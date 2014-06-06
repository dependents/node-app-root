var detective    = require('detective'),
    detectiveAmd = require('detective-amd'),
    gmt          = require('module-definition'),
    required     = require('required'),
    fs           = require('fs'),
    path         = require('path'),
    q            = require('q'),
    ExclusionManager = require('exclusion-manager');

// Calls the passed callback with a list of candidate root filenames
module.exports = function (directory, opt, cb) {
  // opt is an optional configuration object
  if (typeof opt === 'function') {
    cb  = opt;
    opt = {};
  } else {
    opt = opt || {};
  }

  // Avoid tampering with the passed in object
  var options = {
    dirManager:  new ExclusionManager(opt.ignoreDirectories),
    fileManager: new ExclusionManager(opt.ignoreFiles)
  };

  var jsFiles = getAllJSFiles(directory, options);

  // Get all files that are not depended on
  getIndependentJSFiles(jsFiles)
    .done(function (jsFiles) {
      cb && cb(jsFiles);
    });
};

// Returns a list of all JavaScript filepaths
// relative to the given directory
function getAllJSFiles(directory, opt) {
  var jsFilePaths = [];

  fs.readdirSync(directory).forEach(function (filename) {
    var fullName    = directory + '/' + filename,
        isDirectory = fs.lstatSync(fullName).isDirectory(),
        ext         = path.extname(filename);

    if (isDirectory) {
      if (opt.dirManager.shouldIgnore(filename)) return;

      jsFilePaths = jsFilePaths.concat(getAllJSFiles(fullName, opt));

    } else if (ext === '.js') {
      if (opt.fileManager.shouldIgnore(filename)) return;

      jsFilePaths.push(path.resolve(fullName));
    }
  });

  return jsFilePaths;
}

function getIndependentJSFiles(jsFiles) {
  // For each file, mark its non-core dependencies as used
  return q.all(jsFiles.map(getNonCoreDependencies))
    .then(function (results) {
      var filesUsed = {};

      results.forEach(function (deps, idx) {
        // Files with no dependencies are useless and should not be roots
        if (! deps || ! deps.length) {
          filesUsed[jsFiles[idx]] = true;

        } else {
          deps.forEach(function (dep) {
            if (dep.core) return;

            filesUsed[dep.filename] = true;
          });
        }
      });

      // Return all unused js files
      return jsFiles.filter(function (jsFile) {
        return typeof filesUsed[jsFile] === 'undefined';
      });
    });
}

// Resolve with a list of non-core dependencies for the given file
function getNonCoreDependencies(jsFile) {
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
        deps = deps || [];

        var nonCoreDeps = deps.filter(function (dep) {
          return ! dep.core;
        });

        deferred.resolve(nonCoreDeps);
      });

      return deferred.promise;
    });
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
