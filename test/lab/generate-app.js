
var path = require('path');
var util = require('util');
var Temporify = require('temporify');

function buildApp(params) {
  params = params || {};

  var projectName = params.projectName || 'example-project';
  var builder = new Temporify({
    subdir: projectName
  });
  let basedir = builder.basedir;

  builder.add([{
    filename: 'index.js',
    content: `
    'use strict';
    var lab = require('<%- testHomeDir %>');
    var Devebot = lab.getDevebot();
    var app = Devebot.launchApplication({
      appRootPath: __dirname
    });
    if (require.main === module) app.server.start();
    module.exports = app;
    `,
    model: {
      testHomeDir: params.testHomeDir
    }
  }, {
    dir: 'config/',
    filename: 'sandbox.js',
    content: `
      module.exports = {};
    `
  }, {
    filename: 'package.json',
    content: `
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
    `,
    model: {
      projectName: projectName
    }
  }]);

  return function(args) {
    args = args || {};
    var context = {
      appRootPath: builder.homedir
    }
    if (args.privateProfile) {
      context.privateProfile = args.privateProfile;
    }
    builder.add({
      filename: 'index.js',
      content: `
      'use strict';
      var lab = require('<%- testHomeDir %>');
      var Devebot = lab.getDevebot();
      var app = Devebot.launchApplication(<%- context %>);
      if (require.main === module) app.server.start();
      module.exports = app;
      `,
      model: {
        testHomeDir: params.testHomeDir,
        context: JSON.stringify(context)
      }
    });
    builder.generate();
    return builder;
  };
}

var flow = Promise.resolve();

flow = flow.then(function() {
  var build = buildApp({
    projectName: 'invalid-appbox-context',
    testHomeDir: path.join(__dirname, '../index')
  });

  var tempor = build({
    privateProfile: 'abc'
  });

  console.log('Home: %s', tempor.homedir);

  var app = require(tempor.homedir);
  var subf = app.server.start();
  
  subf = subf.delay(5000);
  
  subf = subf.then(function() {
    return app.server.stop();
  });

  subf = subf.then(function() {
    tempor.destroy();
  });

  return subf;
});
