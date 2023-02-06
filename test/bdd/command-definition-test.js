"use strict";

const lab = require("../index");
const Devebot = lab.getFramework();
const Promise = Devebot.require("bluebird");
const lodash = Devebot.require("lodash");
const assert = require("chai").assert;
const util = require("util");
const DevebotApi = require("devebot-api");

describe("bdd:api:command:definition", function() {
  this.timeout(lab.getDefaultTimeout());

  let app, api;

  before(function() {
    app = lab.getApp("default");
    api = new DevebotApi(lab.getApiConfig());
  });

  beforeEach(function() {
    return app.server.start();
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

  afterEach(function() {
    return app.server.stop();
  });
});
