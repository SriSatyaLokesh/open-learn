/**
 * @file src/app/layout.tsx
 * @description Root layout shell for OpenLearn.
 * Manages Google font loading (Outfit, Newsreader italic serif, JetBrains Mono),
 * page-level typography variables, tactile paper dot-grid background mesh,
 * and persistent HeaderNav and EditorialFooter wrappers.
 */

import type { Metadata } from 'next';
import { Outfit, Newsreader, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { HeaderNav } from '@/components/layout/HeaderNav';
import { EditorialFooter } from '@/components/layout/EditorialFooter';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-newsreader',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'OpenLearn — Turn Online Content Into Learning You Can Finish',
  description:
    'OpenLearn turns scattered videos from YouTube and the open web into structured learning paths with practice, progress tracking, and verified completion.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${newsreader.variable} ${jetbrainsMono.variable} scroll-smooth`}
    >
      <body className="min-h-screen bg-page text-charcoal font-sans antialiased relative selection:bg-accent/20 selection:text-charcoal">
        {/* Subtle Tactile Dot-Grid Background Mesh */}
        <div className="taste-bg-mesh" aria-hidden="true" />

        <HeaderNav />
        <main className="relative z-10 flex flex-col">{children}</main>
        <EditorialFooter />
      </body>
    </html>
  );
}
