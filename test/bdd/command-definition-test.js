"use strict";

var lab = require("../index");
var Devebot = lab.getDevebot();
var Promise = Devebot.require("bluebird");
var lodash = Devebot.require("lodash");
var assert = require("chai").assert;
var util = require("util");
var DevebotApi = require("devebot-api");

describe("bdd:devebot:command:definition", function() {
  this.timeout(lab.getDefaultTimeout());

  var app, api;

  before(function() {
    app = lab.getApp();
    api = new DevebotApi(lab.getApiConfig());
  });

  beforeEach(function(done) {
    app.server.start().asCallback(done);
  });

  it("definition should contain default commands", function() {
    return new Promise(function(resolve, reject) {
      api.loadDefinition(function(err, obj) {
        if (err) return reject(err);
        resolve(obj.payload);
      });
    }).then(function(defs) {
      var cmdNames = lodash.map(defs.commands, function(cmd) {
        return cmd.name;
      });

      var fwCmdNames = [
        "applica-info",
        "logger-info", "logger-reset", "logger-set",
        "sandbox-info", "system-info"
      ];
      assert.includeMembers(cmdNames, fwCmdNames);

      var appCmdNames = [
        "main-cmd1", "main-cmd2"
      ];
      assert.includeMembers(cmdNames, appCmdNames);

      var pluginCmdNames = [
        "plugin1-routine1", "plugin1-routine2",
        "plugin2-routine1", "plugin2-routine3"
      ];
      assert.includeMembers(cmdNames, pluginCmdNames);

      assert(cmdNames.length >= fwCmdNames.length + appCmdNames.length + pluginCmdNames.length);

      lodash.forEach(defs.commands, function(cmd) {
        false && console.log("%s: %s", cmd.name, util.inspect(cmd, {depth: 8}));
        assert.containsAllKeys(cmd, ["name", "description", "options"]);
      });
      false && console.log("Definition: %s", JSON.stringify(defs, null, 2));
    });
  });

  afterEach(function(done) {
    app.server.stop().asCallback(done);
  });
});
