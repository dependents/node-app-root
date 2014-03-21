var detective    = require('detective'),
    detectiveAmd = require('detective-amd'),
    gmt          = require('module-definition'),
    required     = require('required'),
    fs           = require('fs'),
    path         = require('path'),
    q            = require('q');

// Calls the passed callback with a list of candidtate root filenames
module.exports = function (directory, opt, cb) {
  // opt is an optional configuration object
  if (typeof opt === 'function') {
    cb  = opt;
    opt = {};
  } else {
    opt = opt || {};
  }

  var jsFiles = getAllJSFiles(directory, opt);

  // Get all files that are not depended on
  getIndependentJSFiles(jsFiles)
    .done(function (jsFiles) {
      cb && cb(jsFiles);
    });
};

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

// Returns a list of all JavaScript filepaths
// relative to the given directory
function getAllJSFiles(directory, opt) {
  var jsFilePaths = [];

  fs.readdirSync(directory).forEach(function (filename) {
    var fullName    = directory + '/' + filename,
        isDirectory = fs.lstatSync(fullName).isDirectory(),
        ext         = path.extname(filename);

    if (isDirectory) {
      if (opt.ignore && ! shouldBeIgnored(filename, opt.ignore) ||
          (! opt.ignore || ! opt.ignore.length)) {

        jsFilePaths = jsFilePaths.concat(getAllJSFiles(fullName, opt));
      }
    } else if (ext === '.js') {
      jsFilePaths.push(fullName);
    }
  });

  return jsFilePaths;
}

// This is shared with node-unique-extensions but should be
// within exposed within its own module.
function shouldBeIgnored(filename, exclusions) {
  var result = false;

  exclusions = exclusions || [];

  for (var i = 0, l = exclusions.length; i < l; i++) {
    // If any part of the file's name (absolute or relative)
    // contains an excluded folder, it should be ignored
    if (filename.indexOf(exclusions[i]) !== -1) {
      result = true;
      break;
    }
  }

  return result;
}