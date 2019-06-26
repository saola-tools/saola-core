'use strict';

var Temporify = require('temporify');
var path = require('path');

var HELPER_ROOT_PATH = path.join(__dirname, '../index');
var helper = require(HELPER_ROOT_PATH);

function getBuilder(descriptor) {
  descriptor = descriptor || {};
  var builder = new Temporify({
    subdir: descriptor.application || 'default',
    variables: {
      helperRootPath: HELPER_ROOT_PATH,
      application: descriptor.application || {},
      plugins: descriptor.plugins || [],
      bridges: descriptor.bridges || []
    }
  });
  builder.assign([{
    filename: 'package.json',
    template: `
    {
      "name": "<%- application.name || 'default' %>",
      "version": "<%- application.version || '0.1.0' %>",
      "description": "<%- application.description || 'Devebot Demo Application' %>",
      "main": "index.js",
      "scripts": {
        "test": "echo 'Error: no test specified' && exit 1"
      },
      "author": "devebot",
      "license": "ISC"
    }
    `
  }, {
    filename: 'index.js',
    template: `
    'use strict';
    var helper = require('<%- helperRootPath %>');
    var Devebot = helper.getDevebot();
    var app = Devebot.launchApplication({
      appRootPath: __dirname
    }, [
      <%_ plugins.forEach(function(plugin, index) { -%>
      {
        name: '<%- plugin.name %>',
        path: '<%- plugin.path %>'
      }<%- index < (plugins.length - 1) ? ',' : '' %>
      <%_ }); -%>
    ], [
      <%_ bridges.forEach(function(bridge, index) { -%>
      {
        name: '<%- bridge.name %>',
        path: '<%- bridge.path %>'
      }<%- index < (bridges.length - 1) ? ',' : '' %>
      <%_ }); -%>
    ]);
    if (require.main === module) app.server.start();
    module.exports = app;
    `
  }, {
    dir: 'config/',
    filename: 'profile.js',
    template: `
    module.exports = {
      devebot: {
        verbose: false,
        jobqueue: {
          enabled: true
        }
      },
      logger: {
        transports: {
          console: {
            type: 'console',
            level: 'error',
            json: false,
            timestamp: true,
            colorize: true
          }
        }
      }
    }
    `
  }, {
    dir: 'config/',
    filename: 'sandbox.js',
    template: `
    module.exports = {
      application: {
        "host": "0.0.0.0",
        "port": 17700,
        "verbose": false
      },
      bridges: {
      },
      plugins: {
        <%_ plugins.forEach(function(plugin, index) { -%>
        "<%- plugin.name %>": {
          "host": "<%- plugin.host || 'localhost' %>",
          "port": <%- plugin.port || (17701 + index) %>,
          "verbose": false
        }<%- index < (plugins.length - 1) ? ',' : '' %>
        <%_ }); -%>
      }
    }
    `
  }, {
    dir: 'lib/services',
    filename: 'main-service.js',
    template: `
    'use strict';

    var Promise = Devebot.require('bluebird');
    var lodash = Devebot.require('lodash');

    var Service = function(params={}) {
      var L = params.loggingFactory.getLogger();

      var mainCfg = lodash.get(params, ['sandboxConfig', 'application'], {});
      L.has('silly') && L.log('silly', 'configuration: %s', JSON.stringify(mainCfg));
    };

    module.exports = Service;
    `
  }, {
    dir: 'lib/triggers',
    filename: 'main-trigger.js',
    template: `
    'use strict';

    var http = require('http');
    var Promise = Devebot.require('bluebird');
    var lodash = Devebot.require('lodash');
    var chores = Devebot.require('chores');
    var debugx = Devebot.require('pinbug')('devebot:test:lab:main:mainTrigger');

    var Service = function(params={}) {
      var self = this;
      var packageName = params.packageName || '<%- application.name || 'default' %>';
      var mainCfg = lodash.get(params, ['sandboxConfig', 'application'], {});

      var server = http.createServer();

      server.on('error', function(err) {
        debugx.enabled && debugx('Server Error: %s', JSON.stringify(err));
      });

      self.getServer = function() {
        return server;
      };

      var configHost = lodash.get(mainCfg, 'host', '<%- application.servlet_host || '0.0.0.0' %>');
      var configPort = lodash.get(mainCfg, 'port', <%- application.servlet_port || 8080 %>);

      self.start = function() {
        return new Promise(function(resolved, rejected) {
          var serverInstance = server.listen(configPort, configHost, function () {
            var host = serverInstance.address().address;
            var port = serverInstance.address().port;
            chores.isVerboseForced(packageName, mainCfg) &&
            console.log('%s is listening at http://%s:%s', packageName, host, port);
            resolved(serverInstance);
          });
        });
      };

      self.stop = function() {
        return new Promise(function(resolved, rejected) {
          server.close(function () {
            chores.isVerboseForced(packageName, mainCfg) &&
            console.log('%s has been closed', packageName);
            resolved();
          });
        });
      };
    };

    module.exports = Service;
    `
  }]);

  var deployed = builder.generate();

  return deployed;
}

module.exports = getBuilder;

if (require.main === module) {
  var builder = getBuilder({
    application: {
      name: 'demo-app',
      port: 17700,
      servlet_host: 'localhost',
      servlet_port: 8080
    },
    plugins: [1, 2].map(function(idx) {
      return {
        name: 'plugin' + idx,
        path: helper.getLibHome('plugin' + idx),
        host: '0.0.0.0',
        port: 17700 + idx
      }
    }),
    bridges: [1, 2].map(function(idx) {
      return {
        name: 'bridge' + idx,
        path: helper.getLibHome('bridge' + idx)
      }
    })
  });
  process.env.DEBUG = 'devebot*';
  var app = require(builder.homedir);
  app.server.start();
  console.log('Home: %s', builder.homedir);
}