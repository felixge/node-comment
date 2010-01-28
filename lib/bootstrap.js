// This is used to setup require paths
// Also mixes in the sys module to make debugging easier
process.mixin(require('sys'));

var
  path = require('path'),
  rootDir = path.dirname(__dirname);

require.paths.unshift(rootDir);
process.chdir(rootDir);