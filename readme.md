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

But `@brillout/vite-plugin-server-entry` doesn't work if you use Yarn PnP and you'll keep getting following error. The workaround is to manually import the server entry.

```bash
# Yarn PnP users always get this error:
[@brillout/vite-plugin-server-entry][Wrong Usage] Cannot find server entry. (Re-)build your app
and try again. If you still get this error, then you may need to manually import the server entry.
```

> [!WARNING]
> If you aren't using Yarn PnP and you keep getting this error, then it's a bug that should be fixed &mdash; [file a bug report](https://github.com/brillout/vite-plugin-server-entry/issues/new).

To manually import the server entry:

```js
// server.js

// Load the server entry, see https://github.com/brillout/vite-plugin-server-entry#manual-import
import './path/to/dist/server/entry.js'

// Your server code (Express.js, Vercel Serverless/Edge Function, Cloudflare Worker, ...)
// ...
```

Make sure to import `dist/server/entry.js` only in production. See [Conditional manual import](https://github.com/brillout/vite-plugin-server-entry/issues/6) if your production and development share the same server.

If the file extension is `entry.mjs`, import accordingly:

```diff
- import './path/to/dist/server/entry.js
+ import './path/to/dist/server/entry.mjs
```

If you use [`vite.config.js` > `build.outDir`](https://vitejs.dev/config/build-options.html#build-outdir) then replace `dist/server/entry.js` with `${build.outDir}/server/entry.js`.

<p align="center"><sup><a href="#readme"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a></sup></p><br/>


## What it does

> [!NOTE]
> This section is meant for library authors. As a user, you don't need to read this. If you have a problem, read [Manual import](#Manual-import) instead or reach out to maintainers.

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
