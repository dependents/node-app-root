#!/usr/bin/env node

'use strict';

var getAppRoots = require('../'),
    directory = process.argv[2];

if (! directory) {
  throw new Error('please supply a directory');
}

getAppRoots(directory, function(roots) {
  roots.forEach(function(root) {
    console.log(root);
  });
});

