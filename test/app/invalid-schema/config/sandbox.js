module.exports = {
  application: {
    "host": "0.0.0.0",
    // "port": 17700,
    "verbose": false
  },
  plugins: {
    "subPlugin1": {
      "host": "0.0.0.0",
      "port": "17701",
      "verbose": false
    },
    "subPlugin2": {
      "host": "0.0.0.0",
      "port": 17702,
      "verbose": false
    }
  }
}