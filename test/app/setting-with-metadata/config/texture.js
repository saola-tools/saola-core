var lodash = require('lodash');

module.exports = {
  plugins: {
    subPlugin1: {
      internal: {},
      services: {
        sublibService: {
          getConfig: {
            logging: {
              enabled: true,
              onRequest: {
                enabled: true,
                extractReqId: function(args, context) {
                  return args && args[0] && args[0].reqId;
                },
                extractInfo: function(args, context) {
                  return args[0];
                },
                template: "#{objectName}.#{methodName}()/Request[#{requestId}] - begin"
              },
              onSuccess: {
                enabled: true,
                extractInfo: function(result) {
                  return result;
                },
                template: "#{objectName}.#{methodName}()/Request[#{requestId}] - completed"
              },
              onFailure: {
                enabled: true,
                extractInfo: function(error) {
                  return {
                    error_code: error.code,
                    error_message: error.message
                  }
                },
                template: "#{objectName}.#{methodName}()/Request[#{requestId}] - failed"
              }
            },
            mocking: {
              mappings: {
                "default": {
                  selector: function(parameters) {
                  },
                  generate: function(parameters) {
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  bridges: {
    bridge4: {
      application: {
        instance: {
          getConfig: {
            logging: {
              onRequest: {
                extractReqId: function(args, context) {
                  return args && args[0] && args[0].reqId;
                },
                extractInfo: function(args, context) {
                  return lodash.omit(args[0], ['reqId']);
                },
                template: "#{objectName} - #{methodName} - Request[#{requestId}]"
              },
              onSuccess: {
                extractInfo: function(result) {
                  return result;
                },
                template: "#{objectName}.#{methodName} - Request[#{requestId}]"
              },
              onFailure: {
                extractInfo: function(error) {
                  return {
                    error_code: error.code,
                    error_message: error.message
                  }
                },
                template: "#{objectName}.#{methodName} - Request[#{requestId}]"
              }
            }
          }
        }
      }
    }
  }
}