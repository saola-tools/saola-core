"use strict";

const Promise = FRWK.require("bluebird");
const chores = FRWK.require("chores");
const lodash = FRWK.require("lodash");
const http = require("http");

const Service = function(params) {
  params = params || {};

  const packageName = params.packageName || "plugin-invalid-trigger-methods";
  const blockRef = chores.getBlockRef(__filename, packageName);
  const L = params.loggingFactory.getLogger();
  const T = params.loggingFactory.getTracer();

  L.has("dunce") && L.log("dunce", T.toMessage({
    tags: [ blockRef, "constructor-begin" ],
    text: " + constructor begin"
  }));

  const pluginCfg = lodash.get(params, "sandboxConfig", {});

  const server = http.createServer();

  server.on("error", function(err) {
    L.has("error") && L.log("error", T.add({
      error: err
    }).toMessage({
      tags: [ blockRef, "server-error" ],
      text: " - Server Error: {error}",
      reset: true
    }));
  });

  server.on("request", function(req, res) {
    res.writeHead(200);
    res.end("plugin-invalid-trigger webserver");
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

  L.has("dunce") && L.log("dunce", T.toMessage({
    tags: [ blockRef, "constructor-end" ],
    text: " - constructor end!"
  }));
};

module.exports = Service;
