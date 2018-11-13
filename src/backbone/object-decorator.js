'use strict';

const Promise = require('bluebird');
const lodash = require('lodash');
const path = require('path');
const chores = require('../utils/chores');
const constx = require('../utils/constx');
const loader = require('../utils/loader');
const nodash = require('../utils/nodash');
const blockRef = chores.getBlockRef(__filename);

function ObjectDecorator(params={}) {
  const loggingFactory = params.loggingFactory.branch(blockRef);
  const L = loggingFactory.getLogger();
  const T = loggingFactory.getTracer();
  const C = lodash.assign({L, T}, lodash.pick(params, ['issueInspector', 'schemaValidator']));
  const bridgeCTX = lodash.assign({moduleType: 'bridge'}, C);
  const pluginCTX = lodash.assign({moduleType: 'plugin'}, C);

  this.wrapBridgeDialect = function(bean, opts) {
    return wrapObject(bridgeCTX, textureStore, bean, opts);
  }

  this.wrapPluginGadget = function(bean, opts) {
    return wrapObject(pluginCTX, textureStore, bean, opts);
  }

  let textureStore = lodash.get(params, ['textureConfig']);
}

ObjectDecorator.argumentSchema = {
  "$id": "objectDecorator",
  "type": "object",
  "properties": {
    "issueInspector": {
      "type": "object"
    },
    "loggingFactory": {
      "type": "object"
    },
    "schemaValidator": {
      "type": "object"
    },
    "textureNames": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "textureConfig": {
      "type": "object"
    }
  }
};

module.exports = ObjectDecorator;

function wrapObject(ref, textureStore, object, opts) {
  ref = ref || {};
  if (lodash.isObject(object)) {
    opts = opts || {};
    for(let name in object) {
      if(lodash.isFunction(object[name])) {
        let texture = null;
        if (ref.moduleType === 'bridge') {

        }
        if (ref.moduleType === 'plugin') {
          texture = getTextureDef({
            textureStore: textureStore,
            pluginCode: opts.pluginCode,
            gadgetType: opts.gadgetType,
            objectName: opts.objectName,
            methodName: name
          });
        }
        object[name] = wrapMethod(ref, object[name], texture, {
          object: object,
          objectName: opts.objectName,
          methodName: name
        });
      }
    }
  }
  return object;
}

function wrapMethod(ref, method, texture, opts) {
  if (!nodash.isFunction(method)) return method;
  let {object, objectName, methodName} = opts || {};
  object = nodash.isObject(object) ? object : null;
  let wrapped = method;
  if (isDecorated(texture)) {
    wrapped = function() {
      let parameters = arguments;
      let requestId = null;
      const L = opts.L || ref.L;
      const T = opts.T || ref.T;
      // pre-processing logging texture
      if (isEnabled(texture.logging)) {
        let onRequest = texture.logging.onRequest;
        if (isEnabled(onRequest)) {
          let logArgs = {objectName, methodName};
          if (nodash.isFunction(onRequest.extractReqId)) {
            logArgs.requestId = requestId = onRequest.extractReqId(parameters);
          }
          if (nodash.isFunction(onRequest.extractInfo)) {
            logArgs.parameters = onRequest.extractInfo(parameters);
          }
          let tmpl = "#{objectName}.#{methodName} - #{parameters} - #{requestId}";
          if (nodash.isString(onRequest.template)) {
            tmpl = onRequest.template;
          }
          L.has('debug') && L.log('debug', T.add(logArgs).toMessage({
            text: tmpl
          }));
        }
        let onSuccess = texture.logging.onSuccess;
        if (isEnabled(onSuccess)) {
        }
        let onFailure = texture.logging.onFailure;
        if (isEnabled(onFailure)) {
        }
      }
      // detecting for methodType: promise-returned, callback-based or general method
      let result = undefined;
      switch(texture.methodType) {
        case 'promise': {
          result = Promise.resolve().then(function() {
            return method.apply(object, parameters)
          })
          .then(function(value) {
            return value;
          })
          .catch(function(error) {
            return Promise.reject(error);
          })
          break;
        }
        case 'callback': {
          let withoutCallback = omitCallback(parameters);
          let methodInPromise = Promise.promisify(method, { context: object });
          result = methodInPromise.apply(null, withoutCallback)
          .then(function(value) {
            return value;
          })
          .catch(function(error) {
            return Promise.reject(error);
          })
          .asCallback(pickCallback(parameters));
          break;
        }
        default: {
          try {
            result = method.apply(object, parameters);
          } catch (exception) {
            throw exception;
          }
          break;
        }
      }
      return result;
    }
  }
  return wrapped;
}

function isDecorated(texture) {
  return texture && texture.enabled !== false && (
      (texture.logging && texture.logging.enabled !== false) ||
      (texture.mocking && texture.mocking.enabled !== false)
  );
}

function isEnabled(section) {
  return section && section.enabled !== false;
}

function pickCallback(parameters) {
  return (parameters.length > 0) && parameters[parameters.length - 1];
}

function omitCallback(parameters) {
  return Array.prototype.slice.call(parameters, 0, parameters.length);
}

function getTextureDef({textureStore, pluginCode, gadgetType, objectName, methodName}) {
  let patternPath = [];
  if (pluginCode) {
    if (chores.isSpecialPlugin(pluginCode)) {
      patternPath.push(pluginCode);
    } else {
      patternPath.push('plugins', pluginCode);
    }
    if (['services', 'triggers', 'internal'].indexOf(gadgetType) >= 0) {
      patternPath.push(gadgetType);
      if (objectName) {
        patternPath.push(objectName);
        if (methodName) {
          patternPath.push(methodName);
        }
      }
    }
  }
  return lodash.get(textureStore, patternPath, {});
}
