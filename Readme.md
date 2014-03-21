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

### Ignoring particular subdirectories

Supply an options object as the second parameter with a field `ignore`
that contains a list of the directories that you want to ignore
when looking for candidate app roots.

*Otherwise, you'd end up with junk roots for 3rd party libraries/dependencies.*

```javascript
var options = {
  ignore: ['bower_components', 'vendor', 'node_modules', '.git']
};

getAppRoot('./js', options, function (roots) {
  ...
})
```