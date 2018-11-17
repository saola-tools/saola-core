'use strict';

var Temporify = require('temporify');
var path = require('path');

var HELPER_ROOT_PATH = path.join(__dirname, '../index');
var helper = require(HELPER_ROOT_PATH);

function getBuilder(descriptor) {
  descriptor = descriptor || {};
  var builder = new Temporify({
    subdir: descriptor.name || 'bridge-default',
    variables: {
      helperRootPath: HELPER_ROOT_PATH,
      bridge: {
        name: descriptor.name,
        version: descriptor.version,
        description: descriptor.description
      }
    }
  });

  builder.assign([{
    filename: 'package.json',
    template: `
    {
      "name": "<%- bridge.name || 'bridge-default' %>",
      "version": "<%- bridge.version || '0.1.0' %>",
      "description": "<%- bridge.description || '' %>",
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

    var Promise = Devebot.require('bluebird');
    var lodash = Devebot.require('lodash');
    var dgx = Devebot.require('pinbug')('devebot:test:lab:<%- bridge.name || 'bridge-default' %>');

    var Service = function(params) {
      dgx.enabled && dgx(' + constructor start ...');

      params = params || {};

      dgx.enabled && dgx(' - params: %s', JSON.stringify(params, null, 2));

      this.getConfig = function() {
        return lodash.cloneDeep(params);
      }

      dgx.enabled && dgx(' - constructor end!');
    };

    module.exports = Service;
    `
  }]);

  return builder.generate();
}

module.exports = getBuilder;
