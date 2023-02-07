"use strict";

const Promise = FRWK.require("bluebird");
const lodash = FRWK.require("lodash");
const chores = FRWK.require("chores");
const http = require("http");
const util = require("util");

const Service = function(params = {}) {
  const L = params.loggingFactory.getLogger();
  const T = params.loggingFactory.getTracer();

  const packageName = params.packageName || "plugin2";
  const blockRef = params.componentId;
  const pluginCfg = params.sandboxConfig || {};

  const server = http.createServer();

  server.on("error", function(error) {
    L.has("error") && L.log("error", T.add({ error: error }).toMessage({
      tags: [ blockRef, "server-error" ],
      text: " - Server Error: {error}"
    }));
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
};

Service.argumentSchema = {
  "$id": "plugin2Trigger",
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
