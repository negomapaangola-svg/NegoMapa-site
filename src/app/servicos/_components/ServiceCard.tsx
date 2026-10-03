'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';

interface Service {
  id: string;
  slug: string;
  titulo: string;
  descricao: string | null;
  preco: number | null;
  preco_tipo: string | null;
  whatsapp: string | null;
  provincia: string | null;
  municipio: string | null;
  categoria: {
    id: string;
    nome: string;
    slug: string;
  } | null;
  profissional: {
    id: string;
    nome: string;
    slug: string;
    whatsapp: string | null;
  } | null;
}

function WhatsAppButton({ telefone }: { telefone: string | null | undefined }) {
  if (!telefone) return null;

  const cleanNumber = telefone.replace(/\D/g, '');
  const url = `https://wa.me/244${cleanNumber}`;

  return (
    <Button variant="primary" size="sm" asChild>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 16v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h10a2 2 0 012 2v1m-3.678-1.636A16.039 16.039 0 016 12.353 16.083 16.083 0 0112.05 3s10.03 8.347 10.323 9.378a7.97 7.97 0 00-1.677 2.043 7.926 7.926 0 01-3.062.094A11.956 11.956 0 0018 16z" />
        </svg>
        <span>WhatsApp</span>
      </a>
    </Button>
  );
}

export function ServiceCard({ service }: { service: Service }) {
  const whatsappNumber = service.whatsapp || service.profissional?.whatsapp;

  return (
    <Card variant="liquid" padding="md" hover className="h-full flex flex-col border-card-border">
      <CardHeader>
        <CardTitle className="text-lg line-clamp-2">{service.titulo}</CardTitle>
        <CardDescription className="text-sm">
          {service.categoria?.nome && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-medium">
              {service.categoria.nome}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600 dark:text-cream-text/80">
          {service.provincia && (
            <span className="flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {service.provincia}
            </span>
          )}
          {service.municipio && (
            <span className="flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {service.municipio}
            </span>
          )}
        </div>

        {service.preco !== null && service.preco !== undefined && (
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-orange-500 dark:text-orange-400">
              {formatCurrency(service.preco)}
            </span>
            {service.preco_tipo && (
              <span className="text-sm text-neutral-500 dark:text-cream-text/70">
                / {service.preco_tipo}
              </span>
            )}
          </div>
        )}

        {service.descricao && (
          <p className="text-sm text-neutral-600 dark:text-cream-text line-clamp-3 mt-2">
            {service.descricao}
          </p>
        )}
      </CardContent>
      <CardFooter className="pt-4">
        <div className="flex items-center justify-between w-full gap-2">
          <span className="text-xs text-neutral-500 dark:text-cream-text/70 flex-1 truncate">
            Por: {service.profissional?.nome || 'Profissional'}
          </span>
          <WhatsAppButton telefone={whatsappNumber} />
        </div>
      </CardFooter>
    </Card>
  );
}