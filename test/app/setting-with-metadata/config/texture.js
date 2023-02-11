"use strict";

const lodash = require("lodash");

module.exports = {
  plugins: {
    subPlugin3: {
      reducers: {},
      services: {
        sublibService: {
          methods: {
            getConfig: {
              logging: {
                enabled: true,
                onRequest: {
                  enabled: true,
                  getRequestId: function(args, context) {
                    return args && args[0] && args[0].reqId;
                  },
                  extractInfo: function(args, context) {
                    return args[0];
                  },
                  template: "Request[#{requestId}] #{objectName}.#{methodName} - begin"
                },
                onSuccess: {
                  enabled: true,
                  extractInfo: function(result) {
                    return result;
                  },
                  template: "Request[#{requestId}] #{objectName}.#{methodName} - completed"
                },
                onFailure: {
                  enabled: true,
                  extractInfo: function(error) {
                    return {
                      error_code: error.code,
                      error_message: error.message
                    };
                  },
                  template: "Request[#{requestId}] #{objectName}.#{methodName} - failed"
                }
              }
            }
          }
        }
      }
    },
    subPlugin4: {
      services: {
        sublibService: {
          methods: {
            getConfig: {
              mocking: {
                mappings: {
                  "default": {
                    selector: function() {
                      return true;
                    },
                    generate: function(opts) {
                      return { msg: "hello world" };
                    }
                  }
                }
              }
            }
          }
        }
      },
      triggers: {
        sublibTrigger: {
          methods: {
            getConfig: {}
          }
        }
      }
    }
  },
  bridges: {
    adapter: {
      application: {
        instance: {
          methods: {
            getConfig: {
              useDefaultTexture: true
            }
          }
        }
      }
    },
    bridge4: {
      application: {
        instance: {
          methods: {
            getConfig: {
              logging: {
                onRequest: {
                  getRequestId: function(args, context) {
                    return args && args[0] && args[0].reqId;
                  },
                  extractInfo: function(args, context) {
                    return lodash.omit(args[0], ["reqId"]);
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
                    };
                  },
                  template: "#{objectName}.#{methodName} - Request[#{requestId}]"
                }
              }
            }
          }
        }
      }
    },
  }
};
