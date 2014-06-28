var detective    = require('detective'),
    detectiveAmd = require('detective-amd'),
    gmt          = require('module-definition'),
    required     = require('required'),
    fs           = require('fs'),
    path         = require('path'),
    q            = require('q'),
    ExclusionManager = require('exclusion-manager');

/**
 * Calls the given callback with a list of candidate root filenames
 *
 * @param  {String}   directory
 *
 * @param  {Object}   opt                             Configuration options
 * @param  {Array}    opt.ignoreDirectories           List of directory names to ignore in the root search
 * @param  {Array}    opt.ignoreFiles                 List of filesnames to ignore in the root search
 * @param  {Boolean}  opt.includeNoDependencyModules  Whether or not to include, as roots, modules that are
 *                                                    independent (no one depends on) and have no dependencies
 * @param  {Function} cb - ({Array}) -> null
 */
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
  },
  jsFiles;

  directory = path.resolve(directory);

  jsFiles = getAllJSFiles(directory, options);

  // Filter out non-modules
  jsFiles = jsFiles.filter(function(file) {
    return gmt.sync(file) !== 'none';
  });

  options.includeNoDependencyModules = true;
  options.directory = directory;

  // Get all files that are not depended on
  getIndependentJSFiles(jsFiles, options)
    .done(function (jsFiles) {
      cb(jsFiles);
    });
};

/**
 * Returns a list of all JavaScript filepaths relative to the given directory
 *
 * @param  {String}           directory
 * @param  {Object}           opt
 * @param  {ExclusionManager} opt.dirManager
 * @param  {ExclusionManager} opt.fileManager
 * @return {Array}
 */
function getAllJSFiles(directory, opt) {
  var jsFilePaths = [];

  fs.readdirSync(directory).forEach(function (filename) {
    var fullName    = path.resolve(directory, filename),
        isDirectory = fs.lstatSync(fullName).isDirectory(),
        ext         = path.extname(filename);

    if (isDirectory) {
      if (opt.dirManager.shouldIgnore(filename)) return;

      jsFilePaths = jsFilePaths.concat(getAllJSFiles(fullName, opt));

    } else if (ext === '.js') {
      if (opt.fileManager.shouldIgnore(filename)) return;

      jsFilePaths.push(fullName);
    }
  });

  return jsFilePaths;
}

/**
 * @param  {Array}    jsFiles
 * @param  {Object}   options
 * @param  {Boolean}  options.includeNoDependencyModules
 * @return {Promise}  ({Array}) -> null Resolves with the list of independent filenames
 */
function getIndependentJSFiles(jsFiles, options) {
  // For each file, mark its non-core dependencies as used
  return q.all(jsFiles.map(getNonCoreDependencies))
    .then(function (results) {
      // A look up table of all files used as dependencies within the directory
      var dependencies = {};

      results.forEach(function (deps, idx) {
        // Files with no dependencies are useless and should not be roots
        if (! options.includeNoDependencyModules && (! deps || ! deps.length)) {
          dependencies[jsFiles[idx]] = true;

        } else {
          deps.forEach(function (dep) {
            if (dep.core) return;

            if (dep.filename.indexOf('.js') === -1) {
              dep.filename += '.js';
            }

            dependencies[dep.filename] = true;
          });
        }
      });

      // Return all unused (independent) js files
      return jsFiles.filter(function (jsFile) {
        return typeof dependencies[jsFile] === 'undefined';
      });
    });
}

/**
 * Resolve with a list of non-core dependencies for the given file
 * @param  {Object} opts
 * @param  {Object} opts
 * @param  {[type]} jsFile [description]
 * @return {[type]}        [description]
 */
function getNonCoreDependencies(jsFile) {
  return getModuleType(jsFile)
    .then(function (moduleType) {
      // Options for required
      var options = {
        detective:     getAppropriateDetective(moduleType),
        ignoreMissing: true
      },

      deferred = q.defer();

      // Bypass required since it doesn't play well with amd dependencies
      // TODO: Consider using a custom resolver with required
      if (moduleType === 'amd') {
        var content = fs.readFileSync(jsFile).toString(),
            fileDir = path.dirname(jsFile),
            deps = options.detective(content).map(function(d) {
              return {
                filename: path.resolve(fileDir, d)
              };
            });

        deferred.resolve(deps);

      } else if (moduleType === 'commonjs') {
        required(jsFile, options, function (err, deps) {
          if (err) console.log(jsFile, err);
          deps = deps || [];

          var nonCoreDeps = deps.filter(function (dep) {
            return ! dep.core;
          });

          deferred.resolve(nonCoreDeps);
        });

      } else {
        deferred.resolve([]);
      }

      return deferred.promise;
    });
}

/**
 * Returns the detective function appropriate to the given module type
 * @param  {String} moduleType
 * @return {Function|null} The detective for the module type
 */
function getAppropriateDetective(moduleType) {
  switch (moduleType) {
    case 'commonjs':
      return detective;
    case 'amd':
      return detectiveAmd;
  }

  return null;
}

/**
 * Promisified wrapper of gmt
 * @param  {String} jsFile
 * @return {Promise} - ({String}) -> null - Resolves with the file's module type
 */
function getModuleType(jsFile) {
  var deferred = q.defer();

  gmt(jsFile, function (moduleType) {
    deferred.resolve(moduleType);
  });

  return deferred.promise;
}
