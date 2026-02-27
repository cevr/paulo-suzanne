import { createRequestHandler } from 'react-router';

const BUILD_PATH = './build/server/index.js';
const CLIENT_PATH = './build/client';

const build = await import(BUILD_PATH);
const handler = createRequestHandler(build, process.env.NODE_ENV ?? 'production');

const PRERENDERED: Record<string, string> = {
  '/': `${CLIENT_PATH}/index.html`,
  '/en': `${CLIENT_PATH}/en/index.html`,
};

Bun.serve({
  port: Number(process.env.PORT) || 3000,
  async fetch(req) {
    const url = new URL(req.url);
    const { pathname } = url;

    // Hashed assets — immutable cache
    if (pathname.startsWith('/assets/')) {
      const file = Bun.file(`${CLIENT_PATH}${pathname}`);
      if (await file.exists()) {
        return new Response(file, {
          headers: {
            'cache-control': 'public, max-age=31536000, immutable',
          },
        });
      }
    }

    // Static files from client build (favicon, sitemap, images, etc.)
    if (pathname !== '/') {
      const staticFile = Bun.file(`${CLIENT_PATH}${pathname}`);
      if (await staticFile.exists()) {
        return new Response(staticFile, {
          headers: { 'cache-control': 'public, max-age=3600' },
        });
      }
    }

    // Prerendered HTML for document requests (no .data suffix)
    if (!pathname.endsWith('.data') && PRERENDERED[pathname]) {
      return new Response(Bun.file(PRERENDERED[pathname]), {
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'public, max-age=3600',
        },
      });
    }

    // Everything else (data requests, unknown paths) — SSR handler
    return handler(req);
  },
});

console.log(
  `Server running on http://localhost:${process.env.PORT || 3000}`,
);
