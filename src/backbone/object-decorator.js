'use strict';

const Promise = require('bluebird');
const lodash = require('lodash');
const chores = require('../utils/chores');
const nodash = require('../utils/nodash');
const BeanProxy = require('../utils/proxy');
const blockRef = chores.getBlockRef(__filename);

function ObjectDecorator(params={}) {
  const loggingFactory = params.loggingFactory.branch(blockRef);
  const nameResolver = params.nameResolver;
  const L = loggingFactory.getLogger();
  const T = loggingFactory.getTracer();
  const C = lodash.assign({L, T}, lodash.pick(params, ['issueInspector', 'schemaValidator']));

  this.wrapBridgeDialect = function(beanConstructor, opts) {
    const textureOfBean = getTextureOfBridge({
      textureStore: textureStore,
      pluginCode: opts.pluginCode || nameResolver.getDefaultAliasOf(opts.pluginName, 'plugin'),
      bridgeCode: opts.bridgeCode || nameResolver.getDefaultAliasOf(opts.bridgeName, 'bridge'),
      dialectName: opts.dialectName
    });
    return wrapConstructor(C, beanConstructor, lodash.assign({
      textureOfBean, objectName: opts.dialectName
    }, lodash.pick(opts, ['logger', 'tracer'])));
  }

  this.wrapPluginGadget = function(beanConstructor, opts) {
    const textureOfBean = getTextureOfPlugin({
      textureStore: textureStore,
      pluginCode: opts.pluginCode || nameResolver.getDefaultAliasOf(opts.pluginName, 'plugin'),
      gadgetType: opts.gadgetType,
      gadgetName: opts.gadgetName
    });
    return wrapConstructor(C, beanConstructor, lodash.assign({
      textureOfBean, objectName: opts.gadgetName
    }, lodash.pick(opts, ['logger', 'tracer'])));
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
    "nameResolver": {
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

function wrapConstructor(refs, constructor, opts) {
  return new Proxy(constructor, {
    construct: function(target, argumentsList, newTarget) {
      function F() {
        return target.apply(this, argumentsList);
      }
      F.prototype = target.prototype;
      // F = target.bind.apply(target, [target].concat(argumentsList));
      // F = Function.prototype.bind.apply(target, [target].concat(argumentsList));
      return wrapObject(refs, new F(), opts);
    },
    apply: function(target, thisArg, argumentsList) {
      let createdObject = target.apply(thisArg, argumentsList) || thisArg;
      return wrapObject(refs, createdObject, opts);
    }
  })
}

function wrapObject(refs, object, opts) {
  if (!lodash.isObject(object) || lodash.isArray(object)) {
    return object;
  }
  opts = opts || {};
  refs = refs || {};
  let {L, T} = refs;
  let cached = {};
  return new BeanProxy(object, {
    get(target, property, receiver) {
      let parent = object;
      if (!lodash.isEmpty(this.path)) {
        parent = lodash.get(object, this.path);
      }
      let node = parent[property];
      // L.has('dunce') && L.log('dunce', T.add({
      //   path: this.path, property, itemType: typeof(node)
      // }).toMessage({
      //   text: '#{path} / #{property} -> #{itemType}'
      // }));
      if (lodash.isFunction(node)) {
        return this.nest(node);
      }
      if (lodash.isObject(node) && !lodash.isArray(node)) {
        return this.nest();
      }
      return node;
    },
    apply(target, thisArg, argList) {
      let methodName = this.path[this.path.length - 1];
      let fieldChain = lodash.slice(this.path, 0, this.path.length - 1);
      let methodPath = this.path.join('.');
      L.has('dunce') && L.log('dunce', T.add({
        objectName: opts.objectName, fieldChain, methodName, methodPath
      }).toMessage({
        text: 'Method: #{objectName}.#{methodPath} is invoked',
        info: argList
      }));
      if (!cached[methodPath]) {
        let texture = getTextureByPath({
          textureOfBean: opts.textureOfBean,
          fieldChain: fieldChain,
          methodName: methodName
        });
        let owner = lodash.get(object, fieldChain);
        let ownerName = opts.objectName;
        if (fieldChain.length > 0) {
          ownerName = [opts.objectName].concat(fieldChain).join('.');
        }
        cached[methodPath] = wrapMethod(refs, target, {
          texture: texture,
          object: owner,
          objectName: ownerName,
          methodName: methodName,
          logger: opts.logger || object.logger,
          tracer: opts.tracer || object.tracer
        });
      }
      return cached[methodPath].apply(undefined, argList);
    }
  })
}

function wrapMethod(refs, method, opts) {
  if (!lodash.isFunction(method)) return method;
  let {texture, object, objectName, methodName} = opts || {};
  object = lodash.isObject(object) ? object : null;
  let executor = null;
  let wrapped = method;
  if (isDecorated(texture)) {
    executor = new MethodExecutor({
      texture: texture,
      object: object,
      objectName: objectName,
      method: method,
      methodName: methodName,
      logger: opts.logger || refs.L,
      tracer: opts.tracer || refs.T
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
      if (lodash.isFunction(onEvent.extractReqId) && eventName === 'Request') {
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
      if (lodash.isFunction(onEvent.extractInfo)) {
        msgObj.info = onEvent.extractInfo(data, metadata);
      }
      if (lodash.isString(onEvent.template)) {
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

  if (!lodash.isArray(parameters)) {
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
  counter[pointer.current]++;
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

function getTextureByPath({textureOfBean, fieldChain, methodName }) {
  let texture = null;
  if (nodash.isObject(textureOfBean)) {
    let beanToMethod = [];
    if (nodash.isArray(fieldChain) && fieldChain.length > 0) {
      Array.prototype.push.apply(beanToMethod, fieldChain);
    }
    if (methodName) {
      beanToMethod.push(methodName);
    }
    texture = lodash.get(textureOfBean, beanToMethod);
    texture = texture || textureOfBean[beanToMethod.join('.')];
  }
  return texture;
}

function getTextureOfBridge({textureStore, pluginCode, bridgeCode, dialectName, dialectPath}) {
  let rootToBean = [];
  if (lodash.isArray(dialectPath) && !lodash.isEmpty(dialectPath)) {
    rootToBean.push("bridges");
    Array.prototype.push.apply(rootToBean, dialectPath);
  } else {
    if (pluginCode && bridgeCode && dialectName) {
      rootToBean.push("bridges", bridgeCode, pluginCode, dialectName);
    }
  }
  let textureOfBean = textureStore;
  if (rootToBean.length > 0) {
    textureOfBean = lodash.get(textureStore, rootToBean, null);
  }
  return textureOfBean;
}

function getTextureOfPlugin({textureStore, pluginCode, gadgetType, gadgetName}) {
  let rootToBean = [];
  if (pluginCode) {
    if (chores.isSpecialPlugin(pluginCode)) {
      rootToBean.push(pluginCode);
    } else {
      rootToBean.push('plugins', pluginCode);
    }
    if (['services', 'triggers', 'internal'].indexOf(gadgetType) >= 0) {
      rootToBean.push(gadgetType);
      if (gadgetName) {
        rootToBean.push(gadgetName);
      }
    }
  }
  let textureOfBean = textureStore;
  if (rootToBean.length > 0) {
    textureOfBean = lodash.get(textureStore, rootToBean, null);
  }
  return textureOfBean;
}
