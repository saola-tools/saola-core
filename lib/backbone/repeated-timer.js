'use strict';

var lodash = require('lodash');
var events = require('events');
var util = require('util');

var LogAdapter = require('logolite').LogAdapter;
var LogTracer = require('logolite').LogTracer;

var LX = LogAdapter.getLogger({ scope: 'devebot:RepeatedTimer' });

var RepeatedTimer = function(kwargs) {
  events.EventEmitter.call(this);

  kwargs = kwargs || {};
  kwargs.timerId = kwargs.timerId || LogTracer.getLogID();

  var timerTrail = LogTracer.ROOT.branch({ key:'timerId', value:kwargs.timerId });

  LX.isEnabledFor('trace') && LX.log('trace', timerTrail.add({
    message: 'RepeatedTimer.new()'
  }).toString());

  var self = this;
  var config = lodash.pick(kwargs, ['target', 'period', 'offset', 'total', 'activated', 'name']);

  config.target = config.target || function() {};

  if (!lodash.isFunction(config.target)) {
    throw new Error('target must be a function');
  }

  config.total = config.total || 0;
  config.period = standardizeInt(MIN_PERIOD, config.period || 1000);
  config.offset = standardizeInt(MIN_OFFSET, config.offset || 0);

  var taskHandler = null;
  var taskCounter = 0;

  var taskWrapper = function() {
    taskCounter++;
    if (0 == config.total || taskCounter <= config.total) {
      config.target.call(self);
    } else {
      self.stop();
    }
  };

  var startTime, finishTime;

  this.start = function() {
    LX.isEnabledFor('trace') && LX.log('trace', timerTrail.add({
      message: 'RepeatedTimer daemon is starting'
    }).toString());
    this.emit('started', {});
    return this.startInSilent();
  }

  this.startInSilent = function() {
    if (0 < config.total && config.total < taskCounter) {
      return this;
    }
    if (!taskHandler) {
      var taskFunction = taskWrapper;
      if (config.offset > 0) {
        taskFunction = function() {
          setTimeout(taskWrapper, getRandomInt(0, config.offset));
        };
      }
      taskHandler = setInterval(taskFunction, config.period);
      startTime = new Date();
    }
    return this;
  }

  this.stop = function() {
    LX.isEnabledFor('trace') && LX.log('trace', timerTrail.add({
      message: 'RepeatedTimer daemon will be stopped'
    }).toString());
    this.emit('stopped', {});
    return this.stopInSilent();
  }

  this.stopInSilent = function() {
    if (taskHandler) {
      clearInterval(taskHandler);
      taskHandler = null;
      finishTime = new Date();
    }
    return this;
  }

  this.isRunning = function() {
    return (taskHandler != null);
  }

  this.isStopped = function() {
    return (taskHandler == null);
  }

  if (config.activated) this.start();

  Object.defineProperties(this, {
    startTime: {
      get: function() { return startTime }
    },
    finishTime: {
      get: function() { return finishTime }
    },
    uptime: {
      get: function() { return (new Date() - startTime) }
    }
  });

  LX.isEnabledFor('trace') && LX.log('trace', timerTrail.add({
    message: 'RepeatedTimer.new() end!'
  }).toString());
}

util.inherits(RepeatedTimer, events.EventEmitter);

function standardizeInt(min, number) {
  return (number > min) ? number : min;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

var MIN_PERIOD = 10;
var MIN_OFFSET = 0;

module.exports = RepeatedTimer;