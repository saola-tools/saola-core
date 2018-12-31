'use strict';

var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');

function Dialect(params = {}) {
  this.getConfig = function() {
    return lodash.cloneDeep(params);
  }
};

module.exports = Dialect;

Dialect.manifest = require('./manifest');
