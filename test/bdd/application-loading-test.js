"use strict";

const lab = require("../index");
const FRWK = lab.getFramework();
const chores = FRWK.require("chores");
const lodash = FRWK.require("lodash");

const LogConfig = FRWK.require("logolite").LogConfig;
const LogTracer = FRWK.require("logolite").LogTracer;
const envcloak = require("envcloak").instance;
const util = require("util");

const { assert } = require("liberica");

const constx = require(lab.getFrameworkModule("utils/constx"));
const FRAMEWORK_NAMESPACE = constx.FRAMEWORK.NAMESPACE;
const FRAMEWORK_PACKAGE_NAME = constx.FRAMEWORK.PACKAGE_NAME;
const FRAMEWORK_METADATA = FRAMEWORK_NAMESPACE + "-metadata";

describe("bdd:app:application", function() {
  this.timeout(lab.getDefaultTimeout());

  before(function() {
    envcloak.setup({
      LOGOLITE_FULL_LOG_MODE: "false",
      LOGOLITE_ALWAYS_ENABLED: "all",
      LOGOLITE_ALWAYS_MUTED: "all",
    });
    LogConfig.reset();
  });

  after(function() {
    envcloak.reset();
  });

  describe("application[default]", function() {
    let app;
    let serverStats = {};
    let moduleStats = {};

    before(function() {
      LogTracer.setupDefaultInterceptors([
        {
          accumulator: serverStats,
          mappings: [
            {
              allTags: [ chores.toFullname(FRAMEWORK_PACKAGE_NAME, "server"), "start()" ],
              countTo: "startingCount"
            },
            {
              allTags: [ chores.toFullname(FRAMEWORK_PACKAGE_NAME, "server"), "close()" ],
              countTo: "stoppingCount"
            }
          ]
        },
        {
          accumulator: moduleStats,
          mappings: [
            {
              anyTags: [ FRAMEWORK_METADATA ],
              storeTo: "metadata"
            },
            {
              anyTags: [ "constructor-begin" ],
              countTo: "constructorBeginTotal"
            },
            {
              anyTags: [ "constructor-end" ],
              countTo: "constructorEndTotal"
            }
          ]
        }
      ]);
    });

    beforeEach(function() {
      LogTracer.reset().empty(serverStats).empty(moduleStats);
    });

    it("total of constructor startpoints must equal to constructor endpoints", function() {
      app = lab.getApp("default");
      let frameworkScopes = [
        FRAMEWORK_PACKAGE_NAME,
        chores.toFullname(FRAMEWORK_PACKAGE_NAME, "bootstrap"),
        chores.toFullname(FRAMEWORK_PACKAGE_NAME, "appinfoLoader"),
        chores.toFullname(FRAMEWORK_PACKAGE_NAME, "nameResolver"),
        chores.toFullname(FRAMEWORK_PACKAGE_NAME, "manifestHandler"),
        chores.toFullname(FRAMEWORK_PACKAGE_NAME, "configLoader"),
        chores.toFullname(FRAMEWORK_PACKAGE_NAME, "contextManager"),
        chores.toFullname(FRAMEWORK_PACKAGE_NAME, "kernel"),
        chores.toFullname(FRAMEWORK_PACKAGE_NAME, "server"),
        chores.toFullname(FRAMEWORK_PACKAGE_NAME, "bridgeLoader"),
        chores.toFullname(FRAMEWORK_PACKAGE_NAME, "schemaValidator"),
        chores.toFullname(FRAMEWORK_PACKAGE_NAME, "bundleLoader"),
        chores.toFullname(FRAMEWORK_PACKAGE_NAME, "objectDecorator"),
        chores.toFullname(FRAMEWORK_PACKAGE_NAME, "sandboxManager"),
        chores.toFullname(FRAMEWORK_PACKAGE_NAME, "jobqueueBinder"),
        chores.toFullname(FRAMEWORK_PACKAGE_NAME, "processManager"),
        chores.toFullname(FRAMEWORK_PACKAGE_NAME, "runhookManager"),
        chores.toFullname(FRAMEWORK_PACKAGE_NAME, "scriptExecutor"),
        chores.toFullname(FRAMEWORK_PACKAGE_NAME, "scriptRenderer"),
        chores.toFullname(FRAMEWORK_PACKAGE_NAME, "securityManager"),
        chores.toFullname(FRAMEWORK_PACKAGE_NAME, "repeatedTimer")
      ];
      if (chores.isUpgradeSupported("builtin-mapping-loader")) {
        frameworkScopes.push(chores.toFullname(FRAMEWORK_PACKAGE_NAME, "mappingLoader"));
      }
      let plugin1Scopes = [
        chores.toFullname("plugin1", "plugin1Service"),
        chores.toFullname("plugin1", "plugin1Trigger")
      ];
      let plugin2Scopes = [
        chores.toFullname("plugin2", "plugin2Service"),
        chores.toFullname("plugin2", "plugin2Trigger")
      ];
      let mainScopes = [
        chores.toFullname("demo-app", "mainService"),
        chores.toFullname("demo-app", "mainTrigger")
      ];

      let bridge1Scopes = [];
      let bridge2Scopes = [];

      if (chores.isUpgradeSupported(["bridge-full-ref", "presets"])) {
        bridge1Scopes = [
          chores.toFullname("plugin1", "bridge1#anyname1a"),
          chores.toFullname("plugin2", "bridge1#anyname1b"),
          chores.toFullname("plugin2", "bridge1#anyname1c")
        ];
        bridge2Scopes = [
          chores.toFullname("plugin1", "bridge2#anyname2a"),
          chores.toFullname("plugin2", "bridge2#anyname2b"),
          chores.toFullname("plugin1", "bridge2#anyname2c")
        ];
      }

      if (!chores.isUpgradeSupported("bridge-full-ref")) {
        bridge1Scopes = [
          chores.toFullname("bridge1", "anyname1a"),
          chores.toFullname("bridge1", "anyname1b"),
          chores.toFullname("bridge1", "anyname1c")
        ];
        bridge2Scopes = [
          chores.toFullname("bridge2", "anyname2a"),
          chores.toFullname("bridge2", "anyname2b"),
          chores.toFullname("bridge2", "anyname2c")
        ];
      }

      return app.server.start()
        .then(function(info) {
          assert.equal(serverStats.startingCount, 3);
          return info;
        })
        .delay(100)
        .then(function(info) {
          false && console.info(JSON.stringify(moduleStats, null, 2));
          assert.isAbove(moduleStats.constructorBeginTotal, 0);
          assert.equal(moduleStats.constructorBeginTotal, moduleStats.constructorEndTotal);
          let metadata = lodash.map(moduleStats.metadata, function(item) {
            return item && item.blockName;
          });
          // block 'bootstrap' appears 3 times
          metadata = lodash.uniq(metadata);
          false && console.info(JSON.stringify(metadata, null, 2));
          assert.includeMembers(metadata, frameworkScopes);
          assert.includeMembers(metadata, plugin1Scopes);
          assert.includeMembers(metadata, plugin2Scopes);
          assert.includeMembers(metadata, bridge1Scopes);
          assert.includeMembers(metadata, bridge2Scopes);
          false && assert.includeMembers(metadata, mainScopes);
          assert.equal(metadata.length, frameworkScopes.length +
              plugin1Scopes.length + plugin2Scopes.length +
              bridge1Scopes.length + bridge2Scopes.length);
          return info;
        })
        .delay(100)
        .then(function(info) {
          return app.server.stop();
        })
        .then(function() {
          assert.equal(serverStats.stoppingCount, 3);
        });
    });

    afterEach(function() {
      app = null;
    });

    after(function() {
      LogTracer.clearInterceptors();
    });
  });

  describe("other applications", function() {
    let app;
    let moduleStats = {};

    before(function() {
      LogTracer.setupDefaultInterceptors([
        {
          accumulator: moduleStats,
          mappings: [
            {
              allTags: [ chores.toFullname(FRAMEWORK_PACKAGE_NAME, "sandboxManager"), "instantiateObject" ],
              storeTo: "dependencyInfo"
            },
            {
              allTags: [ chores.toFullname(FRAMEWORK_NAMESPACE + "-dp-wrapper1", "sublibTrigger"), "bridge-config" ],
              storeTo: "bridgeConfigOfWrapper1"
            },
            {
              allTags: [ chores.toFullname(FRAMEWORK_NAMESPACE + "-dp-wrapper2", "sublibTrigger"), "bridge-config" ],
              storeTo: "bridgeConfigOfWrapper2"
            },
            {
              anyTags: [ "constructor-begin" ],
              countTo: "constructorBeginTotal"
            },
            {
              anyTags: [ "constructor-end" ],
              countTo: "constructorEndTotal"
            }
          ]
        }
      ]);
    });

    beforeEach(function() {
      LogTracer.reset().empty(moduleStats);
    });

    it("[naming-convention] special plugins & bridges should be loaded properly", function() {
      if (!chores.isUpgradeSupported("standardizing-config")) {
        this.skip();
      }

      app = lab.getApp(lab.unloadApp("naming-convention"));
      assert.isNotNull(app.server);

      false && console.info(JSON.stringify(moduleStats, null, 2));
      assert.isAbove(moduleStats.constructorBeginTotal, 0);
      assert.equal(moduleStats.constructorBeginTotal, moduleStats.constructorEndTotal);

      let expectedDependencies = [
        {
          "handlerName": chores.toFullname("application", "mainService"),
          "handlerType": "SERVICE"
        },
        {
          "handlerName": chores.toFullname(FRAMEWORK_NAMESPACE + "-dp-wrapper1", "sublibService"),
          "handlerType": "SERVICE"
        },
        {
          "handlerName": chores.toFullname(FRAMEWORK_NAMESPACE + "-dp-wrapper2", "sublibService"),
          "handlerType": "SERVICE"
        },
        {
          "handlerName": chores.toFullname("application", "mainTrigger"),
          "handlerType": "TRIGGER"
        },
        {
          "handlerName": chores.toFullname(FRAMEWORK_NAMESPACE + "-dp-wrapper1", "sublibTrigger"),
          "handlerType": "TRIGGER"
        },
        {
          "handlerName": chores.toFullname(FRAMEWORK_NAMESPACE + "-dp-wrapper2", "sublibTrigger"),
          "handlerType": "TRIGGER"
        }
      ];
      if (chores.isUpgradeSupported("bridge-full-ref")) {
        expectedDependencies.push({
          "handlerName": chores.toFullname("application", "connector1#wrapper"),
          "handlerType": "DIALECT"
        },
        {
          "handlerName": chores.toFullname(FRAMEWORK_NAMESPACE + "-dp-wrapper1", "connector1#bean"),
          "handlerType": "DIALECT"
        },
        {
          "handlerName": chores.toFullname(FRAMEWORK_NAMESPACE + "-dp-wrapper2", "connector1#bean"),
          "handlerType": "DIALECT"
        },
        {
          "handlerName": chores.toFullname("application", "connector2#wrapper"),
          "handlerType": "DIALECT"
        },
        {
          "handlerName": chores.toFullname(FRAMEWORK_NAMESPACE + "-dp-wrapper1", "connector2#bean"),
          "handlerType": "DIALECT"
        },
        {
          "handlerName": chores.toFullname(FRAMEWORK_NAMESPACE + "-dp-wrapper2", "connector2#bean"),
          "handlerType": "DIALECT"
        },
        {
          "handlerName": chores.toFullname(FRAMEWORK_NAMESPACE + "-dp-wrapper1", "bridgeKebabCase1#pointer"),
          "handlerType": "DIALECT"
        },
        {
          "handlerName": chores.toFullname(FRAMEWORK_NAMESPACE + "-dp-wrapper2", "bridgeKebabCase1#pointer"),
          "handlerType": "DIALECT"
        },
        {
          "handlerName": chores.toFullname(FRAMEWORK_NAMESPACE + "-dp-wrapper1", "bridgeKebabCase2#pointer"),
          "handlerType": "DIALECT"
        },
        {
          "handlerName": chores.toFullname(FRAMEWORK_NAMESPACE + "-dp-wrapper2", "bridgeKebabCase2#pointer"),
          "handlerType": "DIALECT"
        });
      };

      let dependencyInfo = lodash.map(moduleStats.dependencyInfo, function(item) {
        return lodash.pick(item, ["handlerName", "handlerType"]);
      });
      false && console.info(JSON.stringify(dependencyInfo, null, 2));
      assert.sameDeepMembers(dependencyInfo, expectedDependencies);
    });

    it("[naming-convention] special plugins & bridges should be available", function() {
      if (!chores.isUpgradeSupported("standardizing-config")) {
        return this.skip();
      }
      app = lab.getApp("naming-convention/index1");
      return app.runner.invoke(function(injektor) {
        let sandboxManager = injektor.lookup("sandboxManager");
        let service1 = sandboxManager.getSandboxService("sublibService", {
          scope: FRAMEWORK_NAMESPACE + "-dp-wrapper1"
        });
        assert(service1.getConfig(), { port: 17741, host: "localhost" });
        let service2 = sandboxManager.getSandboxService(chores.toFullname(FRAMEWORK_NAMESPACE + "-dp-wrapper2", "sublibService"));
        assert(service2.getConfig(), { port: 17742, host: "localhost" });
      });
    });

    it("[naming-convention] bridge configuration should be loaded properly", function() {
      if (!chores.isUpgradeSupported("standardizing-config")) {
        this.skip();
      }
      if (!chores.isUpgradeSupported("bridge-full-ref")) {
        this.skip();
      }

      app = lab.getApp("naming-convention/index2");
      assert.isNotNull(app.server);

      false && console.info(JSON.stringify(moduleStats, null, 2));
      for (let k=1; k<=2; k++) {
        let config = lodash.map(moduleStats["bridgeConfigOfWrapper" + k], function(item) {
          return lodash.get(item, "config");
        });
        false && console.info(JSON.stringify(config, null, 2));
        assert.sameDeepMembers(config, [
          {
            "default": false,
            "refPath": util.format("sandbox -> connector1 -> wrapper%s -> bean", k),
            "refType": util.format("wrapper%s", k),
            "refName": util.format("namespace-dp-wrapper%s", k)
          },
          {
            "default": false,
            "refPath": util.format("sandbox -> connector2 -> wrapper%s -> bean", k),
            "refType": util.format("wrapper%s", k),
            "refName": util.format("namespace-dp-wrapper%s", k)
          }
        ]);
      }
    });

    it("[reference-alias] special plugins & bridges should be loaded properly", function() {
      if (!chores.isUpgradeSupported("presets")) {
        this.skip();
        return;
      }

      app = lab.getApp("reference-alias");
      assert.isNotNull(app.server);

      false && console.info(JSON.stringify(moduleStats, null, 2));
      assert.isAbove(moduleStats.constructorBeginTotal, 0);
      assert.equal(moduleStats.constructorBeginTotal, moduleStats.constructorEndTotal);

      let dependencyInfo = lodash.map(moduleStats.dependencyInfo, function(item) {
        return lodash.pick(item, ["handlerName", "handlerType"]);
      });
      false && console.info(JSON.stringify(dependencyInfo, null, 2));
      assert.sameDeepMembers(dependencyInfo, [
        {
          "handlerName": chores.toFullname("application", "mainService"),
          "handlerType": "SERVICE"
        },
        {
          "handlerName": chores.toFullname("plugin-reference-alias", "sublibService"),
          "handlerType": "SERVICE"
        },
        {
          "handlerName": chores.toFullname("application", "mainTrigger"),
          "handlerType": "TRIGGER"
        },
        {
          "handlerName": chores.toFullname("plugin-reference-alias", "sublibTrigger"),
          "handlerType": "TRIGGER"
        }
      ]);
    });

    it("[rename-comp-dir] special plugins & bridges should be loaded properly", function() {
      if (!chores.isUpgradeSupported("presets")) {
        this.skip();
        return;
      }

      app = lab.getApp("rename-comp-dir");
      assert.isNotNull(app.server);

      false && console.info(JSON.stringify(moduleStats, null, 2));
      assert.isAbove(moduleStats.constructorBeginTotal, 0);
      assert.equal(moduleStats.constructorBeginTotal, moduleStats.constructorEndTotal);

      let dependencyInfo = lodash.map(moduleStats.dependencyInfo, function(item) {
        return lodash.pick(item, ["handlerName", "handlerType"]);
      });
      false && console.info(JSON.stringify(dependencyInfo, null, 2));
      assert.sameDeepMembers(dependencyInfo, [
        {
          "handlerName": chores.toFullname("application", "mainService"),
          "handlerType": "SERVICE"
        },
        {
          "handlerName": chores.toFullname("plugin-rename-comp-dir", "sublibService"),
          "handlerType": "SERVICE"
        },
        {
          "handlerName": chores.toFullname("application", "mainTrigger"),
          "handlerType": "TRIGGER"
        },
        {
          "handlerName": chores.toFullname("plugin-rename-comp-dir", "sublibTrigger"),
          "handlerType": "TRIGGER"
        }
      ]);
    });

    after(function() {
      LogTracer.clearInterceptors();
    });
  });
});
