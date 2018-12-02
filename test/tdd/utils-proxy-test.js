'use strict';

var lab = require('..');
var Devebot = lab.getDevebot();
var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var loader = Devebot.require('loader');
var pinbug = Devebot.require('pinbug')('tdd:devebot:utils:proxy');
var assert = require('chai').assert;
var BeanProxy = require(lab.getDevebotModule('utils/proxy'));

describe('tdd:devebot:utils:proxy', function() {

  describe('BeanProxy ~ normal proxy', function() {
    var BeanConstructor = function() {
      this.factor = 1.1;
      this.calc = function(cost) {
        return cost * this.factor;
      }
    }

    it('proxy with empty handler should be tranparent', function() {
      var beanObject = new BeanConstructor();
      var emptyProxy = new BeanProxy(beanObject, {});
      assert.instanceOf(emptyProxy, BeanConstructor);
      assert.equal(emptyProxy.factor, 1.1);
      assert.isFunction(emptyProxy.calc);
      assert.equal(emptyProxy.calc(2), 2.2);
      assert.isUndefined(emptyProxy.unknown);
    });

    it('should work like a normal proxy for constructor', function() {
      var wrappedConstructor = new BeanProxy(BeanConstructor, {
        construct(target, argumentsList, newTarget) {
          assert.equal(target, BeanConstructor);
          assert.equal(newTarget, wrappedConstructor);
          assert.isArray(argumentsList);
          return {
            bean: new target(...argumentsList),
            args: argumentsList
          }
        }
      });
      var beanObject = new wrappedConstructor(1, 'hello', true);
      assert.instanceOf(beanObject.bean, BeanConstructor);
      assert.deepEqual(beanObject.args, [1, 'hello', true]);
    });

    it('should work like a normal proxy for object', function() {
      var beanObject = new BeanConstructor();
      var beanProxy = new BeanProxy(beanObject, {
        get(target, property, receiver) {
          assert.equal(target, beanObject);
          assert.equal(receiver, beanProxy);
          if (property in target) {
            return target[property];
          }
          return property + ' not found';
        }
      });
      assert.isNumber(beanProxy.factor);
      assert.isFunction(beanProxy.calc);
      assert.equal(beanProxy.info, 'info not found');
    });

    it('should work like a normal proxy for function', function() {
      var simpleCalc = function(amount, unit) {
        var factor = this && this.factor || 1;
        return amount * unit * factor;
      }
      var wrappedCalc = new BeanProxy(simpleCalc, {
        apply(target, thisArg, argumentsList) {
          assert.equal(target, simpleCalc);
          assert.isArray(argumentsList);
          return {
            result: target.apply(thisArg, argumentsList),
            thisArg: thisArg
          }
        }
      });
      var object = {
        factor: 1.1,
        calc: wrappedCalc
      }
      var output = object.calc(2, 100);
      assert.equal(output.thisArg, object);
      assert.equal(Math.round(output.result), 220);
    });
  });

  describe('BeanProxy ~ nested proxy', function() {
    var BeanConstructor = function() {
      this.factor = 1.1;
      this.calc = function(cost) {
        return cost * this.factor;
      }
      this.product = {
        attrs: {
          price: {
            discount: 0.1,
            tax: 0.2,
            calc: function(unit, amount) {
              amount = amount || 1;
              return amount * unit * (1-this.discount) * (1+this.tax);
            },
            tags: ['tax', 'discount']
          }
        }
      }
    }
    it('should create a chain of nested proxies using internal nest() method (1)', function() {
      var beanObject = new BeanConstructor();
      var beanProxy = new BeanProxy(beanObject, {
        get(target, property, receiver) {
          let node = target[property];
          if (lodash.isFunction(node) || lodash.isObject(node)) {
            return this.nest(node);
          }
          return node;
        },
        apply(target, thisArg, argumentsList) {
          assert.deepEqual(this.path, ["product","attrs","price","calc"]);
          assert.deepInclude(thisArg, {"discount":0.1,"tax":0.2,"tags":["tax","discount"]});
          return target.apply(thisArg, argumentsList);
        }
      });
      assert.isObject(beanProxy.product);
      assert.isUndefined(beanProxy.product.unknown);
      assert.isObject(beanProxy.product.attrs);
      assert.isObject(beanProxy.product.attrs.price);
      assert.isArray(beanProxy.product.attrs.price.tags);
      assert.isNumber(beanProxy.product.attrs.price.discount);
      assert.isFunction(beanProxy.product.attrs.price.calc);
      assert.equal(beanProxy.product.attrs.price.calc(100), 108);
    });
    it('should create a chain of nested proxies using internal nest() method (2)', function() {
      var beanObject = new BeanConstructor();
      var beanProxy = new BeanProxy(beanObject, {
        get(target, property, receiver) {
          let parent = beanObject;
          if (!lodash.isEmpty(this.path)) {
            parent = lodash.get(parent, this.path);
          }
          let node = parent[property];
          if (lodash.isFunction(node)) {
            return this.nest(node);
          }
          if (lodash.isObject(node) && !lodash.isArray(node)) {
            return this.nest();
          }
          return node;
        },
        apply(target, thisArg, argumentsList) {
          assert.deepEqual(this.path, ["product","attrs","price","calc"]);
          assert.isArray(thisArg.tags);
          assert.isNumber(thisArg.discount);
          assert.isNumber(thisArg.tax);
          assert.isFunction(thisArg.calc);
          assert.notEqual(thisArg.calc, target);
          return target.apply(thisArg, argumentsList);
        }
      });
      assert.isObject(beanProxy.product);
      assert.isUndefined(beanProxy.product.unknown);
      assert.isObject(beanProxy.product.attrs);
      assert.isObject(beanProxy.product.attrs.price);
      assert.isArray(beanProxy.product.attrs.price.tags);
      assert.isNumber(beanProxy.product.attrs.price.discount);
      assert.isFunction(beanProxy.product.attrs.price.calc);
      assert.equal(beanProxy.product.attrs.price.calc(100), 108);
    });
    it('should access hierarchical proxy-wrapped descendants correctly', function() {
      var BeanConstructor = function() {
        this.factor = 1.1;
        this.calc = function(unit, amount) {
          return this.factor * this.product.attrs.price.calc(unit, amount);
        }
        this.product = {
          attrs: {
            price: {
              discount: 0.1,
              tax: 0.2,
              calc: function(unit, amount) {
                amount = amount || 1;
                return amount * unit * (1-this.discount) * (1+this.tax);
              },
              tags: ['tax', 'discount']
            }
          }
        }
      }
      var requestTags = [];
      var beanObject = new BeanConstructor();
      var beanProxy = new BeanProxy(beanObject, {
        get(target, property, receiver) {
          let node = target[property];
          if (lodash.isFunction(node) || lodash.isObject(node)) {
            return this.nest(node);
          }
          return node;
        },
        apply(target, thisArg, argumentsList) {
          requestTags.push(this.path);
          return target.apply(thisArg, argumentsList);
        }
      });
      assert.equal(lodash.round(beanProxy.calc(100, 1), 5), 118.8);
      assert.deepEqual(requestTags, [["calc"],["product","attrs","price","calc"]]);
    });
  });
});
