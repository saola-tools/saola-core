"use strict";

const Promise = FRWK.require("bluebird");
const chores = FRWK.require("chores");
const lodash = FRWK.require("lodash");
const http = require("http");

const Service = function(params) {
  params = params || {};

  const L = params.loggingFactory.getLogger();
  const T = params.loggingFactory.getTracer();
  const packageName = params.packageName || "plugin3";

  const pluginCfg = lodash.get(params, ["sandboxConfig", "plugins", "plugin3"], {});

  const server = http.createServer();

  server.on("error", function(error) {
    L.has("error") && L.log("error", T.add({ error }).toMessage({
      tags: [ packageName, "server-error" ],
      text: " - Server Error: {error}",
      reset: true
    }));
  });

  server.on("request", function(req, res) {
    res.writeHead(200);
    res.end("plugin3 webserver");
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
  "$id": "plugin3Trigger",
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
