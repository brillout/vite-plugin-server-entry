- [What is this?](#what-is-this)
- [Manual import](#manual-import)
- Learn more (for library authors)
  - [How it works](#how-it-works)
  - [When to use this](#when-to-use-this)

&nbsp;


## What is this?

`@brillout/vite-plugin-server-entry` does two things:
 - Generates the server production entry `dist/server/entry.js`.
 - Automatically imports it.

[Vike](https://vike.dev) and [Telefunc](https://telefunc.com) automatically use and configure this plugin on your behalf: there is nothing for you to do and you can usually ignore this plugin.

&nbsp;


## Manual import

Normally the file `dist/server/entry.js` is automatically imported.

But this automatic importing doesn't work with Yarn PnP, some Docker configurations, and certain production setups. You'll keep getting the following error:

```
[@brillout/vite-plugin-server-entry][Wrong Usage] The server production entry is missing.
(Re-)build your app and try again. If you still get this error, then you need to manually
import the server production entry.
```

The workaround is to manually import `dist/server/entry.js` in your server code:

```js
// server/index.js

// Add this at the beginning of your server entry, or elsewhere at server start
// before receiving HTTP requests.
if (process.env.NODE_ENV === 'production') {
  await import('../dist/server/entry.js') // Or wherever the build directory is
}

// ...
// Your server code (Express.js, Hono, Cloudflare Worker, Vercel, ...)
// ...
```

> [!NOTE]
> The import path may be different:
> - The file extension may differ from `.js` (e.g. `dist/server/entry.mjs`).
> - The build directory may be named and located differently than `dist/` (e.g. `build/server/entry.js` if you or your framework set [`vite.config.js` > `build.outDir`](https://vitejs.dev/config/build-options.html#build-outdir) to `build`).
>
> ```diff
> - import '../dist/server/entry.js
> + import '../build/server/entry.mjs
> ```

> [!NOTE]
> If top-level `await` isn't available, then check out the alternative approaches to conditionally import `dist/server/entry.js` only in production at [Conditional manual import](https://github.com/brillout/vite-plugin-server-entry/issues/6).

> [!NOTE]
> `@brillout/vite-plugin-server-entry` generates a file `node_modules/@brillout/vite-plugin-server-entry/dist/runtime/autoImporter.js`, which automatically imports `dist/server/entry.js`.
>
> The `node_modules/.../autoImporter.js` file is generated at build-time. Consequently, it breaks if:
>  - Your `node_modules/` directory is immutable (Yarn PnP): `node_modules/.../autoImporter.js` cannot be written.
>  - You remove or (re-)install `node_modules/` *after* building your app for production: `node_modules/.../autoImporter.js` is lost.
>    - E.g. you build locally, copy `dist/` to the deployment server, and then run `$ npm install` there.
>    - Some Docker configurations move `dist/`, then re-install `node_modules/`.
>
> In those situations, you must manually import the server entry.
>
> If you aren't using Yarn PnP and you don't modify `node_modules/` after building, then you don't need to manually import and you shouldn't keep getting `The server production entry is missing`. If you do, then [file a bug report](https://github.com/brillout/vite-plugin-server-entry/issues/new).
>
> To learn more, see [How it works](#how-it-works).

&nbsp;


## How it works

> [!NOTE]
> As a user, you usually don't need to read this. If you have a problem, reading the section [Manual import](#Manual-import) is usually enough.

`@brillout/vite-plugin-server-entry` does two things:
 - Generates a *server production entry*, the file `dist/server/entry.js`.
 - Generates a *auto importer*, the file `node_modules/@brillout/vite-plugin-server-entry/dist/runtime/autoImporter.js`.

The *server production entry* (`dist/server/entry.js`) enables tools like [Vike](https://vike.dev) and [Telefunc](https://telefunc.com) to combine their production entries into a single file.

The *auto importer* file (`node_modules/@brillout/vite-plugin-server-entry/dist/runtime/autoImporter.js`) automatically imports `dist/server/entry.js`, saving you the need to do it manually:

```js
// server/index.js

// Without the auto importer, you need to manually import dist/server/entry.js
if (process.env.NODE_ENV === 'production') {
  await import('../dist/server/entry.js')
}
```

> [!NOTE]
> The `autoImporter.js` file is generated inside `node_modules/` — not in the build directory (`dist/`) — because the whole point of the auto importer is to know where the build directory is. The runtime code of tools (e.g. Telefunc) lives in `node_modules/` and cannot know where the build directory is. The auto importer bridges that gap in the simplest and most minimal way possible.

See [How the auto importer works](https://github.com/brillout/vite-plugin-server-entry/issues/4) for more information.

&nbsp;


## When to use this

There is only one valid use case for `@brillout/vite-plugin-server-entry`: when the server entry isn't processed by Vite.

For example, in the following, Vike is used with a vanilla Node.js server that isn't processed by Vite:
- [Vike > API > `renderPage()` > Without `+serverEntry.js`](https://vike.dev/renderPage#without-serverentry-js)
- [Vike > Integration > `+server` > Extra control > `+serverEntry.js` => `$ node server/index.js`](https://vike.dev/server#serverentry-js-node-server-index-js)

> [!NOTE]
> The fundamental problem here is that the user's `server/index.js` (not processed by Vite) cannot magically load the Vite entry of Vike nor of tools like Telefunc — the vanilla Node.js server needs to import the Vite land in one way or another.

When the server entry is processed by Vite then `@brillout/vite-plugin-server-entry` is useless: using a Vite virtual module is dramatically simpler and fundamentally more reliable.

> [!NOTE]
> Another feature of  `@brillout/vite-plugin-server-entry` is that it bundles the entries of various tools (e.g. Vike's entry and Telefunc's entry) into a single entry.
>
> Ideally, in the future (see [`vitejs/ecosystem#19` - Server entry injection](https://github.com/vitejs/ecosystem/issues/19)), Vite natively supports this instead of requiring a tool like `@brillout/vite-plugin-server-entry`. (The fundamental problem here is: how can a tool like Telefunc inject its entry into the server entry defined by a Vite framework like Vike or SvelteKit?)
>
> In the short term, this can be a valid reason to use `@brillout/vite-plugin-server-entry` although we encourage to finding solutions only using Vite instead (while nugding the Vite team to work on this problem).
