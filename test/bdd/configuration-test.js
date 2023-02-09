"use strict";

const lab = require("../index");
const FRWK = lab.getFramework();
const chores = FRWK.require("chores");
const debugx = FRWK.require("pinbug")("devteam:bdd:core:configuration");

const expect = require("chai").expect;

const constx = require(lab.getFrameworkModule("utils/constx"));
const PROFILE_CONFIG_FRAMEWORK_FIELD = constx.FRAMEWORK.NAMESPACE;
const TEST_PACKAGE_AUTHOR = "devteam";

describe("bdd:app:configuration", function() {
  this.timeout(lab.getDefaultTimeout());
  let app;
  //
  describe("default configuration (without profile & sandbox)", function() {
    before(function() {
      app = lab.getApp("default");
    });

    it("appInfo has been loaded correctly", function() {
      return app.runner.invoke(function(injektor) {
        let appInfo = injektor.lookup("appInfo");
        debugx.enabled && debugx("appInfo: %s", JSON.stringify(appInfo, null, 2));
        //
        expect(appInfo).to.deep.include({
          "version": "0.1.0",
          "name": "demo-app",
          "description": "Demo Application",
          "main": "index.js",
          "author": TEST_PACKAGE_AUTHOR,
          "license": "ISC",
          "framework": lab.getFrameworkInfo()
        });
        //
        expect(appInfo).to.deep.include({
          "layerware": [
            {
              "version": "0.1.1",
              "name": "plugin1",
              "description": "",
              "main": "index.js",
              "author": TEST_PACKAGE_AUTHOR,
              "license": "ISC"
            },
            {
              "version": "0.1.2",
              "name": "plugin2",
              "description": "",
              "main": "index.js",
              "author": TEST_PACKAGE_AUTHOR,
              "license": "ISC"
            }
          ]
        });
      });
    });

    it("profileConfig has been loaded correctly", function() {
      return app.runner.invoke(function(injektor) {
        let profileConfig = injektor.lookup("profileConfig");
        debugx.enabled && debugx("profileConfig: %s", JSON.stringify(profileConfig, null, 2));
        //
        if (chores.isUpgradeSupported("profile-config-field-framework")) {
          expect(profileConfig)
            .to.be.an("object")
            .to.include.all.keys("framework", "logger", "newFeatures")
            .to.not.contain.all.keys(PROFILE_CONFIG_FRAMEWORK_FIELD);
        } else {
          expect(profileConfig)
            .to.be.an("object")
            .to.include.all.keys(PROFILE_CONFIG_FRAMEWORK_FIELD, "logger", "newFeatures")
            .to.not.contain.all.keys("framework");
        }
        //
        expect(chores.getFrameworkProfileConfig(profileConfig))
          .to.be.an("object")
          .to.include.all.keys("host", "port", "authen", "tunnel");
        //
        expect(chores.getFrameworkProfileConfig(profileConfig, ["authen"]))
          .to.be.an("object")
          .to.include.all.keys("disabled", "tokenStoreFile");
        //
        expect(chores.getFrameworkProfileConfig(profileConfig, ["tunnel"]))
          .to.be.an("object")
          .to.include.all.keys("enabled", "key_file", "crt_file");
      });
    });
  });
});
