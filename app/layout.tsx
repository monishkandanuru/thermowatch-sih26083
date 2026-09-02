import type { Metadata, Viewport } from 'next';
import { Fira_Code, Fira_Sans } from 'next/font/google';
import './globals.css';
import { PwaRegister } from '@/components/pwa-register';

const firaSans = Fira_Sans({
  variable: '--font-fira-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

const firaCode = Fira_Code({
  variable: '--font-fira-code',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ThermoWatch — Heatwave Early Warning',
  description:
    'District heat-risk intelligence, early warning and response support for India.',
  manifest: '/manifest.webmanifest',
  applicationName: 'ThermoWatch',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ThermoWatch',
  },
  openGraph: {
    title: 'ThermoWatch — Heatwave Early Warning',
    description:
      'District heat-risk intelligence, early warning and response support for India.',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'ThermoWatch heatwave early warning dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ThermoWatch — Heatwave Early Warning',
    description:
      'District heat-risk intelligence, early warning and response support for India.',
    images: ['/og.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#10213f',
  colorScheme: 'light',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${firaSans.variable} ${firaCode.variable} antialiased`}>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
