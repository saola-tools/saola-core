#!/bin/bash
npm run build && node_modules/.bin/mocha --recursive test/tdd/**/*-test.js;
true