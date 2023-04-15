# `@brillout/vite-plugin-import-build`

Little utility that automatically loads the server build (files at `dist/server/`).

<br/>

## Manual import

Most of the time `@brillout/vite-plugin-import-build` can automatically import the server build (files at `dist/server/`).

But, in some situations, it doesn't work and you have to import the server build manually.

If you keep getting the following error then import the server build manually.

```
[@brillout/vite-plugin-import-build][Wrong Usage] Cannot find server build. (Re-)build your app
and try again. If you still get this error, then you may need to manually import the server build.
```

> If you aren't using Yarn PnP and you keep getting the error, then [open a new issue](https://github.com/brillout/vite-plugin-import-build/issues/new). (If you aren't using Yarn PnP then the automatic import should always work.)

To manually import the server build:

```js
// server.js

// Load server build, see https://github.com/brillout/vite-plugin-import-build#manual-import
import './path/to/dist/server/importBuild.cjs'

// Your server code (e.g. Express.js, Vercel Serverless/Edge Function, Cloudflare Worker, ...)
// ...
```

If you use [`vite.config.js` > `build.outDir`](https://vitejs.dev/config/build-options.html#build-outdir) then replace `dist/server/importBuild.cjs` with `${build.outDir}/server/importBuild.cjs`.

See [Conditional manual import](https://github.com/brillout/vite-plugin-import-build/issues/6) if your production and development share the same server entry file.

See [How it works](https://github.com/brillout/vite-plugin-import-build/issues/4) if you're curious and/or you want to learn more.
