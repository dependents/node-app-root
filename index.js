var precinct = require('precinct');
var path = require('path');
var q = require('q');
var dir = require('node-dir');
var gmt = require('module-definition');

/**
 * Calls the given callback with a list of candidate root filenames
 *
 * @param {Object} options - Configuration options
 * @param {String} options.directory - Where to look for roots
 * @param {Function} options.success - Executed with the list of roots
 *
 * @param {Array} [options.ignoreDirectories] - List of directory names to ignore in the root search
 * @param {Array} [options.ignoreFiles] - List of filenames to ignore in the root search
 * @param {Boolean} [options.includeNoDependencyModules=undefined] - Whether or not to include modules with no dependencies
 */
module.exports = function(options) {
  options = options || {};

  if (!options.directory) { throw new Error('directory not given'); }
  if (!options.success) { throw new Error('success callback not given'); }

  options.directory = path.resolve(options.directory);

  getAllFiles(options)
  .then(function(files) {
    // Remove non-modules
    return files.filter(function(file) {
      return path.extname(file) !== '.js' || gmt.sync(file) !== 'none';
    });
  })
  .then(function(files) {
    // Get all files that are not depended on
    return getIndependentFiles(files, options);
  })
  .done(function(files) {
    options.success(files);
  });
};

/**
 * Returns a list of all filepaths relative to the given directory
 *
 * @param  {Object}   options
 * @param  {String}   options.directory
 * @param  {String[]} [options.ignoreDirectories=null]
 * @param  {String[]} [options.ignoreFiles=null]
 * @return {Promise}
 */
function getAllFiles(options) {
  var deferred = q.defer();

  dir.readFiles(options.directory, {
    exclude: options.ignoreFiles || null,
    excludeDir: options.ignoreDirectories || null
  },
  function(err, content, next) {
    if (err) {
      deferred.reject(err);
      return;
    }

    next();
  },
  function(err, files) {
    if (err) {
      deferred.reject(err);
      return;
    }

    deferred.resolve(files);
  });

  return deferred.promise;
}

/**
 * @param  {String[]} files
 * @param  {Object}   options
 * @param  {Boolean}  options.includeNoDependencyModules
 * @param  {String}  options.directory
 * @return {Promise}  Resolves with the list of independent filenames
 */
function getIndependentFiles(files, options) {
  // A look up table of all files used as dependencies within the directory
  var dependencies = {};

  files.forEach(function(file) {
    var deps = getNonCoreDependencies(file);

    if (!options.includeNoDependencyModules && !deps.length) {
      // Files with no dependencies are useless and should not be roots
      // so we add them to the list so they're no longer root candidates
      dependencies[file] = true;
      return;
    }

    deps.forEach(function(dep) {
      dep = resolveDep(dep, file, options.directory);
      dependencies[dep] = true;
    });
  });

  // Files that haven't been depended on
  return files.filter(function(file) {
    return typeof dependencies[file] === 'undefined';
  });
}

/**
 * Resolve a dependency's path
 * @param  {String} dep - The dependency name to resolve
 * @param  {String} filename - Filename that contains the dependency
 * @param  {String} directory - Root of all files
 * @return {String} Absolute/resolved path of the dependency
 */
function resolveDep(dep, filename, directory) {
  var filepath;
  var depExt = path.extname(dep);
  var fileExt = path.extname(filename);
  var isRelative = function(path) {
    return dep.indexOf('..') === 0 || dep.indexOf('.') === 0;
  };

  if (isRelative(dep)) {
    filepath = path.resolve(path.dirname(filename), dep);
  } else {
    filepath = path.resolve(directory, dep);
  }

  if (!depExt) {
    filepath += fileExt;
  }

  return filepath;
}

/**
 * Get a list of non-core dependencies for the given file
 * @param  {String} file
 * @return {String[]}
 */
function getNonCoreDependencies(file) {
  return precinct.paperwork(file, {
    includeCore: false
  });
}
