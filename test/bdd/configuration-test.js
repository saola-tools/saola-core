"use strict";

const lab = require("../index");
const Devebot = lab.getDevebot();
const Promise = Devebot.require("bluebird");
const lodash = Devebot.require("lodash");
const chores = Devebot.require("chores");
const debugx = Devebot.require("pinbug")("bdd:devebot:core:configuration");
const assert = require("chai").assert;
const expect = require("chai").expect;
const util = require("util");

describe("bdd:app:configuration", function() {
  this.timeout(lab.getDefaultTimeout());
  let app;
  describe("default configuration (without profile & sandbox)", function() {
    before(function() {
      app = lab.getApp();
    });

    it("configuration has been loaded correctly", function(done) {
      app.runner.invoke(function(injektor) {
        let appInfo = injektor.lookup("appInfo");
        debugx.enabled && debugx("appInfo: %s", JSON.stringify(appInfo, null, 2));
        expect(appInfo).to.deep.include({
          "version": "0.1.0",
          "name": "demo-app",
          "description": "Devebot Demo Application",
          "main": "index.js",
          "author": "devebot",
          "license": "ISC",
          "framework": lab.getFrameworkInfo()
        });

        expect(appInfo).to.deep.include({
          "layerware": [
            {
              "version": "0.1.1",
              "name": "plugin1",
              "description": "",
              "main": "index.js",
              "author": "devebot",
              "license": "ISC"
            },
            {
              "version": "0.1.2",
              "name": "plugin2",
              "description": "",
              "main": "index.js",
              "author": "devebot",
              "license": "ISC"
            }
          ]
        });

        let profileConfig = injektor.lookup("profileConfig");
        debugx.enabled && debugx("profileConfig: %s", JSON.stringify(profileConfig, null, 2));
        expect(profileConfig)
          .to.be.an("object")
          .to.include.all.keys("devebot");
        expect(lodash.get(profileConfig, chores.getProfileConfigFrameworkSection()))
          .to.be.an("object")
          .to.include.all.keys("host", "port", "authen", "tunnel");
        expect(lodash.get(profileConfig, chores.getProfileConfigFrameworkSection(["authen"])))
          .to.be.an("object")
          .to.include.all.keys("disabled", "tokenStoreFile");
        expect(lodash.get(profileConfig, chores.getProfileConfigFrameworkSection(["tunnel"])))
          .to.be.an("object")
          .to.include.all.keys("enabled", "key_file", "crt_file");
      }).then(done);
    });
  });
});
