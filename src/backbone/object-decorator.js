'use strict';

const lodash = require('lodash');
const path = require('path');
const chores = require('../utils/chores');
const constx = require('../utils/constx');
const loader = require('../utils/loader');
const blockRef = chores.getBlockRef(__filename);

function ObjectDecorator(params={}) {
  let loggingFactory = params.loggingFactory.branch(blockRef);
  let L = loggingFactory.getLogger();
  let T = loggingFactory.getTracer();

  this.wrapBean = function(bean, opts) {
    if (!lodash.isObject(bean)) return bean;
    opts = opts || {};
    let self = this;
    return self.wrapMethodsOf(bean, opts);
  }

  this.wrapMethodsOf = function(object, opts) {
    let self = this;
    if (lodash.isObject(object)) {
      opts = opts || {};
      for(let name in object) {
        if(lodash.isFunction(object[name])) {
          object[name] = self.wrapMethod(object[name], {
            object: object,
            objectName: opts.objectName,
            methodName: name
          });
        }
      }
    }
    return object;
  }

  this.wrapMethod = function(method, opts) {
    if (!lodash.isFunction(method)) return method;
    let object = opts && lodash.isObject(opts.object) && opts.object || null;
    return function() {
      return method.apply(object, arguments);
    }
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
