'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var chores = Devebot.require('chores');
var assert = require('chai').assert;

describe('tdd:devebot:core:mapping-loader', function() {
  var loggingFactory = lab.createLoggingFactoryMock();
  var CTX = {
    L: loggingFactory.getLogger(),
    T: loggingFactory.getTracer(),
  }

  describe('loadMappingStore()', function() {
    var loggingFactory = lab.createLoggingFactoryMock({ captureMethodCall: false });
    var ctx = {
      L: loggingFactory.getLogger(),
      T: loggingFactory.getTracer(),
      blockRef: 'app-restfetch',
    }

    var MappingLoader, loadMappingStore, evaluateMappingFile, fs;

    beforeEach(function() {
      MappingLoader = lab.acquireDevebotModule('backbone/mapping-loader');
      loadMappingStore = MappingLoader.__get__('loadMappingStore');
      fs = {
        statSync: sinon.stub()
      };
      MappingLoader.__set__('fs', fs);
    });
  });
});
