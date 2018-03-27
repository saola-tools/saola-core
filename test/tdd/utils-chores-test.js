'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var loader = Devebot.require('loader');
var debugx = Devebot.require('pinbug')('tdd:devebot:utils:chores');
var assert = require('chai').assert;
var expect = require('chai').expect;
var path = require('path');
var util = require('util');
var chores = require('../../lib/utils/chores');
var envtool = require('logolite/envtool');
var LogAdapter = require('logolite').LogAdapter;
var LogTracer = require('logolite').LogTracer;

describe('tdd:devebot:utils:chores', function() {
  describe('loadServiceByNames()', function() {
    var serviceFolder = path.join(__dirname, '../lib/testcode/services');
    var serviceNames = ['service1', 'service2'];
    it('should load service modules by names', function() {
      var serviceMap = {};
      var result = chores.loadServiceByNames(serviceMap, serviceFolder, serviceNames);
      assert.equal(result, serviceMap);
      assert.sameMembers(lodash.keys(serviceMap), serviceNames);
      var totalConstructors = lodash.reduce(lodash.values(serviceMap), function(sum, f) {
        return lodash.isFunction(f) ? (sum + 1) : sum;
      }, 0);
      assert.equal(totalConstructors, serviceNames.length);
    });
  });

  describe('String manipulation', function() {
    it('stringKebabCase() converts normal string to kebab-case string', function() {
      assert.equal(chores.stringKebabCase(null), null);
      assert.equal(chores.stringKebabCase(''), '');
      assert.equal(chores.stringKebabCase('Application'), 'application');
      assert.equal(chores.stringKebabCase('HELLO WORLD'), 'hello-world');
      assert.equal(chores.stringKebabCase('Simple demo Application'), 'simple-demo-application');
      assert.equal(chores.stringKebabCase('more  than   words'), 'more-than-words');
    });

    it('stringLabelCase() converts normal string to label-case string', function() {
      assert.equal(chores.stringLabelCase(null), null);
      assert.equal(chores.stringLabelCase(''), '');
      assert.equal(chores.stringLabelCase('Application'), 'APPLICATION');
      assert.equal(chores.stringLabelCase('Hello  world'), 'HELLO_WORLD');
      assert.equal(chores.stringLabelCase('user@example.com'), 'USER_EXAMPLE_COM');
      assert.equal(chores.stringLabelCase('Underscore_with 123'), 'UNDERSCORE_WITH_123');
    });

    it('stringCamelCase() converts normal string to camel-case string', function() {
      assert.equal(chores.stringCamelCase(null), null);
      assert.equal(chores.stringCamelCase(''), '');
      assert.equal(chores.stringCamelCase('application'), 'application');
      assert.equal(chores.stringCamelCase('hello-world'), 'helloWorld');
      assert.equal(chores.stringCamelCase('three-words-phrase'), 'threeWordsPhrase');
    });
  });

  describe('getBlockRef()', function() {
    it('should generate blockRef correctly', function() {
      var file = path.join(lab.getLibHome('plugin1'), 'lib/services/plugin1-service.js');
      assert.equal(chores.getBlockRef(file), 'devebot/plugin1Service');
      assert.equal(chores.getBlockRef(file, 'mymodule'), 'mymodule/plugin1Service');
      assert.equal(chores.getBlockRef(file, [ 'mymodule' ]), 'mymodule/plugin1Service');
      assert.equal(chores.getBlockRef(file, [ 'part1', 'part2' ]), 'part1/part2/plugin1Service');
    });
  });

  describe('extractCodeByPattern()', function() {
    const CTX = {
      LX: LogAdapter.getLogger(),
      LT: LogTracer.ROOT
    }
    it('should extract code by pattern from name correctly', function() {
      const BRIDGE_NAME_PATTERNS = [
        /^devebot-co-([a-z][a-z0-9\-]*)$/g,
        /^([a-z][a-z0-9\-]*)$/g
      ];
      assert(chores.extractCodeByPattern(CTX, BRIDGE_NAME_PATTERNS, 'hello-world'), 'helloWorld');
      assert(chores.extractCodeByPattern(CTX, BRIDGE_NAME_PATTERNS, 'devebot-co'), 'devebotCo');
      assert(chores.extractCodeByPattern(CTX, BRIDGE_NAME_PATTERNS, 'devebot-co-'), '');
      assert(chores.extractCodeByPattern(CTX, BRIDGE_NAME_PATTERNS, 'devebot-co-hello-world'), 'helloWorld');
      assert(chores.extractCodeByPattern(CTX, BRIDGE_NAME_PATTERNS, 'devebot-co-hello_world'), 'hello_world');
      assert(chores.extractCodeByPattern(CTX, BRIDGE_NAME_PATTERNS, 'devebot-co-top-s3cr3t'), 'topS3cr3t');
      assert(chores.extractCodeByPattern(CTX, BRIDGE_NAME_PATTERNS, 'devebot-co-your-5ecret'), 'your_5ecret');
    });
  });
});