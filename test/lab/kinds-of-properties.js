'use strict';

// ==================================================== Example

var lab = require('../index');
var Devebot = lab.getDevebot();
var chores = Devebot.require('chores');
var util = require('util');

function Service(params) {
  this.PI = 3.14;

  this.area = function(radius) {
    let s = this.PI * radius * radius;
    console.log('Area: %s', s);
    console.log('PI: %s', this.capsule.PI);
    return s;
  }
}

Service.prototype.calc = function() {}

function Super() {
  Service.apply(this, arguments);
  this.PI = 3.14159;

  let capsule = null;
  Object.defineProperty(this, 'capsule', {
    get: function() {
      return capsule;
    },
    set: function(ref) {
      capsule = capsule || ref;
    },
    // enumerable: true
  })
}

util.inherits(Super, Service);

function Wrapper() {
  return new Proxy(Super, {
    construct: function(target, argumentsList, newTarget) {
      return new target(...argumentsList);
    }
  });
}

var s = new (Wrapper())();
s.capsule = s;

// ================================================

// for (var propName in s) {
//   console.log(' - %s', propName);
// }

// ['PI', 'area', 'calc', 'capsule', 'valueOf', 'toString', 'length', 'prototype'].forEach(function(name) {
//   console.log('hasOwnProperty("%s"): %s', name, s.hasOwnProperty(name));
// });


// console.log('chores: %s', chores.is);
console.log('Object.keys(): %s', Object.keys(s));
console.log('Object.getOwnPropertyNames(): %s', Object.getOwnPropertyNames(s));

// -----------------------------------------------

/** Return an array with the names of the inherited enumerable properties of obj */
function inheritedEnumerablePropertyNames(obj) {
  var result = [];
  for (var propName in obj) {
      result.push(propName);
  }
  return result;
}

/** Return an array with the names of the inherited properties of obj */
function inheritedPropertyNames(obj) {
  if ((typeof obj) !== "object") { // null is not a problem
      throw new Error("Only objects are allowed");
  }
  var props = {};
  while(obj) {
      Object.getOwnPropertyNames(obj).forEach(function(p) {
          props[p] = true;
      });
      obj = Object.getPrototypeOf(obj);
  }
  return Object.getOwnPropertyNames(props);
}

console.log('inheritedEnumerablePropertyNames: ', inheritedEnumerablePropertyNames(s));
console.log('inheritedPropertyNames: ', inheritedPropertyNames(s));

var ss = inheritedPropertyNames(s).filter(function(prop) {
  return chores.isOwnOrInheritedProperty(s, prop);
})
console.log('isOwnOrInheritedProperty: ', ss);

// -----------------------------------------------------
