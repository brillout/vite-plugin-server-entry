- [What is this?](#what-is-this)
- [Manual import](#manual-import)
- [How it works](#how-it-works)

&nbsp;


## What is this?

`@brillout/vite-plugin-server-entry` does two things:
 - Generates a server entry for production at `dist/server/entry.js`.
 - Automatically loads it.

[Vike](https://vike.dev) and [Telefunc](https://telefunc.com) automatically use and configure this plugin on your behalf: there is nothing for you to do and you can usually ignore this plugin.

<p align="center"><sup><a href="#readme"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a></sup></p><br/>


## Manual import

For most users, `@brillout/vite-plugin-server-entry` is able to automatically import the production server entry `dist/server/entry.js`.

However, this automatic importing doesn't work with Yarn PnP and certain Docker configurations, and you'll keep getting the following error:

```
[@brillout/vite-plugin-server-entry][Wrong Usage] Cannot find server entry. (Re-)build
your app and try again. If you still get this error, then you may need to manually
import the server entry.
```

> [!WARNING]
> If you aren't using Yarn PnP nor Docker and you keep getting this error, then it's most likely a bug. Please [file a bug report](https://github.com/brillout/vite-plugin-server-entry/issues/new).

> [!NOTE]
> More precisely, it doesn't work if your `node_modules/` directory is immutable or if you remove/reset `node_modules/` **after** you build your app for production. For more information, see [How it works](#how-it-works).

The workaround is to manually import the production server entry:

```js
// server.js

// See https://github.com/brillout/vite-plugin-server-entry#manual-import
import './path/to/dist/server/entry.js'

// Your server code (Express.js, Vercel Serverless/Edge Function, Cloudflare Worker, ...)
// ...
```

Make sure to import `dist/server/entry.js` only in production, see [Conditional manual import](https://github.com/brillout/vite-plugin-server-entry/issues/6).

> [!NOTE]
> The file extension may be different than `.js` (e.g. `.mjs`), and the build directory location is determined by [`vite.config.js` > `build.outDir`](https://vitejs.dev/config/build-options.html#build-outdir) which may be different than `dist/` (e.g. `build/`).
>
> ```diff
> - import './path/to/dist/server/entry.js
> + import './path/to/build/server/entry.mjs
> ```

<p align="center"><sup><a href="#readme"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a></sup></p><br/>


## How it works

> [!NOTE]
> You usually don't need to read this. If you have a problem, reading the section [Manual import](#Manual-import) is usually enough.

`@brillout/vite-plugin-server-entry` does two things:
 - Generates a "server entry" file at `dist/server/entry.js`.
 - Generates a "auto importer" file at `node_modules/@brillout/vite-plugin-server-entry/dist/importServerEntry/autoImporter.js`.

The *server entry for production*, which is located at `dist/server/entry.js`, enables tools such as Vike and Telefunc to consolidate their production entry into a single file. It loads the user files built for production which are located at `dist/**` (e.g. the built `.telefunc.js` user files for Telefunc, and the built `+Page.js` user files for Vike).

The *auto importer* file, which is located at `node_modules/@brillout/vite-plugin-server-entry/dist/importServerEntry/autoImporter.js`, automatically imports `dist/server/entry.js` on your behalf, so that you don't have to manually import `dist/server/entry.js` yourself as shown in the following. That's the only purpose of the auto importer.

```js
// server/index.js (*your* server entry)

// Without the auto importer, you would have to manually import dist/server/entry.js
// yourself like this:
if (process.env.NODE_ENV === 'production') {
  await import('../dist/server/entry.js')
}
```

See [How the auto importer works](https://github.com/brillout/vite-plugin-server-entry/issues/4) for more information.

<p align="center"><sup><a href="#readme"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a></sup></p><br/>
