'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { ServicePagination } from './ServicePagination';
import { ServiceModerationActions } from './ServiceModerationActions';

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
  estado: string;
  created_at: string;
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

type EstadoServico = 'pendente' | 'aprovado' | 'rejeitado' | 'suspenso';

interface ServiceListClientProps {
  initialServices: Service[];
  page: number;
  totalPages: number;
  searchParams: { q?: string; estado?: EstadoServico | ''; page?: string };
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

function getEstadoBadgeClass(estado: string): string {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  switch (estado) {
    case 'pendente':
      return `${base} bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300`;
    case 'aprovado':
      return `${base} bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300`;
    case 'rejeitado':
      return `${base} bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300`;
    case 'suspenso':
      return `${base} bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300`;
    default:
      return `${base} bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300`;
  }
}

export function ServiceListClient({ initialServices, page, totalPages, searchParams }: ServiceListClientProps) {
  const [services, setServices] = useState<Service[]>(initialServices);

  const handleStateChange = (serviceId: string, newEstado: EstadoServico) => {
    setServices((prev) =>
      prev.map((service) =>
        service.id === serviceId ? { ...service, estado: newEstado } : service
      )
    );
  };

  if (services.length === 0) {
    return (
      <div className="text-center py-16" role="alert">
        <svg className="mx-auto h-16 w-16 text-neutral-300 dark:text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="mt-4 text-xl font-semibold text-ink dark:text-cream">Nenhum serviço encontrado</h2>
        <p className="mt-2 text-neutral-600 dark:text-cream-text max-w-md mx-auto">
          {searchParams.q || searchParams.estado
            ? 'Tente ajustar os filtros ou buscar por outro termo.'
            : 'Ainda não há serviços cadastrados.'}
        </p>
        {(searchParams.q || searchParams.estado) && (
          <a
            href="/admin/servicos"
            className="mt-4 inline-block px-4 py-2 border border-card-border rounded-[4px] bg-white text-ink dark:text-cream hover:bg-cream dark:hover:bg-navy-dark transition-colors"
          >
            Limpar filtros
          </a>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full" role="table">
          <thead>
            <tr className="bg-white/50 dark:bg-neutral-800/50 border-b border-card-border">
              <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider">Título</th>
              <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider hidden md:table-cell">Profissional</th>
              <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider hidden lg:table-cell">Categoria</th>
              <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider hidden lg:table-cell">Província</th>
              <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider hidden lg:table-cell">Município</th>
              <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider hidden md:table-cell">Criado em</th>
              <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-card-border">
            {services.map((service) => (
              <tr key={service.id} className="bg-white dark:bg-neutral-900 hover:bg-cream/50 dark:hover:bg-neutral-800/50 transition-colors">
                <td className="px-4 py-4 font-medium text-ink dark:text-cream">
                  {service.titulo}
                </td>
                <td className="px-4 py-4 text-neutral-600 dark:text-cream-text/70 hidden md:table-cell">
                  {service.profissional?.nome || '—'}
                </td>
                <td className="px-4 py-4 text-neutral-600 dark:text-cream-text/70 hidden lg:table-cell">
                  {service.categoria?.nome || '—'}
                </td>
                <td className="px-4 py-4 text-neutral-600 dark:text-cream-text/70 hidden lg:table-cell">
                  {service.provincia || '—'}
                </td>
                <td className="px-4 py-4 text-neutral-600 dark:text-cream-text/70 hidden lg:table-cell">
                  {service.municipio || '—'}
                </td>
                <td className="px-4 py-4">
                  <span className={getEstadoBadgeClass(service.estado)}>
                    {service.estado}
                  </span>
                </td>
                <td className="px-4 py-4 text-neutral-600 dark:text-cream-text/70 hidden md:table-cell whitespace-nowrap">
                  {formatDate(service.created_at)}
                </td>
                <td className="px-4 py-4">
                  <ServiceModerationActions
                    serviceId={service.id}
                    serviceTitulo={service.titulo}
                    currentEstado={service.estado as EstadoServico}
                    onStateChange={handleStateChange}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3 mt-4" role="list" aria-label="Lista de serviços em cards">
        {services.map((service) => (
          <Card key={service.id} variant="default" padding="md" className="border-card-border">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-semibold text-ink dark:text-cream flex-1 min-w-0 truncate">
                  {service.titulo}
                </h3>
                <span className={getEstadoBadgeClass(service.estado)}>{service.estado}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-neutral-500 dark:text-cream-text/70">Profissional</p>
                  <p className="text-ink dark:text-cream">{service.profissional?.nome || '—'}</p>
                </div>
                <div>
                  <p className="text-neutral-500 dark:text-cream-text/70">Categoria</p>
                  <p className="text-ink dark:text-cream">{service.categoria?.nome || '—'}</p>
                </div>
                <div>
                  <p className="text-neutral-500 dark:text-cream-text/70">Província</p>
                  <p className="text-ink dark:text-cream">{service.provincia || '—'}</p>
                </div>
                <div>
                  <p className="text-neutral-500 dark:text-cream-text/70">Município</p>
                  <p className="text-ink dark:text-cream">{service.municipio || '—'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-neutral-500 dark:text-cream-text/70">Criado em</p>
                  <p className="text-ink dark:text-cream">{formatDate(service.created_at)}</p>
                </div>
              </div>
              <div className="pt-3 border-t border-card-border">
                <ServiceModerationActions
                  serviceId={service.id}
                  serviceTitulo={service.titulo}
                  currentEstado={service.estado as EstadoServico}
                  onStateChange={handleStateChange}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <ServicePagination
        currentPage={page}
        totalPages={totalPages}
        searchParams={searchParams}
      />
    </>
  );
}