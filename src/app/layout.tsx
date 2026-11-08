import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { AdminBottomBar } from '@/components/layout/AdminBottomBar';
import { OG_IMAGE_PATH, OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT } from '@/lib/og';
import { TEMA_SCRIPT } from '@/lib/tema';

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
  metadataBase: new URL(
    'https://nego-mapa-site-negomapaangola-svg.vercel.app'
  ),
  title: {
    default: 'NegóMapa - Serviços e Empregos em Angola',
    template: '%s | NegóMapa',
  },
  description: 'Plataforma em Angola que liga clientes a profissionais e empresas e apresenta oportunidades de emprego.',
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
    description: 'Encontre serviços profissionais, profissionais, empresas e oportunidades de emprego em Angola através da NegóMapa.',
    images: [
      {
        url: OG_IMAGE_PATH,
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT,
        alt: 'NegóMapa',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NegóMapa',
    description: 'Encontre serviços profissionais, profissionais, empresas e oportunidades de emprego em Angola através da NegóMapa.',
    images: [OG_IMAGE_PATH],
  },
  icons: {
    icon: '/favicon.ico',
  },
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
    <html lang="pt-AO" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable} h-full`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script dangerouslySetInnerHTML={{ __html: TEMA_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <a href="#main-content" className="skip-link">
          Ir para o conteúdo principal
        </a>
        {children}
        <AdminBottomBar />
      </body>
    </html>
  );
}
