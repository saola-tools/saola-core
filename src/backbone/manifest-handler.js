'use strict';

const lodash = require('lodash');
const chores = require('../utils/chores');
const envbox = require('../utils/envbox');
const nodash = require('../utils/nodash');
const LoggingWrapper = require('./logging-wrapper');
const blockRef = chores.getBlockRef(__filename);

function ManifestHandler(params={}) {
  const {issueInspector, appRef, devebotRef, pluginRefs, bridgeRefs} = params;
  const loggingWrapper = new LoggingWrapper(blockRef);
  const L = loggingWrapper.getLogger();
  const T = loggingWrapper.getTracer();

  L.has('silly') && L.log('silly', T.toMessage({
    tags: [ blockRef, 'constructor-begin' ],
    text: ' + constructor start ...'
  }));

  

  L.has('silly') && L.log('silly', T.toMessage({
    tags: [ blockRef, 'constructor-end' ],
    text: ' - constructor has finished'
  }));
};

ManifestHandler.argumentSchema = {
  "$id": "manifestHandler",
  "type": "object",
  "properties": {
    "issueInspector": {
      "type": "object"
    }
  }
};

module.exports = ManifestHandler;
