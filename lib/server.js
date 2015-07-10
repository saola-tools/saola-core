'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');

var CommandController = require('./controllers/command-controller.js');
var logger = require('./utils/logger.js');

var NODE_ENV = process.env.NODE_DEVEBOT_ENV || process.env.NODE_ENV;

function init(params) {
  // init the default parameters
  params = params || {};

  // Create our Express application
  var app = express();
  
  app.use(session({ 
    secret: '5upersecr3tk3yf0rd3v3b0t',
    saveUninitialized: true,
    resave: true
  }));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  
  app.use('*', function(req, res, next) {
    if (NODE_ENV && NODE_ENV != 'production') {
      process.nextTick(function() {
        logger.trace('=@ devebot service receives a new request:');
        logger.trace(' - Request protocol: ' + req.protocol);
        logger.trace(' - Request host: ' + req.hostname);
        logger.trace(' - Request port: ' + req.port);
        logger.trace(' - Request body: ' + JSON.stringify(req.body));
        logger.trace(' - Invoker User-Agent: ' + req.headers['user-agent']);
      });
   }
   next();
  });
  
  // Create commandController object
  var commandController = CommandController(params);
  
  // Create our Express router
  var router = express.Router();
  router.route('/devebot/clidef').get(commandController.getDefinition);
  router.route('/devebot/runner').post(commandController.postCommand);
  app.use(router);
  
  return app;
};

module.exports = init;