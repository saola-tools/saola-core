'use strict';

const toPath = require('lodash/toPath');

const nameIndexOf = {
  get: 1,
  set: 1,
  has: 1,
  defineProperty: 1,
  deleteProperty: 1,
  enumerate: 1,
  getOwnPropertyDescriptor: 1,
}

const trapNames = [
  'apply',
  'construct',
  'getPrototypeOf',
  'setPrototypeOf',
  'isExtensible',
  'preventExtensions',
  'ownKeys',
].concat(Object.keys(nameIndexOf))

function BeanProxy(rootTarget, handler, options) {
  function createProxy(target, path) {
    const context = { root: rootTarget, path };
    const namespace = chainify(path);
    const wrappedHandler = {};
    for (const trapName of trapNames) {
      const trap = handler[trapName];
      if (isFunction(trap)) {
        const nameIndex = nameIndexOf[trapName];
        wrappedHandler[trapName] = function () {
          const name = isNumber(nameIndex) ? arguments[nameIndex] : null;
          context.slug = namespace;
          if (isString(name)) {
            context.slug = namespace && (namespace + '.' + name) || name;
          }
          context.wrap = function (wrappedTarget) {
            if (isUndefined(wrappedTarget)) {
              wrappedTarget = isString(name) ? rootTarget : {};
            }
            const wrappedPath = isString(name) ? [].concat(path, name) : path;
            return createProxy(wrappedTarget, wrappedPath);
          }
          return trap.apply(context, arguments);
        }
      }
    }
    return new Proxy(target, wrappedHandler);
  }
  return createProxy(rootTarget, extractPath(options));
}

module.exports = BeanProxy;

function chainify(path) {
  if (isString(path)) return path;
  if (Array.isArray(path)) return path.join('.');
  return null;
}

function extractPath(options) {
  return options && options.path ? toPath(options.path) : [];
}

function isFunction(f) {
  return (typeof f === 'function');
}

function isNumber(n) {
  return (typeof n === 'number');
}

function isString(s) {
  return (typeof s === 'string');
}

function isUndefined(v) {
  return (typeof v === 'undefined');
}
