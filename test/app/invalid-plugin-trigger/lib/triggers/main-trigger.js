"use strict";

const http = require("http");
const Promise = FRWK.require("bluebird");
const lodash = FRWK.require("lodash");
const chores = FRWK.require("chores");
const devlog = FRWK.require("pinbug")("devteam:test:app:invalid-plugin-trigger:mainTrigger");

const Service = function(params) {
  devlog.enabled && devlog(" + constructor begin ...");

  params = params || {};

  const packageName = params.packageName || "invalid-plugin-trigger";
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
        chores.isVerboseForced(packageName, mainCfg) &&
        chores.logConsole("%s#webserver is listening at http://%s:%s", packageName, host, port);
        resolve(serverInstance);
      });
    });
  };

  this.stop = function() {
    return new Promise(function(resolve, reject) {
      server.close(function () {
        chores.isVerboseForced(packageName, mainCfg) &&
        chores.logConsole("%s#webserver has been closed", packageName);
        resolve();
      });
    });
  };

  devlog.enabled && devlog(" - constructor end!");
};

module.exports = Service;
