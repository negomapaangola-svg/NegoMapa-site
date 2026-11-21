import type { MetadataRoute } from 'next';

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nego-mapa-site-negomapaangola-svg.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const rotas = [
    '',
    '/empresas',
    '/profissionais',
    '/servicos',
    '/vagas',
    '/descobrir',
    '/produto',
    '/contacto',
    '/privacidade',
    '/termos',
    '/cookies',
    '/regras-empresas',
    '/regras-profissionais',
  ];

  return rotas.map((rota) => ({
    url: `${BASE_URL}${rota}`,
    lastModified: new Date(),
    changeFrequency: rota === '' ? 'daily' : 'weekly',
    priority: rota === '' ? 1 : 0.7,
  }));
}
