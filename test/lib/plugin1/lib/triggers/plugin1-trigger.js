/* global Devebot */
"use strict";

const Promise = Devebot.require("bluebird");
const lodash = Devebot.require("lodash");
const chores = Devebot.require("chores");
const debugx = Devebot.require("pinbug")("devebot:test:lab:plugin1:plugin1Trigger");
const http = require("http");
const util = require("util");

const Service = function(params = {}) {
  debugx.enabled && debugx(" + constructor begin ...");

  const packageName = params.packageName || "plugin1-default-name";
  const blockRef = params.componentId;
  const pluginCfg = lodash.get(params, ["sandboxConfig"], {});

  const server = http.createServer();

  server.on("error", function(err) {
    debugx.enabled && debugx("Server Error: %s", JSON.stringify(err));
  });

  server.on("request", function(req, res) {
    res.writeHead(200);
    res.end(util.format("%s webserver", packageName));
  });

  this.getServer = function() {
    return server;
  };

  const configHost = lodash.get(pluginCfg, "host", "0.0.0.0");
  const configPort = lodash.get(pluginCfg, "port", 8080);

  this.start = function() {
    return new Promise(function(resolve, reject) {
      const serverInstance = server.listen(configPort, configHost, function () {
        const host = serverInstance.address().address;
        const port = serverInstance.address().port;
        chores.isVerboseForced(packageName, pluginCfg) &&
            chores.logConsole("%s webserver is listening at http://%s:%s", packageName, host, port);
        resolve(serverInstance);
      });
    });
  };

  this.stop = function() {
    return new Promise(function(resolve, reject) {
      server.close(function () {
        chores.isVerboseForced(packageName, pluginCfg) &&
            chores.logConsole("%s webserver has been closed", packageName);
        resolve();
      });
    });
  };

  debugx.enabled && debugx(" - constructor end!");
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
