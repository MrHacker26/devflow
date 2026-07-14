import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { QueryProvider } from '@/components/providers/query-provider';
import { cn } from '@/lib/utils';
import { TRPCReactProvider } from '@/trpc/client';

import './globals.css';

const geistHeading = Geist({
  subsets: ['latin'],
  variable: '--font-heading',
});

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
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
      className={cn(
        'dark h-full',
        'antialiased',
        geistSans.variable,
        geistMono.variable,
        geistHeading.variable,
      )}
    >
      <body className="flex min-h-full flex-col">
        <QueryProvider>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
