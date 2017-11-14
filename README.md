# nodeZestClient

[![Build Status](https://travis-ci.org/Toshbrown/nodeZestClient.svg?branch=master)](https://travis-ci.org/Toshbrown/nodeZestClient)

A NodeJs Lib for [REST over ZeroMQ](https://github.com/jptmoore/zest)

## Starting server to test against

```bash
$ docker run -p 5555:5555 -p 5556:5556 -d --name zest --rm jptmoore/zest /app/zest/server.exe --secret-key-file example-server-key --enable-logging
$ docker logs zest -f
```

## Client for testing

In the ./client directory there is a simple client for testing this library with the zest server.
Run `node ./client.js` to run with the default options.

```bash
Usage: client.js [options]

Options:
  --help, -h          Show help                                        [boolean]
  --0.0.1             Show version number                              [boolean]
  --server-key        Set the curve server key
                           [default: "vl6wu0A@XP?}Or/&BR#LSxn>A+}L)p44/W[wXL3<"]
  --path              Set the uri path for POST and GET     [default: "/kv/foo"]
  --token             Set set access token                         [default: ""]
  --payload           Set the uri path for POST and GET
                                          [default: "{"name":"dave", "age":32}"]
  --request-endpoint  set the request/reply endpoint
                                               [default: "tcp://127.0.0.1:5555"]
  --router-endpoint   et the router/dealer endpoint
                                               [default: "tcp://127.0.0.1:5556"]
  --method            set the mode of operation                 [default: "GET"]
  --format            text, json, binary to set the message content type
                                                               [default: "JSON"]
  --enable-logging    output debug information                  [default: false]
```

## Running unit tests

```
npm test
```