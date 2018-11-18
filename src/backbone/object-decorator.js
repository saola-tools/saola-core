'use strict';

const Promise = require('bluebird');
const lodash = require('lodash');
const path = require('path');
const chores = require('../utils/chores');
const constx = require('../utils/constx');
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
  let executor = null;
  let wrapped = method;
  if (isDecorated(texture)) {
    executor = new MethodExecutor({
      texture: texture,
      object: object,
      objectName: objectName,
      method: method,
      methodName: methodName,
      logger: opts.L || ref.L,
      tracer: opts.T || ref.T
    });
    wrapped = function() {
      return executor.run(arguments);
    }
  }
  return wrapped;
}

function MethodExecutor(params={}) {
  const { logger, tracer, preciseThreshold } = params
  const { texture, object, objectName, method, methodName } = params;
  let counter = { promise: 0, callback: 0, general: 0 }
  let pointer = { current: null, actionFlow: null, preciseThreshold }
  const logState = { objectName, methodName, requestId: null }

  // pre-processing logging texture
  let methodType = texture.methodType;
  pointer.preciseThreshold = pointer.preciseThreshold || 5;

  function createListener(texture, eventName) {
    if (!isEnabled(texture.logging)) return null;
    let onEvent = texture.logging['on' + eventName];
    if (!isEnabled(onEvent)) return null;
    return function (data, metadata) {
      if (nodash.isFunction(onEvent.extractReqId) && eventName === 'Request') {
        logState.requestId = onEvent.extractReqId(data, metadata);
      }
      if (pointer.actionFlow) {
        logState.actionFlow = pointer.actionFlow;
      }
      let msgObj = {
        text: "#{objectName}.#{methodName} - Request[#{requestId}]"
      }
      switch (eventName) {
        case 'Request':
          msgObj.text += ' is invoked';
          break;
        case 'Success':
          msgObj.text += ' has done';
          break;
        case 'Failure':
          msgObj.text += ' has failed';
          break;
      }
      if (nodash.isFunction(onEvent.extractInfo)) {
        msgObj.info = onEvent.extractInfo(data, metadata);
      }
      if (nodash.isString(onEvent.template)) {
        msgObj.text = onEvent.template;
      }
      msgObj.tags = onEvent.tags || texture.tags;
      if (!lodash.isArray(msgObj.tags) && lodash.isEmpty(msgObj.tags)) {
        delete msgObj.tags;
      }
      let logLevel = onEvent.logLevel || (eventName === 'Failure' ? 'error' : 'debug');
      logger.has(logLevel) && logger.log(logLevel, tracer.add(logState).toMessage(msgObj));
    }
  }
  const CALLED_EVENTS = ['Request', 'Success', 'Failure'];
  let logOnEvent = lodash.mapValues(lodash.keyBy(CALLED_EVENTS), function(value) {
    return createListener(texture, value);
  });

  this.__state__ = { object, method, methodType, counter, pointer, logOnEvent }
}

MethodExecutor.prototype.run = function(parameters) {
  const { object, method, methodType, counter, pointer, logOnEvent } = this.__state__;

  function _detect(parameters) {
    let result = null, exception = null, found = false;
    let pair = extractCallback(parameters);
    if (!found) {
      if (pair.callback) {
        found = true;
        hitMethodType(pointer, counter, 'callback');
        pair.parameters.push(function(error, value) {
          if (error) {
            logOnEvent.Failure(error);
          } else {
            logOnEvent.Success(value);
          }
          return pair.callback.apply(null, arguments);
        });
      }
    }
    try {
      logOnEvent.Request(pair.parameters);
      result = method.apply(object, pair.parameters);
      if (!found) {
        if (isPromise(result)) {
          found = true;
          hitMethodType(pointer, counter, 'promise');
          result = Promise.resolve(result).then(function(value) {
            logOnEvent.Success(value, pair.parameters);
            return value;
          }).catch(function(error) {
            logOnEvent.Failure(error, pair.parameters);
            return Promise.reject(error);
          });
        } else {
          logOnEvent.Success(result);
        }
      }
    } catch (error) {
      logOnEvent.Failure(error);
      exception = error;
    }
    // not be callback or promise
    if (!found) {
      found = true;
      hitMethodType(pointer, counter, 'general');
    }
    // return both result & exception
    return {result, exception};
  }

  function _invoke(parameters) {
    let result = undefined, exception = undefined;
    switch(methodType) {
      case 'promise': {
        result = Promise.resolve().then(function() {
          logOnEvent.Request(parameters);
          return method.apply(object, parameters)
        })
        .then(function(value) {
          logOnEvent.Success(value, parameters);
          return value;
        })
        .catch(function(error) {
          logOnEvent.Failure(error, parameters);
          return Promise.reject(error);
        })
        break;
      }
      case 'callback': {
        let pair = extractCallback(parameters);
        pair.parameters.push(function(error, value) {
          if (error) {
            logOnEvent.Failure(error);
          } else {
            logOnEvent.Success(value);
          }
          return pair.callback.apply(null, arguments);
        });
        logOnEvent.Request(parameters);
        result = method.apply(object, pair.parameters);
        break;
      }
      default: {
        try {
          logOnEvent.Request(parameters);
          result = method.apply(object, parameters);
          logOnEvent.Success(result);
        } catch (error) {
          exception = error;
          logOnEvent.Failure(exception);
        }
        break;
      }
    }
    return {result, exception};
  }

  if (!nodash.isArray(parameters)) {
    parameters = Array.prototype.slice.call(parameters);
  }

  let output = null;
  if (this.__state__.methodType) {
    pointer.actionFlow = 'explicit';
    output = _invoke(parameters);
  } else {
    pointer.actionFlow = 'implicit';
    output = _detect(parameters);
    let maxItem = maxOf(counter);
    if (maxItem.value >= pointer.preciseThreshold) {
      this.__state__.methodType = maxItem.label;
    }
  }
  // an error is occurred
  if (output.exception) {
    throw output.exception;
  }
  return output.result;
}

function hitMethodType(pointer, counter, methodType) {
  if (pointer.current !== methodType) {
    for(let name in counter) {
      counter[name] = 0;
    }
    pointer.current = methodType;
  }
  counter[methodType]++;
}

function maxOf(counter) {
  let maxValue = -1, maxLabel = null;
  for(let mt in counter) {
    if (maxValue < counter[mt]) {
      maxValue = counter[mt];
      maxLabel = mt;
    }
  }
  return { label: maxLabel, value: maxValue }
}

function isPromise(p) {
  return lodash.isObject(p) && lodash.isFunction(p.then);
}

function extractCallback(parameters) {
  let r = {};
  r.callback = parameters.length > 0 && parameters[parameters.length - 1] || null;
  if (typeof r.callback === 'function') {
    r.parameters = Array.prototype.slice.call(parameters, 0, parameters.length);
  } else {
    r.parameters = parameters;
    delete r.callback;
  }
  return r;
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
