var getAppRoot = require('../');

var options = {
  ignore: ['bower_components']
};

getAppRoot(__dirname + '/commonjs', options, function (root) {
  console.log('CommonJS Candidate root: ', root);
  console.log(root.length === 1);
  console.log(root[0].indexOf('a2.js') !== -1);
});

getAppRoot(__dirname + '/amd', options, function (root) {
  console.log('AMD Candidate root: ', root);
  console.log(root.length === 1);
  console.log(root[0].indexOf('a2.js') !== -1);
});