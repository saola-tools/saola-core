'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var loader = Devebot.require('loader');
var debugx = Devebot.require('pinbug')('tdd:devebot:base:bootstrap');
var assert = require('chai').assert;
var expect = require('chai').expect;
var path = require('path');
var util = require('util');
var bootstrap = require('../../lib/bootstrap');
var LogConfig = require('logolite').LogConfig;
var LogTracer = require('logolite').LogTracer;
var envtool = require('logolite/envtool');
var rewire = require('rewire');

describe('tdd:devebot:base:bootstrap', function() {
  this.timeout(lab.getDefaultTimeout());

  before(function() {
    envtool.setup({
      LOGOLITE_ALWAYS_ENABLED: 'all',
      LOGOLITE_ALWAYS_MUTED: 'all'
		});
		LogConfig.reset();
  });

  describe('replaceObjectFields()', function() {
    it('should do nothing with empty object', function() {
      assert.deepEqual(replaceObjectFields({}), {});
      assert.deepEqual(replaceObjectFields(null), null);
      assert.deepEqual(replaceObjectFields('hello'), 'hello');
    });
    it('should replace the matched string fields only', function() {
      assert.deepEqual(replaceObjectFields({
        libRootPaths: [
          '/some/path/here/test/lib/plugin1',
          '/some/path/here/test/lib/plugin2',
          '/some/path/here/test/lib/plugin3'
        ],
        pluginRefs: {
          'plugin1': { name: 'plugin1', path: '/some/path/here/test/lib/plugin1/index.js' },
          'plugin2': { name: 'plugin2', path: '/some/path/here/test/lib/plugin2/index.js' },
          'plugin3': { name: 'plugin3', path: '/some/path/here/test/lib/plugin3/index.js' }
        },
        bridgeRefs: {
          'bridge1': { name: 'bridge1', path: '/some/path/here/test/lib/bridge1/index.js' },
          'bridge2': { name: 'bridge2', path: '/some/path/here/test/lib/bridge2/index.js' }
        }
      }), {
        libRootPaths: ['/test/lib/plugin1', '/test/lib/plugin2', '/test/lib/plugin3'],
        pluginRefs: {
          'plugin1': { name: 'plugin1', path: '/test/lib/plugin1/index.js' },
          'plugin2': { name: 'plugin2', path: '/test/lib/plugin2/index.js' },
          'plugin3': { name: 'plugin3', path: '/test/lib/plugin3/index.js' }
        },
        bridgeRefs: {
          'bridge1': { name: 'bridge1', path: '/test/lib/bridge1/index.js' },
          'bridge2': { name: 'bridge2', path: '/test/lib/bridge2/index.js' }
        }
      });
    });
  });

  describe('require()', function() {
    var pkgs = {
      chores: '../../lib/utils/chores.js',
      loader: '../../lib/utils/loader.js',
      pinbug: '../../lib/utils/pinbug.js'
    }
    lodash.forEach([
      'bluebird', 'lodash', 'injektor', 'logolite', 'schemato'
    ], function(pkgName) {
      pkgs[pkgName] = pkgName;
    });
    it('require() returns correct exported packages', function() {
      lodash.forOwn(pkgs, function(pkgPath, pkgName) {
        assert.equal(bootstrap.require(pkgName), require(pkgPath));
      });
    });
  });

  describe('expandExtensions()', function() {
    var bootstrap = rewire('../../lib/bootstrap');
    var expandExtensions = bootstrap.__get__('expandExtensions');
    assert.isNotNull(expandExtensions);

    it('expand empty parameters', function() {
      var output = expandExtensions();
      false && console.log('expandExtensions(): ', output);
      assert.deepEqual(output, {
        libRootPaths: [],
        bridgeRefs: {},
        pluginRefs: {}
      });
    });

    it('expand empty context with a list of plugins', function() {
      var output = expandExtensions(null, [
        {
          name: 'my-plugin1',
          path: lab.getLibHome('plugin1')
        },
        {
          name: 'my-plugin2',
          path: lab.getLibHome('plugin2')
        }
      ], null);
      output = replaceObjectFields(output);
      false && console.log('expandExtensions(): ', output);
      assert.deepEqual(output, {
        libRootPaths: ['/test/lib/plugin1', '/test/lib/plugin2'],
        pluginRefs: {
          'my-plugin1': { name: 'my-plugin1', path: '/test/lib/plugin1/index.js' },
          'my-plugin2': { name: 'my-plugin2', path: '/test/lib/plugin2/index.js' }
        },
        bridgeRefs: {}
      });
    });

    it('expand empty context with a list of bridges', function() {
      var output = expandExtensions(null, [], [
        {
          name: 'my-bridge1',
          path: lab.getLibHome('bridge1')
        },
        {
          name: 'my-bridge2',
          path: lab.getLibHome('bridge2')
        }
      ]);
      output = replaceObjectFields(output);
      false && console.log('expandExtensions(): ', output);
      assert.deepEqual(output, {
        libRootPaths: [],
        pluginRefs: {},
        bridgeRefs: {
          'my-bridge1': { name: 'my-bridge1', path: '/test/lib/bridge1/index.js' },
          'my-bridge2': { name: 'my-bridge2', path: '/test/lib/bridge2/index.js' }
        }
      });
    });

    it('expand empty context with a list of plugins and a list of bridges', function() {
      var output = expandExtensions(null, [
        {
          name: 'my-plugin1',
          path: lab.getLibHome('plugin1')
        },
        {
          name: 'my-plugin2',
          path: lab.getLibHome('plugin2')
        },
        {
          name: 'my-plugin3',
          path: lab.getLibHome('plugin3')
        }
      ], [
        {
          name: 'my-bridge1',
          path: lab.getLibHome('bridge1')
        },
        {
          name: 'my-bridge2',
          path: lab.getLibHome('bridge2')
        }
      ]);
      output = replaceObjectFields(output);
      assert.deepEqual(output, {
        libRootPaths: ['/test/lib/plugin1', '/test/lib/plugin2', '/test/lib/plugin3'],
        pluginRefs: {
          'my-plugin1': { name: 'my-plugin1', path: '/test/lib/plugin1/index.js' },
          'my-plugin2': { name: 'my-plugin2', path: '/test/lib/plugin2/index.js' },
          'my-plugin3': { name: 'my-plugin3', path: '/test/lib/plugin3/index.js' }
        },
        bridgeRefs: {
          'my-bridge1': { name: 'my-bridge1', path: '/test/lib/bridge1/index.js' },
          'my-bridge2': { name: 'my-bridge2', path: '/test/lib/bridge2/index.js' }
        }
      });
    });

    it('expand empty context with nested and overlap plugins', function() {
      var output = expandExtensions(null, [
        {
          name: 'sublib1',
          path: lab.getLibHome('sublib1')
        },
        {
          name: 'sublib2',
          path: lab.getLibHome('sublib2')
        }
      ]);
      output = replaceObjectFields(output);
      false && console.log('expandExtensions(): ', output);
      assert.deepEqual(output, {
        libRootPaths:
          ['/test/lib/sublib1',
            '/test/lib/plugin1',
            '/test/lib/plugin2',
            '/test/lib/sublib2',
            '/test/lib/plugin3'],
        pluginRefs:
          {
            sublib1: { name: 'sublib1', path: '/test/lib/sublib1/index.js' },
            sublib2: { name: 'sublib2', path: '/test/lib/sublib2/index.js' },
            plugin1: { name: 'plugin1', path: '/test/lib/plugin1/index.js' },
            plugin2: { name: 'plugin2', path: '/test/lib/plugin2/index.js' },
            plugin3: { name: 'plugin3', path: '/test/lib/plugin3/index.js' }
          },
        bridgeRefs:
          {
            bridge1: { name: 'bridge1', path: '/test/lib/bridge1/index.js' },
            bridge2: { name: 'bridge2', path: '/test/lib/bridge2/index.js' },
            bridge3: { name: 'bridge3', path: '/test/lib/bridge3/index.js' }
          }
      });
    });

    it('expand empty context with complete plugins (nested and overlap plugins)', function() {
      var output = expandExtensions(null, [
        {
          name: 'sublib1',
          path: lab.getLibHome('sublib1')
        },
        {
          name: 'plugin1',
          path: lab.getLibHome('plugin1')
        },
        {
          name: 'plugin2',
          path: lab.getLibHome('plugin2')
        },
        {
          name: 'sublib2',
          path: lab.getLibHome('sublib2')
        },
        {
          name: 'plugin3',
          path: lab.getLibHome('plugin3')
        },
        {
          name: 'plugin4',
          path: lab.getLibHome('plugin4')
        }
      ], [
        {
          name: 'bridge1',
          path: lab.getLibHome('bridge1')
        },
        {
          name: 'bridge2',
          path: lab.getLibHome('bridge2')
        },
        {
          name: 'bridge3',
          path: lab.getLibHome('bridge3')
        },
        {
          name: 'bridge4',
          path: lab.getLibHome('bridge4')
        }
      ]);
      output = replaceObjectFields(output);
      false && console.log('expandExtensions(): ', output);
      assert.deepEqual(output, {
        libRootPaths:
          ['/test/lib/sublib1',
            '/test/lib/plugin1',
            '/test/lib/plugin2',
            '/test/lib/sublib2',
            '/test/lib/plugin3',
            '/test/lib/plugin4'],
        pluginRefs:
          {
            sublib1: { name: 'sublib1', path: '/test/lib/sublib1/index.js' },
            plugin1: { name: 'plugin1', path: '/test/lib/plugin1/index.js' },
            plugin2: { name: 'plugin2', path: '/test/lib/plugin2/index.js' },
            sublib2: { name: 'sublib2', path: '/test/lib/sublib2/index.js' },
            plugin3: { name: 'plugin3', path: '/test/lib/plugin3/index.js' },
            plugin4: { name: 'plugin4', path: '/test/lib/plugin4/index.js' }
          },
        bridgeRefs:
          {
            bridge1: { name: 'bridge1', path: '/test/lib/bridge1/index.js' },
            bridge2: { name: 'bridge2', path: '/test/lib/bridge2/index.js' },
            bridge3: { name: 'bridge3', path: '/test/lib/bridge3/index.js' },
            bridge4: { name: 'bridge4', path: '/test/lib/bridge4/index.js' }
          }
      });
    });
  });

  describe('launchApplication()', function() {
    var assertAppConfig = function(app) {
      var cfg = app.config;
      false && console.log('SHOW [app.config]: ', cfg);
      assert.hasAllKeys(cfg, [
        'profile', 'sandbox', 'appName', 'appInfo', 'bridgeRefs', 'pluginRefs'
      ]);
      assert.equal(cfg.appName, 'devebot-application');
      assert.deepEqual(cfg.appInfo, {
        layerware: [],
        framework: lab.getFrameworkInfo()
      });
      assert.sameMembers(cfg.bridgeRefs, []);
      assert.sameDeepMembers(lodash.map(cfg.pluginRefs, item => {
        return lodash.pick(item, ['type', 'name'])
      }), [{
        type: 'application',
        name: 'devebot-application'
      },
      {
        type: 'framework',
        name: 'devebot'
      }]);
    }

    var assertAppRunner = function(app) {
      var runner = app.runner;
    }

    var assertAppServer = function(app) {
      var runner = app.runner;
    }

    beforeEach(function() {
      LogTracer.reset();
    });

    it('launch application with empty root directory (as string)', function() {
      var app = bootstrap.launchApplication(null, [], []);
      var cfg = app.config;
      assert.equal(cfg.appName, 'devebot-application');
      assert.deepEqual(cfg.appInfo, {
        layerware: [],
        framework: lab.getFrameworkInfo()
      });
      assert.sameMembers(cfg.bridgeRefs, []);
      assert.sameDeepMembers(lodash.map(cfg.pluginRefs, item => {
        return lodash.pick(item, ['type', 'name'])
      }), [{
        type: 'framework',
        name: 'devebot'
      }]);
    });

    it('launch application with empty root directory (as string)', function() {
      var app = bootstrap.launchApplication(lab.getAppHome('empty'), [], []);
      assertAppConfig(app);
    });

    it('launch application with empty root directory (in context)', function() {
      var app = bootstrap.launchApplication({
        appRootPath: lab.getAppHome('empty')
      }, [], []);
      assertAppConfig(app);
      assertAppRunner(app);
      assertAppServer(app);
    });
  });

  describe('registerLayerware()', function() {
    beforeEach(function() {
      LogTracer.reset();
    });

    it('register a new plugin with empty parameters', function() {
      var pluginLauncher = bootstrap.registerLayerware(null, [], []);
      var pluginStore = pluginLauncher();
      false && console.log(JSON.stringify(pluginStore, null, 2));
      assert.deepEqual(pluginStore, { libRootPaths: [], bridgeRefs: {}, pluginRefs: {} });
    });

    it('register a new plugin with nested and overlap sub-plugins', function() {
      var pluginLauncher = bootstrap.registerLayerware(null, [
        {
          name: 'sublib1',
          path: lab.getLibHome('sublib1')
        },
        {
          name: 'sublib2',
          path: lab.getLibHome('sublib2')
        }
      ], []);
      var output = replaceObjectFields(pluginLauncher());
      false && console.log('pluginLauncher(): ', output);
      assert.deepEqual(output, {
        libRootPaths:
          ['/test/lib/sublib1',
            '/test/lib/plugin1',
            '/test/lib/plugin2',
            '/test/lib/sublib2',
            '/test/lib/plugin3'],
        pluginRefs:
          {
            sublib1: { name: 'sublib1', path: '/test/lib/sublib1/index.js' },
            sublib2: { name: 'sublib2', path: '/test/lib/sublib2/index.js' },
            plugin1: { name: 'plugin1', path: '/test/lib/plugin1/index.js' },
            plugin2: { name: 'plugin2', path: '/test/lib/plugin2/index.js' },
            plugin3: { name: 'plugin3', path: '/test/lib/plugin3/index.js' }
          },
        bridgeRefs:
          {
            bridge1: { name: 'bridge1', path: '/test/lib/bridge1/index.js' },
            bridge2: { name: 'bridge2', path: '/test/lib/bridge2/index.js' },
            bridge3: { name: 'bridge3', path: '/test/lib/bridge3/index.js' }
          }
      });
    });
  });

  after(function() {
		LogTracer.clearStringifyInterceptors();
		envtool.reset();
	});
});

var LIB_PATH_PATTERN = /(.*)test\/lib\/([^\/].*)(\/?.*)/g;
var replaceLibPath = function(p) {
  if (typeof p !== 'string') return p;
  return p.replace(LIB_PATH_PATTERN, '/test/lib/$2$3');
}

var replaceObjectFields = function(obj) {
  var replaceFields = function(queue) {
    if (queue.length > 0) {
      var o = queue.shift();
      if (lodash.isObject(o)) {
        lodash.forEach(lodash.keys(o), function(key) {
          if (lodash.isObject(o[key])) {
            queue.push(o[key]);
            return;
          }
          if (lodash.isString(o[key])) {
            o[key] = replaceLibPath(o[key]);
          }
        })
      }
      replaceFields(queue);
    }
  }
  replaceFields([obj]);
  return obj;
}