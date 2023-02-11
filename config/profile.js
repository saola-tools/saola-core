"use strict";

const path = require("path");

module.exports = {
  framework: {
    mode: "server", // 'server', 'silent', 'tictac'
    host: "0.0.0.0",
    port: "17779",
    authen: {
      disabled: false,
      tokenStoreFile: path.join(__dirname, "/../data/tokenstore.json")
    },
    tunnel: {
      enabled: false,
      key_file: path.join(__dirname, "/../data/ssl/example.key"),
      crt_file: path.join(__dirname, "/../data/ssl/example.crt")
    },
    coupling: "loose", // 'loose', 'tight'
    jobqueue: {
      enabled: false
    }
  }
};
