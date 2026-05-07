import './app.css';

import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useMatches,
} from 'react-router';

import type { Route } from './+types/root';
import { Toaster } from './components/ui/sonner';
import { loadContent } from './content/loader';
import type { SiteContent } from './content/schema';
import { LanguageProvider } from './lib/language-provider';
import type { Lang } from './lib/language';

const CANONICAL_URL = 'https://pauloetsuzanne.com/';

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap&subset=latin',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap&subset=latin',
  },
  { rel: 'alternate', hrefLang: 'fr', href: CANONICAL_URL },
  { rel: 'alternate', hrefLang: 'en', href: `${CANONICAL_URL}en` },
  { rel: 'alternate', hrefLang: 'x-default', href: CANONICAL_URL },
  { rel: 'icon', href: '/favicon.ico' },
  { rel: 'apple-touch-icon', href: '/favicon.ico' },
];

function buildJsonLd(jsonLd: SiteContent['jsonLd']) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: jsonLd.name,
    url: CANONICAL_URL,
    telephone: jsonLd.telephone,
    email: jsonLd.email,
    image: `${CANONICAL_URL}${jsonLd.imageKey}`,
    menu: `${CANONICAL_URL}${jsonLd.menuPath.replace(/^\//, '')}`,
    servesCuisine: jsonLd.servesCuisine,
    priceRange: jsonLd.priceRange,
    address: {
      '@type': 'PostalAddress',
      ...jsonLd.address,
    },
    openingHoursSpecification: jsonLd.openingHours.map((spec) => ({
      '@type': 'OpeningHoursSpecification',
      ...spec,
    })),
    sameAs: jsonLd.sameAs,
  };
}

export const loader = async ({ request }: Route.LoaderArgs) => {
  const url = new URL(request.url);
  const lang: Lang = url.pathname.startsWith('/en') ? 'en' : 'fr';
  const content = await loadContent();
  return { lang, content };
};

export function Layout({ children }: { children: React.ReactNode }) {
  const matches = useMatches();
  const rootData = matches.find((m) => m.id === 'root')?.data as
    | { lang: Lang; content: SiteContent }
    | undefined;
  const lang = rootData?.lang ?? 'fr';
  const jsonLd = rootData?.content ? buildJsonLd(rootData.content.jsonLd) : null;

  return (
    <html lang={lang}>
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
        <meta
          name="theme-color"
          content="#d41111"
        />
        <Meta />
        <Links />
        {jsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        )}
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App({ loaderData }: Route.ComponentProps) {
  const { lang, content } = loaderData;
  return (
    <LanguageProvider initialLanguage={lang} content={content}>
      <Outlet />
      <Toaster />
    </LanguageProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!';
  let details = 'An unexpected error occurred.';
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error';
    details =
      error.status === 404
        ? 'The requested page could not be found.'
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="container mx-auto p-4 pt-16">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
