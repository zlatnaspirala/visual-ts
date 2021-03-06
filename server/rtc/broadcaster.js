class Broadcaster {
  constructor(serverConfig) {
    const fs = require("fs");
    const path = require("path");
    const url = require("url");
    const ioServer = require("socket.io");
    const RTCMultiConnectionServer = require("rtcmulticonnection-server");
    var httpServer = null;

    // Direct input flags
    var PORT = 9001;

    const jsonPath = {
      config: "./server/broadcaster-config.json",
      logs: "logs.json",
    };

    const BASH_COLORS_HELPER = RTCMultiConnectionServer.BASH_COLORS_HELPER;
    const getValuesFromConfigJson =
      RTCMultiConnectionServer.getValuesFromConfigJson;
    const getBashParameters = RTCMultiConnectionServer.getBashParameters;

    var config = getValuesFromConfigJson(jsonPath);
    config = getBashParameters(config, BASH_COLORS_HELPER);

    // if user didn't modifed "PORT" object
    if (PORT === 9001) {
      PORT = config.port;
    }

    function serverHandler(request, response) {
      console.log("++++++++++++++++serverHandler++++++++++++++++");
      // to make sure we always get valid info from json file
      // even if external codes are overriding it
      config = getValuesFromConfigJson(jsonPath);
      config = getBashParameters(config, BASH_COLORS_HELPER);

      var headers = {};
      headers["Access-Control-Allow-Origin"] = "*";
      headers["Access-Control-Allow-Headers"] =
        "Content-Type, Content-Length, Authorization, Accept, X-Requested-With";
      headers["Access-Contrl-Allow-Methods"] =
        "PUT, POST, GET, DELETE, OPTIONS";
      headers["Access-Control-Max-Age"] = "86400";
      response.writeHead(200, headers);

      if (request.method === "OPTIONS") {
        console.log("OPTIONS SUCCESS");
        response.end();
      } else {
        response.writeHead(200, {
          "Content-Type": "text/plain",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,OPTIONS",
          "Access-Control-Allow-Headers": "*",
        });
        let msgForHttpCheck = '**********************************************************' + ' \n' +
                              '* VisualTS Game Engine Server composition, version: ' + serverConfig.version + '* \n' + 
                              '* Type of network - BROADCASTER                          *' + ' \n' +
                              '**********************************************************';
        response.write(msgForHttpCheck);
        response.end();
      }
    }

    var httpApp;
    httpServer = require("https");

    var options = {
      key: null,
      cert: null,
      ca: null,
    };

    /**
     * @description This block can be optimisex
     * SSL on/off
     */
    if (serverConfig.serverMode === "dev") {
      options = {
        key: fs.readFileSync(serverConfig.certPathSelf.pKeyPath),
        cert: fs.readFileSync(serverConfig.certPathSelf.pCertPath),
        ca: fs.readFileSync(serverConfig.certPathSelf.pCBPath),
      };
    } else if (serverConfig.serverMode === "prod") {
      options = {
        key: fs.readFileSync(serverConfig.certPathProd.pKeyPath),
        cert: fs.readFileSync(serverConfig.certPathProd.pCertPath),
        ca: fs.readFileSync(serverConfig.certPathProd.pCBPath),
      };
    } else {
      console.warn(
        "Something wrong with serverConfig certPathProd/certPathSelf path."
      );
    }

    var pfx = false;
    console.info("Server runs `https` protocol.");

    httpApp = httpServer.createServer(options, serverHandler);

    RTCMultiConnectionServer.beforeHttpListen(httpApp, config);
    httpApp = httpApp.listen(
      process.env.PORT || PORT,
      process.env.IP || "0.0.0.0",
      function () {
        RTCMultiConnectionServer.afterHttpListen(httpApp, config);
      }
    );

    var collectCorsDomain = "https://localhost";
    if (serverConfig.serverMode == "dev") {
      console.log("-rtc cors dev: ", serverConfig.domain.dev);
    } else if (serverConfig.serverMode == "prod") {
      console.log("-rtc cors prod: ", serverConfig.domain.prod);
      collectCorsDomain = serverConfig.protocol + "://" + serverConfig.domain.prod;
    }

    console.log("Cors Domain: ", collectCorsDomain);
    ioServer(httpApp, {
      cors: {
        origin: collectCorsDomain,
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: ["*"],
        credentials: true,
      },
    }).on("connection", function (socket) {
      console.log("MultiRTC3: new client.");
      RTCMultiConnectionServer.addSocket(socket, config);

      const params = socket.handshake.query;

      if (!params.socketCustomEvent) {
        params.socketCustomEvent = "custom-message";
      }

      socket.on(params.socketCustomEvent, function (message) {
        socket.broadcast.emit(params.socketCustomEvent, message);
      });
    });

    console.log("Broadcaster runned under:");
    console.log(config);
    console.log("Good luck.");
  }
}
module.exports = Broadcaster;
