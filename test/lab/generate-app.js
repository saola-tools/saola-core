
var path = require('path');
var Temporify = require('temporify');

function AppGenerator(params) {
  params = params || {};

  var projectName = params.projectName || 'example-project';
  var testHomeDir = params.testHomeDir || path.join(__dirname, '../index');

  var builder = new Temporify({
    subdir: projectName,
    variables: {
      projectName: projectName,
      testHomeDir: testHomeDir
    }
  });

  builder.assign([{
    filename: 'index.js',
    template: `
    'use strict';
    var lab = require('<%- testHomeDir %>');
    var Devebot = lab.getDevebot();
    var app = Devebot.launchApplication({
      appRootPath: __dirname,
      <% if (privateProfile) { %>
      privateProfile: <%- privateProfile %>
      <% } %>
    });
    if (require.main === module) app.server.start();
    module.exports = app;
    `
  }, {
    dir: 'config/',
    filename: 'sandbox.js',
    template: `
      module.exports = {};
    `
  }, {
    filename: 'package.json',
    template: `
    {
      "name": "<%- projectName %>",
      "version": "0.1.0",
      "description": "Testapp: invalid context",
      "main": "index.js",
      "scripts": {
        "test": "echo 'Error: no test specified' && exit 1"
      },
      "author": "devebot",
      "license": "ISC"
    }
    `
  }]);

  this.customize = function(args) {
    return builder.assign({
      filename: 'index.js',
      variables: args
    }).generate();
  };

  this.destroy = function() {
    builder.destroy();
  }
}

var flow = Promise.resolve();

flow = flow.then(function() {
  var generator = new AppGenerator({
    projectName: 'invalid-appbox-context',
    testHomeDir: path.join(__dirname, '../index')
  });

  var tempor = generator.customize({
    privateProfile: JSON.stringify('123')
  });

  console.log('Home: %s', tempor.homedir);

  var app = require(tempor.homedir);
  var subf = app.server.start();
  
  subf = subf.delay(5000);
  
  subf = subf.then(function() {
    return app.server.stop();
  });

  subf = subf.then(function() {
    generator.destroy();
  });

  return subf;
});
