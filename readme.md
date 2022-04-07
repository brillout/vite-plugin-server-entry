Automatically import `dist/server/` assets.

The import paths are statically analyzable, enabling bundlers to discover the entire dependency tree. (Which is needed for serverless services such as Cloudflare Workers, Vercel, etc.)

Supports Yarn PnP.

For more information, create a new GitHub ticket.

It's currently used by [`vite-plugin-ssr`](https://vite-plugin-ssr.com/) and [Telefunc](https://telefunc.com/).
