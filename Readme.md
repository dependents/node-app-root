Returns a list of candidate root files for CommonJS or AMD JavaScript applications within a directory
by ranking each .js file based on its largest, cumulative, non-core degree (i.e., sum of non-core
dependencies across the entire dependency graph).

`npm install app-root`

*This is useful for automatically deducing the entry point for r.js or browserify configurations.*

```javascript
var getAppRoot = require('app-root');

// Find the application roots within the js folder
getAppRoot('./js', function (roots) {
  ...
})
```

# TODO:

* Accept option (as second param) object with subdirectories to ignore in directory traversal (i.e., node_modules, vendor, bower_components)
 * Otherwise, we'll get non-relevant roots