Automatically load the server-side build entries living at `dist/server/`.

- In a way that is statically analyzable. So that bundlers are able to discover the entire dependency tree. (Which is needed for serverless services such as Cloudflare Workers, Vercel, etc.)
- Supports Yarn PnP.

Do not use for now, as it's currently meant to be used only by [vite-plugin-ssr](https://vite-plugin-ssr.com/) and [Telefunc](https://telefunc.com/). Reach out on GitHub or Discord, if you want to use it.
