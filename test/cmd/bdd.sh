#!/bin/bash
npm run build && find $(dirname $0)/../bdd -name '*-test.js' | xargs node_modules/.bin/mocha -R spec;
true