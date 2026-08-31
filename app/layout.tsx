import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const siteUrl =
  process.env.SITE_URL ??
  'https://nritschel.github.io/aggie-orientation-app';
const socialPreviewUrl = `${siteUrl.replace(/\/$/, '')}/og.png`;

/**
 * ============================================================================
 * ROOT LAYOUT
 * ============================================================================
 *
 * The root layout is the foundational shell that wraps every route in the
 * application. It establishes the typography system, the metadata contract,
 * and the global styling baseline, ensuring a consistent and polished
 * experience across the entire student journey.
 * ============================================================================
 */

// Primary sans-serif typeface used throughout the interface.
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

// Monospace companion typeface, reserved for future code and data surfaces.
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

/**
 * Comprehensive metadata configuration covering SEO, Open Graph, and Twitter
 * card surfaces. Getting this right is crucial for organic discoverability.
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'USU Orientation Week | Logan Campus',
  description: 'Find orientation events, explore the Logan campus, and chat with an A-Team mentor.',
  openGraph: {
    title: 'USU Orientation Week',
    description: 'Your first week starts here.',
    type: 'website',
    images: [{ url: socialPreviewUrl, width: 1200, height: 630, alt: 'Aggie Launch orientation week demo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'USU Orientation Week',
    description: 'Your first week starts here.',
    images: [socialPreviewUrl],
  },
};

/**
 * Renders the root HTML document shell.
 *
 * @param children - The route content to render inside the document body.
 * @returns The fully composed document shell.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
