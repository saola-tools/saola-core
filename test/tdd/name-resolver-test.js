'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var Promise = Devebot.require('bluebird');
var chores = Devebot.require('chores');
var lodash = Devebot.require('lodash');
var loader = Devebot.require('loader');
var debugx = Devebot.require('pinbug')('tdd:devebot:core:name-resolver');
var assert = require('chai').assert;
var expect = require('chai').expect;
var path = require('path');
var util = require('util');
var LogAdapter = require('logolite').LogAdapter;
var LogTracer = require('logolite').LogTracer;
var envtool = require('logolite/envtool');
var rewire = require('rewire');

describe('tdd:devebot:core:name-resolver', function() {

  var CTX = {
    LX: LogAdapter.getLogger(),
    LT: LogTracer.ROOT
  };

  describe('standardizing loaded configuration data', function() {
    var NameResolver = rewire('../../lib/backbone/name-resolver');
    var extractAliasNames = NameResolver.__get__('extractAliasNames');
    var buildAbsoluteAliasMap = NameResolver.__get__('buildAbsoluteAliasMap');
    var buildRelativeAliasMap = NameResolver.__get__('buildRelativeAliasMap');

    it('should build the map of plugin-names transformation correctly', function() {
      if (!chores.isUpgradeSupported('standardizing-config')) {
        this.skip();
        return;
      }

      var pluginDefs = {
        "path/to/devebot-dp-wrapper1": {
          name: "devebot-dp-wrapper1"
        },
        "path/to/devebot-dp-wrapper2": {
          name: "devebot-dp-wrapper2"
        },
        "path/to/sub-wrapper1": {
          name: "sub-wrapper1"
        },
        "path/to/devebot-dp-sub-wrapper0": {
          name: "devebot-dp-sub-wrapper0"
        },
        "path/to/devebot-dp-sub-wrapper1": {
          name: "devebot-dp-sub-wrapper1"
        },
        "path/to/devebot-dp-sub-wrapper2": {
          name: "devebot-dp-sub-wrapper2"
        },
        "path/to/sub-wrapper2": {
          name: "sub-wrapper2"
        }
      };

      var pluginRefs = {
        "path/to/devebot-dp-wrapper1": {
          name: "devebot-dp-wrapper1",
          nameInCamel: "devebotDpWrapper1",
          code: "wrapper1",
          codeInCamel: "wrapper1"
        },
        "path/to/devebot-dp-wrapper2": {
          name: "devebot-dp-wrapper2",
          nameInCamel: "devebotDpWrapper2",
          code: "wrapper2",
          codeInCamel: "wrapper2"
        },
        "path/to/sub-wrapper1": {
          name: "sub-wrapper1",
          nameInCamel: "subWrapper1",
          code: "sub-wrapper1",
          codeInCamel: "subWrapper1"
        },
        "path/to/devebot-dp-sub-wrapper0": {
          name: "devebot-dp-sub-wrapper0",
          nameInCamel: "devebotDpSubWrapper0",
          code: "sub-wrapper0",
          codeInCamel: "subWrapper0"
        },
        "path/to/devebot-dp-sub-wrapper1": {
          name: "devebot-dp-sub-wrapper1",
          nameInCamel: "devebotDpSubWrapper1",
          code: "sub-wrapper1",
          codeInCamel: "subWrapper1"
        },
        "path/to/devebot-dp-sub-wrapper2": {
          name: "devebot-dp-sub-wrapper2",
          nameInCamel: "devebotDpSubWrapper2",
          code: "sub-wrapper2",
          codeInCamel: "subWrapper2"
        },
        "path/to/sub-wrapper2": {
          name: "sub-wrapper2",
          nameInCamel: "subWrapper2",
          code: "sub-wrapper2",
          codeInCamel: "subWrapper2"
        }
      };

      assert.deepEqual(extractAliasNames(CTX, 'plugin', pluginDefs), pluginRefs);

      var expectedMap = {
        "devebot-dp-wrapper1": "devebot-dp-wrapper1",
        "devebotDpWrapper1": "devebot-dp-wrapper1",
        "wrapper1": "devebot-dp-wrapper1",
        "devebot-dp-wrapper2": "devebot-dp-wrapper2",
        "devebotDpWrapper2": "devebot-dp-wrapper2",
        "wrapper2": "devebot-dp-wrapper2",
        "sub-wrapper1": "sub-wrapper1",
        "subWrapper1": "sub-wrapper1",
        "devebot-dp-sub-wrapper0": "devebot-dp-sub-wrapper0",
        "devebotDpSubWrapper0": "devebot-dp-sub-wrapper0",
        "sub-wrapper0": "devebot-dp-sub-wrapper0",
        "subWrapper0": "devebot-dp-sub-wrapper0",
        "devebot-dp-sub-wrapper1": "devebot-dp-sub-wrapper1",
        "devebotDpSubWrapper1": "devebot-dp-sub-wrapper1",
        "devebot-dp-sub-wrapper2": "devebot-dp-sub-wrapper2",
        "devebotDpSubWrapper2": "devebot-dp-sub-wrapper2",
        "sub-wrapper2": "sub-wrapper2",
        "subWrapper2": "sub-wrapper2"
      };

      var pluginAliasMap = buildAbsoluteAliasMap(pluginRefs);

      false && console.log(JSON.stringify(pluginAliasMap, null, 2));
      assert.deepEqual(pluginAliasMap, expectedMap);
    });
  });
});
