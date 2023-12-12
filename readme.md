## What is this?

This Vite plugin automatically loads your server build (i.e. your files at `dist/server/`).

[Vite-plugin-ssr](https://vite-plugin-ssr.com) and [Telefunc](https://telefunc.com) automatically add this plugin to your Vite app.


## Manual import

Usually this Vite plugin is able to automatically import your server build (i.e. your files at `dist/server/`) &mdash; there is nothing for you to do.

But the plugin doesn't work if you use Yarn PnP and you'll keep getting following error. The workaround is to manually import your server build.

```bash
# Yarn PnP users always get this error:
[@brillout/vite-plugin-import-build][Wrong Usage] Cannot find server build. (Re-)build your app
and try again. If you still get this error, then you may need to manually import the server build.
```

> [!WARNING]
> If you aren't using Yarn PnP and you keep getting this error, then it's a bug that should be fixed &mdash; please [open a new issue](https://github.com/brillout/vite-plugin-import-build/issues/new).

To manually import your server build:

```js
// server.js

// Load server build, see https://github.com/brillout/vite-plugin-import-build#manual-import
import './path/to/dist/server/importBuild.cjs'

// Your server code (Express.js, Vercel Serverless/Edge Function, Cloudflare Worker, ...)
// ...
```

Make sure to import `dist/server/importBuild.cjs` only in production. See [Conditional manual import](https://github.com/brillout/vite-plugin-import-build/issues/6) if your production and development share the same server entry file.

If you use [`vite.config.js` > `build.outDir`](https://vitejs.dev/config/build-options.html#build-outdir) then replace `dist/server/importBuild.cjs` with `${build.outDir}/server/importBuild.cjs`.

See [How it works](https://github.com/brillout/vite-plugin-import-build/issues/4) if you're curious and/or you want to learn more.
