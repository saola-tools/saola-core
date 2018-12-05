'use strict';

const assert = require('assert');
const Promise = require('bluebird');
const lodash = require('lodash');
const chores = require('../utils/chores');
const nodash = require('../utils/nodash');
const errors = require('../utils/errors');
const BeanProxy = require('../utils/proxy');
const blockRef = chores.getBlockRef(__filename);

const NOOP = function() {}

function ObjectDecorator(params={}) {
  const loggingFactory = params.loggingFactory.branch(blockRef);
  const nameResolver = params.nameResolver;
  const L = loggingFactory.getLogger();
  const T = loggingFactory.getTracer();
  const C = lodash.assign({L, T}, lodash.pick(params, ['issueInspector', 'schemaValidator']));
  const textureStore = lodash.get(params, ['textureConfig']);

  this.wrapBridgeDialect = function(beanConstructor, opts) {
    if (!chores.isUpgradeSupported('bean-decorator')) {
      return beanConstructor;
    }
    const textureOfBean = getTextureOfBridge({
      textureStore: textureStore,
      pluginCode: opts.pluginCode || nameResolver.getDefaultAliasOf(opts.pluginName, 'plugin'),
      bridgeCode: opts.bridgeCode || nameResolver.getDefaultAliasOf(opts.bridgeName, 'bridge'),
      dialectName: opts.dialectName
    });
    let useDefaultTexture = null;
    if (opts && 'useDefaultTexture' in opts) {
      useDefaultTexture = opts.useDefaultTexture;
    }
    return wrapConstructor(C, beanConstructor, lodash.assign({
      textureOfBean, useDefaultTexture, objectName: opts.dialectName
    }, lodash.pick(opts, ['logger', 'tracer'])));
  }

  this.wrapPluginGadget = function(beanConstructor, opts) {
    if (!chores.isUpgradeSupported('bean-decorator')) {
      return beanConstructor;
    }
    const textureOfBean = getTextureOfPlugin({
      textureStore: textureStore,
      pluginCode: opts.pluginCode || nameResolver.getDefaultAliasOf(opts.pluginName, 'plugin'),
      gadgetType: opts.gadgetType,
      gadgetName: opts.gadgetName
    });
    let useDefaultTexture = (['reducers', 'services'].indexOf(opts.gadgetType) >= 0);
    if (opts && 'useDefaultTexture' in opts) {
      useDefaultTexture = opts.useDefaultTexture;
    }
    return wrapConstructor(C, beanConstructor, lodash.assign({
      textureOfBean, useDefaultTexture, objectName: opts.gadgetName
    }, lodash.pick(opts, ['logger', 'tracer'])));
  }
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
  if (opts && opts.textureOfBean && opts.textureOfBean.enabled === false) {
    return constructor;
  }
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
      let node = target[property];
      false && L.has('dunce') && L.log('dunce', T.add({
        path: this.path, property, itemType: typeof(node)
      }).toMessage({
        text: '#{path} / #{property} -> #{itemType}'
      }));
      if (lodash.isFunction(node) || lodash.isObject(node)) {
        return this.nest(node);
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
        if (opts.useDefaultTexture) {
          texture = lodash.defaultsDeep(texture, DEFAULT_TEXTURE);
        }
        let owner = thisArg;
        if (!owner) {
          owner = object;
          if (fieldChain.length > 0) {
            owner = lodash.get(object, fieldChain);
          }
        }
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
      return cached[methodPath].apply(thisArg, argList);
    }
  })
}

function wrapMethod(refs, method, opts) {
  if (!lodash.isFunction(method)) return method;
  let {texture, object, objectName, methodName} = opts || {};
  object = lodash.isObject(object) ? object : null;
  let loggingProxy = null;
  let mockingProxy = null;
  let wrapped = method;
  if (isMockingEnabled(texture)) {
    mockingProxy = new MockingInterceptor({
      texture: texture,
      method: wrapped
    });
    wrapped = mockingProxy.capsule;
  }
  if (isLoggingEnabled(texture)) {
    loggingProxy = new LoggingInterceptor({
      texture: texture,
      object: object,
      objectName: objectName,
      method: wrapped,
      methodName: methodName,
      logger: opts.logger || refs.L,
      tracer: opts.tracer || refs.T
    });
    wrapped = loggingProxy.capsule;
  }
  return wrapped;
}

function MockingInterceptor(params) {
  const { texture, method } = params;
  const enabled = isMockingEnabled(texture) && !lodash.isEmpty(texture.mocking.mappings);
  let capsule;
  Object.defineProperty(this, 'capsule', {
    get: function() {
      if (!enabled) return method;
      return capsule = capsule || new Proxy(method, {
        apply: function(target, thisArg, argumentsList) {
          let output = {};
          let generate = getGenerator(texture, thisArg, argumentsList);
          if (generate) {
            try {
              output.result = generate.apply(thisArg, argumentsList);
            } catch (error) {
              output.exception = error;
            }
            if (texture.methodType === 'callback') {
              let pair = extractCallback(argumentsList);
              if (pair.callback) {
                return pair.callback.apply(null, [output.exception].concat(output.result));
              }
            }
            if (texture.methodType === 'promise') {
              if (output.exception) {
                return Promise.reject(output.exception);
              }
              return Promise.resolve(output.result);
            }
            if (output.exception) {
              throw output.exception;
            }
            return output.result;
          } else {
            if (texture.mocking.unmatched === 'exception') {
              let MockNotFoundError = errors.assertConstructor('MockNotFoundError');
              output.exception = new MockNotFoundError('All of selectors are unmatched');
              if (texture.methodType === 'promise') {
                return Promise.reject(output.exception);
              }
              if (texture.methodType === 'callback') {
                let pair = extractCallback(argumentsList);
                if (pair.callback) {
                  return pair.callback(output.exception);
                }
              }
              throw output.exception;
            } else {
              return method.apply(thisArg, argumentsList);
            }
          }
        }
      });
    }
  });
  function getGenerator(texture, thisArg, argumentsList) {
    let generate = null;
    for(const name in texture.mocking.mappings) {
      const rule = texture.mocking.mappings[name];
      if (!lodash.isFunction(rule.selector)) continue;
      if (!lodash.isFunction(rule.generate)) continue;
      if (rule.selector.apply(thisArg, argumentsList)) {
        generate = rule.generate;
        break;
      }
    }
    return generate;
  }
}

function LoggingInterceptor(params={}) {
  const { logger, tracer, preciseThreshold } = params
  const { texture, object, objectName, method, methodName } = params;
  let counter = { promise: 0, callback: 0, general: 0 }
  let pointer = { current: null, actionFlow: null, preciseThreshold }

  assert.ok(lodash.isObject(logger));
  assert.ok(lodash.isObject(tracer));
  assert.ok(lodash.isObject(texture));
  assert.ok(lodash.isFunction(method));

  // pre-processing logging texture
  let methodType = texture.methodType;
  pointer.preciseThreshold = pointer.preciseThreshold || 5;

  function createListener(texture, eventName) {
    const onEventName = 'on' + eventName;
    const onEvent = texture.logging && texture.logging[onEventName];
    if (!isEnabled(onEvent)) return NOOP;
    return function (logState, data, extra) {
      if (lodash.isFunction(onEvent.getRequestId) && eventName === 'Request') {
        let reqId = null;
        if (onEvent.getRequestId === DEFAULT_TEXTURE.logging[onEventName].getRequestId) {
          reqId = onEvent.getRequestId(data);
        } else {
          try {
            reqId = onEvent.getRequestId.call(logState.reqContext, data, extra);
          } catch (fatal) {
            reqId = 'getRequestId-throw-an-error';
          }
        }
        if (reqId) {
          logState.requestId = reqId;
          logState.requestType = 'link';
        } else {
          logState.requestId = chores.getUUID();
          logState.requestType = 'head';
        }
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
        if (onEvent.extractInfo === DEFAULT_TEXTURE.logging[onEventName].extractInfo) {
          msgObj.info = onEvent.extractInfo(data);
        } else {
          try {
            msgObj.info = onEvent.extractInfo.call(logState.reqContext, data, extra);
          } catch (fatal) {
            msgObj.info = {
              event: onEventName,
              errorName: fatal.name,
              errorMessage: fatal.message
            }
          }
        }
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

  const __state__ = { object, method, methodType, counter, pointer }

  let capsule;
  Object.defineProperty(this, 'capsule', {
    get: function() {
      return capsule = capsule || new Proxy(method, {
        apply: function(target, thisArg, argumentsList) {
          const logState = { objectName, methodName, reqContext: {} }
          return callMethod(__state__, argumentsList, logOnEvent, logState);
        }
      });
    }
  })

  this.getState = function() {
    return lodash.cloneDeep(lodash.pick(__state__, [ 'methodType', 'counter', 'pointer' ]));
  }
}

function callMethod(refs, argumentsList, logOnEvent, logState) {
  const { object, method, methodType, counter, pointer } = refs;

  function _detect(argumentsList) {
    let result = null, exception = null, found = false;
    let pair = proxifyCallback(argumentsList, logOnEvent, logState, function() {
      hitMethodType(pointer, counter, 'callback');
    });
    try {
      logOnEvent.Request(logState, pair.parameters);
      result = method.apply(object, pair.parameters);
      if (isPromise(result)) {
        found = true;
        hitMethodType(pointer, counter, 'promise');
        result = Promise.resolve(result).then(function(value) {
          logOnEvent.Success(logState, value);
          return value;
        }).catch(function(error) {
          logOnEvent.Failure(logState, error);
          return Promise.reject(error);
        });
      } else {
        logOnEvent.Success(logState, result);
      }
    } catch (error) {
      exception = error;
      logOnEvent.Failure(logState, exception);
    }
    if (!found) {
      hitMethodType(pointer, counter, 'general');
    }
    // return both result & exception
    return {result, exception};
  }

  function _invoke(argumentsList) {
    let result = undefined, exception = undefined;
    switch(methodType) {
      case 'promise': {
        result = Promise.resolve().then(function() {
          logOnEvent.Request(logState, argumentsList);
          return method.apply(object, argumentsList)
        })
        .then(function(value) {
          logOnEvent.Success(logState, value);
          return value;
        })
        .catch(function(error) {
          logOnEvent.Failure(logState, error);
          return Promise.reject(error);
        })
        break;
      }
      case 'callback': {
        try {
          let pair = proxifyCallback(argumentsList, logOnEvent, logState);
          logOnEvent.Request(logState, pair.parameters);
          result = method.apply(object, pair.parameters);
        } catch (error) {
          exception = error;
          logOnEvent.Failure(logState, exception);
        }
        break;
      }
      default: {
        try {
          logOnEvent.Request(logState, argumentsList);
          result = method.apply(object, argumentsList);
          logOnEvent.Success(logState, result);
        } catch (error) {
          exception = error;
          logOnEvent.Failure(logState, exception);
        }
        break;
      }
    }
    return {result, exception};
  }

  argumentsList = chores.argumentsToArray(argumentsList);

  let output = null;
  if (methodType) {
    pointer.actionFlow = 'explicit';
    output = _invoke(argumentsList);
  } else {
    pointer.actionFlow = 'implicit';
    output = _detect(argumentsList);
    refs.methodType = suggestMethodType(pointer, counter, methodType);
  }
  // an error is occurred
  if (output.exception) {
    throw output.exception;
  }
  return output.result;
}

function hitMethodType(pointer, counter, methodType) {
  if (methodType) {
    if (methodType === 'callback') {
      counter[methodType]++;
    } else {
      if (methodType !== pointer.current && pointer.current) {
        for(let name in counter) {
          counter[name] = 0;
        }
      }
      pointer.current = methodType;
      counter[methodType]++;
    }
  } else {
    counter.total = counter.total || 0;
    counter.total++;
  }
}

function suggestMethodType(pointer, counter, methodType) {
  const threshold = pointer.preciseThreshold || 100;
  let max = 'promise', min = 'general';
  if (counter[max] < counter[min]) {
    let tmp = max; max = min; min = tmp;
  }
  if (counter[max] >= threshold) {
    if (counter['callback'] / counter[max] > 0.7) {
      return 'callback';
    }
    if (counter[min] === 0) {
      return max;
    }
  }
  return methodType;
}

function isPromise(p) {
  return lodash.isObject(p) && lodash.isFunction(p.then);
}

function extractCallback(argumentsList) {
  let r = {};
  r.callback = argumentsList.length > 0 && argumentsList[argumentsList.length - 1] || null;
  if (typeof r.callback === 'function') {
    r.parameters = Array.prototype.slice.call(argumentsList, 0, argumentsList.length - 1);
  } else {
    r.parameters = argumentsList;
    delete r.callback;
  }
  return r;
}

function proxifyCallback(argumentsList, logOnEvent, logState, checker) {
  let pair = extractCallback(argumentsList);
  if (pair.callback) {
    pair.parameters.push(new Proxy(pair.callback, {
      apply: function(target, thisArg, callbackArgs) {
        (typeof checker === 'function') && checker();
        let error = callbackArgs[0];
        if (error) {
          logOnEvent.Failure(logState, error);
        } else {
          logOnEvent.Success(logState, ...Array.prototype.slice.call(callbackArgs, 1));
        }
        return pair.callback.apply(thisArg, callbackArgs);
      }
    }));
  }
  return pair;
}

function isEnabled(section) {
  return section && section.enabled !== false;
}

function isLoggingEnabled(texture) {
  return isEnabled(texture) && isEnabled(texture.logging);
}

function isMockingEnabled(texture) {
  return isEnabled(texture) && isEnabled(texture.mocking);
}

function getTextureByPath({textureOfBean, fieldChain, methodName}) {
  let texture = null;
  if (nodash.isObject(textureOfBean)) {
    let beanToMethod = [];
    if (nodash.isArray(fieldChain) && fieldChain.length > 0) {
      Array.prototype.push.apply(beanToMethod, fieldChain);
    }
    if (methodName) {
      beanToMethod.push(methodName);
    }
    texture = lodash.get(textureOfBean, ['methods'].concat(beanToMethod));
    texture = texture || lodash.get(textureOfBean, ['methods', beanToMethod.join('.')]);
  }
  return propagateEnabled(texture, textureOfBean);
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
  return propagateEnabled(textureOfBean, textureStore);
}

function getTextureOfPlugin({textureStore, pluginCode, gadgetType, gadgetName}) {
  let rootToBean = [];
  if (pluginCode) {
    if (chores.isSpecialPlugin(pluginCode)) {
      rootToBean.push(pluginCode);
    } else {
      rootToBean.push('plugins', pluginCode);
    }
    if (['reducers', 'services', 'triggers'].indexOf(gadgetType) >= 0) {
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
  return propagateEnabled(textureOfBean, textureStore);
}

function propagateEnabled(childTexture, parentTexture) {
  if (parentTexture && parentTexture.enabled === false) {
    childTexture = lodash.defaults(childTexture, {
      enabled: parentTexture.enabled
    })
  }
  return childTexture;
}

const DEFAULT_TEXTURE = {
  logging: {
    onRequest: {
      getRequestId: function(argumentsList) {
        let reqId = undefined;
        if (argumentsList && argumentsList.length > 0) {
          for(let k=(argumentsList.length-1); k>=0; k--) {
            let o = argumentsList[k];
            reqId = o && (o.requestId || o.reqId);
            if (typeof reqId === 'string') break;
          }
        }
        return reqId;
      },
      extractInfo: function(argumentsList) {
        return chores.extractObjectInfo(chores.argumentsToArray(argumentsList));
      },
      template: "Req[#{requestId}] #{objectName}.#{methodName}() #{requestType}"
    },
    onSuccess: {
      extractInfo: function(result) {
        return chores.extractObjectInfo(result);
      },
      template: "Req[#{requestId}] #{objectName}.#{methodName}() completed"
    },
    onFailure: {
      extractInfo: function(error) {
        error = error || { code: 'null' };
        return {
          errorName: error.name,
          errorCode: error.code,
          errorMessage: error.message
        }
      },
      template: "Req[#{requestId}] #{objectName}.#{methodName}() failed"
    }
  }
}
