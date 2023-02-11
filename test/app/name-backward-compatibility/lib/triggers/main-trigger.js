"use strict";

const http = require("http");

const lab = require("../../../../index");
const FRWK = lab.getFramework();
const Promise = FRWK.require("bluebird");
const chores = FRWK.require("chores");
const lodash = FRWK.require("lodash");

const constx = require(lab.getFrameworkModule("utils/constx"));
const FRAMEWORK_NAMESPACE = constx.FRAMEWORK.NAMESPACE;

const Service = function(params={}) {
  const sandboxConfig = lodash.get(params, ["sandboxConfig", "application"], {});

  const { packageName, loggingFactory, mainService } = params;
  const { dpBackward1Service, dpBackward2Service, coBackward1, coBackward2 } = params;
  const { coConnector1, coConnector2 } = params;

  const L = loggingFactory && loggingFactory.getLogger();
  const T = loggingFactory && loggingFactory.getTracer();
  const blockRef = chores.getBlockRef(__filename, packageName);

  const self = this;
  const server = http.createServer();

  server.on("error", function(err) {
    L && L.has("silly") && L.log("silly", T && T.add({ blockRef }).toMessage({
      tags: [ blockRef, "http-server-error" ],
      text: "Server error: " + JSON.stringify(err)
    }));
  });

  server.on("request", function(req, res) {
    res.writeHead(200, {
      "Content-Type": "application/json"
    });
    res.end(JSON.stringify({
      packageName: packageName,
      config: self.getConfig(),
    }, null, 2));
  });

  this.getServer = function() {
    return server;
  };

  this.getConfig = function() {
    return Object.assign({},
      {
        [blockRef]: sandboxConfig
      },
      mainService && mainService.getConfig() || {},
      dpBackward1Service && dpBackward1Service.getConfig() || {},
      dpBackward2Service && dpBackward2Service.getConfig() || {},
      {
        coBackward1: coBackward1 && coBackward1.getConfig() || {},
      },
      {
        coBackward2: coBackward2 && coBackward2.getConfig() || {},
      },
      {
        coConnector1: coConnector1 && coConnector1.getConfig() || {},
      },
      {
        coConnector2: coConnector2 && coConnector2.getConfig() || {},
      },
    );
  };

  const configHost = lodash.get(sandboxConfig, "host", "0.0.0.0");
  const configPort = lodash.get(sandboxConfig, "port", 8080);

  this.start = function() {
    return new Promise(function(resolve, reject) {
      const serverInstance = server.listen(configPort, configHost, function () {
        const host = serverInstance.address().address;
        const port = serverInstance.address().port;
        chores.isVerboseForced(packageName, sandboxConfig) &&
        chores.logConsole("%s is listening at http://%s:%s", packageName, host, port);
        resolve(serverInstance);
      });
    });
  };

  this.stop = function() {
    return new Promise(function(resolve, reject) {
      server.close(function () {
        chores.isVerboseForced(packageName, sandboxConfig) &&
        chores.logConsole("%s has been closed", packageName);
        resolve();
      });
    });
  };
};

Service.referenceHash = {
  mainService: "application/mainService",
  dpBackward1Service: FRAMEWORK_NAMESPACE + "-dp-backward1/sublibService",
  dpBackward2Service: FRAMEWORK_NAMESPACE + "-dp-backward2/sublibService",
  coBackward1: "application/backward1#wrapper",
  coBackward2: "application/backward2#wrapper",
  coConnector1: "application/connector1#wrapper",
  coConnector2: "application/connector2#wrapper",
};

module.exports = Service;
