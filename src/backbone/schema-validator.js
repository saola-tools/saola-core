'use strict';

const lodash = require('lodash');
const chores = require('../utils/chores');
const blockRef = chores.getBlockRef(__filename);

function SchemaValidator(params={}) {
  const loggingFactory = params.loggingFactory.branch(blockRef);
  const L = loggingFactory.getLogger();
  const T = loggingFactory.getTracer();
  let validator;

  L.has('silly') && L.log('silly', T.toMessage({
    tags: [ blockRef, 'constructor-begin' ],
    text: ' + constructor start ...'
  }));

  this.validate = function(object, schema) {
    validator = validator || chores.getValidator();
    const result = validator.validate(object, schema);
    if (typeof result.ok === 'boolean') {
      result.valid = result.ok;
    }
    return result;
  }

  L.has('silly') && L.log('silly', T.toMessage({
    tags: [ blockRef, 'constructor-end' ],
    text: ' - constructor has finished'
  }));
}

SchemaValidator.argumentSchema = {
  "$id": "schemaValidator",
  "type": "object",
  "properties": {
    "loggingFactory": {
      "type": "object"
    }
  }
};

module.exports = SchemaValidator;