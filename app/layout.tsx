import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

/**
 * Canonical site URL. The Pages workflow passes SITE_URL; the fallback is the
 * same address so local and preview builds resolve absolute URLs identically.
 * The trailing slash matters: without it, relative asset URLs resolve against
 * the parent path and drop the repository segment.
 */
const SITE_URL = process.env.SITE_URL ?? 'https://nritschel.github.io/aggie-orientation-app';
const siteBase = new URL(SITE_URL.endsWith('/') ? SITE_URL : `${SITE_URL}/`);

export const metadata: Metadata = {
  metadataBase: siteBase,
  title: 'USU Orientation Week | Logan Campus',
  description: 'Find orientation events, explore the Logan campus, and chat with an A-Team mentor.',
  openGraph: {
    title: 'USU Orientation Week',
    description: 'Your first week starts here.',
    type: 'website',
    images: [{ url: 'og.jpg', width: 1400, height: 735, alt: 'Aggie Launch orientation week demo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'USU Orientation Week',
    description: 'Your first week starts here.',
    images: ['og.jpg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
