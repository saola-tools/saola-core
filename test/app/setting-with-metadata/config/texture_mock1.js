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
          }
        }
      }
    }
  }
}