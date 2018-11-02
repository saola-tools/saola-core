'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var chores = Devebot.require('chores');
var debugx = Devebot.require('pinbug')('tdd:devebot:core:name-resolver');
var assert = require('chai').assert;
var LogAdapter = require('logolite').LogAdapter;
var LogTracer = require('logolite').LogTracer;
var envmask = require('envmask').instance;
var rewire = require('rewire');

describe('tdd:devebot:core:name-resolver', function() {

  var CTX = {
    L: LogAdapter.getLogger(),
    T: LogTracer.ROOT
  };

  describe('standardizing loaded configuration data', function() {
    var NameResolver = rewire(lab.getDevebotModule('backbone/name-resolver'));
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

  describe('converting and reverting the plugin & bridge names', function() {
    var nameResolver = lab.getNameResolver([
      'sub-plugin1', 'devebot-dp-wrapper1', 'sub-plugin2', 'devebot-dp-wrapper2'
    ], [
      'bridge1', 'bridge-kebab-case1', 'devebot-co-connector1', 'bridge2', 'bridge-kebab-case2', 'devebot-co-connector2'
    ]);
    it('should build absoluteAliasMap correctly', function() {
      var absoluteAliasMap = nameResolver.getAbsoluteAliasMap();
      false && console.log('absoluteAliasMap: %s', JSON.stringify(absoluteAliasMap, null, 2));
      assert.deepEqual(absoluteAliasMap, {
        "plugin": {
          "sub-plugin1": "sub-plugin1",
          "subPlugin1": "sub-plugin1",
          "devebot-dp-wrapper1": "devebot-dp-wrapper1",
          "devebotDpWrapper1": "devebot-dp-wrapper1",
          "wrapper1": "devebot-dp-wrapper1",
          "sub-plugin2": "sub-plugin2",
          "subPlugin2": "sub-plugin2",
          "devebot-dp-wrapper2": "devebot-dp-wrapper2",
          "devebotDpWrapper2": "devebot-dp-wrapper2",
          "wrapper2": "devebot-dp-wrapper2"
        },
        "bridge": {
          "bridge1": "bridge1",
          "bridge-kebab-case1": "bridge-kebab-case1",
          "bridgeKebabCase1": "bridge-kebab-case1",
          "devebot-co-connector1": "devebot-co-connector1",
          "devebotCoConnector1": "devebot-co-connector1",
          "connector1": "devebot-co-connector1",
          "bridge2": "bridge2",
          "bridge-kebab-case2": "bridge-kebab-case2",
          "bridgeKebabCase2": "bridge-kebab-case2",
          "devebot-co-connector2": "devebot-co-connector2",
          "devebotCoConnector2": "devebot-co-connector2",
          "connector2": "devebot-co-connector2"
        }
      });
    });
  
    it('should build relativeAliasMap correctly', function() {
      var relativeAliasMap = nameResolver.getRelativeAliasMap();
      false && console.log('relativeAliasMap: %s', JSON.stringify(relativeAliasMap, null, 2));
      assert.deepEqual(relativeAliasMap, {
        "plugin": {
          "sub-plugin1": "subPlugin1",
          "devebot-dp-wrapper1": "wrapper1",
          "sub-plugin2": "subPlugin2",
          "devebot-dp-wrapper2": "wrapper2"
        },
        "bridge": {
          "bridge1": "bridge1",
          "bridge-kebab-case1": "bridgeKebabCase1",
          "devebot-co-connector1": "connector1",
          "bridge2": "bridge2",
          "bridge-kebab-case2": "bridgeKebabCase2",
          "devebot-co-connector2": "connector2"
        }
      });
    });

    it('getOriginalNameOf(_, "bridge")', function() {
      var result = [
        'bridge1',
        'bridge-kebab-case1',
        'bridgeKebabCase1',
        'devebot-co-connector1',
        'devebotCoConnector1',
        'connector1',
        'unknown',
        null
      ].map(function(name) {
        return {
          source: name,
          target: nameResolver.getOriginalNameOf(name, 'bridge')
        }
      });
      false && console.log(JSON.stringify(result, null, 2));
      assert.deepEqual(result, [
        {
          "source": "bridge1",
          "target": "bridge1"
        },
        {
          "source": "bridge-kebab-case1",
          "target": "bridge-kebab-case1"
        },
        {
          "source": "bridgeKebabCase1",
          "target": "bridge-kebab-case1"
        },
        {
          "source": "devebot-co-connector1",
          "target": "devebot-co-connector1"
        },
        {
          "source": "devebotCoConnector1",
          "target": "devebot-co-connector1"
        },
        {
          "source": "connector1",
          "target": "devebot-co-connector1"
        },
        {
          "source": "unknown",
          "target": "unknown"
        },
        {
          "source": null,
          "target": null
        }
      ]);
    });

    it('getOriginalNameOf(_, "plugin")', function() {
      var result = [
        'sub-plugin1',
        'subPlugin1',
        'devebot-dp-wrapper1',
        'devebotDpWrapper1',
        'wrapper1',
        'unknown',
        null
      ].map(function(name) {
        return {
          source: name,
          target: nameResolver.getOriginalNameOf(name, 'plugin')
        }
      });
      false && console.log(JSON.stringify(result, null, 2));
      assert.deepEqual(result, [
        {
          "source": "sub-plugin1",
          "target": "sub-plugin1"
        },
        {
          "source": "subPlugin1",
          "target": "sub-plugin1"
        },
        {
          "source": "devebot-dp-wrapper1",
          "target": "devebot-dp-wrapper1"
        },
        {
          "source": "devebotDpWrapper1",
          "target": "devebot-dp-wrapper1"
        },
        {
          "source": "wrapper1",
          "target": "devebot-dp-wrapper1"
        },
        {
          "source": "unknown",
          "target": "unknown"
        },
        {
          "source": null,
          "target": null
        }
      ]);
    });

    it('getDefaultAliasOf(_, "bridge")', function() {
      var result = [
        'bridge1', 'bridge-kebab-case1', 'devebot-co-connector1', 'unknown', null
      ].map(function(name) {
        return {
          source: name,
          target: nameResolver.getDefaultAliasOf(name, "bridge")
        }
      });
      false && console.log(JSON.stringify(result, null, 2));
      assert.deepEqual(result, [
        {
          "source": "bridge1",
          "target": "bridge1"
        },
        {
          "source": "bridge-kebab-case1",
          "target": "bridgeKebabCase1"
        },
        {
          "source": "devebot-co-connector1",
          "target": "connector1"
        },
        {
          "source": "unknown",
          "target": "unknown"
        },
        {
          "source": null,
          "target": null
        }
      ]);
    });

    it('getDefaultAliasOf(_, "plugin")', function() {
      var result = [
        'sub-plugin1', 'sub-plugin2', 'devebot-dp-wrapper1', 'devebot-dp-wrapper2', 'unknown', null
      ].map(function(name) {
        return {
          source: name,
          target: nameResolver.getDefaultAliasOf(name, "plugin")
        }
      });
      false && console.log(JSON.stringify(result, null, 2));
      assert.deepEqual(result, [
        {
          "source": "sub-plugin1",
          "target": "subPlugin1"
        },
        {
          "source": "sub-plugin2",
          "target": "subPlugin2"
        },
        {
          "source": "devebot-dp-wrapper1",
          "target": "wrapper1"
        },
        {
          "source": "devebot-dp-wrapper2",
          "target": "wrapper2"
        },
        {
          "source": "unknown",
          "target": "unknown"
        },
        {
          "source": null,
          "target": null
        }
      ]);
    });
  });
});
