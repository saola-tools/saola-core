"use strict";

const lab = require("../index");
const FRWK = lab.getFramework();
const chores = FRWK.require("chores");
const lodash = FRWK.require("lodash");
const assert = require("chai").assert;
const path = require("path");
const bootstrap = require(lab.getFrameworkModule("bootstrap"));
const LogConfig = FRWK.require("logolite").LogConfig;
const LogTracer = FRWK.require("logolite").LogTracer;
const envcloak = require("envcloak").instance;

const constx = require(lab.getFrameworkModule("utils/constx"));
const FRAMEWORK_NAMESPACE = constx.FRAMEWORK.NAMESPACE;
const FRAMEWORK_PACKAGE_NAME = constx.FRAMEWORK.PACKAGE_NAME;
const FRAMEWORK_PACKAGE_AUTHOR = "devebot";
const TEST_PACKAGE_AUTHOR = "devteam";

const CONFIG_EXTENDED_FIELDS = [
  "profile", "sandbox", "texture",
  "appName", "appInfo", "bridgeList", "bundleList",
];
if (!chores.isUpgradeSupported("config-extended-fields")) {
  CONFIG_EXTENDED_FIELDS.push("bridgeRefs", "pluginRefs");
}

describe("tdd:lib:base:bootstrap", function() {
  this.timeout(lab.getDefaultTimeout());

  before(function() {
    envcloak.setup({
      LOGOLITE_FULL_LOG_MODE: "false",
      LOGOLITE_ALWAYS_ENABLED: "all",
      LOGOLITE_ALWAYS_MUTED: "all"
    });
    LogConfig.reset();
  });

  after(function() {
    LogTracer.clearInterceptors();
    envcloak.reset();
  });

  describe("Prerequisite", function() {
    it("launchApplication() load configure only (not server/runner)", function() {
      let loggingStore = {};
      LogTracer.reset().setupDefaultInterceptors([{
        accumulator: loggingStore,
        mappings: [{
          allTags: [ "constructor-begin", "appLoader" ],
          countTo: "appLoader"
        }, {
          allTags: [ chores.toFullname(FRAMEWORK_PACKAGE_NAME, "kernel"), "constructor-begin" ],
          countTo: "loadingKernel"
        }, {
          allTags: [ chores.toFullname(FRAMEWORK_PACKAGE_NAME, "server"), "constructor-begin" ],
          countTo: "loadingServer"
        }, {
          allTags: [ chores.toFullname(FRAMEWORK_PACKAGE_NAME, "runner"), "constructor-begin" ],
          countTo: "loadingRunner"
        }]
      }]);

      let app = bootstrap.launchApplication({
        appRootPath: lab.getAppHome("fullapp")
      });

      false && console.info(loggingStore);
      assert.deepEqual(loggingStore, { appLoader: 1 });

      LogTracer.clearInterceptors();
    });
  });

  describe("replaceObjectFields()", function() {
    it("should do nothing with empty object", function() {
      assert.deepEqual(replaceObjectFields({}, DEFAULT_CONTEXT), {});
      assert.deepEqual(replaceObjectFields(null, DEFAULT_CONTEXT), null);
      assert.deepEqual(replaceObjectFields("hello", DEFAULT_CONTEXT), "hello");
    });
    it("should replace the matched string fields only", function() {
      assert.deepEqual(
        replaceObjectFields({
          libRootPaths: [
            "/some/path/here/test/lib/plugin1",
            "/some/path/here/test/lib/plugin2",
            "/some/path/here/test/lib/plugin3"
          ],
          pluginRefs: {
            "plugin1": { name: "plugin1", path: "/some/path/here/test/lib/plugin1" },
            "plugin2": { name: "plugin2", path: "/some/path/here/test/lib/plugin2" },
            "plugin3": { name: "plugin3", path: "/some/path/here/test/lib/plugin3" }
          },
          bridgeRefs: {
            "bridge1": { name: "bridge1", path: "/some/path/here/test/lib/bridge1" },
            "bridge2": { name: "bridge2", path: "/some/path/here/test/lib/bridge2" }
          }
        }, DEFAULT_CONTEXT),
        {
          libRootPaths: ["/test/lib/plugin1", "/test/lib/plugin2", "/test/lib/plugin3"],
          pluginRefs: {
            "plugin1": { name: "plugin1", path: "/test/lib/plugin1" },
            "plugin2": { name: "plugin2", path: "/test/lib/plugin2" },
            "plugin3": { name: "plugin3", path: "/test/lib/plugin3" }
          },
          bridgeRefs: {
            "bridge1": { name: "bridge1", path: "/test/lib/bridge1" },
            "bridge2": { name: "bridge2", path: "/test/lib/bridge2" }
          }
        }
      );
    });
  });

  describe("require()", function() {
    let pkgs = {
      chores: path.join(lab.getFrameworkHome(), "lib/utils/chores.js"),
      errors: path.join(lab.getFrameworkHome(), "lib/utils/errors.js"),
      loader: path.join(lab.getFrameworkHome(), "lib/utils/loader.js"),
      pinbug: path.join(lab.getFrameworkHome(), "lib/utils/pinbug.js"),
    };
    lodash.forEach([ "injektor", "logolite", "schemato" ], function(pkgName) {
      pkgs[pkgName] = pkgName;
    });
    it("require() returns correct exported packages", function() {
      lodash.forOwn(pkgs, function(pkgPath, pkgName) {
        assert.equal(bootstrap.require(pkgName), require(pkgPath));
      });
    });
  });

  describe("locatePackage()", function() {
    let issueInspector = lab.getIssueInspector();
    let bootstrap = lab.acquireFrameworkModule("bootstrap");
    let locatePackage = bootstrap.__get__("locatePackage");
    assert.isFunction(locatePackage);

    it("locate a valid package successfully", function() {
      let providedPkg = lab.getAppHome("locating-package-json");
      let detectedPkg = locatePackage({issueInspector}, {
        name: "locating-package-json",
        type: "application",
        path: providedPkg
      });
      assert.equal(detectedPkg, providedPkg);
    });

    it("locate a deep packages with default [main] script files (index.js)", function() {
      let detectedPkg = replaceLibPath(locatePackage({issueInspector}, {
        name: "locating-package-json-foo",
        type: "application",
        path: lab.getAppHome("locating-package-json/foo")
      }));
      assert.equal(detectedPkg, "/test/app/locating-package-json/foo");

      detectedPkg = replaceLibPath(locatePackage({issueInspector}, {
        name: "locating-package-json-foo",
        type: "application",
        path: lab.getAppHome("locating-package-json/foo/sub")
      }));
      assert.equal(detectedPkg, "/test/app/locating-package-json/foo");

      detectedPkg = replaceLibPath(locatePackage({issueInspector}, {
        name: "locating-package-json-foo",
        type: "application",
        path: lab.getAppHome("locating-package-json/foo/sub/sub")
      }));
      assert.equal(detectedPkg, "/test/app/locating-package-json/foo/sub/sub");

      detectedPkg = replaceLibPath(locatePackage({issueInspector}, {
        name: "locating-package-json-foo",
        type: "application",
        path: lab.getAppHome("locating-package-json/foo/sub/sub/sub")
      }));
      assert.equal(detectedPkg, "/test/app/locating-package-json/foo/sub/sub");
    });

    it("locate a deep packages with customized [main] script files", function() {
      let detectedPkg = replaceLibPath(locatePackage({issueInspector}, {
        name: "locating-package-json-bar",
        type: "application",
        path: lab.getAppHome("locating-package-json/bar")
      }));
      assert.equal(detectedPkg, "/test/app/locating-package-json/bar");

      detectedPkg = replaceLibPath(locatePackage({issueInspector}, {
        name: "locating-package-json-bar",
        type: "application",
        path: lab.getAppHome("locating-package-json/bar/sub/start")
      }));
      assert.equal(detectedPkg, "/test/app/locating-package-json/bar");

      detectedPkg = replaceLibPath(locatePackage({issueInspector}, {
        name: "locating-package-json-bar",
        type: "application",
        path: lab.getAppHome("locating-package-json/bar/sub/sub")
      }));
      assert.equal(detectedPkg, "/test/app/locating-package-json/bar/sub/sub");

      detectedPkg = replaceLibPath(locatePackage({issueInspector}, {
        name: "locating-package-json-bar",
        type: "application",
        path: lab.getAppHome("locating-package-json/bar/sub/sub/sub/start")
      }));
      assert.equal(detectedPkg, "/test/app/locating-package-json/bar/sub/sub");
    });
  });

  describe("expandExtensions()", function() {
    let bootstrap = lab.acquireFrameworkModule("bootstrap");
    let expandExtensions = bootstrap.__get__("expandExtensions");
    assert.isFunction(expandExtensions);

    it("expand empty parameters", function() {
      let output = expandExtensions();
      false && console.info("expandExtensions(): ", output);
      assert.deepEqual(output, {
        libRootPaths: [],
        bridgeRefs: {},
        pluginRefs: {}
      });
    });

    it("expand empty context with a list of plugins", function() {
      let output = expandExtensions(null, [
        {
          name: "plugin1",
          path: lab.getLibHome("plugin1")
        },
        {
          name: "plugin2",
          path: lab.getLibHome("plugin2")
        }
      ], null);
      output = replaceObjectFields(removeLoggingUtils(output), DEFAULT_CONTEXT);
      false && console.info("expandExtensions(): ", JSON.stringify(output, null, 2));
      if (chores.isUpgradeSupported("presets")) {
        assert.deepEqual(output, {
          "libRootPaths": [
            "/test/lib/plugin1",
            "/test/lib/plugin2"
          ],
          "pluginRefs": {
            "/test/lib/plugin1": {
              "name": "plugin1",
              "type": "plugin",
              "path": "/test/lib/plugin1",
              "presets": {
                "configTags": "bridge[dialect-bridge]"
              },
              "bridgeDepends": [ "bridge1", "bridge2" ],
              "pluginDepends": []
            },
            "/test/lib/plugin2": {
              "name": "plugin2",
              "type": "plugin",
              "path": "/test/lib/plugin2",
              "presets": {
                "configTags": "bridge[dialect-bridge]"
              },
              "bridgeDepends": [ "bridge1", "bridge2" ],
              "pluginDepends": []
            }
          },
          "bridgeRefs": {
            "/test/lib/bridge1": {
              "name": "bridge1",
              "type": "bridge",
              "path": "/test/lib/bridge1"
            },
            "/test/lib/bridge2": {
              "name": "bridge2",
              "type": "bridge",
              "path": "/test/lib/bridge2"
            }
          }
        });
      } else {
        assert.deepEqual(output, {
          libRootPaths: ["/test/lib/plugin1", "/test/lib/plugin2"],
          pluginRefs: {
            "plugin1": { name: "plugin1", type: "plugin", path: "/test/lib/plugin1" },
            "plugin2": { name: "plugin2", type: "plugin", path: "/test/lib/plugin2" }
          },
          bridgeRefs: {
            "bridge1": { name: "bridge1", type: "bridge", path: "/test/lib/bridge1" },
            "bridge2": { name: "bridge2", type: "bridge", path: "/test/lib/bridge2" }
          }
        });
      }
    });

    it("expand empty context with a list of bridges", function() {
      let output = expandExtensions(null, [], [
        {
          name: "bridge1",
          path: lab.getLibHome("bridge1")
        },
        {
          name: "bridge2",
          path: lab.getLibHome("bridge2")
        }
      ]);
      output = replaceObjectFields(output, DEFAULT_CONTEXT);
      false && console.info("expandExtensions(): ", output);
      if (chores.isUpgradeSupported("presets")) {
        assert.deepEqual(output, {
          libRootPaths: [],
          pluginRefs: {},
          bridgeRefs: {
            "/test/lib/bridge1": {
              "name": "bridge1",
              "type": "bridge",
              "path": "/test/lib/bridge1"
            },
            "/test/lib/bridge2": {
              "name": "bridge2",
              "type": "bridge",
              "path": "/test/lib/bridge2"
            }
          }
        });
      } else {
        assert.deepEqual(output, {
          libRootPaths: [],
          pluginRefs: {},
          bridgeRefs: {
            "bridge1": { name: "bridge1", type: "bridge", path: "/test/lib/bridge1" },
            "bridge2": { name: "bridge2", type: "bridge", path: "/test/lib/bridge2" }
          }
        });
      }
    });

    it("expand empty context with a list of plugins and a list of bridges", function() {
      let output = expandExtensions(null, [
        {
          name: "plugin1",
          path: lab.getLibHome("plugin1")
        },
        {
          name: "plugin2",
          path: lab.getLibHome("plugin2")
        },
        {
          name: "plugin3",
          path: lab.getLibHome("plugin3")
        }
      ], [
        {
          name: "bridge1",
          path: lab.getLibHome("bridge1")
        },
        {
          name: "bridge2",
          path: lab.getLibHome("bridge2")
        }
      ]);
      output = replaceObjectFields(removeLoggingUtils(output), DEFAULT_CONTEXT);
      false && console.info("expandExtensions(): ", JSON.stringify(output, null, 2));
      if (chores.isUpgradeSupported("presets")) {
        assert.deepEqual(output, {
          "libRootPaths": [
            "/test/lib/plugin1",
            "/test/lib/plugin2",
            "/test/lib/plugin3"
          ],
          "pluginRefs": {
            "/test/lib/plugin1": {
              "name": "plugin1",
              "type": "plugin",
              "path": "/test/lib/plugin1",
              "presets": {
                "configTags": "bridge[dialect-bridge]"
              },
              "bridgeDepends": [ "bridge1", "bridge2" ],
              "pluginDepends": []
            },
            "/test/lib/plugin2": {
              "name": "plugin2",
              "type": "plugin",
              "path": "/test/lib/plugin2",
              "presets": {
                "configTags": "bridge[dialect-bridge]"
              },
              "bridgeDepends": [ "bridge1", "bridge2" ],
              "pluginDepends": []
            },
            "/test/lib/plugin3": {
              "name": "plugin3",
              "type": "plugin",
              "path": "/test/lib/plugin3",
              "presets": {},
              "bridgeDepends": [],
              "pluginDepends": []
            }
          },
          "bridgeRefs": {
            "/test/lib/bridge1": {
              "name": "bridge1",
              "type": "bridge",
              "path": "/test/lib/bridge1"
            },
            "/test/lib/bridge2": {
              "name": "bridge2",
              "type": "bridge",
              "path": "/test/lib/bridge2"
            }
          }
        });
      } else {
        assert.deepEqual(output, {
          libRootPaths: ["/test/lib/plugin1", "/test/lib/plugin2", "/test/lib/plugin3"],
          pluginRefs: {
            "plugin1": { name: "plugin1", type: "plugin", path: "/test/lib/plugin1" },
            "plugin2": { name: "plugin2", type: "plugin", path: "/test/lib/plugin2" },
            "plugin3": { name: "plugin3", type: "plugin", path: "/test/lib/plugin3" }
          },
          bridgeRefs: {
            "bridge1": { name: "bridge1", type: "bridge", path: "/test/lib/bridge1" },
            "bridge2": { name: "bridge2", type: "bridge", path: "/test/lib/bridge2" }
          }
        });
      }
    });

    it("expand empty context with nested and overlap plugins", function() {
      let output = expandExtensions(null, [
        {
          name: "sub-plugin1",
          path: lab.getLibHome("sub-plugin1")
        },
        {
          name: "sub-plugin2",
          path: lab.getLibHome("sub-plugin2")
        }
      ]);
      output = replaceObjectFields(removeLoggingUtils(output), DEFAULT_CONTEXT);
      false && console.info("expandExtensions(): ", JSON.stringify(output, null, 2));
      if (chores.isUpgradeSupported("presets")) {
        assert.deepEqual(output, {
          "libRootPaths": [
            "/test/lib/sub-plugin1",
            "/test/lib/plugin1",
            "/test/lib/plugin2",
            "/test/lib/sub-plugin2",
            "/test/lib/plugin3"
          ],
          "pluginRefs": {
            "/test/lib/sub-plugin1": {
              "name": "sub-plugin1",
              "type": "plugin",
              "path": "/test/lib/sub-plugin1",
              "presets": {},
              "bridgeDepends": [ "bridge1", "bridge2" ],
              "pluginDepends": [ "plugin1", "plugin2" ]
            },
            "/test/lib/sub-plugin2": {
              "name": "sub-plugin2",
              "type": "plugin",
              "path": "/test/lib/sub-plugin2",
              "presets": {},
              "bridgeDepends": [ "bridge2", "bridge3" ],
              "pluginDepends": [ "plugin2", "plugin3" ]
            },
            "/test/lib/plugin1": {
              "name": "plugin1",
              "type": "plugin",
              "path": "/test/lib/plugin1",
              "presets": {
                "configTags": "bridge[dialect-bridge]"
              },
              "bridgeDepends": [ "bridge1", "bridge2" ],
              "pluginDepends": []
            },
            "/test/lib/plugin2": {
              "name": "plugin2",
              "type": "plugin",
              "path": "/test/lib/plugin2",
              "presets": {
                "configTags": "bridge[dialect-bridge]"
              },
              "bridgeDepends": [ "bridge1", "bridge2" ],
              "pluginDepends": []
            },
            "/test/lib/plugin3": {
              "name": "plugin3",
              "type": "plugin",
              "path": "/test/lib/plugin3",
              "presets": {},
              "bridgeDepends": [],
              "pluginDepends": []
            }
          },
          "bridgeRefs": {
            "/test/lib/bridge1": {
              "name": "bridge1",
              "type": "bridge",
              "path": "/test/lib/bridge1"
            },
            "/test/lib/bridge2": {
              "name": "bridge2",
              "type": "bridge",
              "path": "/test/lib/bridge2"
            },
            "/test/lib/bridge3": {
              "name": "bridge3",
              "type": "bridge",
              "path": "/test/lib/bridge3"
            }
          }
        });
      } else {
        assert.deepEqual(output, {
          libRootPaths:
            [
              "/test/lib/sub-plugin1",
              "/test/lib/plugin1",
              "/test/lib/plugin2",
              "/test/lib/sub-plugin2",
              "/test/lib/plugin3"
            ],
          pluginRefs:
            {
              "sub-plugin1": { name: "sub-plugin1", type: "plugin", path: "/test/lib/sub-plugin1" },
              "sub-plugin2": { name: "sub-plugin2", type: "plugin", path: "/test/lib/sub-plugin2" },
              plugin1: { name: "plugin1", type: "plugin", path: "/test/lib/plugin1" },
              plugin2: { name: "plugin2", type: "plugin", path: "/test/lib/plugin2" },
              plugin3: { name: "plugin3", type: "plugin", path: "/test/lib/plugin3" }
            },
          bridgeRefs:
            {
              bridge1: { name: "bridge1", type: "bridge", path: "/test/lib/bridge1" },
              bridge2: { name: "bridge2", type: "bridge", path: "/test/lib/bridge2" },
              bridge3: { name: "bridge3", type: "bridge", path: "/test/lib/bridge3" }
            }
        });
      }
    });

    it("expand empty context with complete plugins (nested and overlap plugins)", function() {
      let output = expandExtensions(null, [
        {
          name: "sub-plugin1",
          path: lab.getLibHome("sub-plugin1")
        },
        {
          name: "plugin1",
          path: lab.getLibHome("plugin1")
        },
        {
          name: "plugin2",
          path: lab.getLibHome("plugin2")
        },
        {
          name: "sub-plugin2",
          path: lab.getLibHome("sub-plugin2")
        },
        {
          name: "plugin3",
          path: lab.getLibHome("plugin3")
        },
        {
          name: "plugin4",
          path: lab.getLibHome("plugin4")
        }
      ], [
        {
          name: "bridge1",
          path: lab.getLibHome("bridge1")
        },
        {
          name: "bridge2",
          path: lab.getLibHome("bridge2")
        },
        {
          name: "bridge3",
          path: lab.getLibHome("bridge3")
        },
        {
          name: "bridge4",
          path: lab.getLibHome("bridge4")
        }
      ]);
      output = replaceObjectFields(removeLoggingUtils(output), DEFAULT_CONTEXT);
      false && console.info("expandExtensions(): ", JSON.stringify(output, null, 2));
      if (chores.isUpgradeSupported("presets")) {
        assert.deepEqual(output, {
          "libRootPaths": [
            "/test/lib/sub-plugin1",
            "/test/lib/plugin1",
            "/test/lib/plugin2",
            "/test/lib/sub-plugin2",
            "/test/lib/plugin3",
            "/test/lib/plugin4"
          ],
          "pluginRefs": {
            "/test/lib/sub-plugin1": {
              "name": "sub-plugin1",
              "type": "plugin",
              "path": "/test/lib/sub-plugin1",
              "presets": {},
              "bridgeDepends": [ "bridge1", "bridge2" ],
              "pluginDepends": [ "plugin1", "plugin2" ],
            },
            "/test/lib/plugin1": {
              "name": "plugin1",
              "type": "plugin",
              "path": "/test/lib/plugin1",
              "presets": {
                "configTags": "bridge[dialect-bridge]"
              },
              "bridgeDepends": [ "bridge1", "bridge2" ],
              "pluginDepends": [],
            },
            "/test/lib/plugin2": {
              "name": "plugin2",
              "type": "plugin",
              "path": "/test/lib/plugin2",
              "presets": {
                "configTags": "bridge[dialect-bridge]"
              },
              "bridgeDepends": [ "bridge1", "bridge2" ],
              "pluginDepends": []
            },
            "/test/lib/sub-plugin2": {
              "name": "sub-plugin2",
              "type": "plugin",
              "path": "/test/lib/sub-plugin2",
              "presets": {},
              "bridgeDepends": [ "bridge2", "bridge3" ],
              "pluginDepends": [ "plugin2", "plugin3" ]
            },
            "/test/lib/plugin3": {
              "name": "plugin3",
              "type": "plugin",
              "path": "/test/lib/plugin3",
              "presets": {},
              "bridgeDepends": [],
              "pluginDepends": []
            },
            "/test/lib/plugin4": {
              "name": "plugin4",
              "type": "plugin",
              "path": "/test/lib/plugin4",
              "presets": {},
              "bridgeDepends": [],
              "pluginDepends": []
            }
          },
          "bridgeRefs": {
            "/test/lib/bridge1": {
              "name": "bridge1",
              "type": "bridge",
              "path": "/test/lib/bridge1"
            },
            "/test/lib/bridge2": {
              "name": "bridge2",
              "type": "bridge",
              "path": "/test/lib/bridge2"
            },
            "/test/lib/bridge3": {
              "name": "bridge3",
              "type": "bridge",
              "path": "/test/lib/bridge3"
            },
            "/test/lib/bridge4": {
              "name": "bridge4",
              "type": "bridge",
              "path": "/test/lib/bridge4"
            }
          }
        });
      } else {
        assert.deepEqual(output, {
          libRootPaths:
            [
              "/test/lib/sub-plugin1",
              "/test/lib/plugin1",
              "/test/lib/plugin2",
              "/test/lib/sub-plugin2",
              "/test/lib/plugin3",
              "/test/lib/plugin4"
            ],
          pluginRefs:
            {
              "sub-plugin1": { name: "sub-plugin1", type: "plugin", path: "/test/lib/sub-plugin1" },
              plugin1: { name: "plugin1", type: "plugin", path: "/test/lib/plugin1" },
              plugin2: { name: "plugin2", type: "plugin", path: "/test/lib/plugin2" },
              "sub-plugin2": { name: "sub-plugin2", type: "plugin", path: "/test/lib/sub-plugin2" },
              plugin3: { name: "plugin3", type: "plugin", path: "/test/lib/plugin3" },
              plugin4: { name: "plugin4", type: "plugin", path: "/test/lib/plugin4" }
            },
          bridgeRefs:
            {
              bridge1: { name: "bridge1", type: "bridge", path: "/test/lib/bridge1" },
              bridge2: { name: "bridge2", type: "bridge", path: "/test/lib/bridge2" },
              bridge3: { name: "bridge3", type: "bridge", path: "/test/lib/bridge3" },
              bridge4: { name: "bridge4", type: "bridge", path: "/test/lib/bridge4" }
            }
        });
      }
    });
  });

  describe("launchApplication()", function() {
    function assertAppConfig (app) {
      let cfg = app.config;
      false && console.info("SHOW [app.config]: ", cfg);
      assert.hasAllKeys(cfg, CONFIG_EXTENDED_FIELDS);
      assert.equal(cfg.appName, FRAMEWORK_NAMESPACE + "-application");
      assert.deepEqual(cfg.appInfo, {
        layerware: [],
        framework: lab.getFrameworkInfo()
      });
      assert.sameDeepMembers(cfg.bridgeList, []);
      assert.sameDeepMembers(lodash.map(cfg.bundleList, item => {
        return lodash.pick(item, ["type", "name"]);
      }), [{
        type: "application",
        name: FRAMEWORK_NAMESPACE + "-application"
      },
      {
        type: "framework",
        name: FRAMEWORK_PACKAGE_NAME
      }]);
    };

    function assertAppRunner (app) {
      return app.runner;
    };

    function assertAppServer (app) {
      return app.server;
    };

    beforeEach(function() {
      LogTracer.reset();
    });

    it("launch application with empty parameters", function() {
      let app = bootstrap.launchApplication();
      let cfg = replaceObjectFields(app.config);
      false && console.info("Application config: ", JSON.stringify(cfg, null, 2));
      assert.equal(cfg.appName, FRAMEWORK_NAMESPACE + "-application");
      assert.deepEqual(cfg.appInfo, {
        layerware: [],
        framework: lab.getFrameworkInfo()
      });
      assert.sameDeepMembers(cfg.bridgeList, []);
      assert.sameDeepMembers(cfg.bundleList, [
        {
          "name": FRAMEWORK_NAMESPACE + "-application",
          "type": "application",
        },
        {
          "name": FRAMEWORK_PACKAGE_NAME,
          "type": "framework",
          "path": "/devebot",
        }
      ]);
    });

    it("launch application with empty root directory (as string)", function() {
      let app = bootstrap.launchApplication(lab.getAppHome("empty"), [], []);
      assertAppConfig(app);
    });

    it("launch application with empty root directory (in context)", function() {
      let app = bootstrap.launchApplication({
        appRootPath: lab.getAppHome("empty")
      }, [], []);
      assertAppConfig(app);
      assertAppRunner(app);
      assertAppServer(app);
    });

    it("launch application with full components", function() {
      let app = lab.getApp("fullapp");
      false && console.info("fullapp app.config: ", JSON.stringify(app.config, null, 2));
      let cfg = replaceObjectFields(app.config, DEFAULT_CONTEXT);
      false && console.info("fullapp cfg: ", JSON.stringify(cfg, null, 2));
      assert.hasAllKeys(cfg, CONFIG_EXTENDED_FIELDS);
      // verify appInfo
      assert.equal(cfg.appName, "fullapp");
      assert.deepEqual(cfg.appInfo, {
        "version": "0.1.0",
        "name": "fullapp",
        "description": "Demo Application",
        "main": "index.js",
        "author": TEST_PACKAGE_AUTHOR,
        "license": "ISC",
        "layerware": [
          {
            "version": "0.1.1",
            "name": "sub-plugin1",
            "description": "",
            "main": "index.js",
            "author": TEST_PACKAGE_AUTHOR,
            "license": "ISC"
          },
          {
            "version": "0.1.2",
            "name": "sub-plugin2",
            "description": "",
            "main": "index.js",
            "author": TEST_PACKAGE_AUTHOR,
            "license": "ISC"
          },
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
          },
          {
            "version": "0.1.3",
            "name": "plugin3",
            "description": "",
            "main": "index.js",
            "author": TEST_PACKAGE_AUTHOR,
            "license": "ISC"
          }
        ],
        "framework": lab.getFrameworkInfo()
      });
      // verify bridgeRefs
      let expectedBridgeRefs = [
        {
          "type": "bridge",
          "name": "bridge3",
          "path": "/test/lib/bridge3",
          "code": "bridge3",
          "codeInCamel": "bridge3",
          "nameInCamel": "bridge3",
          "manifest": null,
          "version": "0.1.3",
        },
        {
          "type": "bridge",
          "name": "bridge4",
          "path": "/test/lib/bridge4",
          "code": "bridge4",
          "codeInCamel": "bridge4",
          "nameInCamel": "bridge4",
          "manifest": null,
          "version": "0.1.4",
        },
        {
          "type": "bridge",
          "name": "devebot-co-connector1",
          "path": "/test/lib/namespace-co-connector1",
          "code": "connector1",
          "codeInCamel": "connector1",
          "nameInCamel": "devebotCoConnector1",
          "manifest": null,
          "version": "0.1.1",
        },
        {
          "type": "bridge",
          "name": "devebot-co-connector2",
          "path": "/test/lib/namespace-co-connector2",
          "code": "connector2",
          "codeInCamel": "connector2",
          "nameInCamel": "devebotCoConnector2",
          "manifest": null,
          "version": "0.1.2",
        },
        {
          "type": "bridge",
          "name": "bridge1",
          "path": "/test/lib/bridge1",
          "code": "bridge1",
          "codeInCamel": "bridge1",
          "nameInCamel": "bridge1",
          "manifest": null,
          "version": "0.1.1",
        },
        {
          "type": "bridge",
          "name": "bridge2",
          "path": "/test/lib/bridge2",
          "code": "bridge2",
          "codeInCamel": "bridge2",
          "nameInCamel": "bridge2",
          "manifest": null,
          "version": "0.1.2",
        }
      ];
      if (!chores.isUpgradeSupported("manifest-refiner")) {
        expectedBridgeRefs = lodash.map(expectedBridgeRefs, function(ref) {
          return lodash.omit(ref, ["manifest", "version"]);
        });
      }
      assert.sameDeepMembers(cfg.bridgeList, expectedBridgeRefs);
      // verify pluginRefs
      let expectedPluginRefs = [
        {
          "type": "application",
          "name": "fullapp",
          "path": "/test/app/fullapp",
          "manifest": null,
          "version": "0.1.0",
        },
        {
          "type": "plugin",
          "name": "sub-plugin1",
          "path": "/test/lib/sub-plugin1",
          "presets": {},
          "bridgeDepends": [ "bridge1", "bridge2" ],
          "pluginDepends": [ "plugin1", "plugin2" ],
          "code": "sub-plugin1",
          "codeInCamel": "subPlugin1",
          "nameInCamel": "subPlugin1",
          "manifest": null,
          "version": "0.1.1",
        },
        {
          "type": "plugin",
          "name": "sub-plugin2",
          "path": "/test/lib/sub-plugin2",
          "presets": {},
          "bridgeDepends": [ "bridge2", "bridge3" ],
          "pluginDepends": [ "plugin2", "plugin3" ],
          "code": "sub-plugin2",
          "codeInCamel": "subPlugin2",
          "nameInCamel": "subPlugin2",
          "manifest": null,
          "version": "0.1.2",
        },
        {
          "type": "plugin",
          "name": "plugin1",
          "path": "/test/lib/plugin1",
          "presets": {
            "configTags": "bridge[dialect-bridge]"
          },
          "bridgeDepends": [ "bridge1", "bridge2" ],
          "pluginDepends": [],
          "code": "plugin1",
          "codeInCamel": "plugin1",
          "nameInCamel": "plugin1",
          "manifest": null,
          "version": "0.1.1",
        },
        {
          "type": "plugin",
          "name": "plugin2",
          "path": "/test/lib/plugin2",
          "presets": {
            "configTags": "bridge[dialect-bridge]"
          },
          "bridgeDepends": [ "bridge1", "bridge2" ],
          "pluginDepends": [],
          "code": "plugin2",
          "codeInCamel": "plugin2",
          "nameInCamel": "plugin2",
          "manifest": null,
          "version": "0.1.2",
        },
        {
          "type": "plugin",
          "name": "plugin3",
          "path": "/test/lib/plugin3",
          "presets": {},
          "bridgeDepends": [],
          "pluginDepends": [],
          "code": "plugin3",
          "codeInCamel": "plugin3",
          "nameInCamel": "plugin3",
          "manifest": null,
          "version": "0.1.3",
        },
        {
          "type": "framework",
          "name": FRAMEWORK_PACKAGE_NAME,
          "path": "/devebot",
        }
      ];
      if (!chores.isUpgradeSupported("presets")) {
        expectedPluginRefs = lodash.map(expectedPluginRefs, function(item) {
          return lodash.omit(item, ["presets", "bridgeDepends", "pluginDepends"]);
        });
      }
      if (!chores.isUpgradeSupported("manifest-refiner")) {
        expectedPluginRefs = lodash.map(expectedPluginRefs, function(ref) {
          return lodash.omit(ref, ["manifest", "version"]);
        });
      }
      assert.sameDeepMembers(cfg.bundleList, expectedPluginRefs);
    });
  });

  describe("registerLayerware()", function() {
    beforeEach(function() {
      LogTracer.reset();
    });

    it("register a new plugin with empty parameters", function() {
      let pluginLauncher = bootstrap.registerLayerware();
      let pluginStore = removeLoggingUtils(pluginLauncher());
      false && console.info(JSON.stringify(pluginStore, null, 2));
      assert.deepEqual(pluginStore, { libRootPaths: [], bridgeRefs: {}, pluginRefs: {} });
    });

    it("register a new plugin with nested and overlap sub-plugins", function() {
      let pluginLauncher = bootstrap.registerLayerware(null, [
        {
          name: "sub-plugin1",
          path: lab.getLibHome("sub-plugin1")
        },
        {
          name: "sub-plugin2",
          path: lab.getLibHome("sub-plugin2")
        }
      ], []);
      let output = replaceObjectFields(removeLoggingUtils(pluginLauncher()), DEFAULT_CONTEXT);
      false && console.info("pluginLauncher(): ", JSON.stringify(output, null, 2));
      if (chores.isUpgradeSupported("presets")) {
        assert.deepEqual(output, {
          "libRootPaths": [
            "/test/lib/sub-plugin1",
            "/test/lib/plugin1",
            "/test/lib/plugin2",
            "/test/lib/sub-plugin2",
            "/test/lib/plugin3"
          ],
          "pluginRefs": {
            "/test/lib/sub-plugin1": {
              "name": "sub-plugin1",
              "type": "plugin",
              "path": "/test/lib/sub-plugin1",
              "presets": {},
              "bridgeDepends": [ "bridge1", "bridge2" ],
              "pluginDepends": [ "plugin1", "plugin2" ]
            },
            "/test/lib/sub-plugin2": {
              "name": "sub-plugin2",
              "type": "plugin",
              "path": "/test/lib/sub-plugin2",
              "presets": {},
              "bridgeDepends": [ "bridge2", "bridge3" ],
              "pluginDepends": [ "plugin2", "plugin3" ]
            },
            "/test/lib/plugin1": {
              "name": "plugin1",
              "type": "plugin",
              "path": "/test/lib/plugin1",
              "presets": {
                "configTags": "bridge[dialect-bridge]"
              },
              "bridgeDepends": [ "bridge1", "bridge2" ],
              "pluginDepends": []
            },
            "/test/lib/plugin2": {
              "name": "plugin2",
              "type": "plugin",
              "path": "/test/lib/plugin2",
              "presets": {
                "configTags": "bridge[dialect-bridge]"
              },
              "bridgeDepends": [ "bridge1", "bridge2" ],
              "pluginDepends": [],
            },
            "/test/lib/plugin3": {
              "name": "plugin3",
              "type": "plugin",
              "path": "/test/lib/plugin3",
              "presets": {},
              "bridgeDepends": [],
              "pluginDepends": [],
            }
          },
          "bridgeRefs": {
            "/test/lib/bridge1": {
              "name": "bridge1",
              "type": "bridge",
              "path": "/test/lib/bridge1"
            },
            "/test/lib/bridge2": {
              "name": "bridge2",
              "type": "bridge",
              "path": "/test/lib/bridge2"
            },
            "/test/lib/bridge3": {
              "name": "bridge3",
              "type": "bridge",
              "path": "/test/lib/bridge3"
            }
          }
        });
      } else {
        assert.deepEqual(output, {
          libRootPaths:
            [
              "/test/lib/sub-plugin1",
              "/test/lib/plugin1",
              "/test/lib/plugin2",
              "/test/lib/sub-plugin2",
              "/test/lib/plugin3"
            ],
          pluginRefs:
            {
              "sub-plugin1": { name: "sub-plugin1", type: "plugin", path: "/test/lib/sub-plugin1" },
              "sub-plugin2": { name: "sub-plugin2", type: "plugin", path: "/test/lib/sub-plugin2" },
              plugin1: { name: "plugin1", type: "plugin", path: "/test/lib/plugin1" },
              plugin2: { name: "plugin2", type: "plugin", path: "/test/lib/plugin2" },
              plugin3: { name: "plugin3", type: "plugin", path: "/test/lib/plugin3" }
            },
          bridgeRefs:
            {
              bridge1: { name: "bridge1", type: "bridge", path: "/test/lib/bridge1" },
              bridge2: { name: "bridge2", type: "bridge", path: "/test/lib/bridge2" },
              bridge3: { name: "bridge3", type: "bridge", path: "/test/lib/bridge3" }
            }
        });
      }
    });

    it("register a new plugin with nested and overlap sub-plugins (with presets)", function() {
      let pluginLauncher = bootstrap.registerLayerware(null, [
        {
          name: "devebot-dp-backward1",
          path: lab.getLibHome("namespace-dp-backward1"),
          formers: [ "sub-plugin1" ],
          presets: {
            moduleName: "sub-plugin1"
          }
        },
        {
          name: "devebot-dp-backward2",
          path: lab.getLibHome("namespace-dp-backward2"),
          formers: [ "sub-plugin2" ],
          presets: {
            moduleName: "sub-plugin2"
          }
        }
      ], []);
      let output = replaceObjectFields(removeLoggingUtils(pluginLauncher()), DEFAULT_CONTEXT);
      false && console.info("pluginLauncher(): ", JSON.stringify(output, null, 2));
      if (chores.isUpgradeSupported("presets")) {
        assert.deepEqual(output, {
          "libRootPaths": [
            "/test/lib/namespace-dp-backward1",
            "/test/lib/plugin1",
            "/test/lib/plugin2",
            "/test/lib/namespace-dp-backward2",
            "/test/lib/plugin3"
          ],
          "pluginRefs": {
            "/test/lib/namespace-dp-backward1": {
              "name": "devebot-dp-backward1",
              "type": "plugin",
              "path": "/test/lib/namespace-dp-backward1",
              "formers": [
                "sub-plugin1"
              ],
              "presets": {
                "moduleName": "sub-plugin1"
              },
              "bridgeDepends": [
                "bridge1",
                "bridge2"
              ],
              "pluginDepends": [
                "plugin1",
                "plugin2"
              ]
            },
            "/test/lib/namespace-dp-backward2": {
              "name": "devebot-dp-backward2",
              "type": "plugin",
              "path": "/test/lib/namespace-dp-backward2",
              "formers": [
                "sub-plugin2"
              ],
              "presets": {
                "moduleName": "sub-plugin2"
              },
              "bridgeDepends": [
                "bridge2",
                "bridge3"
              ],
              "pluginDepends": [
                "plugin2",
                "plugin3"
              ]
            },
            "/test/lib/plugin1": {
              "name": "plugin1",
              "type": "plugin",
              "path": "/test/lib/plugin1",
              "presets": {
                "configTags": "bridge[dialect-bridge]"
              },
              "bridgeDepends": [
                "bridge1",
                "bridge2"
              ],
              "pluginDepends": []
            },
            "/test/lib/plugin2": {
              "name": "plugin2",
              "type": "plugin",
              "path": "/test/lib/plugin2",
              "presets": {
                "configTags": "bridge[dialect-bridge]"
              },
              "bridgeDepends": [
                "bridge1",
                "bridge2"
              ],
              "pluginDepends": []
            },
            "/test/lib/plugin3": {
              "name": "plugin3",
              "type": "plugin",
              "path": "/test/lib/plugin3",
              "presets": {},
              "bridgeDepends": [],
              "pluginDepends": []
            }
          },
          "bridgeRefs": {
            "/test/lib/bridge1": {
              "name": "bridge1",
              "type": "bridge",
              "path": "/test/lib/bridge1"
            },
            "/test/lib/bridge2": {
              "name": "bridge2",
              "type": "bridge",
              "path": "/test/lib/bridge2"
            },
            "/test/lib/bridge3": {
              "name": "bridge3",
              "type": "bridge",
              "path": "/test/lib/bridge3"
            }
          }
        });
      } else {
        assert.deepEqual(output, {
          "libRootPaths": [
            "/test/lib/namespace-dp-backward1",
            "/test/lib/plugin1",
            "/test/lib/plugin2",
            "/test/lib/namespace-dp-backward2",
            "/test/lib/plugin3"
          ],
          "pluginRefs": {
            "devebot-dp-backward1": {
              "name": "devebot-dp-backward1",
              "type": "plugin",
              "path": "/test/lib/namespace-dp-backward1"
            },
            "devebot-dp-backward2": {
              "name": "devebot-dp-backward2",
              "type": "plugin",
              "path": "/test/lib/namespace-dp-backward2"
            },
            "plugin1": {
              "name": "plugin1",
              "type": "plugin",
              "path": "/test/lib/plugin1"
            },
            "plugin2": {
              "name": "plugin2",
              "type": "plugin",
              "path": "/test/lib/plugin2"
            },
            "plugin3": {
              "name": "plugin3",
              "type": "plugin",
              "path": "/test/lib/plugin3"
            }
          },
          "bridgeRefs": {
            "bridge1": {
              "name": "bridge1",
              "type": "bridge",
              "path": "/test/lib/bridge1"
            },
            "bridge2": {
              "name": "bridge2",
              "type": "bridge",
              "path": "/test/lib/bridge2"
            },
            "bridge3": {
              "name": "bridge3",
              "type": "bridge",
              "path": "/test/lib/bridge3"
            }
          }
        });
      }
    });
  });
});

const DEFAULT_CONTEXT = {
  replacers: [
    {
      pattern: /^(?!https).*\/(devebot|test\/lib|test\/app)\/([^\/].*)(\/?.*)/g,
      replacement: "/$1/$2$3"
    }
  ]
};

let replaceLibPath = function(p, context) {
  if (typeof p !== "string") return p;
  let output = p;
  context = context || DEFAULT_CONTEXT;
  context.replacers = context.replacers || [];
  for (let i=0; i<context.replacers.length; i++) {
    let replacer = context.replacers[i];
    if (p.match(replacer.pattern)) {
      output = p.replace(replacer.pattern, replacer.replacement);
      break;
    }
  }
  output = output.replace(/^\/devebot\/devebot/g, "/devebot");
  output = output.replace(/^\/devebot\/projects\/devebot/g, "/devebot");
  output = output.replace(/^\/devebot-[0-9].*/g, "/devebot"); // folder /devebot-0.2.1
  return output;
};

let replaceObjectFields = function(obj, context) {
  let replaceFields = function(queue) {
    if (queue.length > 0) {
      let o = queue.shift();
      if (lodash.isObject(o)) {
        lodash.forEach(lodash.keys(o), function(key) {
          if (lodash.isObject(o[key])) {
            queue.push(o[key]);
            return;
          }
          if (lodash.isString(o[key])) {
            o[key] = replaceLibPath(o[key], context);
          }
        });
      }
      replaceFields(queue);
    }
  };
  obj = lodash.cloneDeep(obj);
  if (chores.isUpgradeSupported("presets")) {
    if (obj && obj.bridgeRefs && !lodash.isArray(obj.bridgeRefs)) {
      obj.bridgeRefs = lodash.mapKeys(obj.bridgeRefs, function(value, key) {
        return replaceLibPath(key, context);
      });
    }
    if (obj && obj.pluginRefs && !lodash.isArray(obj.pluginRefs)) {
      obj.pluginRefs = lodash.mapKeys(obj.pluginRefs, function(value, key) {
        return replaceLibPath(key, context);
      });
    }
  }
  replaceFields([obj]);
  return obj;
};

let removeLoggingUtils = function(config) {
  return lodash.omit(config, ["logger", "tracer"]);
};
