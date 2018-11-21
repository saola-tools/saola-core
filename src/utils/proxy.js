'use strict';

const toPath = require('lodash/toPath');

// names of the traps that can be registered with ES6's Proxy object
const trapNames = [
  'getPrototypeOf',
  'setPrototypeOf',
  'isExtensible',
  'preventExtensions',
  'construct',
  'apply',
  'ownKeys',
  'get',
  'set',
  'has',
  'enumerate',
  'defineProperty',
  'deleteProperty',
  'getOwnPropertyDescriptor',
]

// a list of paramer indexes that indicate that the a recieves a key at that parameter
// this information will be used to update the path accordingly
const keys = {
  get: 1,
  set: 1,
  has: 1,
  enumerate: 1,
  defineProperty: 1,
  deleteProperty: 1,
  getOwnPropertyDescriptor: 1,
}

function extractPath(options) {
  return options !== undefined && typeof options.path !== 'undefined' ? toPath(options.path) : [];
}

function BeanProxy(rootTarget, handler, options) {
  function createProxy(target, path) {
    // avoid creating a new object between two traps
    const context = { rootTarget, path };
    const realTraps = {};
    for (const trapName of trapNames) {
      const keyIndex = keys[trapName], trap = handler[trapName];
      if (typeof trap !== 'undefined') {
        if (typeof keyIndex !== 'undefined') {
          realTraps[trapName] = function () {
            const key = arguments[keyIndex];
            // update context for this trap
            context.nest = function (nestedTarget) {
              if (nestedTarget === undefined) {
                nestedTarget = rootTarget;
              }
              return createProxy(nestedTarget, [].concat(path, key)); 
            }
            return trap.apply(context, arguments);
          }
        } else {
          realTraps[trapName] = function () {
            // update context for this trap
            context.nest = function (nestedTarget) {
              if (nestedTarget === undefined) {
                nestedTarget = {};
              }
              return createProxy(nestedTarget, path);
            }
            return trap.apply(context, arguments);
          }
        }
      }
    }
    return new Proxy(target, realTraps);
  }
  return createProxy(rootTarget, extractPath(options));
}

module.exports = BeanProxy;
