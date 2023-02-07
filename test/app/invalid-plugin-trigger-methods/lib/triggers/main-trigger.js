"use strict";

const http = require("http");
const Promise = Devebot.require("bluebird");
const lodash = Devebot.require("lodash");
const chores = Devebot.require("chores");
const devlog = Devebot.require("pinbug")("test:app:invalid-plugin-trigger-methods:mainTrigger");

const Service = function(params) {
  devlog.enabled && devlog(" + constructor begin ...");

  params = params || {};

  const pluginName = params.packageName;
  const mainCfg = lodash.get(params, ["sandboxConfig"], {});

  const server = http.createServer();

  server.on("error", function(err) {
    devlog.enabled && devlog("Server Error: %s", JSON.stringify(err));
  });

  this.getServer = function() {
    return server;
  };

  const configHost = lodash.get(mainCfg, "host", "0.0.0.0");
  const configPort = lodash.get(mainCfg, "port", 8080);

  this.start = function() {
    return new Promise(function(resolve, reject) {
      const serverInstance = server.listen(configPort, configHost, function () {
        const host = serverInstance.address().address;
        const port = serverInstance.address().port;
        chores.isVerboseForced(pluginName, mainCfg) &&
        chores.logConsole("%s#webserver is listening at http://%s:%s", pluginName, host, port);
        resolve(serverInstance);
      });
    });
  };

  this.stop = function() {
    return new Promise(function(resolve, reject) {
      server.close(function () {
        chores.isVerboseForced("invalid-plugin-trigger", mainCfg) &&
        chores.logConsole("%s#webserver has been closed", pluginName);
        resolve();
      });
    });
  };

  devlog.enabled && devlog(" - constructor end!");
};

module.exports = Service;
