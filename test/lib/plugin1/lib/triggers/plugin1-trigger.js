"use strict";

const Promise = FRWK.require("bluebird");
const lodash = FRWK.require("lodash");
const chores = FRWK.require("chores");
const devlog = FRWK.require("pinbug")("devebot:test:lab:plugin1:plugin1Trigger");
const http = require("http");
const util = require("util");

const Service = function(params = {}) {
  devlog.enabled && devlog(" + constructor begin ...");

  const { packageName, sandboxConfig } = params;

  const server = http.createServer();

  server.on("error", function(err) {
    devlog.enabled && devlog("Server Error: %s", JSON.stringify(err));
  });

  server.on("request", function(req, res) {
    res.writeHead(200);
    res.end(util.format("%s webserver", packageName));
  });

  this.getServer = function() {
    return server;
  };

  const configHost = lodash.get(sandboxConfig, "host", "0.0.0.0");
  const configPort = lodash.get(sandboxConfig, "port", 8080);

  this.start = function() {
    return new Promise(function(resolve, reject) {
      const serverInstance = server.listen(configPort, configHost, function () {
        const host = serverInstance.address().address;
        const port = serverInstance.address().port;
        chores.isVerboseForced(packageName, sandboxConfig) &&
            chores.logConsole("%s webserver is listening at http://%s:%s", packageName, host, port);
        resolve(serverInstance);
      });
    });
  };

  this.stop = function() {
    return new Promise(function(resolve, reject) {
      server.close(function () {
        chores.isVerboseForced(packageName, sandboxConfig) &&
            chores.logConsole("%s webserver has been closed", packageName);
        resolve();
      });
    });
  };

  devlog.enabled && devlog(" - constructor end!");
};

Service.argumentSchema = {
  "$id": "plugin1Trigger",
  "type": "object",
  "properties": {
    "sandboxName": {
      "type": "string"
    },
    "sandboxConfig": {
      "type": "object"
    },
    "profileConfig": {
      "type": "object"
    },
    "loggingFactory": {
      "type": "object"
    }
  }
};

module.exports = Service;
