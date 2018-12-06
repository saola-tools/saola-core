var lodash = require('lodash');

module.exports = {
  application: {
    services: {
      mainService: {
        methods: {
          internalMergeConfig: {
            mocking: {
              mappings: {
                "default": {
                  selector: function() {
                    return true;
                  },
                  generate: function(msg, opts) {
                    if (msg) {
                      return { msg: msg }
                    }
                    return { msg: "hello world" }
                  }
                }
              }
            }
          },
          "forLogOnly.submethod": {
            logging: {
              onRequest: {
                getRequestId: function(args, context) {
                  return args && args[0] && args[0].reqId;
                },
                extractInfo: function(args, context) {
                  return args[0];
                },
                template: "Request[#{requestId}]<#{objectName}.#{methodName}> - begin"
              },
              onSuccess: {
                enabled: true,
                extractInfo: function(result) {
                  return result;
                },
                template: "Request[#{requestId}]<#{objectName}.#{methodName}> - completed"
              },
              onFailure: {
                enabled: true,
                extractInfo: function(error) {
                  return {
                    error_name: error.name,
                    error_message: error.message
                  }
                },
                template: "Request[#{requestId}]<#{objectName}.#{methodName}> - failed"
              }
            }
          }
        }
      }
    }
  }
}