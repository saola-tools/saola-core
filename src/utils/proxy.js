'use strict';

const toPath = require('lodash/toPath');

// a list of paramer indexes that indicate that the a recieves a name at that parameter
// this information will be used to update the path accordingly
const nameIndexOf = {
  get: 1,
  set: 1,
  has: 1,
  defineProperty: 1,
  deleteProperty: 1,
  enumerate: 1,
  getOwnPropertyDescriptor: 1,
}

// names of the traps that can be registered with ES6's Proxy object
const trapNames = [
  'getPrototypeOf',
  'setPrototypeOf',
  'isExtensible',
  'preventExtensions',
  'construct',
  'apply',
  'ownKeys'
].concat(Object.keys(nameIndexOf))

function extractPath(options) {
  return options !== undefined && typeof options.path !== 'undefined' ? toPath(options.path) : [];
}

function BeanProxy(rootTarget, handler, options) {
  function createProxy(target, path) {
    // avoid creating a new object between two traps
    const context = { rootTarget, path };
    const realTraps = {};
    for (const trapName of trapNames) {
      const nameIndex = nameIndexOf[trapName], trap = handler[trapName];
      if (isFunction(trap)) {
        realTraps[trapName] = function () {
          const name = isNumber(nameIndex) ? arguments[nameIndex] : null;
          // update context for this trap
          context.nest = function (nestedTarget) {
            if (nestedTarget === undefined) {
              nestedTarget = isString(name) ? rootTarget : {};
            }
            const nestedPath = isString(name) ? [].concat(path, name) : path;
            return createProxy(nestedTarget, nestedPath);
          }
          return trap.apply(context, arguments);
        }
      }
    }
    return new Proxy(target, realTraps);
  }
  return createProxy(rootTarget, extractPath(options));
}

module.exports = BeanProxy;

function isFunction(f) {
  return (typeof f === 'function');
}

function isNumber(n) {
  return (typeof n === 'number');
}

function isString(s) {
  return (typeof s === 'string');
}
