Returns a list of candidate root files for CommonJS or AMD JavaScript applications within a directory.

A root/entry-point file is one that has dependencies but is not depended on (i.e., no other file requires it).

`npm install app-root`

*This is useful for automatically deducing the entry point for r.js or browserify configurations.*

```javascript
var getAppRoot = require('app-root');

// Find the application roots within the js folder
getAppRoot('./js', function (roots) {
  ...
})
```

### Ignoring particular subdirectories or files

Supply an options object as the second parameter.

Supported options:

* `ignoreDirectories`: list of directory names (strings or regex) to ignore
* `ignoreFiles`: list of file names (strings or regex) to ignore

These lists will be managed by an [exclusion-manager](https://github.com/mrjoelkemp/node-exclusion-manager).

Directory or filenames that match elements of the above lists will be ignored when looking for candidate app roots.

*Otherwise, you'd end up with junk roots for 3rd party libraries/dependencies.*

```javascript
var options = {
  ignoreDirectories: [/.+_components/, 'vendor', 'node_modules', '.git'],
  ignoreFiles: ['Gruntfile.js']
};

getAppRoot('./js', options, function (roots) {
  ...
})
```