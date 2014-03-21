var detective    = require('detective'),
    detectiveAmd = require('detective-amd'),
    gmt          = require('module-definition'),
    required     = require('required'),
    fs           = require('fs'),
    path         = require('path'),
    q            = require('q');

// Calls the passed callback with a list of candidtate root filenames
module.exports = function (directory, cb) {
  var jsFiles = getAllJSFiles(directory);

  // Given a directory, get the cumulative non-core degrees of all .js files
  var getAllDegrees = jsFiles.map(function (jsFile) {
    return getCumulativeDegree(jsFile);
  });

  q.all(getAllDegrees)
    .then(function (results) {
      // The app root is the file with the largest cumulative degree
      // There might be more than one root if there are independent apps
      // located within the same directory (perhaps lazily loaded)
      var maxDegree = Math.max.apply(Math, results),
          candidateRootFiles = jsFiles.filter(function (jsFile, idx) {
            // Its degree is the max degree
            return results[idx] === maxDegree;
          });

      cb && cb(candidateRootFiles);
    });
};

// Resolves with the sum of non-core dependencies for the file's dependency graph
function getCumulativeDegree(jsFile) {
  return getDependencies(jsFile)
    // Get degree of root file + each non-core dependency
    .then(getNonCoreDegree);
}

// Resolve with a list of dependencies for the given file
function getDependencies(jsFile) {
  return getModuleType(jsFile)
    // Configure required options
    .then(function (moduleType) {
      return {
        detective:     getAppropriateDetective(moduleType),
        ignoreMissing: true
      };
    })
    // Use required to get the file's dependency list
    .then(function (options) {
      var deferred = q.defer();

      required(jsFile, options, function (err, deps) {
        if (err) console.log(jsFile, err);

        deferred.resolve(deps || []);
      });

      return deferred.promise;
    });
}

// Returns the number (degree) of non-core dependencies
// by traversing the entire dependency tree
function getNonCoreDegree(deps) {
  var count = 0;

  if (! deps || ! deps.length) return count;

  deps.forEach(function (dep) {
    if (! dep || dep.core) return;

    // Count the current dependency
    count++;

    // Count the sub dependencies
    if (dep.deps) {
      count += getNonCoreDegree(dep.deps);
    }
  });

  return count;
}

// Returns the detective function appropriate to
// the given module type
// Precond: moduleType is 'commonjs' or 'amd'
function getAppropriateDetective(moduleType) {
  switch (moduleType) {
    case 'commonjs':
      return detective;
    case 'amd':
      return detectiveAmd;
  }

  return null;
}

// Promisified wrapper of gmt
function getModuleType(jsFile) {
  var deferred = q.defer();

  gmt(jsFile, function (moduleType) {
    deferred.resolve(moduleType);
  });

  return deferred.promise;
}

// Returns a list of all JavaScript filepaths
// relative to the given directory
function getAllJSFiles(directory) {
  var jsFilePaths = [];

  fs.readdirSync(directory).forEach(function (filename) {
    var fullName    = directory + '/' + filename,
        isDirectory = fs.lstatSync(fullName).isDirectory(),
        ext         = path.extname(filename);

    if (isDirectory) {
      jsFilePaths = jsFilePaths.concat(getAllJSFiles(fullName));

    } else if (ext === '.js') {
      jsFilePaths.push(fullName);
    }
  });

  return jsFilePaths;
}