module.exports = {
  schema: {
    "type": "object",
    "properties": {
      "host": {
        "type": "string"
      },
      "port": {
        "type": "number"
      },
      "verbose": {
        "type": "boolean"
      }
    },
    "required": ["host", "port"]
  }
}
