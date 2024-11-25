- [What is this?](#what-is-this)
- [Manual import](#manual-import)
- [How it works](#how-it-works)

&nbsp;


## What is this?

`@brillout/vite-plugin-server-entry` does two things:
 - Generates the server production entry `dist/server/entry.js`.
 - Automatically imports it.

[Vike](https://vike.dev) and [Telefunc](https://telefunc.com) automatically use and configure this plugin on your behalf: there is nothing for you to do and you can usually ignore this plugin.

<p align="center"><sup><a href="#readme"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a></sup></p><br/>


## Manual import

Normally the file `dist/server/entry.js` is automatically imported.

But this automatic importing doesn't work with Yarn PnP and certain Docker configurations, and you'll keep getting the following error:

```
[@brillout/vite-plugin-server-entry][Wrong Usage] The server production entry is missing.
(Re-)build your app and try again. If you still get this error, then you need to manually
import the server production entry.
```

The workaround is to manually import `dist/server/entry.js` in your server code:

```js
// server.js

// Add this import at the begining of your server code
import './path/to/dist/server/entry.js'

// ...
// your server code (Express.js, Hono, Cloudflare Worker, Vercel, ...)
// ...
```

Make sure to import `dist/server/entry.js` only in production, see [Conditional manual import](https://github.com/brillout/vite-plugin-server-entry/issues/6).

> [!NOTE]
> The import path may be different:
> - The file extension may be different than `.js`. (For example `dist/server/entry.mjs`.)
> - The build directory location may be different than `dist/`. (For example `build/server/entry.js` if you set [`vite.config.js` > `build.outDir`](https://vitejs.dev/config/build-options.html#build-outdir) to `build`.)
>
> ```diff
> - import '../dist/server/entry.js
> + import '../build/server/entry.mjs
> ```

> [!NOTE]
> If you use [Vike](https://vike.dev/) then make sure that you import `dist/server/entry.js` before calling [`renderPage()`](https://vike.dev/renderPage).

> [!NOTE]
> If you aren't using Yarn PnP nor Docker and you keep getting the `The server production entry is missing.` error, then [file a bug report](https://github.com/brillout/vite-plugin-server-entry/issues/new). Manually importing should only be needed for Yarn PnP and Docker users.

> [!NOTE]
> Technically, you need to manually import if and only if:
>  - your `node_modules/` directory is immutable, or
>  - you remove/re-install `node_modules/` *after* building your app for production.
>
> If you want to learn more, see [How it works](#how-it-works).


<p align="center"><sup><a href="#readme"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a></sup></p><br/>


## How it works

> [!NOTE]
> You usually don't need to read this. If you have a problem, reading the section [Manual import](#Manual-import) is usually enough.

`@brillout/vite-plugin-server-entry` does two things:
 - Generates a "server production entry" file `dist/server/entry.js`.
 - Generates a "auto importer" file `node_modules/@brillout/vite-plugin-server-entry/dist/runtime/autoImporter.js`.

The *server production entry*, which is located at `dist/server/entry.js`, enables tools such as Vike and Telefunc to consolidate their production entry into a single file. It loads the user files built for production which are located at `dist/**` (e.g. the built `.telefunc.js` user files for Telefunc, and the built `+Page.js` user files for Vike).

The *auto importer* file, which is located at `node_modules/@brillout/vite-plugin-server-entry/dist/runtime/autoImporter.js`, automatically imports `dist/server/entry.js` on your behalf, so that you don't have to manually import `dist/server/entry.js` yourself as shown in the following. That's the only purpose of the auto importer.

```js
// server/index.js (*your* server entry)

// Without the auto importer, you would have to manually import dist/server/entry.js
// yourself, for example like this:
if (process.env.NODE_ENV === 'production') {
  await import('../dist/server/entry.js')
}
```

See [How the auto importer works](https://github.com/brillout/vite-plugin-server-entry/issues/4) for more information.

<p align="center"><sup><a href="#readme"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a></sup></p><br/>
