module.exports = {
  plugins: {
    plugin1: {
      host: "localhost",
      port: 17701,
      tdd: {
        field1: "String 1",
        field2: 10001,
        field3: { foo: "foo", bar: "bar", num: 1001 },
        field4: [ 1, 2, 3, null, "4" ]
      }
    }
  },
  bridges: {
    "anyname1a": {
      "bridge1": {
        "refPath": "sandbox -> bridge1 -> anyname1a",
        "refType": "plugin",
        "refName": "plugin1"
      }
    },
  }
}