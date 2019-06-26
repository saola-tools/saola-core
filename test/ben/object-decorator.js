'use strict';

var lab = require('..');
var Devebot = lab.getDevebot();
var chores = Devebot.require('chores');
var lodash = Devebot.require('lodash');
var assert = require('chai').assert;
var Benchmark = require('benchmark');

function execSuite(obj) {
  var suite = new Benchmark.Suite('logolite', {});

  // add listeners
  suite
    .on('start', function() {
      console.log('=> Benchmark started ...');
    })
    .on('cycle', function(event) {
      console.log(' - ' + String(event.target));
    })
    .on('complete', function() {
      console.log('+> Fastest is ' + this.filter('fastest').map('name'));
    });

  // add tests
  suite
    .add('console.log()', {
      'defer': true,
      'fn': function(deferred) {
        setTimeout(function() {
          deferred.resolve();
        }, 70)
      }
    });

  suite
    .add('logolite.logger()', {
      'defer': true,
      'fn': function(deferred) {
        setTimeout(function() {
          deferred.resolve();
        }, 100)
      }
    });

  suite.run({ 'async': true });
}

execSuite({});