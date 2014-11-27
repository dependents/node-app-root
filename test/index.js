var getAppRoot = require('../');
var assert = require('assert');

function extend(o, o2) {
  for (var prop in o2) {
    o[prop] = o2[prop];
  }
}

describe('app-root', function() {
  var options = {
    ignoreDirectories: ['bower_components'],
    ignoreFiles: ['index.js']
  };

  it('omits no dependency modules by default', function(done) {
    var opts = {
      directory: __dirname + '/commonjs',
      success: function(root) {
        assert(!root.some(function(r) {
          return r.indexOf('noDep.js') !== -1;
        }));
        done();
      }
    };

    getAppRoot(opts);
  });

  describe('includeNoDependencyModules', function() {
    it('includes no dependency modules if set', function(done) {
      var opts = {
        directory: __dirname + '/commonjs',
        includeNoDependencyModules: true,
        success: function(root) {
          assert(root.some(function(r) {
            return r.indexOf('noDep.js') !== -1;
          }));
          done();
        }
      };

      getAppRoot(opts);
    });
  });

  describe('ignoreDirectories', function() {
    it('does not ignore any directories by default', function(done) {
      var opts = {
        directory: __dirname + '/amd',
        success: function(root) {
          assert(root.some(function(r) {
            return r.indexOf('bower_components') !== -1;
          }));
          done();
        }
      };

      getAppRoot(opts);
    });

    it('ignores processing files within supplied directories', function(done) {
      var opts = {
        directory: __dirname + '/amd',
        ignoreDirectories: options.ignoreDirectories,
        success: function(root) {
          assert(!root.some(function(r) {
            return r.indexOf('bower_components') !== -1;
          }));
          done();
        }
      };

      getAppRoot(opts);
    });
  });

  it('throws if a directory is not supplied', function() {
    assert.throws(function() {
      getAppRoot();
    });
  });

  it('throws if a success callback is not supplied', function() {
    assert.throws(function() {
      getAppRoot({
        directory: __dirname
      });
    });
  });

  it('finds the roots of an entire directory of multiple apps', function(done) {
    var opts = {
      directory: __dirname,
      success: function(root) {
        assert(root.length === 3);
        assert(root[0].indexOf('a2.js') !== -1);
        assert(root[1].indexOf('a2.js') !== -1);
        assert(root[2].indexOf('root.scss') !== -1);
        done();
      }
    };

    extend(opts, options);

    getAppRoot(opts);
  });

  describe('commonjs', function() {
    it('finds the roots of a commonjs app', function(done) {
      var opts = {
        directory: __dirname + '/commonjs',

        success: function(root) {
          assert(root.length === 1);
          assert(root[0].indexOf('a2.js') !== -1);
          done();
        }
      };

      extend(opts, options);

      getAppRoot(opts);
    });
  });

  describe('amd', function() {
    it('finds the roots of an amd app', function(done) {
      var opts = {
        directory: __dirname + '/amd',
        success: function(root) {
          assert(root.length === 1);
          assert(root[0].indexOf('a2.js') !== -1);
          done();
        }
      };

      extend(opts, options);

      getAppRoot(opts);
    });

    it.skip('handles aliased modules', function() {});
  });

  describe('sass', function() {
    it('finds the roots of a sass codebase', function(done) {
      var opts = {
        directory: __dirname + '/sass',
        success: function(root) {
          assert(root.length === 1);
          assert(root[0].indexOf('root.scss') !== -1);
          done();
        }
      };

      getAppRoot(opts);
    });
  });
});
