'use strict';

var lodash = require('lodash');
var debugx = require('../utils/debug.js')('devebot:schemaValidator');

var Validator = require('jsonschema').Validator;
var validator = new Validator();

function SchemaValidator(params) {
  var self = this;
  params = params || {};
  debugx.enabled && debugx(' + constructor start ...');

  self.validate = function(object, schema) {
  	return validator.validate(object, schema);
  }

  debugx.enabled && debugx(' - constructor has finished');
}

SchemaValidator.argumentSchema = {
  "id": "schemaValidator",
  "type": "object",
  "properties": {}
};

module.exports = SchemaValidator;