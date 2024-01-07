throw new Error(
  "Module '@brillout/vite-plugin-server-entry' doesn't exist. Only '@brillout/vite-plugin-server-entry/plugin' and '@brillout/vite-plugin-server-entry/importServerEntry' does."
)

// Avoid:
// ```
// 8:25:31 PM [vite][request(1)] @brillout/vite-plugin-server-entry doesn't appear to be written in CJS, but also doesn't appear to be a valid ES module (i.e. it doesn't have "type": "module" or an .mjs extension for the entry point). Please contact the package author to fix.
// ```
module.exports = {}
