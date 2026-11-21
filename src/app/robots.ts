import type { MetadataRoute } from 'next';

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nego-mapa-site-negomapaangola-svg.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/conta', '/configuracoes', '/mensagens', '/notificacoes', '/pedidos', '/candidaturas'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
