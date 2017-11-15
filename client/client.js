const zest = require("../zest.js");
var yargs = require('yargs');


const argv = yargs
.usage('This is my awesome program\n\nUsage: $0 [options]')
.help('help').alias('help', 'h')
.version('0.0.1', 'version').alias('version', 'V')
.options({
    "server-key": {
    description: "Set the curve server key",
    default: "vl6wu0A@XP?}Or/&BR#LSxn>A+}L)p44/W[wXL3<"
  },
  "path": {
    description: "Set the uri path for POST and GET",
    default: "/kv/foo"
  },
  "token": {
    description: "Set set access token",
    default: ""
  },
  "payload": {
    description: "Set the uri path for POST and GET",
    default: "{\"name\":\"dave\", \"age\":32}"
  },
  "request-endpoint": {
    description: "set the request/reply endpoint",
    default: "tcp://127.0.0.1:5555"
  },
  "router-endpoint": {
    description: "et the router/dealer endpoint",
    default: "tcp://127.0.0.1:5556"
  },
  "method": {
    description: "set the mode of operation",
    default: "GET"
  },
  "format": {
    description: "text, json, binary to set the message content type",
    default: "JSON"
  },
  "enable-logging": {
    description: "output debug information",
    default: false
  }
})
.argv;



client = zest.New(argv["request-endpoint"], argv["router-endpoint"],argv["server-key"],argv["enable-logging"]);

switch(argv["method"].toUpperCase()) {
  case 'POST':
    client.Post(argv["token"],argv["path"],argv["payload"],argv["format"])
    .then((resp)=>{
      console.log(resp);
      client.ZMQsoc.close();
    })
    .catch((err)=>{
        console.log(err);
        client.ZMQsoc.close();
    });
  break;
  case 'GET':
  client.Get(argv["token"],argv["path"],argv["format"])
  .then((resp)=>{
    console.log(resp);
    client.ZMQsoc.close();
  })
  .catch((err)=>{
      console.log(err);
      client.ZMQsoc.close();
  });
break;
case 'OBSERVE':
client.Observe(argv["token"],argv["path"],argv["format"])
.then((eventEmmiter)=>{
  console.log("Waiting for data:")
  let dataCount = 0;
  eventEmmiter.on('data',(data)=>{
    console.log(data);
    dataCount++;
    if(dataCount > 3) {
      client.StopObserving(argv["path"]);
      client.ZMQsoc.close();
    }
  })
  eventEmmiter.on('error',(data)=>{
    console.log(data);
  })
})
.catch((err)=>{
    console.log(err);
    client.ZMQsoc.close();
});
break;
};
