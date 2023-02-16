Automatically loads your server build. (Your server files built at `dist/server/` &ndash; or `${build.outDir}/server` if you use [`vite.config.js` > `build.outDir`](https://vitejs.dev/config/build-options.html#build-outdir)).

## `importBuild.cjs`

Usually, `@brillout/vite-plugin-import-build` does everything automagically and you don't have to do anything.

But, in some environments, you need to help `@brillout/vite-plugin-import-build` by adding the following to your server code:

```js
// server.js

// Load server files built at dist/server/, see https://github.com/brillout/vite-plugin-import-build#importbuildcjs
import './path/to/dist/server/importBuild.cjs'

// Your server code (e.g. Express.js, Vercel Serverless/Edge, Cloudflare Worker, ...)
// ...
```

If you use [`vite.config.js` > `build.outDir`](https://vitejs.dev/config/build-options.html#build-outdir) replace `./path/to/dist/server/importBuild.cjs` with `./path/to/${build.outDir}/server/importBuild.cjs`.

> ⚠️ **If you get following error, even though 1) you're building your app _after_ installing your app's dependencies and 2) you aren't using Yarn PnP, then [open a new issue](https://github.com/brillout/vite-plugin-import-build/issues/new) &ndash; it's likely a bug that should be fixed.**
>
> ```
> Error: [@brillout/vite-plugin-import-build][Wrong Usage] Cannot find server build.
> (Re-)build your app (`$ vite build`) and try again. Note that you need the
> build your app (`$ vite build`) *after* installing your dependencies (`$ npm install`).
> ```

See https://github.com/brillout/vite-plugin-import-build/issues/4 to learn more about `importBuild.cjs` and why/when you need to import it manually.
