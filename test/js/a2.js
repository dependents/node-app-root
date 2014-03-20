// A file that has a bunch of built-in but no
// custom/relative dependencies

// Should not be the root node

var fs = require('fs'),
    path = require('path'),
    exec = require('child_process').exec,
    http = require('http');

console.log('Booyah');