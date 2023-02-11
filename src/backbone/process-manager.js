"use strict";

const lodash = require("lodash");
const chores = require("../utils/chores");
const getenv = require("../utils/getenv");
const blockRef = chores.getBlockRef(__filename);

function ProcessManager (params = {}) {
  const loggingFactory = params.loggingFactory.branch(blockRef);
  const L = loggingFactory.getLogger();
  const T = loggingFactory.getTracer();

  L && L.has("silly") && L.log("silly", T && T.toMessage({
    tags: [ blockRef, "constructor-begin" ],
    text: " + constructor start ..."
  }));

  const clusterCfg = lodash.get(params, ["profileConfig", "cluster"], {});

  const pmId = parseInt(getenv(clusterCfg.ENV_ID_NAMES || ["pm_id", "NODE_APP_INSTANCE"]));
  const pmTotal = parseInt(getenv(clusterCfg.ENV_TOTAL_NAMES || ["instances"]));

  L && L.has("debug") && L.log("debug", T && T.add({ pmId, pmTotal }).toMessage({
    tags: [ blockRef, "pm2-env-vars" ],
    text: "PM2 environment: id: ${pmId} / total: ${pmTotal}"
  }));

  Object.defineProperty(this, "available", {
    get: function() {
      return typeof(pmId) === "number" && !isNaN(pmId) &&
          typeof(pmTotal) === "number" && !isNaN(pmTotal);
    },
    set: function(value) {}
  });

  Object.defineProperty(this, "isMaster", {
    get: function() {
      if (!this.available || pmId < 0 || pmTotal <= 0) return false;
      return (pmId % pmTotal) === 0;
    },
    set: function(value) {}
  });

  Object.defineProperty(this, "id", {
    get: function() {
      return typeof(pmId) === "number" && !isNaN(pmId) ? pmId : undefined;
    },
    set: function(value) {}
  });

  Object.defineProperty(this, "total", {
    get: function() {
      return typeof(pmTotal) === "number" && !isNaN(pmTotal) ? pmTotal : undefined;
    },
    set: function(value) {}
  });

  this.belongTo = function(idx) {
    if (!this.available || pmId < 0 || pmTotal <= pmId) return null;
    while (idx >= pmTotal) idx -= pmTotal;
    return idx === pmId;
  };

  L && L.has("silly") && L.log("silly", T && T.toMessage({
    tags: [ blockRef, "constructor-end" ],
    text: " - constructor has finished"
  }));
};

ProcessManager.argumentSchema = {
  "$id": "processManager",
  "type": "object",
  "properties": {
    "profileConfig": {
      "type": "object"
    },
    "issueInspector": {
      "type": "object"
    },
    "loggingFactory": {
      "type": "object"
    }
  }
};

module.exports = ProcessManager;
