import type { Metadata } from 'next';
import { Geist_Mono, Outfit, Syne } from 'next/font/google';

import { QueryProvider } from '@/components/providers/query-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { TRPCReactProvider } from '@/trpc/client';

import './globals.css';

const heading = Syne({
  subsets: ['latin'],
  variable: '--font-heading-family',
  weight: ['500', '600', '700', '800'],
});

const sans = Outfit({
  subsets: ['latin'],
  variable: '--font-sans-family',
  weight: ['300', '400', '500', '600', '700'],
});

const mono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono-family',
});

export const metadata: Metadata = {
  title: 'DevFlow',
  description: 'Internal developer onboarding workflows',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn('dark h-full antialiased', sans.variable, mono.variable, heading.variable)}
    >
      <body className="flex h-full min-h-full flex-col font-sans">
        <QueryProvider>
          <TRPCReactProvider>
            <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
          </TRPCReactProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
