module.exports = {
  application: {
    internal: {},
    services: {
      mainService: {
        getConfig: {
          logging: {
            enabled: true,
            onRequest: {
              enabled: true,
              extractReqId: function(args, context) {

              },
              extractInfo: function(args, context) {

              },
              template: "#{objectName} - #{methodName} - #{methodArgs} - #{requestId}"
            },
            onSuccess: {
              
            },
            onFailure: {
              
            }
          },
          mocking: {
            mappings: {
              "default": {
                selector: function() {

                },
                generate: function() {
                  
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
          dialect: {
            getConfig: {
              enabled: true,
              logging: {
                enabled: true,
                onRequest: {
                  enabled: true,
                  extractReqId: function(args, context) {
    
                  },
                  extractInfo: function(args, context) {
    
                  },
                  template: "#{objectName} - #{methodName} - #{methodArgs} - #{requestId}"
                },
                onSuccess: {
                  
                },
                onFailure: {
                  
                }
              }
            }
          }
        }
      }
    }
  }
}