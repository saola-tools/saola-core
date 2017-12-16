'use strict';

var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');

var commandConfig;

var commandObject = {
  info: {
  	description: 'Main Application Command1',
    options: []
  },
  handler: function(opts, ctx) {
    return Promise.resolve([{
        type: 'json',
        title: 'Main Application Command1',
        data: {}
    }]);
  }
};

module.exports = function(params) {
  commandConfig = params || {};
  return commandObject;
};
