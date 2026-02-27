const CLIENT_PATH = './build/client';

const PRERENDERED: Record<string, string> = {
  '/': `${CLIENT_PATH}/index.html`,
  '/en': `${CLIENT_PATH}/en/index.html`,
};

const DATA_FILES: Record<string, string> = {
  '/_root.data': `${CLIENT_PATH}/_root.data`,
  '/en.data': `${CLIENT_PATH}/en.data`,
};

Bun.serve({
  port: Number(process.env.PORT) || 3000,
  async fetch(req) {
    const url = new URL(req.url);
    const { pathname } = url;

    // Prerendered HTML — serve directly
    const htmlPath = PRERENDERED[pathname];
    if (htmlPath) {
      return new Response(Bun.file(htmlPath), {
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'public, max-age=3600',
        },
      });
    }

    // Client-side navigation data files
    const dataPath = DATA_FILES[pathname];
    if (dataPath) {
      const file = Bun.file(dataPath);
      if (await file.exists()) {
        return new Response(file, {
          headers: { 'cache-control': 'public, max-age=3600' },
        });
      }
    }

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

    // Static files from client build (favicon, sitemap, etc.)
    if (pathname !== '/') {
      const staticFile = Bun.file(`${CLIENT_PATH}${pathname}`);
      if (await staticFile.exists()) {
        return new Response(staticFile, {
          headers: { 'cache-control': 'public, max-age=3600' },
        });
      }
    }

    // Any other path — redirect to /
    return Response.redirect(new URL('/', url), 302);
  },
});

console.log(
  `Server running on http://localhost:${process.env.PORT || 3000}`,
);
