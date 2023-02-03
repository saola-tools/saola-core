/* global Devebot */
"use strict";

const chores = Devebot.require("chores");

const profileConfig = {
  newFeatures: {
    plugin2: {
      logoliteEnabled: true
    }
  }
};

const profileConfigFramework = {
  hashtags: {
    plugin2: 2,
    framework: 2
  }
};

if (chores.isUpgradeSupported("profile-config-field-framework")) {
  profileConfig.framework = profileConfigFramework;
} else {
  profileConfig.devebot = profileConfigFramework;
}

module.exports = profileConfig;
