module.exports = {
  plugins: {
    plugin2: {
      host: "localhost",
      port: 17702,
      tdd: {
        field1: "String 2",
        field2: 10002,
        field3: { foo: "foo", bar: "bar", num: 1002 },
        field4: [ 1, 2, 3, null, "4" ]
      }
    }
  },
  bridges: {
    "anyname2a": {
      "bridge2": {
        "refPath": "sandbox -> bridge2 -> anyname2a",
        "refType": "plugin",
        "refName": "plugin2"
      }
    },
  }
}