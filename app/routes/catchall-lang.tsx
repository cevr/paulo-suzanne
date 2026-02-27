import { redirect } from 'react-router';

import type { Route } from './+types/catchall-lang';

export const loader = ({ params }: Route.LoaderArgs) => {
  if (params.lang === 'en') {
    return redirect('/en');
  }
  return redirect('/');
};
