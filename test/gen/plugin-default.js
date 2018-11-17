'use strict';

var Temporify = require('temporify');
var path = require('path');

var HELPER_ROOT_PATH = path.join(__dirname, '../index');
var helper = require(HELPER_ROOT_PATH);

function getBuilder(descriptor) {
  descriptor = descriptor || {};
  var builder = new Temporify({
    subdir: descriptor.name || 'plugin-default',
    variables: {
      helperRootPath: HELPER_ROOT_PATH,
      module: {
        name: descriptor.name,
        version: descriptor.version,
        description: descriptor.description
      },
      plugins: descriptor.plugins || [],
      bridges: descriptor.bridges || []
    }
  });

  builder.assign([{
    filename: 'package.json',
    template: `
    {
      "name": "<%- module.name || 'plugin-default' %>",
      "version": "<%- module.version || '0.1.0' %>",
      "description": "<%- module.description || '' %>",
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
    module.exports = Devebot.registerLayerware({
      layerRootPath: __dirname,
      presets: {
        configTags: 'bridge[dialect-bridge]'
      }
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
    `
  }, {
    dir: 'lib/triggers',
    filename: descriptor.name + '-trigger.js',
    template: `
    'use strict';

    var Promise = Devebot.require('bluebird');
    var lodash = Devebot.require('lodash');
    var chores = Devebot.require('chores');
    var http = require('http');
    var util = require('util');

    var Service = function(params) {
      var self = this;
      params = params || {};

      var L = params.loggingFactory.getLogger();
      var T = params.loggingFactory.getTracer();

      var packageName = params.packageName || '<%- module.name || 'plugin-default' %>';
      var blockRef = params.componentId;
      var pluginCfg = params.sandboxConfig || {};

      var server = http.createServer();

      server.on('error', function(error) {
        L.has('error') && L.log('error', T.add({ error: error }).toMessage({
          tags: [ blockRef, 'server-error' ],
          text: ' - Server Error: {error}'
        }));
      });

      server.on('request', function(req, res) {
        res.writeHead(200);
        res.end(util.format('%s webserver', packageName));
      });

      self.getServer = function() {
        return server;
      };

      var configHost = lodash.get(pluginCfg, 'host', '0.0.0.0');
      var configPort = lodash.get(pluginCfg, 'port', 8080);

      self.start = function() {
        return new Promise(function(resolved, rejected) {
          var serverInstance = server.listen(configPort, configHost, function () {
            var host = serverInstance.address().address;
            var port = serverInstance.address().port;
            chores.isVerboseForced(packageName, pluginCfg) &&
                console.log('%s webserver is listening at http://%s:%s', packageName, host, port);
            resolved(serverInstance);
          });
        });
      };

      self.stop = function() {
        return new Promise(function(resolved, rejected) {
          server.close(function () {
            chores.isVerboseForced(packageName, pluginCfg) &&
                console.log('%s webserver has been closed', packageName);
            resolved();
          });
        });
      };
    };

    Service.argumentSchema = {
      "$id": "<%- module.name || 'pluginDefault' %>Trigger",
      "type": "object",
      "properties": {
        "sandboxName": {
          "type": "string"
        },
        "sandboxConfig": {
          "type": "object"
        },
        "profileConfig": {
          "type": "object"
        },
        "loggingFactory": {
          "type": "object"
        }
      }
    };

    module.exports = Service;
    `
  }]);

  return builder.generate();
}

module.exports = getBuilder;
