'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var Promise = Devebot.require('bluebird');
var chores = Devebot.require('chores');
var lodash = Devebot.require('lodash');
var loader = Devebot.require('loader');
var debugx = Devebot.require('pinbug')('tdd:devebot:core:config-loader');
var assert = require('chai').assert;
var expect = require('chai').expect;
var path = require('path');
var util = require('util');
var ConfigLoader = require(lab.getDevebotModule('backbone/config-loader'));
var NameResolver = require(lab.getDevebotModule('backbone/name-resolver'));
var LogAdapter = require('logolite').LogAdapter;
var LogTracer = require('logolite').LogTracer;
var envtool = require('logolite/envtool');
var envbox = require(lab.getDevebotModule('utils/envbox'));
var rewire = require('rewire');

describe('tdd:devebot:core:config-loader', function() {

  var errorCollector = lab.getErrorCollector();
  var stateInspector = lab.getStateInspector();

  var CTX = {
    LX: LogAdapter.getLogger(),
    LT: LogTracer.ROOT,
    errorCollector,
    CONFIG_PROFILE_NAME: 'profile',
    CONFIG_SANDBOX_NAME: 'sandbox'
  };

  var appRef = {
    name: 'tdd-cfg',
    type: 'application',
    path: lab.getAppHome('tdd-cfg')
  };

  var devebotRef = {
    name: 'devebot',
    type: 'framework',
    path: lab.getDevebotHome()
  };

  var pluginRefs = {
    "plugin1": {
      name: 'plugin1',
      path: lab.getLibHome('plugin1')
    },
    "plugin2": {
      name: 'plugin2',
      path: lab.getLibHome('plugin2')
    }
  };

  var bridgeRefs = {};

  var nameResolver = new NameResolver({
    errorCollector,
    pluginRefs: lodash.values(pluginRefs),
    bridgeRefs: lodash.values(bridgeRefs)
  });

  var libRefs = [].concat(lodash.values(pluginRefs), devebotRef);

  describe('default configuration (without profile & sandbox)', function() {
    it('load configuration of nothing (empty loader)', function() {
      // appName: null, appOptions: null, appRootDir: null, libRootDirs: null
      var cfgLoader = new ConfigLoader({errorCollector, stateInspector, nameResolver});
      var config = cfgLoader.load();
      false && console.log(JSON.stringify(config, null, 2));
      assert.deepEqual(config, {
        "profile": {
          "mixture": {},
          "names": [ "default" ]
        },
        "sandbox": {
          "mixture": {},
          "names": [ "default" ]
        }
      });
    });

    it('load configuration of empty application', function() {
      // appName: empty-app, appOptions: null, appRootDir: null, libRootDirs: [...]
      var cfgLoader = new ConfigLoader({appName: 'empty-app', devebotRef, pluginRefs, bridgeRefs, errorCollector, stateInspector, nameResolver});
      var config = cfgLoader.load();
      false && console.log(JSON.stringify(config, null, 2));

      // Profile configuration
      assert.deepEqual(lodash.get(config,"profile.names"), ["default"]);
      assert.deepEqual(lodash.get(config,"profile.default"),
        lodash.defaultsDeep(
          loader(path.join(lab.getLibCfgDir('plugin1'), 'profile.js')),
          loader(path.join(lab.getLibCfgDir('plugin2'), 'profile.js')),
          loader(path.join(lab.getDevebotCfgDir(), 'profile.js')),
          {}));
      assert.deepEqual(lodash.get(config,"profile.mixture"), {});

      // Sandbox configuration
      assert.deepEqual(lodash.get(config,"sandbox.names"), ["default"]);
      assert.deepEqual(lodash.get(config,"sandbox.default"),
        lodash.defaultsDeep(
          loader(path.join(lab.getLibCfgDir('plugin1'), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin2'), 'sandbox.js')),
          loader(path.join(lab.getDevebotCfgDir(), 'sandbox.js')),
          {}));
      assert.deepEqual(lodash.get(config,"sandbox.mixture"), {});
    });

    it('load application configuration (without options)', function() {
      var cfgLoader = new ConfigLoader({appName: 'app', appRef, devebotRef, pluginRefs, bridgeRefs, errorCollector, stateInspector, nameResolver});
      var config = cfgLoader.load();
      false && console.log(JSON.stringify(config, null, 2));

      // Profile configuration
      assert.deepEqual(lodash.get(config,"profile.default"),
        lodash.defaultsDeep(
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'config'), 'profile.js')),
          loader(path.join(lab.getLibCfgDir('plugin1'), 'profile.js')),
          loader(path.join(lab.getLibCfgDir('plugin2'), 'profile.js')),
          loader(path.join(lab.getDevebotCfgDir(), 'profile.js')),
          {}));
      assert.deepEqual(lodash.get(config,"profile.mixture"),
          lodash.get(config,"profile.default"));

      // Sandbox configuration
      assert.deepEqual(lodash.get(config,"sandbox.default"),
        lodash.defaultsDeep(
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'config'), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin1'), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin2'), 'sandbox.js')),
          loader(path.join(lab.getDevebotCfgDir(), 'sandbox.js')),
          {}));
      assert.deepEqual(lodash.get(config,"sandbox.mixture"),
          lodash.get(config,"sandbox.default"));
    });
  });

  describe('standardizing loaded configuration data', function() {
    var NameResolver = rewire(lab.getDevebotModule('backbone/name-resolver'));
    var extractAliasNames = NameResolver.__get__('extractAliasNames');
    var buildAbsoluteAliasMap = NameResolver.__get__('buildAbsoluteAliasMap');
    var buildRelativeAliasMap = NameResolver.__get__('buildRelativeAliasMap');
    var ConfigLoader = rewire(lab.getDevebotModule('backbone/config-loader'));
    var doAliasMap = ConfigLoader.__get__('doAliasMap');
    var transformConfig = ConfigLoader.__get__('transformConfig');

    it('should transform relative names into default full names', function() {
      if (!chores.isUpgradeSupported(['bridge-full-ref', 'standardizing-config'])) {
        this.skip();
        return;
      }

      var originalCfg = {
        bridges: {
          "bridgeKebabCase1": {
            "wrapper1": {
              "pointer": {
                "refPath": "sandbox -> bridge-kebab-case1 -> wrapper1 -> pointer"
              }
            }
          },
          "bridgeKebabCase2": {
            "devebot-dp-wrapper1": {
              "pointer": {
                "refPath": "sandbox -> bridge-kebab-case2 -> wrapper1 -> pointer"
              }
            }
          },
          "connector1": {
            "wrapper1": {
              "bean": {
                "refPath": "sandbox -> connector1 -> wrapper1 -> bean"
              }
            }
          },
          "connector2": {
            "devebot-dp-wrapper1": {
              "bean": {
                "refPath": "sandbox -> connector2 -> wrapper1 -> bean"
              }
            }
          }
        }
      };

      var expectedCfg = {
        bridges: {
          "bridge-kebab-case1": {
            "devebot-dp-wrapper1": {
              "pointer": {
                "refPath": "sandbox -> bridge-kebab-case1 -> wrapper1 -> pointer"
              }
            }
          },
          "bridge-kebab-case2": {
            "devebot-dp-wrapper1": {
              "pointer": {
                "refPath": "sandbox -> bridge-kebab-case2 -> wrapper1 -> pointer"
              }
            }
          },
          "devebot-co-connector1": {
            "devebot-dp-wrapper1": {
              "bean": {
                "refPath": "sandbox -> connector1 -> wrapper1 -> bean"
              }
            }
          },
          "devebot-co-connector2": {
            "devebot-dp-wrapper1": {
              "bean": {
                "refPath": "sandbox -> connector2 -> wrapper1 -> bean"
              }
            }
          }
        }
      };

      var convertedCfg = transformConfig(lodash.assign({
        pluginAliasMap: buildAbsoluteAliasMap(extractAliasNames(CTX, 'plugin', {
          "path/to/devebot-dp-wrapper1": {
            name: "devebot-dp-wrapper1"
          },
          "path/to/devebot-dp-wrapper2": {
            name: "devebot-dp-wrapper2"
          }
        })),
        bridgeAliasMap: buildAbsoluteAliasMap(extractAliasNames(CTX, 'bridge', {
          "path/to/bridge-kebab-case1": {
            name: "bridge-kebab-case1"
          },
          "path/to/bridge-kebab-case2": {
            name: "bridge-kebab-case2"
          },
          "path/to/devebot-co-connector1": {
            name: "devebot-co-connector1"
          },
          "path/to/devebot-co-connector2": {
            name: "devebot-co-connector2"
          }
        }))
      }, CTX), 'sandbox', originalCfg, 'plugin', 'cfg-example', {});

      false && console.log(JSON.stringify(convertedCfg, null, 2));
      assert.deepInclude(convertedCfg, expectedCfg);
    });

    it('should transform absolute names into relative names', function() {
      if (!chores.isUpgradeSupported(['bridge-full-ref', 'standardizing-config'])) {
        this.skip();
        return;
      }

      var originalCfg = {
        bridges: {
          "bridgeKebabCase1": {
            "wrapper1": {
              "pointer": {
                "refPath": "sandbox -> bridge-kebab-case1 -> wrapper1 -> pointer"
              }
            }
          },
          "bridge-kebab-case2": {
            "devebot-dp-wrapper1": {
              "pointer": {
                "refPath": "sandbox -> bridge-kebab-case2 -> wrapper1 -> pointer"
              }
            }
          },
          "connector1": {
            "wrapper1": {
              "bean": {
                "refPath": "sandbox -> connector1 -> wrapper1 -> bean"
              }
            }
          },
          "connector2": {
            "devebot-dp-wrapper1": {
              "bean": {
                "refPath": "sandbox -> connector2 -> wrapper1 -> bean"
              }
            }
          }
        }
      };

      var expectedCfg = {
        bridges: {
          "bridgeKebabCase1": {
            "wrapper1": {
              "pointer": {
                "refPath": "sandbox -> bridge-kebab-case1 -> wrapper1 -> pointer"
              }
            }
          },
          "bridgeKebabCase2": {
            "wrapper1": {
              "pointer": {
                "refPath": "sandbox -> bridge-kebab-case2 -> wrapper1 -> pointer"
              }
            }
          },
          "connector1": {
            "wrapper1": {
              "bean": {
                "refPath": "sandbox -> connector1 -> wrapper1 -> bean"
              }
            }
          },
          "connector2": {
            "wrapper1": {
              "bean": {
                "refPath": "sandbox -> connector2 -> wrapper1 -> bean"
              }
            }
          }
        }
      };

      var pluginRefs = extractAliasNames(CTX, 'plugin', {
        "path/to/devebot-dp-wrapper1": {
          name: "devebot-dp-wrapper1"
        },
        "path/to/devebot-dp-wrapper2": {
          name: "devebot-dp-wrapper2"
        }
      });

      var bridgeRefs = extractAliasNames(CTX, 'bridge', {
        "path/to/bridge-kebab-case1": {
          name: "bridge-kebab-case1"
        },
        "path/to/bridge-kebab-case2": {
          name: "bridge-kebab-case2"
        },
        "path/to/devebot-co-connector1": {
          name: "devebot-co-connector1"
        },
        "path/to/devebot-co-connector2": {
          name: "devebot-co-connector2"
        }
      });

      var absoluteCfg = transformConfig(lodash.assign({
        pluginAliasMap: buildAbsoluteAliasMap(pluginRefs),
        bridgeAliasMap: buildAbsoluteAliasMap(bridgeRefs)
      }, CTX), 'sandbox', originalCfg, 'plugin', 'cfg-example', {});

      var relativeCfg = doAliasMap(CTX, absoluteCfg,
          buildRelativeAliasMap(pluginRefs),
          buildRelativeAliasMap(bridgeRefs));

      false && console.log(JSON.stringify(relativeCfg, null, 2));
      assert.deepInclude(relativeCfg, expectedCfg);
    });
  });

  describe('customize configDir and mixture', function() {
    before(function() {
      envtool.setup({
        NODE_ENV: 'test',
        DEVEBOT_CONFIG_DIR: lab.getAppCfgDir('tdd-cfg', 'newcfg'),
        DEVEBOT_CONFIG_ENV: 'dev'
      });
    });

    it('load application configuration (without customized profile, sandbox)', function() {
      var cfgLoader = new ConfigLoader({appName: 'app', appRef, devebotRef, pluginRefs, bridgeRefs, errorCollector, stateInspector, nameResolver});
      var config = cfgLoader.load();
      false && console.log(JSON.stringify(config, null, 2));

      // Profile configuration
      assert.deepEqual(
        lodash.get(config,"profile.default"),
        lodash.get(config,"profile.mixture")
      );

      assert.deepInclude(
        lodash.get(config,"profile.mixture"),
        lodash.defaultsDeep(
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'profile.js')),
          loader(path.join(lab.getDevebotCfgDir(), 'profile.js')),
          {}));

      // Sandbox configuration
      assert.deepEqual(
        lodash.get(config,"sandbox.default"),
        lodash.get(config,"sandbox.mixture")
      );

      assert.deepEqual(
        lodash.get(config,"sandbox.default"),
        lodash.defaultsDeep(
          {
            application: {
              "step0": "base"
            },
            plugins: {
              "plugin1": {
                "dir": "config"
              },
              "plugin2": {
                "dir": "config"
              }
            }
          },
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin1'), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin2'), 'sandbox.js')),
          loader(path.join(lab.getDevebotCfgDir(), 'sandbox.js')),
          {}));
    });

    after(function() {
      envtool.reset();
    });
  });

  describe('private sandbox configurations', function() {
    before(function() {
      envtool.setup({
        NODE_ENV: 'test',
        DEVEBOT_CONFIG_DIR: lab.getAppCfgDir('tdd-cfg', 'newcfg'),
        DEVEBOT_CONFIG_ENV: 'dev',
        DEVEBOT_SANDBOX: 'private1,private2,ev1,ev2'
      });
    });

    let expandedDefaultConfig = {
      "application": {
        "step0": "base",
        "step1": "private1",
        "step2": "private2"
      },
      "plugins": {
        "plugin1": {
          "dir": "config"
        },
        "plugin2": {
          "dir": "config"
        }
      }
    };

    it('load application configuration (without private sandboxes)', function() {
      var cfgLoader = new ConfigLoader({appName: 'app', appRef, devebotRef, pluginRefs, bridgeRefs, errorCollector, stateInspector, nameResolver});
      var config = cfgLoader.load();
      false && console.log(JSON.stringify(config, null, 2));

      // Profile configuration
      assert.deepEqual(
        lodash.get(config,"profile.mixture"),
        lodash.get(config,"profile.default")
      );

      assert.deepInclude(
        lodash.get(config,"profile.mixture"),
        lodash.defaultsDeep(
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'profile.js')),
          loader(path.join(lab.getDevebotCfgDir(), 'profile.js')),
          {}));

      // Sandbox configuration
      assert.deepInclude(
        lodash.get(config,"sandbox.mixture"),
        lodash.defaultsDeep({}, expandedDefaultConfig, lodash.get(config,"sandbox.default"), {
          "common": {
            "ev": 2,
            "ev1": [ "environment variable", 1 ],
            "ev2": [ "environment variable", 2 ],
            "name": "ev2"
          }
        })
      );

      assert.deepInclude(
        lodash.get(config,"sandbox.mixture"),
        lodash.defaultsDeep(
          {}, expandedDefaultConfig,
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_ev2.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_ev1.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin1'), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin2'), 'sandbox.js')),
          loader(path.join(lab.getDevebotCfgDir(), 'sandbox.js')),
          {}));
    });

    it('load application configuration with single private sandboxes', function() {
      var cfgLoader = new ConfigLoader({appName: 'app', appOptions: {
        privateSandboxes: 'bs1'
      }, appRef, devebotRef, pluginRefs, bridgeRefs, errorCollector, stateInspector, nameResolver});
      var config = cfgLoader.load();
      false && console.log(JSON.stringify(config, null, 2));

      // Profile configuration
      assert.deepEqual(
        lodash.get(config,"profile.mixture"),
        lodash.get(config,"profile.default")
      );

      assert.deepInclude(
        lodash.get(config,"profile.mixture"),
        lodash.defaultsDeep(
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'profile.js')),
          loader(path.join(lab.getDevebotCfgDir(), 'profile.js')),
          {}));

      // Sandbox configuration
      assert.deepInclude(
        lodash.get(config,"sandbox.mixture"),
        lodash.defaultsDeep({}, expandedDefaultConfig, lodash.get(config,"sandbox.default"), {
          "common": {
            "bs": 1,
            "bs1": [ "bootstrap", 1 ],
            "ev": 2,
            "ev1": [ "environment variable", 1 ],
            "ev2": [ "environment variable", 2 ],
            "name": "bs1"
          }
        })
      );

      assert.deepInclude(
        lodash.get(config,"sandbox.mixture"),
        lodash.defaultsDeep(
          {}, expandedDefaultConfig,
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_bs1.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_ev2.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_ev1.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin1'), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin2'), 'sandbox.js')),
          loader(path.join(lab.getDevebotCfgDir(), 'sandbox.js')),
          {}));
    });

    it('load application configuration with multiple private sandboxes', function() {
      var cfgLoader = new ConfigLoader({appName: 'app', appOptions: {
        privateSandboxes: ['bs1', 'bs2']
      }, appRef, devebotRef, pluginRefs, bridgeRefs, errorCollector, stateInspector, nameResolver});
      var config = cfgLoader.load();
      false && console.log(JSON.stringify(config, null, 2));

      // Profile configuration
      assert.deepEqual(
        lodash.get(config,"profile.mixture"),
        lodash.get(config,"profile.default")
      );

      assert.deepInclude(
        lodash.get(config,"profile.mixture"),
        lodash.defaultsDeep(
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'profile.js')),
          loader(path.join(lab.getDevebotCfgDir(), 'profile.js')),
          {}));

      // Sandbox configuration
      assert.deepInclude(
        lodash.get(config,"sandbox.mixture"),
        lodash.defaultsDeep({}, expandedDefaultConfig, lodash.get(config,"sandbox.default"), {
          "common": {
            "bs": 2,
            "bs1": [ "bootstrap", 1 ],
            "bs2": [ "bootstrap", 2 ],
            "ev": 2,
            "ev1": [ "environment variable", 1 ],
            "ev2": [ "environment variable", 2 ],
            "name": "bs2"
          }
        })
      );

      assert.deepInclude(
        lodash.get(config,"sandbox.mixture"),
        lodash.defaultsDeep(
          {}, expandedDefaultConfig,
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_bs2.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_bs1.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_ev2.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_ev1.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin1'), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin2'), 'sandbox.js')),
          loader(path.join(lab.getDevebotCfgDir(), 'sandbox.js')),
          {}));
    });

    it('load application configuration with underscore suffixes', function() {
      var cfgLoader = new ConfigLoader({appName: 'app', appOptions: {
        privateSandboxes: ['bs_p1', 'bs_p2']
      }, appRef, devebotRef, pluginRefs, bridgeRefs, errorCollector, stateInspector, nameResolver});
      var config = cfgLoader.load();
      false && console.log(JSON.stringify(config, null, 2));

      // Profile configuration
      assert.deepEqual(
        lodash.get(config,"profile.mixture"),
        lodash.get(config,"profile.default")
      );

      assert.deepInclude(
        lodash.get(config,"profile.mixture"),
        lodash.defaultsDeep(
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'profile.js')),
          loader(path.join(lab.getDevebotCfgDir(), 'profile.js')),
          {}));

      // Sandbox configuration
      assert.deepInclude(
        lodash.get(config,"sandbox.mixture"),
        lodash.defaultsDeep({}, expandedDefaultConfig, lodash.get(config,"sandbox.default"), {
          "common": {
            "bs": 2,
            "bs1": [ "bootstrap", 1 ],
            "bs2": [ "bootstrap", 2 ],
            "ev": 2,
            "ev1": [ "environment variable", 1 ],
            "ev2": [ "environment variable", 2 ],
            "name": "bs2"
          }
        })
      );

      assert.deepInclude(
        lodash.get(config,"sandbox.mixture"),
        lodash.defaultsDeep(
          {}, expandedDefaultConfig,
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_bs_p2.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_bs_p1.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_ev2.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_ev1.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin1'), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin2'), 'sandbox.js')),
          loader(path.join(lab.getDevebotCfgDir(), 'sandbox.js')),
          {}));
    });

    it('the order of listed sandbox labels is sensitive', function() {
      var cfgLoader = new ConfigLoader({appName: 'app', appOptions: {
        privateSandboxes: 'bs2, bs1'
      }, appRef, devebotRef, pluginRefs, bridgeRefs, errorCollector, stateInspector, nameResolver});
      var config = cfgLoader.load();

      // Profile configuration
      assert.deepEqual(
        lodash.get(config,"profile.mixture"),
        lodash.get(config,"profile.default")
      );

      assert.deepInclude(
        lodash.get(config,"profile.mixture"),
        lodash.defaultsDeep(
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'profile.js')),
          loader(path.join(lab.getDevebotCfgDir(), 'profile.js')),
          {}));

      // Sandbox configuration
      assert.deepInclude(
        lodash.get(config,"sandbox.mixture"),
        lodash.defaultsDeep({}, expandedDefaultConfig, lodash.get(config,"sandbox.default"), {
          "common": {
            "bs": 1,
            "bs1": [ "bootstrap", 1 ],
            "bs2": [ "bootstrap", 2 ],
            "ev": 2,
            "ev1": [ "environment variable", 1 ],
            "ev2": [ "environment variable", 2 ],
            "name": "bs1"
          }
        })
      );

      assert.deepInclude(
        lodash.get(config,"sandbox.mixture"),
        lodash.defaultsDeep(
          {}, expandedDefaultConfig,
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_bs1.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_bs2.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_ev2.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_ev1.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin1'), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin2'), 'sandbox.js')),
          loader(path.join(lab.getDevebotCfgDir(), 'sandbox.js')),
          {}));
    });

    describe('bridge configure transformation', function() {
      var ConfigLoader = rewire(lab.getDevebotModule('backbone/config-loader'));
      var convertSandboxConfig = ConfigLoader.__get__('convertSandboxConfig');
      var RELOADING_FORCED = ConfigLoader.__get__('RELOADING_FORCED');
  
      it('transform sandboxConfig.bridges from application', function() {
        var sandboxConfig = {
          "plugins": {
            "plugin1": {},
            "plugin2": {}
          },
          "bridges": {
            "bridge1": {
              "plugin1": {
                "anyname1a": {
                  "refPath": "sandbox -> bridge1 -> plugin1 -> anyname1a"
                },
                "anyname1c": {
                  "refPath": "sandbox -> bridge1 -> plugin1 -> anyname1c"
                }
              }
            },
            "bridge2": {
              "plugin2": {
                "anyname2b": {
                  "refPath": "sandbox -> bridge2 -> plugin2 -> anyname2b"
                }
              }
            }
          }
        };
        var exptectedConfig = {
          "plugins": {
            "plugin1": {},
            "plugin2": {}
          },
          "bridges": {
            "bridge1": {
              "plugin1": {
                "anyname1a": {
                  "refPath": "sandbox -> bridge1 -> plugin1 -> anyname1a"
                },
                "anyname1c": {
                  "refPath": "sandbox -> bridge1 -> plugin1 -> anyname1c"
                }
              }
            },
            "bridge2": {
              "plugin2": {
                "anyname2b": {
                  "refPath": "sandbox -> bridge2 -> plugin2 -> anyname2b"
                }
              }
            }
          }
        };
        var convertedCfg = convertSandboxConfig(CTX, sandboxConfig, 'application');
        false && console.log(JSON.stringify(convertedCfg, null, 2));
        assert.deepInclude(convertedCfg, exptectedConfig);
      });

      it('transform sandboxConfig.bridges from a plugin (without name)', function() {
        var sandboxConfig = {
          "plugins": {
            "plugin1": {},
            "plugin2": {}
          },
          "bridges": {
            "anyname1a": {
              "bridge1": {
                "refPath": "sandbox -> bridge1 -> anyname1a"
              }
            },
            "anyname1c": {
              "bridge1": {
                "refPath": "sandbox -> bridge1 -> anyname1c"
              }
            },
            "anyname2b": {
              "bridge2": {
                "refPath": "sandbox -> bridge2 -> anyname2b"
              }
            }
          }
        };
        var exptectedConfig = lodash.cloneDeep(sandboxConfig);
        if (chores.isUpgradeSupported(['bridge-full-ref','presets'])) {
          exptectedConfig.bridges = {
            "bridge1": {
              "*": {
                "anyname1a": {
                  "refPath": "sandbox -> bridge1 -> anyname1a"
                },
                "anyname1c": {
                  "refPath": "sandbox -> bridge1 -> anyname1c"
                }
              }
            },
            "bridge2": {
              "*": {
                "anyname2b": {
                  "refPath": "sandbox -> bridge2 -> anyname2b"
                }
              }
            }
          };
          if (!RELOADING_FORCED) {
            exptectedConfig.bridges.__status__ = true;
          }
        }
        var convertedCfg = convertSandboxConfig(CTX, sandboxConfig, 'plugin', null, {
          configTags: ['bridge[dialect-bridge]']
        });
        false && console.log(JSON.stringify(convertedCfg, null, 2));
        assert.deepInclude(convertedCfg, exptectedConfig);
      });

      it('transform sandboxConfig.bridges from a named plugin', function() {
        var sandboxConfig = {
          "plugins": {
            "plugin1": {},
            "plugin2": {}
          },
          "bridges": {
            "anyname1a": {
              "bridge1": {
                "refPath": "sandbox -> bridge1 -> anyname1a"
              }
            },
            "anyname1b": {
              "bridge1": {
                "refPath": "sandbox -> bridge1 -> anyname1b"
              }
            },
            "anyname3a": {
              "bridge3": {
                "refPath": "sandbox -> bridge3 -> anyname3a"
              }
            }
          }
        };
        var exptectedConfig = lodash.cloneDeep(sandboxConfig);
        if (chores.isUpgradeSupported(['bridge-full-ref','presets'])) {
          exptectedConfig.bridges = {
            "bridge1": {
              "plugin1": {
                "anyname1a": {
                  "refPath": "sandbox -> bridge1 -> anyname1a"
                },
                "anyname1b": {
                  "refPath": "sandbox -> bridge1 -> anyname1b"
                }
              }
            },
            "bridge3": {
              "plugin1": {
                "anyname3a": {
                  "refPath": "sandbox -> bridge3 -> anyname3a"
                }
              }
            }
          };
          if (!RELOADING_FORCED) {
            exptectedConfig.bridges.__status__ = true;
          }
        }
        var convertedCfg = convertSandboxConfig(CTX, sandboxConfig, 'plugin', 'plugin1', {
          configTags: 'bridge[dialect-bridge]'
        });
        false && console.log(JSON.stringify(convertedCfg, null, 2));
        assert.deepInclude(convertedCfg, exptectedConfig);
      });
    });

    after(function() {
      envtool.reset();
    });
  });

  describe('change PROFILE/SANDBOX labels', function() {
    before(function() {
      envtool.setup({
        NODE_ENV: 'test',
        DEVEBOT_CONFIG_PROFILE_ALIASES: 'context',
        DEVEBOT_CONFIG_SANDBOX_ALIASES: 'setting',
        DEVEBOT_CONFIG_DIR: lab.getAppCfgDir('tdd-cfg-customized-names', 'newcfg'),
        DEVEBOT_CONFIG_ENV: 'dev',
        DEVEBOT_SANDBOX: 'private1,private2,ev1,ev2'
      });
      envbox.clearCache();
    });

    var appRef = {
      name: 'tdd-cfg-customized-names',
      type: 'application',
      path: lab.getAppHome('tdd-cfg-customized-names')
    };

    var expandedDefaultConfig = {
      "application": {
        "step0": "base",
        "step1": "private1",
        "step2": "private2"
      },
      "plugins": {
        "plugin1": {
          "dir": "config"
        },
        "plugin2": {
          "dir": "config"
        }
      }
    };

    it('load application configuration with multiple private sandboxes', function() {
      var cfgLoader = new ConfigLoader({appName: 'app', appOptions: {
        privateSandboxes: ['bs1', 'bs2']
      }, appRef, devebotRef, pluginRefs, bridgeRefs, errorCollector, stateInspector, nameResolver});
      var config = cfgLoader.load();
      false && console.log(JSON.stringify(config, null, 2));

      // Profile configuration
      assert.deepEqual(
        lodash.get(config,"profile.mixture"),
        lodash.get(config,"profile.default")
      );

      assert.deepInclude(
        lodash.get(config,"profile.mixture"),
        lodash.defaultsDeep(
          loader(path.join(lab.getAppCfgDir('tdd-cfg-customized-names', 'newcfg/dev'), 'context.js')),
          loader(path.join(lab.getDevebotCfgDir(), 'profile.js')),
          {}));

      // Sandbox configuration
      assert.deepInclude(
        lodash.get(config,"sandbox.mixture"),
        lodash.defaultsDeep({}, expandedDefaultConfig, lodash.get(config,"sandbox.default"), {
          "common": {
            "bs": 2,
            "bs1": [ "bootstrap", 1 ],
            "bs2": [ "bootstrap", 2 ],
            "ev": 2,
            "ev1": [ "environment variable", 1 ],
            "ev2": [ "environment variable", 2 ],
            "name": "bs2"
          }
        })
      );

      assert.deepInclude(
        lodash.get(config,"sandbox.mixture"),
        lodash.defaultsDeep(
          {}, expandedDefaultConfig,
          loader(path.join(lab.getAppCfgDir('tdd-cfg-customized-names', 'newcfg/dev'), 'setting_bs2.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg-customized-names', 'newcfg/dev'), 'setting_bs1.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg-customized-names', 'newcfg/dev'), 'setting_ev2.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg-customized-names', 'newcfg/dev'), 'setting_ev1.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg-customized-names', 'newcfg/dev'), 'setting.js')),
          loader(path.join(lab.getLibCfgDir('plugin1'), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin2'), 'sandbox.js')),
          loader(path.join(lab.getDevebotCfgDir(), 'sandbox.js')),
          {}));
    });

    after(function() {
      envtool.reset();
    });
  });
});
