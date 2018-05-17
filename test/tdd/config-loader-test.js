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
var ConfigLoader = require('../../lib/backbone/config-loader');
var LogAdapter = require('logolite').LogAdapter;
var LogTracer = require('logolite').LogTracer;
var envtool = require('logolite/envtool');
var rewire = require('rewire');

describe('tdd:devebot:core:config-loader', function() {

  var appRef = {
    name: 'tdd-cfg',
    type: 'application',
    path: path.join(lab.getAppHome('tdd-cfg'), 'index.js')
  };

  var devebotRef = {
    name: 'devebot',
    type: 'framework',
    path: path.join(lab.getDevebotHome(), 'index.js')
  };

  var pluginRefs = {
    "plugin1": {
      name: 'plugin1',
      path: path.join(lab.getLibHome('plugin1'), 'index.js')
    },
    "plugin2": {
      name: 'plugin2',
      path: path.join(lab.getLibHome('plugin2'), 'index.js')
    }
  };

  var libRefs = [].concat(lodash.values(pluginRefs), devebotRef);

  describe('default configuration (without profile & sandbox)', function() {
    it('load configuration of nothing (empty loader)', function() {
      // appName: null, appOptions: null, appRootDir: null, libRootDirs: null
      var cfgLoader = new ConfigLoader();
      false && console.log(JSON.stringify(cfgLoader.config, null, 2));
      assert.deepEqual(cfgLoader.config, {
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
      var cfgLoader = new ConfigLoader('empty-app', null, null, devebotRef, pluginRefs);
      false && console.log(JSON.stringify(cfgLoader.config, null, 2));

      // Profile configuration
      assert.deepEqual(lodash.get(cfgLoader,"config.profile.names"), ["default"]);
      assert.deepEqual(lodash.get(cfgLoader,"config.profile.default"),
        lodash.defaultsDeep(
          loader(path.join(lab.getLibCfgDir('plugin1'), 'profile.js')),
          loader(path.join(lab.getLibCfgDir('plugin2'), 'profile.js')),
          loader(path.join(lab.getDevebotCfgDir(), 'profile.js')),
          {}));
      assert.deepEqual(lodash.get(cfgLoader,"config.profile.mixture"), {});

      // Sandbox configuration
      assert.deepEqual(lodash.get(cfgLoader,"config.sandbox.names"), ["default"]);
      assert.deepEqual(lodash.get(cfgLoader,"config.sandbox.default"),
        lodash.defaultsDeep(
          loader(path.join(lab.getLibCfgDir('plugin1'), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin2'), 'sandbox.js')),
          loader(path.join(lab.getDevebotCfgDir(), 'sandbox.js')),
          {}));
      assert.deepEqual(lodash.get(cfgLoader,"config.sandbox.mixture"), {});
    });

    it('load application configuration (without options)', function() {
      var cfgLoader = new ConfigLoader('app', null, appRef, devebotRef, pluginRefs);

      false && console.log(JSON.stringify(cfgLoader.config, null, 2));

      // Profile configuration
      assert.deepEqual(lodash.get(cfgLoader,"config.profile.default"),
        lodash.defaultsDeep(
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'config'), 'profile.js')),
          loader(path.join(lab.getLibCfgDir('plugin1'), 'profile.js')),
          loader(path.join(lab.getLibCfgDir('plugin2'), 'profile.js')),
          loader(path.join(lab.getDevebotCfgDir(), 'profile.js')),
          {}));
      assert.deepEqual(lodash.get(cfgLoader,"config.profile.mixture"),
          lodash.get(cfgLoader,"config.profile.default"));

      // Sandbox configuration
      assert.deepEqual(lodash.get(cfgLoader,"config.sandbox.default"),
        lodash.defaultsDeep(
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'config'), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin1'), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin2'), 'sandbox.js')),
          loader(path.join(lab.getDevebotCfgDir(), 'sandbox.js')),
          {}));
      assert.deepEqual(lodash.get(cfgLoader,"config.sandbox.mixture"),
          lodash.get(cfgLoader,"config.sandbox.default"));
    });
  });

  describe('standardizing loaded configuration data', function() {
    var Bootstrap = rewire('../../lib/bootstrap');
    var extractAliasNames = Bootstrap.__get__('extractAliasNames');
    var ConfigLoader = rewire('../../lib/backbone/config-loader');
    var buildNamingMap = ConfigLoader.__get__('buildNamingMap');
    var transformConfig = ConfigLoader.__get__('transformConfig');

    it('should build the map of plugin-names transformation correctly', function() {
      if (!chores.isFeatureSupported('standardizing-config')) {
        this.skip();
        return;
      }

      var pluginDefs = {
        "path/to/devebot-dp-wrapper1": {
          name: "devebot-dp-wrapper1"
        },
        "path/to/devebot-dp-wrapper2": {
          name: "devebot-dp-wrapper2"
        },
        "path/to/sub-wrapper1": {
          name: "sub-wrapper1"
        },
        "path/to/devebot-dp-sub-wrapper0": {
          name: "devebot-dp-sub-wrapper0"
        },
        "path/to/devebot-dp-sub-wrapper1": {
          name: "devebot-dp-sub-wrapper1"
        },
        "path/to/devebot-dp-sub-wrapper2": {
          name: "devebot-dp-sub-wrapper2"
        },
        "path/to/sub-wrapper2": {
          name: "sub-wrapper2"
        }
      };

      var pluginRefs = {
        "path/to/devebot-dp-wrapper1": {
          name: "devebot-dp-wrapper1",
          nameInCamel: "devebotDpWrapper1",
          code: "wrapper1",
          codeInCamel: "wrapper1"
        },
        "path/to/devebot-dp-wrapper2": {
          name: "devebot-dp-wrapper2",
          nameInCamel: "devebotDpWrapper2",
          code: "wrapper2",
          codeInCamel: "wrapper2"
        },
        "path/to/sub-wrapper1": {
          name: "sub-wrapper1",
          nameInCamel: "subWrapper1",
          code: "sub-wrapper1",
          codeInCamel: "subWrapper1"
        },
        "path/to/devebot-dp-sub-wrapper0": {
          name: "devebot-dp-sub-wrapper0",
          nameInCamel: "devebotDpSubWrapper0",
          code: "sub-wrapper0",
          codeInCamel: "subWrapper0"
        },
        "path/to/devebot-dp-sub-wrapper1": {
          name: "devebot-dp-sub-wrapper1",
          nameInCamel: "devebotDpSubWrapper1",
          code: "sub-wrapper1",
          codeInCamel: "subWrapper1"
        },
        "path/to/devebot-dp-sub-wrapper2": {
          name: "devebot-dp-sub-wrapper2",
          nameInCamel: "devebotDpSubWrapper2",
          code: "sub-wrapper2",
          codeInCamel: "subWrapper2"
        },
        "path/to/sub-wrapper2": {
          name: "sub-wrapper2",
          nameInCamel: "subWrapper2",
          code: "sub-wrapper2",
          codeInCamel: "subWrapper2"
        }
      };

      assert.deepEqual(extractAliasNames({
        LX: LogAdapter.getLogger(),
        LT: LogTracer.ROOT
      }, 'plugin', pluginDefs), pluginRefs);

      var expectedMap = {
        "devebot-dp-wrapper1": "devebot-dp-wrapper1",
        "devebotDpWrapper1": "devebot-dp-wrapper1",
        "wrapper1": "devebot-dp-wrapper1",
        "devebot-dp-wrapper2": "devebot-dp-wrapper2",
        "devebotDpWrapper2": "devebot-dp-wrapper2",
        "wrapper2": "devebot-dp-wrapper2",
        "sub-wrapper1": "sub-wrapper1",
        "subWrapper1": "sub-wrapper1",
        "devebot-dp-sub-wrapper0": "devebot-dp-sub-wrapper0",
        "devebotDpSubWrapper0": "devebot-dp-sub-wrapper0",
        "sub-wrapper0": "devebot-dp-sub-wrapper0",
        "subWrapper0": "devebot-dp-sub-wrapper0",
        "devebot-dp-sub-wrapper1": "devebot-dp-sub-wrapper1",
        "devebotDpSubWrapper1": "devebot-dp-sub-wrapper1",
        "devebot-dp-sub-wrapper2": "devebot-dp-sub-wrapper2",
        "devebotDpSubWrapper2": "devebot-dp-sub-wrapper2",
        "sub-wrapper2": "sub-wrapper2",
        "subWrapper2": "sub-wrapper2"
      };

      var pluginNameMap = buildNamingMap(pluginRefs);

      false && console.log(JSON.stringify(pluginNameMap, null, 2));
      assert.deepEqual(pluginNameMap, expectedMap);
    });
  });

  describe('customize configDir and mixture', function() {
    before(function() {
      envtool.setup({
        DEVEBOT_CONFIG_DIR: lab.getAppCfgDir('tdd-cfg', 'newcfg'),
        DEVEBOT_CONFIG_ENV: 'dev'
      });
    });

    it('load application configuration (without customized profile, sandbox)', function() {
      var cfgLoader = new ConfigLoader('app', null, appRef, devebotRef, pluginRefs);

      false && console.log(JSON.stringify(cfgLoader.config, null, 2));

      // Profile configuration
      assert.deepEqual(
        lodash.get(cfgLoader,"config.profile.default"),
        lodash.get(cfgLoader,"config.profile.mixture")
      );

      assert.deepInclude(
        lodash.get(cfgLoader,"config.profile.mixture"),
        lodash.defaultsDeep(
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'profile.js')),
          loader(path.join(lab.getDevebotCfgDir(), 'profile.js')),
          {}));

      // Sandbox configuration
      assert.deepEqual(
        lodash.get(cfgLoader,"config.sandbox.default"),
        lodash.get(cfgLoader,"config.sandbox.mixture")
      );

      assert.deepEqual(
        lodash.get(cfgLoader,"config.sandbox.default"),
        lodash.defaultsDeep(
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
        DEVEBOT_CONFIG_DIR: lab.getAppCfgDir('tdd-cfg', 'newcfg'),
        DEVEBOT_CONFIG_ENV: 'dev',
        DEVEBOT_SANDBOX: 'ev1,ev2'
      });
    });

    it('load application configuration (without private sandboxes)', function() {
      var cfgLoader = new ConfigLoader('app', null, appRef, devebotRef, pluginRefs);

      false && console.log(JSON.stringify(cfgLoader.config, null, 2));

      // Profile configuration
      assert.deepEqual(
        lodash.get(cfgLoader,"config.profile.mixture"),
        lodash.get(cfgLoader,"config.profile.default")
      );

      assert.deepInclude(
        lodash.get(cfgLoader,"config.profile.mixture"),
        lodash.defaultsDeep(
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'profile.js')),
          loader(path.join(lab.getDevebotCfgDir(), 'profile.js')),
          {}));

      // Sandbox configuration
      assert.deepInclude(
        lodash.get(cfgLoader,"config.sandbox.mixture"),
        lodash.assign(lodash.get(cfgLoader,"config.sandbox.default"), {
          "common": {
            "ev": 2,
            "ev1": [ "environment variable", 1 ],
            "ev2": [ "environment variable", 2 ],
            "name": "ev2"
          }
        })
      );

      assert.deepInclude(
        lodash.get(cfgLoader,"config.sandbox.mixture"),
        lodash.defaultsDeep(
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_ev2.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_ev1.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin1'), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin2'), 'sandbox.js')),
          loader(path.join(lab.getDevebotCfgDir(), 'sandbox.js')),
          {}));
    });

    it('load application configuration with single private sandboxes', function() {
      var cfgLoader = new ConfigLoader('app', {
        privateSandboxes: 'bs1'
      }, appRef, devebotRef, pluginRefs);

      false && console.log(JSON.stringify(cfgLoader.config, null, 2));

      // Profile configuration
      assert.deepEqual(
        lodash.get(cfgLoader,"config.profile.mixture"),
        lodash.get(cfgLoader,"config.profile.default")
      );

      assert.deepInclude(
        lodash.get(cfgLoader,"config.profile.mixture"),
        lodash.defaultsDeep(
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'profile.js')),
          loader(path.join(lab.getDevebotCfgDir(), 'profile.js')),
          {}));

      // Sandbox configuration
      assert.deepInclude(
        lodash.get(cfgLoader,"config.sandbox.mixture"),
        lodash.assign(lodash.get(cfgLoader,"config.sandbox.default"), {
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
        lodash.get(cfgLoader,"config.sandbox.mixture"),
        lodash.defaultsDeep(
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
      var cfgLoader = new ConfigLoader('app', {
        privateSandboxes: ['bs1', 'bs2']
      }, appRef, devebotRef, pluginRefs);

      false && console.log(JSON.stringify(cfgLoader.config, null, 2));

      // Profile configuration
      assert.deepEqual(
        lodash.get(cfgLoader,"config.profile.mixture"),
        lodash.get(cfgLoader,"config.profile.default")
      );

      assert.deepInclude(
        lodash.get(cfgLoader,"config.profile.mixture"),
        lodash.defaultsDeep(
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'profile.js')),
          loader(path.join(lab.getDevebotCfgDir(), 'profile.js')),
          {}));

      // Sandbox configuration
      assert.deepInclude(
        lodash.get(cfgLoader,"config.sandbox.mixture"),
        lodash.assign(lodash.get(cfgLoader,"config.sandbox.default"), {
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
        lodash.get(cfgLoader,"config.sandbox.mixture"),
        lodash.defaultsDeep(
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

    it('the order of listed sandbox labels is sensitive', function() {
      var cfgLoader = new ConfigLoader('app', {
        privateSandboxes: 'bs2, bs1'
      }, appRef, devebotRef, pluginRefs);

      // Profile configuration
      assert.deepEqual(
        lodash.get(cfgLoader,"config.profile.mixture"),
        lodash.get(cfgLoader,"config.profile.default")
      );

      assert.deepInclude(
        lodash.get(cfgLoader,"config.profile.mixture"),
        lodash.defaultsDeep(
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'profile.js')),
          loader(path.join(lab.getDevebotCfgDir(), 'profile.js')),
          {}));

      // Sandbox configuration
      assert.deepInclude(
        lodash.get(cfgLoader,"config.sandbox.mixture"),
        lodash.assign(lodash.get(cfgLoader,"config.sandbox.default"), {
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
        lodash.get(cfgLoader,"config.sandbox.mixture"),
        lodash.defaultsDeep(
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
      var ConfigLoader = rewire('../../lib/backbone/config-loader');
      var transformSandboxConfig = ConfigLoader.__get__('transformSandboxConfig');
  
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
        var transformedCfg = transformSandboxConfig({
          logger: LogAdapter.getLogger(),
          tracer: LogTracer.ROOT
        }, sandboxConfig, 'application');
        false && console.log(JSON.stringify(transformedCfg, null, 2));
        assert.deepInclude(transformedCfg, exptectedConfig);
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
        var exptectedConfig = {
          "plugins": {
            "plugin1": {},
            "plugin2": {}
          },
          "bridges": {
            "__status__": true,
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
          }
        };
        var transformedCfg = transformSandboxConfig({
          logger: LogAdapter.getLogger(),
          tracer: LogTracer.ROOT
        }, sandboxConfig, 'plugin', null, { configTags: ['bridge[dialect-bridge]']});
        false && console.log(JSON.stringify(transformedCfg, null, 2));
        assert.deepInclude(transformedCfg, exptectedConfig);
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
        var exptectedConfig = {
          "plugins": {
            "plugin1": {},
            "plugin2": {}
          },
          "bridges": {
            "__status__": true,
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
          }
        };
        var transformedCfg = transformSandboxConfig({
          logger: LogAdapter.getLogger(),
          tracer: LogTracer.ROOT
        }, sandboxConfig, 'plugin', 'plugin1', {configTags: 'bridge[dialect-bridge]'});
        false && console.log(JSON.stringify(transformedCfg, null, 2));
        assert.deepInclude(transformedCfg, exptectedConfig);
      });
    });

    after(function() {
      envtool.reset();
    });
  });
});
