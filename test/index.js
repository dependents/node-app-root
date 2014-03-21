var getAppRoot = require('../');

getAppRoot(__dirname + '/js', function (root) {
  console.log('Candidate root: ', root)
});