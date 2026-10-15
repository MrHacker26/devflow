import { headers } from 'next/headers';

import { HomeHero } from '@/components/home-hero';
import { auth } from '@/lib/auth';

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  return <HomeHero signedIn={Boolean(session)} />;
}
