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
import { LanguageProvider } from './lib/language-provider';
import type { Lang } from './lib/language';
import { getLanguage } from './lib/language.server';

const CANONICAL_URL = 'https://pauloetsuzanne.com/';

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'preload',
    href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap&subset=latin',
    as: 'style',
  },
  {
    rel: 'preload',
    href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap&subset=latin',
    as: 'style',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap&subset=latin',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap&subset=latin',
  },
  { rel: 'canonical', href: CANONICAL_URL },
  { rel: 'alternate', hrefLang: 'fr', href: CANONICAL_URL },
  { rel: 'alternate', hrefLang: 'en', href: CANONICAL_URL },
  { rel: 'alternate', hrefLang: 'x-default', href: CANONICAL_URL },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Restaurant',
  name: 'Paulo & Suzanne',
  url: CANONICAL_URL,
  telephone: '+1-514-336-5561',
  email: 'info@pauloetsuzanne.com',
  image: `${CANONICAL_URL}indoor.avif`,
  menu: `${CANONICAL_URL}menu.pdf`,
  servesCuisine: ['Poutine', 'Burgers', 'Québécoise'],
  priceRange: '$$',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '5501 Boul Gouin O',
    addressLocality: 'Montréal',
    addressRegion: 'QC',
    postalCode: 'H4J 1C8',
    addressCountry: 'CA',
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
      opens: '10:00',
      closes: '03:00',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: 'Friday',
      opens: '10:00',
      closes: '23:59',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: 'Saturday',
      opens: '00:00',
      closes: '23:59',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: 'Sunday',
      opens: '00:00',
      closes: '03:00',
    },
  ],
  sameAs: [
    'https://www.instagram.com/pauloetsuzanne_officiel/',
    'https://www.facebook.com/pauloetsuzanne247/',
  ],
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const lang = await getLanguage(request);
  return { lang };
};

export function Layout({ children }: { children: React.ReactNode }) {
  const matches = useMatches();
  const rootData = matches.find((m) => m.id === 'root')?.data as
    | { lang: Lang }
    | undefined;
  const lang = rootData?.lang ?? 'fr';

  return (
    <html lang={lang}>
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
        <Meta />
        <Links />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
  const { lang } = loaderData;
  return (
    <LanguageProvider initialLanguage={lang}>
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
