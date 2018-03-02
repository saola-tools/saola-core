'use strict';

var lodash = require('lodash');
var fs = require('fs');
var os = require('os');
var path = require('path');
var util = require('util');
var uuidv4 = require('logolite/uuidv4');
var constx = require('./constx.js');
var loader = require('./loader.js');
var debugx = require('./pinbug.js')('devebot:utils:chores');

var chores = {};

chores.getUUID = function() {
  return uuidv4();
}

chores.pickProperty = function(propName, containers, propDefault) {
  if (!lodash.isString(propName) || !lodash.isArray(containers)) return null;
  for(var i=0; i<containers.length; i++) {
    if (lodash.isObject(containers[i]) && containers[i][propName]) {
      return containers[i][propName];
    }
  }
  return propDefault;
};

chores.listFiles = function(dir, filenames) {
  return chores.filterFiles(dir, filenames, '.*');
};

chores.filterFiles = function(dir, filter, filenames) {
  filenames = filenames || [];
  var regex = (filter) ? new RegExp(filter) : null;
  var files;
  try {
    files = fs.readdirSync(dir);
  } catch (err) {
    files = [];
  }
  for (var i in files) {
    if ((regex) ? regex.test(files[i]) : true) {
      var name = dir + '/' + files[i];
      if (fs.statSync(name).isFile()) {
        filenames.push(files[i]);
      }
    }
  }
  return filenames;
};

chores.loadServiceByNames = function(serviceMap, serviceFolder, serviceNames) {
  var self = this;
  
  debugx.enabled && debugx(' - load services by names: %s', JSON.stringify(serviceNames));
  
  serviceNames = (lodash.isArray(serviceNames)) ? serviceNames : [serviceNames];
  
  serviceNames.forEach(function(serviceName) {
    var filepath = path.join(serviceFolder, serviceName + '.js');
    var serviceConstructor = loader(filepath);
    if (lodash.isFunction(serviceConstructor)) {
      var serviceEntry = {};
      serviceEntry[chores.stringCamelCase(serviceName)] = serviceConstructor;
      lodash.defaults(serviceMap, serviceEntry);
    }
  });
};

chores.stringKebabCase = function kebabCase(str) {
  return (str || '').toLowerCase().replace(/\s/g, '-');
};

chores.stringLabelCase = function labelCase(str) {
  return (str || '').toUpperCase().replace(/-/g, '_');
};

chores.stringCamelCase = function camelCase(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/-([a-z])/g, function (m, w) {
    return w.toUpperCase();
  });
}

chores.assertDir = function(appName) {
  var configDir = path.join(this.homedir(), '.' + appName);
  debugx.enabled && debugx('config in homeDir: %s', configDir);
  try {
    fs.readdirSync(configDir);
  } catch (err) {
    if (err.code == 'ENOENT') {
      try {
        fs.mkdirSync(configDir);
      } catch (err) {
        return null;
      }
    } else {
      return null;
    }
  }
  return configDir;
}

chores.homedir = (typeof os.homedir === 'function') ? os.homedir : function() {
  var env = process.env;
  var home = env.HOME;
  var user = env.LOGNAME || env.USER || env.LNAME || env.USERNAME;

  if (process.platform === 'win32') {
    return env.USERPROFILE || env.HOMEDRIVE + env.HOMEPATH || home || null;
  }

  if (process.platform === 'darwin') {
    return home || (user ? '/Users/' + user : null);
  }

  if (process.platform === 'linux') {
    return home || (process.getuid() === 0 ? '/root' : (user ? '/home/' + user : null));
  }

  return home || null;
};

chores.getBlockRef = function(filename, blockScope) {
  if (filename == null) return null;
  blockScope = blockScope || 'devebot';
  var blockName = chores.stringCamelCase(path.basename(filename, '.js'));
  return [blockScope, blockName].join(chores.getSeparator());
}

chores.DEFAULT_SECTOR_ID_FIELD = 'blockId';
chores.DEFAULT_SECTOR_NAME_FIELD = 'blockName';

chores.getSeparator = function() {
  return '/';
};

chores.getFullname = function(parts, separator) {
  return lodash.filter(parts, lodash.negate(lodash.isEmpty))
      .join(separator || chores.getSeparator());
}

var injektorContext = { scope: 'devebot' };

chores.injektorContext = injektorContext;

module.exports = chores;
