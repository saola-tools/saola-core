module.exports = {
  config: {
    validation: {
      schema: {
        "type": "object",
        "properties": {
          "connection_string": {
            "type": "string"
          },
          "connection_options": {
            "type": "object",
            "properties": {
              "host": {
                "type": "string"
              },
              "port": {
                "type": "number"
              }
            }
          }
        },
        "additionalProperties": false
      }
    }
  }
}
