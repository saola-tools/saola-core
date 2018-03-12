'use strict';

var chores = require('../lib/utils/chores');
var constx = require('../lib/utils/constx');
var debugx = require('../lib/utils/pinbug')('devebot:test:lab');
var fs = require('fs');
var lodash = require('lodash');
var path = require('path');
var Injektor = require('injektor');

var lab = module.exports = {
  getApiConfig: function(ext) {
    ext = ext || {};
    return lodash.merge({
      host: '127.0.0.1',
      port: 17779,
      path: '/demo-app',
      authen: {
        token_key: 'devebot',
        token_secret: 's3cr3tpa$$w0rd'
      },
      stateMap: {
        "definition": "definition",
        "started": "started",
        "progress": "progress",
        "timeout": "timeout",
        "failed": "failed",
        "cancelled": "cancelled",
        "completed": "completed",
        "done": "done",
        "noop": "noop"
      }
    }, ext);
  },
  getAppHome: function(appName) {
    return path.join(__dirname, 'app', appName);
  },
  getApp: function(appName) {
    appName = appName || 'default';
    return require(this.getAppHome(appName));
  },
  getAppCfgDir: function(appName, cfgName) {
    cfgName = cfgName || 'config';
    return path.join(__dirname, 'app', appName, cfgName);
  },
  getLibHome: function(libName) {
    return path.join(__dirname, './lib/', libName);
  },
  getLib: function(libName) {
    return require(this.getLibHome(libName));
  },
  getLibCfgDir: function(libName) {
    return path.join(this.getLibHome(libName), 'config');
  },
  getDevebotHome: function() {
    return path.join(__dirname, '../');
  },
  getDevebot: function() {
    return require(this.getDevebotHome());
  },
  getDevebotCfgDir: function() {
    return path.join(this.getDevebotHome(), 'config');
  },
  getDefaultTimeout: function() {
    return 60000;
  },
  getFrameworkInfo: function() {
    return chores.loadPackageInfo(this.getDevebotHome());
  }
}

lab.createBridgeLoader = function(appName) {
  var profileConfig = {};
  var bridgeRefs = [];
  if (appName) {
    var app = lab.getApp(appName);
    profileConfig = app.config.profile || {
      logger: {
        transports: {
          console: {
            type: 'console',
            level: 'debug',
            json: false,
            timestamp: true,
            colorize: true
          }
        }
      }
    }
    bridgeRefs = app.config.bridgeRefs;
  }
  var injektor = new Injektor({ separator: chores.getSeparator() });
  lodash.forOwn(chores.loadServiceByNames({}, path.join(lab.getDevebotHome(), 'lib/backbone'), [
    'bridge-loader', 'schema-validator', 'logging-factory'
  ]), function(constructor, serviceName) {
    injektor.defineService(serviceName, constructor, chores.injektorContext);
  });
  injektor.registerObject('profileConfig', profileConfig);
  injektor.registerObject('bridgeRefs', bridgeRefs);
  return injektor.lookup('bridgeLoader');
}

lab.createPluginLoader = function(appName) {
  var profileConfig = {};
  var pluginRefs = [];
  if (appName) {
    var app = lab.getApp(appName);
    profileConfig = app.config.profile || {
      logger: {
        transports: {
          console: {
            type: 'console',
            level: 'debug',
            json: false,
            timestamp: true,
            colorize: true
          }
        }
      }
    }
    pluginRefs = app.config.pluginRefs;
  }
  var injektor = new Injektor({ separator: chores.getSeparator() });
  lodash.forOwn(chores.loadServiceByNames({}, path.join(lab.getDevebotHome(), 'lib/backbone'), [
    'plugin-loader', 'schema-validator', 'logging-factory'
  ]), function(constructor, serviceName) {
    injektor.defineService(serviceName, constructor, chores.injektorContext);
  });
  injektor.registerObject('profileConfig', profileConfig);
  injektor.registerObject('pluginRefs', pluginRefs);
  return injektor.lookup('pluginLoader');
}

lab.createKernel = function(appName) {
  var _config = null;
  if (appName) {
    var app = lab.getApp(appName);
    _config = app.config;
  }
  if (_config === null) return null;
  var Kernel = require(path.join(lab.getDevebotHome(), 'lib/kernel.js'));
  return new Kernel(_config);
}

lab.preventExit = function(block) {
  var counter = 0;
  var refExit = process.exit;

  process.exit = function(code) {
    counter += 1;
    debugx.enabled && debugx(' - process.exit(%s) is invoked', code);
  }

  var unhook = function() {
    if (typeof refExit === 'function') {
      process.exit = refExit;
      refExit = null;
    }
    return counter;
  }

  if (typeof block === 'function') {
    block(unhook);
  }

  return unhook;
}
