'use strict';

var lab = require('../index');
var assert = require('chai').assert;
var rewire = require('rewire');
var path = require('path');

var issueInspector = lab.getIssueInspector();
var bootstrap = rewire(path.join(lab.getDevebotHome(), 'lib/bootstrap'));
var locatePackage = bootstrap.__get__('locatePackage');
assert.isFunction(locatePackage);

console.log('Location: %s', locatePackage({issueInspector}, {
  name: 'locating-package-json',
  path: path.join(__dirname, '../app/locating-package-json')
}, 'application'));

console.log('Location: %s', locatePackage({issueInspector}, {
  name: 'locating-package-json-foo',
  path: path.join(__dirname, '../app/locating-package-json/foo')
}, 'application'));

console.log('Location: %s', locatePackage({issueInspector}, {
  name: 'locating-package-json-foo',
  path: path.join(__dirname, '../app/locating-package-json/foo/sub/sub/sub')
}, 'application'));

console.log('Location: %s', locatePackage({issueInspector}, {
  name: 'locating-package-json-bar',
  path: path.join(__dirname, '../app/locating-package-json/bar')
}, 'application'));

console.log('Location: %s', locatePackage({issueInspector}, {
  name: 'locating-package-json-bar',
  path: path.join(__dirname, '../app/locating-package-json/bar/sub/server')
}, 'application'));

console.log('Location: %s', locatePackage({issueInspector}, {
  name: 'locating-package-json-bar',
  path: path.join(__dirname, '../app/locating-package-json/bar/sub/sub')
}, 'application'));

console.log('Location: %s', locatePackage({issueInspector}, {
  name: 'locating-package-json-bar',
  path: path.join(__dirname, '../app/locating-package-json/bar/sub/sub/sub/client')
}, 'application'));

issueInspector.barrier();
