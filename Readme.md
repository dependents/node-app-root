# app-root [![npm](http://img.shields.io/npm/v/app-root.svg)](https://npmjs.org/package/app-root) [![npm](http://img.shields.io/npm/dm/app-root.svg)](https://npmjs.org/package/app-root)

Returns a list of candidate root files for CommonJS or AMD JavaScript applications within a directory.

A root (i.e., entry point) module is one that may have dependencies but is not depended on (i.e., no other file requires it).

As an example, a root would typically be an `index.js` file in a node app or a [module-loading AMD script](http://requirejs.org/docs/api.html#data-main).
This is particularly useful for automatically deducing the entry point for r.js or browserify configurations as done in [YA](github.com/mrjoelkemp/ya).

`npm install app-root`

### Usage

```javascript
var getAppRoot = require('app-root');

// Find the application roots within the js folder
getAppRoot('./js', function (roots) {
  ...
});
```

With configurable options:

```javascript
var options = {
  ignoreDirectories: [/.+_components/, 'vendor', 'node_modules', '.git'],
  ignoreFiles: ['Gruntfile.js']
  includeNoDependencyModules: true
};

getAppRoot('./js', options, function (roots) {
  ...
});
```

Or via a shell command

`approot directory`

* Where `directory` is the directory containing roots you'd like to identify

### Options

* `ignoreDirectories`: list of directory names (strings or regex) to ignore
* `ignoreFiles`: list of file names (strings or regex) to ignore
* `includeNoDependencyModules`: Whether or not to include, as roots, modules that are independent (no one depends on) and have no dependencies

### Ignoring particular subdirectories or files

These lists passed in the options object (described above) will be managed by an [exclusion-manager](https://github.com/mrjoelkemp/node-exclusion-manager).

Directory or filenames that match elements of the above lists will be ignored when looking for candidate app roots.

*Otherwise, you'd end up with junk roots for 3rd party libraries/dependencies.*

