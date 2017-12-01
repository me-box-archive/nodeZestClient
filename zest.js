const zmq = require('zeromq');
const hex = require('hexer');
const os = require('os');
const EventEmitter = require('events');

let enableLogging = false;

let dealer_endpoint = "";

exports.New = function (endpoint, dealerEndpoint, serverKey, logging) {

    enableLogging = logging;

    dealer_endpoint = dealerEndpoint;

    let soc = zmq.socket('req');

    curveKeypair = zmq.curveKeypair();

    soc.curve_serverkey = new Buffer.from(serverKey,'utf8');
    soc.curve_publickey = new Buffer.from(curveKeypair.public,'utf8');
    soc.curve_secretkey = new Buffer.from(curveKeypair.secret,'utf8');
    soc.connect(endpoint);

    const zestClient = {

        ZMQsoc: soc,

        Observers: {}, //a dict to keep track of observers so they can be closed

        Post: function (token, path, payload, contentFormat) {
            return new Promise((resolve,reject)=>{

                let zh = NewZestHeader();
                zh.code = 2;
                zh.token = token;
                zh.tkl = token.length;
                zh.payload = payload;
                zh.oc = 3;
                zh.options.push(NewZestOptionHeader(11,path,path.length));
                let hostname = os.hostname();
                zh.options.push(NewZestOptionHeader(3,hostname,hostname.length));
                zh.options.push(NewZestOptionHeader(12,contentFormatToInt(contentFormat),2)); //uint32

                msg = MarshalZestHeader(zh)
                sendRequestAndAwaitResponse(this.ZMQsoc,msg)
                .then((msg)=>{
                    handleResponse(msg,resolve,reject);
                })
                .catch((err)=>{
                    reject(err);
                });
            });
        },

        Get: function (token, path, contentFormat) {
            return new Promise((resolve,reject)=>{
                let zh = NewZestHeader();
                zh.code = 1;
                zh.token = token;
                zh.tkl = token.length;
                zh.oc = 3;
                zh.options.push(NewZestOptionHeader(11,path,path.length));
                let hostname = os.hostname();
                zh.options.push(NewZestOptionHeader(3,hostname,hostname.length));
                zh.options.push(NewZestOptionHeader(12,contentFormatToInt(contentFormat),2)); //uint32

                msg = MarshalZestHeader(zh)
                sendRequestAndAwaitResponse(this.ZMQsoc,msg)
                .then((msg)=>{
                    handleResponse(msg,(zh)=>{resolve(zh.payload)},reject);
                })
                .catch((err)=>{
                    reject(err);
                });
            });
        },

        Observe: function (token, path, contentFormat, timeOut = 0) {
            return new Promise((resolve,reject)=>{
                let zh = NewZestHeader();
                zh.code = 1
                zh.token = token;
                zh.tkl = token.length;
                zh.oc = 5;
                zh.options.push(NewZestOptionHeader(11,path,path.length));
                let hostname = os.hostname();
                zh.options.push(NewZestOptionHeader(3,hostname,hostname.length));
                zh.options.push(NewZestOptionHeader(6,"",0));
                zh.options.push(NewZestOptionHeader(12,contentFormatToInt(contentFormat),2)); //uint32
                zh.options.push(NewZestOptionHeader(14,timeOut,4)); //uint64
                log(zh);
                msg = MarshalZestHeader(zh)
                sendRequestAndAwaitResponse(this.ZMQsoc,msg)
                .then(function (msg) {

                    let observe = function (zh) {

                        let dealer = zmq.socket('dealer');

                        dealer.identity = zh.payload;

                        serverKeyOption = zh.options.filter((opt)=>{ return opt.number == 2048});
                        serverKey = serverKeyOption[0].value;

                        log("Identity: " + zh.payload);
                        log("serverKey: " + serverKey);

                        curveKeypair = zmq.curveKeypair();

                        dealer.curve_serverkey = new Buffer.from(serverKey,'hex');
                        dealer.curve_publickey = new Buffer.from(curveKeypair.public,'utf8');
                        dealer.curve_secretkey = new Buffer.from(curveKeypair.secret,'utf8');
                        dealer.connect(dealer_endpoint);

                        zestClient.Observers[path] = dealer;

                        let EE = new EventEmitter();

                        dealer.on('message', function(msg){
                            handleResponse(msg,(zh)=>{EE.emit('data',zh.payload);},(msg)=>{EE.emit('error',msg)});
                        });

                        dealer.on('error', function(msg){
                            EE.emit('error',msg);
                        });

                        dealer.on('end', function(msg){
                            EE.emit('error',msg);
                        });

                        dealer.on('connect', function(msg){
                            EE.emit('error',msg);
                        });

                        dealer.on('close', function(msg){
                            EE.emit('error',msg);
                        });

                        resolve(EE);
                    };

                    handleResponse(msg,observe,reject);

                })
                .catch((err)=>{
                    reject(err);
                });
            });
        },
        StopObserving: function (path) {
            if(zestClient.Observers[path]) {
                zestClient.Observers[path].close();
            }
        }
    };

    return zestClient;
}

function log(msg) {
    if (enableLogging) {
		console.log("[Node ZestClient ] ", msg);
	}
}

function sendRequest(ZMQsoc,msg) {

    log("Sending request:");
    log("\n" + hex(msg));

    ZMQsoc.send(msg);

}

function sendRequestAndAwaitResponse(ZMQsoc,msg) {
    return new Promise((resolve,reject)=>{
        log("Sending request:");
        log("\n" + hex(msg));

        ZMQsoc.send(msg);

        ZMQsoc.on('message', function(msg){
            resolve(msg);
        });

        ZMQsoc.on('error', function(msg){
            reject(msg);
        });
    });
}

function checkContentFormatFormat(format) {

    switch (format.toUpperCase()) {
    case "TEXT":
        return true;
        break;
    case "BINARY":
        return true;
        break;
    case "JSON":
        return true;
        break;
    }

    return false;
}

function contentFormatToInt(format) {

    switch (format.toUpperCase()) {
    case "TEXT":
        return 0;
        break;
    case "BINARY":
        return 42;
        break;
    case "JSON":
        return 50;
        break;
    }

    return 0;
}

let NewZestOptionHeader = function (number,value,len) {
    return {
        number: number,
        len: len,
        value: value,
      };
};

let NewZestHeader = function () {
    return {
        oc: 0,
        code: 0,
        tkl: 0,
        token: "",
        options: [],
        payload: "",
      };
};



function MarshalZestHeader(zh) {
    log(zh);

    let optionsLen = zh.options.reduce((len,option)=>{return {len:4 + len.len + option.len};});

    let buf = Buffer.alloc(8+zh.tkl+optionsLen.len+Buffer.byteLength(zh.payload,'utf8'));

    buf.writeUInt8(zh.code,0);
    buf.writeUInt8(zh.oc,1);
    buf.writeUInt16BE(zh.tkl,2);
    buf.write(zh.token,4);

    let offset = 4 + zh.tkl;
    for(let i = 0; i < zh.oc; i++) {
        zoh = MarshalZestOptionsHeader(zh.options[i]);
        zoh.copy(buf,offset);
        offset += zoh.length;
    }

    buf.write(zh.payload,offset,Buffer.byteLength(zh.payload,'utf8'),'utf8');

    return buf;

}

function ParseZestHeader(msgBuf) {
    let zh = NewZestHeader();
    zh.code = msgBuf.readUInt8(0);
    zh.oc = msgBuf.readUInt8(1);
    zh.tkl = msgBuf.readUInt16BE(2);
    if (zh.tkl > 0) {
        zh.token = msgBuf.toString('utf8',4,4+zh.tkl);
    }

    offset = 4 + zh.tkl
    for (let i = 0; i < zh.oc; i++) {
        zoh = ParseZestOptionsHeader(msgBuf,offset);
        zh.options.push(zoh);
        offset += 4+zoh.len;
    }
    if(msgBuf.length > offset) {
        zh.payload = msgBuf.toString('utf8',offset);
    }

    return zh;
}



function MarshalZestOptionsHeader(zoh) {

    log(zoh);

    let buf = Buffer.alloc(4+zoh.len);
    buf.writeUInt16BE(zoh.number,0);
    buf.writeUInt16BE(zoh.len,2);
    if(zoh.number == 12) {
        buf.writeUInt16BE(zoh.value,4);
    } else if (zoh.number == 14) {
        buf.writeUInt32BE(zoh.value,4);
    } else {
        buf.write(zoh.value.toString(),4);
    }
    return buf;

}

function ParseZestOptionsHeader(msgBuf,offset) {
    zoh = NewZestOptionHeader();
    zoh.number = msgBuf.readUInt16BE(offset);
    zoh.len = msgBuf.readUInt16BE(offset+2);
    zoh.value = msgBuf.toString('hex',offset+4,offset+4+zoh.len);
    return zoh;
}

function handleResponse(msg, resolve, reject) {

        log("Got response:");
        log("\n" + hex(msg));

        zr = ParseZestHeader(msg);

        switch (zr.code) {
        case 65:
            //created
            resolve("created");
            return;
        case 69:
            //content
            resolve(zr);
            return;
        case 128:
            reject("bad request");
            return;
        case 129:
            reject("unauthorized");
            return;
        case 143:
            reject("unsupported content format");
            return;
        }

        reject("invalid code:" + zr.Code);
        return;
    }