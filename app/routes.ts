import { index, route, type RouteConfig } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('/en', 'routes/home.tsx', { id: 'routes/home-en' }),
  route('/:lang', 'routes/catchall-lang.tsx'),
] satisfies RouteConfig;
