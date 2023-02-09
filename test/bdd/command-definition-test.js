"use strict";

const lab = require("../index");
const FRWK = lab.getFramework();
const Promise = FRWK.require("bluebird");
const lodash = FRWK.require("lodash");
const util = require("util");

const { assert } = require("liberica");

const ApiClient = require("devebot-api");

describe("bdd:api:command:definition", function() {
  this.timeout(lab.getDefaultTimeout());

  let app, api;

  before(function() {
    app = lab.getApp("default");
    api = new ApiClient(lab.getApiConfig());
  });

  beforeEach(function() {
    return app.server.start();
  });

  afterEach(function() {
    return app.server.stop();
  });

  it("definition should contain default commands", function() {
    return new Promise(function(resolve, reject) {
      api.loadDefinition(function(err, obj) {
        if (err) return reject(err);
        resolve(obj.payload);
      });
    }).then(function(defs) {
      let cmdNames = lodash.map(defs.commands, function(cmd) {
        return cmd.name;
      });

      let fwCmdNames = [
        "applica-info",
        "logger-info", "logger-reset", "logger-set",
        "sandbox-info", "system-info"
      ];
      assert.includeMembers(cmdNames, fwCmdNames);

      let appCmdNames = [
        "main-cmd1", "main-cmd2"
      ];
      assert.includeMembers(cmdNames, appCmdNames);

      let pluginCmdNames = [
        "plugin1-routine1", "plugin1-routine2",
        "plugin2-routine1", "plugin2-routine3"
      ];
      assert.includeMembers(cmdNames, pluginCmdNames);

      assert(cmdNames.length >= fwCmdNames.length + appCmdNames.length + pluginCmdNames.length);

      lodash.forEach(defs.commands, function(cmd) {
        false && console.info("%s: %s", cmd.name, util.inspect(cmd, {depth: 8}));
        assert.containsAllKeys(cmd, ["name", "description", "options"]);
      });
      false && console.info("Definition: %s", JSON.stringify(defs, null, 2));
    });
  });
});
