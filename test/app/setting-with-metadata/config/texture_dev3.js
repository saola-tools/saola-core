module.exports = {
  plugins: {
    subPlugin2: {
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
}