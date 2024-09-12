- [What is this?](#what-is-this)
- [Manual import](#manual-import)
- [What it does](#what-it-does)

&nbsp;


## What is this?

`@brillout/vite-plugin-server-entry` generates a server entry `dist/server/entry.js` and automatically loads it.

[Vike](https://vike.dev) and [Telefunc](https://telefunc.com) automatically add this plugin to your Vite app: there is nothing for you to do and you can usually ignore this plugin.

<p align="center"><sup><a href="#readme"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a></sup></p><br/>


## Manual import

Most of the time `@brillout/vite-plugin-server-entry` is able to automatically import the server entry `dist/server/entry.js` &mdash; there is nothing for you to do.

But it doesn't work with Yarn PnP and certain Docker configurations. You'll keep getting the following error.

```bash
[@brillout/vite-plugin-server-entry][Wrong Usage] Cannot find server entry. (Re-)build your app
and try again. If you still get this error, then you may need to manually import the server entry.
```

> [!WARNING]
> If you aren't using Yarn PnP nor Docker and you keep getting this error, then it's most likely a bug &mdash; [please file a bug report](https://github.com/brillout/vite-plugin-server-entry/issues/new).

> [!NOTE]
> More precisely, it doesn't work if your `node_modules/` directory is immutable or if you remove/reset `node_modules/` *after* building your app for production. For more information, see [What it does](#what-it-does).

The workaround is to manually import the server entry:

```js
// server.js

// Load the server entry, see https://github.com/brillout/vite-plugin-server-entry#manual-import
import './path/to/dist/server/entry.js'

// Your server code (Express.js, Vercel Serverless/Edge Function, Cloudflare Worker, ...)
// ...
```

Make sure to import `dist/server/entry.js` only in production, see [Conditional manual import](https://github.com/brillout/vite-plugin-server-entry/issues/6).

If the file extension is `entry.mjs`, import accordingly:

```diff
- import './path/to/dist/server/entry.js
+ import './path/to/dist/server/entry.mjs
```

If you use [`vite.config.js` > `build.outDir`](https://vitejs.dev/config/build-options.html#build-outdir) then replace `dist/server/entry.js` with `${build.outDir}/server/entry.js`.

<p align="center"><sup><a href="#readme"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a></sup></p><br/>


## What it does

> [!NOTE]
> You usually don't need to read this. If you have a problem, reading [Manual import](#Manual-import) is usually enough.

`@brillout/vite-plugin-server-entry` does two things:
 - Generates a "server entry" file at `dist/server/entry.js`.
 - Generates a "auto importer" file at `node_modules/@brillout/vite-plugin-server-entry/dist/importServerEntry/autoImporter.js`.

The server entry (`dist/server/entry.js`) enables tools, such as Vike and Telefunc, to consolidate their entry files into a single file. It enables tools to load built user files (e.g. for Telefunc built `.telefunc.js` user files, and for Vike built `+Page.js` user files).

The *auto importer* file (`node_modules/@brillout/vite-plugin-server-entry/dist/importServerEntry/autoImporter.js`) automatically imports `dist/server/entry.js`, so that the user doesn't have to manually import `dist/server/entry.js` himself as shown in the following. That's the only purpose of the auto importer.

```js
// server/index.js (the user's server file)

// Without the auto importer, the user would have to manually import dist/server/entry.js
// in his server entry file like this:
if (process.env.NODE_ENV === 'production') {
  await import('../dist/server/entry.js')
}
```

See [How the auto importer works](https://github.com/brillout/vite-plugin-server-entry/issues/4) to learn more.

<p align="center"><sup><a href="#readme"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a></sup></p><br/>
