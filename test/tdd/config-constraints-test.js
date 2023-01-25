"use strict";

const Temporify = require("temporify");
const path = require("path");
const _ = require("lodash");

const helper = require("../index");
const appboxDefault = require("../gen/appbox-default");
const bridgeDefault = require("../gen/bridge-default");

describe.skip("tdd:devebot:core:config-constraints", function() {
  this.timeout(60000);

  let bridgePkgs = _.map(_.range(1, 3), function(idx) {
    return {
      name: "bridge" + idx,
      builder: bridgeDefault({
        name: "bridge" + idx,
        version: "0.1." + idx
      })
    };
  });

  let appDemo = appboxDefault({
    application: {
      name: "demo-app",
      port: 17700,
      servlet_host: "localhost",
      servlet_port: 8080
    },
    plugins: [1, 2].map(function(idx) {
      return {
        name: "plugin" + idx,
        path: helper.getLibHome("plugin" + idx),
        host: "0.0.0.0",
        port: 17700 + idx
      };
    }),
    bridges: _.map(bridgePkgs, (pkg) => {
      return {
        name: pkg.name,
        path: pkg.builder.homedir
      };
    })
  });

  // console.log('Home: %s', appDemo.homedir);
  // console.log('Stats: %s', JSON.stringify(appDemo.stats(), null, 2));

  let app, flow;

  before(function() {
    app = require(appDemo.homedir);
  });

  beforeEach(function() {
  });

  it("", function(done) {
    flow = app.server.start();
    flow = flow.delay(5000);
    flow.asCallback(done);
  });

  afterEach(function(done) {
    app.server.stop().asCallback(done);
  });

  after(function() {
    appDemo.destroy();
  });
});
