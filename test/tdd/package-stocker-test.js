"use strict";

const lab = require("../index");
const Devebot = lab.getFramework();
const chores = Devebot.require("chores");
const assert = require("chai").assert;

describe("tdd:lib:core:package-stocker", function() {
  this.timeout(lab.getDefaultTimeout());

  const packageStocker = lab.getPackageStocker();

  before(function() {
    chores.setEnvironments({
      LOGOLITE_FULL_LOG_MODE: "false",
      LOGOLITE_ALWAYS_ENABLED: "all",
      LOGOLITE_ALWAYS_MUTED: "all",
      DEVEBOT_FORCING_SILENT: "package-stocker",
      DEVEBOT_NODE_ENV: "test",
    });
  });

  describe("declare()", function() {
    it("declares a public package (minimist) successfully", function() {
      packageStocker.declare("minimist");
      //
      const { minimist } = packageStocker.modules;
      //
      const parseArgs = packageStocker.require("minimist");
      assert.isOk(minimist === parseArgs);
      //
      const args = parseArgs('one two three -- four five --six'.split(' '), { '--': true });
      false && console.info(JSON.stringify(args, null, 2));
      assert.deepEqual(args, {
        "_": [ "one", "two", "three" ],
        "--": [ "four", "five", "--six" ]
      });
      //
      const moduleNames = Object.keys(packageStocker.modules);
      const expected = [
        "bluebird", "lodash", "semver",
        "injektor", "logolite", "schemato", "envcloak", "codetags",
        "chores", "loader", "portlet", "pinbug", "debug", "errors",
        "minimist"
      ];
      false && console.info(JSON.stringify(moduleNames));
      assert.sameMembers(moduleNames, expected);
    });
  });
});
