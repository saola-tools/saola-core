"use strict";

const lab = require("..");
const FRWK = lab.getFramework();
const lodash = FRWK.require("lodash");
const chores = FRWK.require("chores");
const assert = require("chai").assert;
const BeanProxy = require(lab.getFrameworkModule("utils/proxy"));

describe("tdd:lib:utils:proxy", function() {
  describe("BeanProxy ~ normal proxy", function() {
    let BeanConstructor = function() {
      this.factor = 1.1;
      this.calc = function(cost) {
        return cost * this.factor;
      };
    };

    it("proxy with empty handler should be tranparent", function() {
      let beanObject = new BeanConstructor();
      let emptyProxy = new BeanProxy(beanObject, {});
      assert.instanceOf(emptyProxy, BeanConstructor);
      assert.equal(emptyProxy.factor, 1.1);
      assert.isFunction(emptyProxy.calc);
      assert.equal(emptyProxy.calc(2), 2.2);
      assert.isUndefined(emptyProxy.unknown);
    });

    it("should work like a normal proxy for constructor", function() {
      let wrappedConstructor = new BeanProxy(BeanConstructor, {
        construct (target, argumentsList, newTarget) {
          assert.equal(target, BeanConstructor);
          assert.equal(newTarget, wrappedConstructor);
          assert.isArray(argumentsList);
          return {
            bean: new target(...argumentsList),
            args: argumentsList
          };
        }
      });
      let beanObject = new wrappedConstructor(1, "hello", true);
      assert.instanceOf(beanObject.bean, BeanConstructor);
      assert.deepEqual(beanObject.args, [1, "hello", true]);
    });

    it("should work like a normal proxy for object", function() {
      let beanObject = new BeanConstructor();
      let beanProxy = new BeanProxy(beanObject, {
        get (target, property, receiver) {
          assert.equal(target, beanObject);
          assert.equal(receiver, beanProxy);
          if (property in target) {
            return target[property];
          }
          return property + " not found";
        }
      });
      assert.isNumber(beanProxy.factor);
      assert.isFunction(beanProxy.calc);
      assert.equal(beanProxy.info, "info not found");
    });

    it("should work like a normal proxy for function", function() {
      let simpleCalc = function(amount, unit) {
        let factor = this && this.factor || 1;
        return amount * unit * factor;
      };
      let wrappedCalc = new BeanProxy(simpleCalc, {
        apply (target, thisArg, argumentsList) {
          assert.equal(target, simpleCalc);
          assert.isArray(argumentsList);
          return {
            result: target.apply(thisArg, argumentsList),
            thisArg: thisArg
          };
        }
      });
      let object = {
        factor: 1.1,
        calc: wrappedCalc
      };
      let output = object.calc(2, 100);
      assert.equal(output.thisArg, object);
      assert.equal(Math.round(output.result), 220);
    });
  });

  describe("BeanProxy ~ wrapped proxy", function() {
    let BeanConstructor = function() {
      this.factor = 1.1;
      this.calc = function(cost) {
        return cost * this.factor;
      };
      this.product = {
        attrs: {
          price: {
            discount: 0.1,
            tax: 0.2,
            calc: function(unit, amount) {
              amount = amount || 1;
              return amount * unit * (1-this.discount) * (1+this.tax);
            },
            tags: ["tax", "discount"]
          }
        }
      };
    };
    it("should create a chain of wrapped proxies using internal wrap() method (1)", function() {
      let beanObject = new BeanConstructor();
      let beanProxy = new BeanProxy(beanObject, {
        get (target, property, receiver) {
          let node = target[property];
          if (lodash.isFunction(node) || lodash.isObject(node)) {
            return this.wrap(node);
          }
          return node;
        },
        apply (target, thisArg, argumentsList) {
          assert.deepEqual(this.path, ["product", "attrs", "price", "calc"]);
          assert.deepInclude(thisArg, {"discount": 0.1, "tax": 0.2, "tags": ["tax", "discount"]});
          return target.apply(thisArg, argumentsList);
        }
      });
      assert.isObject(beanProxy.product);
      assert.notEqual(beanProxy.product, beanProxy.product);
      assert.isUndefined(beanProxy.product.unknown);
      assert.isObject(beanProxy.product.attrs);
      assert.notEqual(beanProxy.product.attrs, beanProxy.product.attrs);
      assert.isObject(beanProxy.product.attrs.price);
      assert.isArray(beanProxy.product.attrs.price.tags);
      assert.notEqual(beanProxy.product.attrs.price.tags, beanProxy.product.attrs.price.tags);
      assert.isNumber(beanProxy.product.attrs.price.discount);
      assert.isFunction(beanProxy.product.attrs.price.calc);
      assert.equal(beanProxy.product.attrs.price.calc(100), 108);
    });
    it("should create a chain of wrapped proxies using internal wrap() method (2)", function() {
      let beanObject = new BeanConstructor();
      let beanProxy = new BeanProxy(beanObject, {
        get (target, property, receiver) {
          let parent = beanObject;
          if (!lodash.isEmpty(this.path)) {
            parent = lodash.get(parent, this.path);
          }
          let node = parent[property];
          if (lodash.isFunction(node)) {
            return this.wrap(node);
          }
          if (lodash.isObject(node) && !lodash.isArray(node)) {
            return this.wrap();
          }
          return node;
        },
        apply (target, thisArg, argumentsList) {
          assert.deepEqual(this.path, ["product", "attrs", "price", "calc"]);
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
    it("should access hierarchical proxy-wrapped descendants correctly", function() {
      let BeanConstructor = function() {
        this.factor = 1.1;
        this.calc = function(unit, amount) {
          return this.factor * this.product.attrs.price.calc(unit, amount);
        };
        this.product = {
          attrs: {
            price: {
              discount: 0.1,
              tax: 0.2,
              calc: function(unit, amount) {
                amount = amount || 1;
                return amount * unit * (1-this.discount) * (1+this.tax);
              },
              tags: ["tax", "discount"]
            }
          }
        };
      };
      let requestTags = [];
      let beanObject = new BeanConstructor();
      let beanProxy = new BeanProxy(beanObject, {
        get (target, property, receiver) {
          let node = target[property];
          if (lodash.isFunction(node) || lodash.isObject(node)) {
            return this.wrap(node);
          }
          return node;
        },
        apply (target, thisArg, argumentsList) {
          requestTags.push(this.path);
          return target.apply(thisArg, argumentsList);
        }
      });
      assert.equal(lodash.round(beanProxy.calc(100, 1), 5), 118.8);
      assert.deepEqual(requestTags, [["calc"], ["product", "attrs", "price", "calc"]]);
    });
    it("should access hierarchical descendants that contain a sequence of method calls", function() {
      let BeanConstructor = function() {
        this.factor = 1.1;
        this.calc = function(unit, amount) {
          return this.factor * this.product.attrs.price.getInstance().calc(unit, amount);
        };
        this.product = {
          attrs: {
            price: {
              getInstance: function() {
                return {
                  discount: 0.1,
                  tax: 0.2,
                  calc: function(unit, amount) {
                    amount = amount || 1;
                    return amount * unit * (1-this.discount) * (1+this.tax);
                  },
                  tags: ["tax", "discount"]
                };
              }
            }
          }
        };
      };
      let requestTags = [];
      let beanObject = new BeanConstructor();
      let beanProxy = new BeanProxy(beanObject, {
        get (target, property, receiver) {
          let node = target[property];
          if (lodash.isFunction(node) || lodash.isObject(node)) {
            return this.wrap(node);
          }
          return node;
        },
        apply (target, thisArg, argumentsList) {
          requestTags.push(this.path);
          let node = target.apply(thisArg, argumentsList);
          if (lodash.isFunction(node) || lodash.isObject(node)) {
            return this.wrap(node);
          }
          return node;
        }
      });
      assert.equal(lodash.round(beanProxy.calc(100, 1), 5), 118.8);
      false && console.info(JSON.stringify(requestTags));
      assert.deepEqual(requestTags, [
        ["calc"],
        ["product", "attrs", "price", "getInstance"],
        ["product", "attrs", "price", "getInstance", "calc"],
      ]);
    });

    it("should provide a solution to cache the hierarchical structure", function() {
      let BeanConstructor = function() {
        this.factor = 1.1;
        this.calc = function(unit, amount) {
          return this.factor * this.product.attrs.price.getInstance().calc(unit, amount);
        };
        this.self = function() {
          return this;
        };
        this.product = {
          attrs: {
            price: {
              getInstance: function() {
                return {
                  discount: 0.1,
                  tax: 0.2,
                  calc: function(unit, amount) {
                    amount = amount || 1;
                    return amount * unit * (1-this.discount) * (1+this.tax);
                  },
                  tags: ["tax", "discount"]
                };
              }
            }
          },
          tags: ["product", "price"]
        };
        this.product.self = function() {
          return this;
        };
      };
      let beanCached = {};
      let beanObject = new BeanConstructor();
      let beanProxy = new BeanProxy(beanObject, {
        get (target, property, receiver) {
          let node = target[property];
          if (chores.isOwnOrInheritedProperty(target, property)) {
            if (lodash.isFunction(node) || lodash.isObject(node)) {
              if (this.slug) {
                beanCached[this.slug] = beanCached[this.slug] || this.wrap(node);
                return beanCached[this.slug];
              }
              return this.wrap(node);
            }
          }
          return node;
        },
        apply (target, thisArg, argumentsList) {
          let node = target.apply(thisArg, argumentsList);
          if (node === thisArg) return node;
          if (lodash.isFunction(node) || lodash.isObject(node)) {
            return this.wrap(node);
          }
          return node;
        }
      });
      assert.equal(beanProxy.product, beanProxy.product);
      assert.equal(beanProxy.product.attrs, beanProxy.product.attrs);
      assert.equal(beanProxy.product.tags, beanProxy.product.tags);
      assert.equal(beanProxy.self(), beanProxy);
      assert.equal(beanProxy.product.self(), beanProxy.product);
      assert.equal(beanProxy.product.self().attrs, beanProxy.product.attrs);
    });
  });

  describe("BeanProxy ~ with lodash", function() {
    let BeanConstructor = function() {
      this.factor = 1.1;
      this.calc = function(unit, amount) {
        return this.factor * this.product.attrs.price.getInstance().calc(unit, amount);
      };
      this.product = {
        attrs: {
          price: {
            getInstance: function() {
              return {
                instance: {
                  discount: 0.1,
                  tax: 0.2,
                  calc: function(unit, amount) {
                    amount = amount || 1;
                    return amount * unit * (1-this.discount) * (1+this.tax);
                  },
                  tags: ["tax", "discount"]
                }
              };
            }
          },
          units: [
            { label: "USD", rate: 22150 },
            { label: "EUR", rate: 28450 }
          ]
        }
      };
    };
    let beanObject = new BeanConstructor();
    let beanProxy = new BeanProxy(beanObject, {
      get (target, property, receiver) {
        let node = target[property];
        if (lodash.isFunction(node) || lodash.isObject(node)) {
          return this.wrap(node);
        }
        return node;
      },
      apply (target, thisArg, argumentsList) {
        let node = target.apply(thisArg, argumentsList);
        if (lodash.isFunction(node) || lodash.isObject(node)) {
          return this.wrap(node);
        }
        return node;
      }
    });
    let safeProxy = new BeanProxy(beanObject, {
      get (target, property, receiver) {
        let node = target[property];
        if (chores.isOwnOrInheritedProperty(target, property)) {
          if (lodash.isFunction(node) || lodash.isObject(node)) {
            return this.wrap(node);
          }
        }
        return node;
      },
      apply (target, thisArg, argumentsList) {
        let node = target.apply(thisArg, argumentsList);
        if (lodash.isFunction(node) || lodash.isObject(node)) {
          return this.wrap(node);
        }
        return node;
      }
    });

    /*
    /node_modules/lodash/lodash.js:6400
          proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto;
                                                    ^
    TypeError: 'get' on proxy: property 'prototype' is a read-only and non-configurable
    data property on the proxy target but the proxy did not return its actual value
    (expected '#<Object>' but got '[object Object]')
    at isPrototype (/node_modules/lodash/lodash.js:6400:53)
    */
    it("should not conflict with lodash collection methods (merge, assign, defaults) - object", function() {
      assert.throw(function() {
        lodash.merge({}, beanProxy.product.attrs.price.getInstance());
      }, TypeError);
      assert.doesNotThrow(function() {
        lodash.merge({}, safeProxy.product.attrs.price.getInstance());
      });
    });

    it("should not conflict with lodash collection methods (merge, assign, defaults) - array", function() {
      assert.throw(function() {
        let rates = lodash.map(beanProxy.product.attrs.units, function(unit) {
          return lodash.assign({}, unit);
        });
      }, TypeError);
      assert.doesNotThrow(function() {
        let rates = lodash.map(safeProxy.product.attrs.units, function(unit) {
          return lodash.assign({}, unit);
        });
      });
    });
  });
});
