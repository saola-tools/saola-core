/* global Devebot */
"use strict";

const chores = Devebot.require("chores");
const http = require("http");

const Service = function(params) {
  params = params || {};

  const packageName = params.packageName || "plugin-invalid-trigger-methods";
  const blockRef = chores.getBlockRef(__filename, packageName);
  const L = params.loggingFactory.getLogger();
  const T = params.loggingFactory.getTracer();

  L.has("dunce") && L.log("dunce", T.toMessage({
    tags: [ blockRef, "constructor-begin" ],
    text: " + constructor begin"
  }));

  const server = http.createServer();

  server.on("error", function(err) {
    L.has("error") && L.log("error", T.add({
      error: err
    }).toMessage({
      tags: [ blockRef, "server-error" ],
      text: " - Server Error: {error}",
      reset: true
    }));
  });

  server.on("request", function(req, res) {
    res.writeHead(200);
    res.end("plugin-invalid-trigger webserver");
  });

  this.getServer = function() {
    return server;
  };

  L.has("dunce") && L.log("dunce", T.toMessage({
    tags: [ blockRef, "constructor-end" ],
    text: " - constructor end!"
  }));
};

module.exports = Service;
