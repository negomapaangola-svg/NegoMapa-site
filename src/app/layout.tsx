import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: '700',
  variable: '--font-heading',
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: 'NegóMapa - Serviços e Empregos em Angola',
    template: '%s | NegóMapa',
  },
  description: 'A plataforma líder em Angola para encontrar serviços profissionais e oportunidades de emprego. Conectamos pessoas e empresas.',
  keywords: ['serviços', 'empregos', 'Angola', 'trabalho', 'profissionais', 'vagas', 'freelance'],
  authors: [{ name: 'NegóMapa' }],
  creator: 'NegóMapa',
  publisher: 'NegóMapa',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'pt_AO',
    siteName: 'NegóMapa',
    title: 'NegóMapa - Serviços e Empregos em Angola',
    description: 'A plataforma líder em Angola para encontrar serviços profissionais e oportunidades de emprego.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NegóMapa',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NegóMapa',
    description: 'A plataforma líder em Angola para encontrar serviços profissionais e oportunidades de emprego.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAF7F2' },
    { media: '(prefers-color-scheme: dark)', color: '#0B1F2E' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-AO" className={`${inter.variable} ${spaceGrotesk.variable} h-full`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <a href="#main-content" className="skip-link">
          Ir para o conteúdo principal
        </a>
        {children}
      </body>
    </html>
  );
}