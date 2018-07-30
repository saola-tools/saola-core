'use strict';

var lab = require('../index');
var assert = require('chai').assert;
var rewire = require('rewire');
var path = require('path');

var bootstrap = rewire(path.join(lab.getDevebotHome(), 'lib/bootstrap'));
var locatePackage = bootstrap.__get__('locatePackage');
assert.isFunction(locatePackage);

console.log('Location: %s', locatePackage({}, {
  name: 'locating-package-json',
  path: path.join(__dirname, '../app/locating-package-json')
}, 'plugin'));
