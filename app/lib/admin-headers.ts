export const adminSecurityHeaders = (): Record<string, string> => ({
  'Cache-Control': 'private, no-store, max-age=0',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'same-origin',
  'X-Robots-Tag': 'noindex, nofollow',
});

export const adminMeta = () => [{ name: 'robots', content: 'noindex, nofollow' }];
