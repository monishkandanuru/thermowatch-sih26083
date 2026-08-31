import type { Metadata } from 'next';
import { Fira_Code, Fira_Sans } from 'next/font/google';
import './globals.css';

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${firaSans.variable} ${firaCode.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
