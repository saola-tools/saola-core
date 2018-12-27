#!/usr/bin/env bash

npm test
DEVEBOT_UPGRADE_DISABLED=presets npm run test-without-rebuilding
DEVEBOT_UPGRADE_DISABLED=bridge-full-ref npm run test-without-rebuilding
DEVEBOT_UPGRADE_DISABLED=bridge-full-ref,presets npm run test-without-rebuilding
DEVEBOT_UPGRADE_DISABLED=standardizing-config npm run test-without-rebuilding
DEVEBOT_UPGRADE_DISABLED=standardizing-config,bridge-full-ref npm run test-without-rebuilding
DEVEBOT_UPGRADE_DISABLED=standardizing-config,bridge-full-ref,presets npm run test-without-rebuilding
DEVEBOT_UPGRADE_DISABLED=gadget-around-log npm run test-without-rebuilding
DEVEBOT_UPGRADE_DISABLED=refining-name-resolver,simplify-name-resolver npm run test-without-rebuilding
DEVEBOT_UPGRADE_ENABLED=metadata-refiner DEVEBOT_UPGRADE_DISABLED=manifest-refiner npm run test-without-rebuilding
