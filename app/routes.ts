import {
  index,
  layout,
  route,
  type RouteConfig,
} from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('/en', 'routes/home.tsx', { id: 'routes/home-en' }),
  route('/admin/login', 'routes/admin/login.tsx'),
  route('/admin/logout', 'routes/admin/logout.tsx'),
  layout('routes/admin/_layout.tsx', [
    route('/admin', 'routes/admin/_index.tsx'),
  ]),
  route('/:lang', 'routes/catchall-lang.tsx'),
] satisfies RouteConfig;
