'use strict';

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

function Super() {
  Service.apply(this, arguments);
  this.PI = 3.14159;

  let capsule = null;
  Object.defineProperty(this, 'capsule', {
    get: function() {
      return capsule;
    },
    set: function(ref) {
      if (capsule === null) {
        capsule = ref;
      }
    }
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

s.area(1);
