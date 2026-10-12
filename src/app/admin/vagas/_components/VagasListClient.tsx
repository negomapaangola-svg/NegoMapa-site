'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { aprovarVaga, rejeitarVaga, type ActionResult } from '@/lib/actions/vagas';
import { formatDate } from '@/lib/utils';

type EstadoVaga = 'pendente' | 'aprovado' | 'rejeitado';

interface VagaAdminItem {
  id: string;
  titulo: string;
  slug: string;
  estado: string;
  categoria: string;
  provincia: string;
  created_at: string;
  company: {
    id: string;
    name: string;
  }[] | null;
}

interface VagasListClientProps {
  initialVagas: VagaAdminItem[];
  currentEstadoFilter: EstadoVaga | '';
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
    default:
      return `${base} bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300`;
  }
}

export function VagasListClient({ initialVagas, currentEstadoFilter }: VagasListClientProps) {
  const [vagas, setVagas] = useState<VagaAdminItem[]>(initialVagas);

  const handleStateChange = (vagaId: string, newEstado: EstadoVaga) => {
    setVagas((prev) =>
      prev.map((vaga) =>
        vaga.id === vagaId ? { ...vaga, estado: newEstado } : vaga
      )
    );
  };

  if (vagas.length === 0) {
    return (
      <div className="text-center py-16" role="alert">
        <svg className="mx-auto h-16 w-16 text-neutral-300 dark:text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="mt-4 text-xl font-semibold text-ink dark:text-cream">Nenhuma vaga encontrada</h2>
        <p className="mt-2 text-neutral-600 dark:text-cream-text max-w-md mx-auto">
          {currentEstadoFilter
            ? `Nenhuma vaga com estado "${currentEstadoFilter}".`
            : 'Ainda não há vagas cadastradas.'}
        </p>
        {currentEstadoFilter && (
          <a
            href="/admin/vagas"
            className="mt-4 inline-block px-4 py-2 border border-card-border rounded-[4px] bg-white text-ink dark:text-cream hover:bg-cream dark:hover:bg-navy-dark transition-colors"
          >
            Ver todas as vagas
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
              <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider hidden md:table-cell">Empresa</th>
              <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider hidden lg:table-cell">Categoria</th>
              <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider hidden lg:table-cell">Província</th>
              <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider hidden md:table-cell">Criado em</th>
              <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-card-border">
            {vagas.map((vaga) => (
              <tr key={vaga.id} className="bg-white dark:bg-neutral-900 hover:bg-cream/50 dark:hover:bg-neutral-800/50 transition-colors">
                <td className="px-4 py-4 font-medium text-ink dark:text-cream">
                  {vaga.titulo}
                </td>
                <td className="px-4 py-4 text-neutral-600 dark:text-cream-text/70 hidden md:table-cell">
                  {vaga.company?.[0]?.name || '—'}
                </td>
                <td className="px-4 py-4 text-neutral-600 dark:text-cream-text/70 hidden lg:table-cell">
                  {vaga.categoria || '—'}
                </td>
                <td className="px-4 py-4 text-neutral-600 dark:text-cream-text/70 hidden lg:table-cell">
                  {vaga.provincia || '—'}
                </td>
                <td className="px-4 py-4">
                  <span className={getEstadoBadgeClass(vaga.estado)}>
                    {vaga.estado}
                  </span>
                </td>
                <td className="px-4 py-4 text-neutral-600 dark:text-cream-text/70 hidden md:table-cell whitespace-nowrap">
                  {formatDate(vaga.created_at)}
                </td>
                <td className="px-4 py-4">
                  <VagaModerationActions
                    vagaId={vaga.id}
                    vagaTitulo={vaga.titulo}
                    currentEstado={vaga.estado as EstadoVaga}
                    onStateChange={handleStateChange}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3 mt-4" role="list" aria-label="Lista de vagas em cards">
        {vagas.map((vaga) => (
          <Card key={vaga.id} variant="default" padding="md" className="border-card-border">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-semibold text-ink dark:text-cream flex-1 min-w-0 truncate">
                  {vaga.titulo}
                </h3>
                <span className={getEstadoBadgeClass(vaga.estado)}>{vaga.estado}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-neutral-500 dark:text-cream-text/70">Empresa</p>
                  <p className="text-ink dark:text-cream">{vaga.company?.[0]?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-neutral-500 dark:text-cream-text/70">Categoria</p>
                  <p className="text-ink dark:text-cream">{vaga.categoria || '—'}</p>
                </div>
                <div>
                  <p className="text-neutral-500 dark:text-cream-text/70">Província</p>
                  <p className="text-ink dark:text-cream">{vaga.provincia || '—'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-neutral-500 dark:text-cream-text/70">Criado em</p>
                  <p className="text-ink dark:text-cream">{formatDate(vaga.created_at)}</p>
                </div>
              </div>
              <div className="pt-3 border-t border-card-border">
                <VagaModerationActions
                  vagaId={vaga.id}
                  vagaTitulo={vaga.titulo}
                  currentEstado={vaga.estado as EstadoVaga}
                  onStateChange={handleStateChange}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

function VagaModerationActions({ vagaId, vagaTitulo, currentEstado, onStateChange }: {
  vagaId: string;
  vagaTitulo: string;
  currentEstado: EstadoVaga;
  onStateChange: (vagaId: string, newEstado: EstadoVaga) => void;
}) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleAction = async (
    action: typeof aprovarVaga | typeof rejeitarVaga,
    newEstado: EstadoVaga,
    actionLabel: string,
    requiresConfirmation: boolean
  ) => {
    if (isPending) return;

    if (requiresConfirmation) {
      const confirmed = window.confirm(
        `Tem a certeza que deseja ${actionLabel.toLowerCase()} a vaga "${vagaTitulo}"?`
      );
      if (!confirmed) return;
    }

    clearMessages();
    setIsPending(true);

    const result: ActionResult = await action(vagaId);

    setIsPending(false);

    if (result.success) {
      setSuccess(`Vaga ${actionLabel.toLowerCase()} com sucesso.`);
      onStateChange(vagaId, newEstado);
      setTimeout(clearMessages, 3000);
    } else {
      setError(result.error || `Erro ao ${actionLabel.toLowerCase()} vaga.`);
    }
  };

  if (currentEstado === 'pendente') {
    return (
      <div className="flex items-center gap-2">
        {error && (
          <div className="text-red-600 dark:text-red-400 text-sm" role="alert">
            {error}
          </div>
        )}
        {success && (
          <div className="text-green-600 dark:text-green-400 text-sm" role="status">
            {success}
          </div>
        )}
        <Button
          variant="primary"
          size="sm"
          disabled={isPending}
          onClick={() => handleAction(aprovarVaga, 'aprovado', 'Aprovar', false)}
        >
          Aprovar
        </Button>
        <Button
          variant="destructive"
          size="sm"
          disabled={isPending}
          onClick={() => handleAction(rejeitarVaga, 'rejeitado', 'Rejeitar', true)}
        >
          Rejeitar
        </Button>
      </div>
    );
  }

  if (currentEstado === 'aprovado') {
    return (
      <div className="flex items-center gap-2">
        {error && (
          <div className="text-red-600 dark:text-red-400 text-sm" role="alert">
            {error}
          </div>
        )}
        {success && (
          <div className="text-green-600 dark:text-green-400 text-sm" role="status">
            {success}
          </div>
        )}
        <Button
          variant="destructive"
          size="sm"
          disabled={isPending}
          onClick={() => handleAction(rejeitarVaga, 'rejeitado', 'Rejeitar', true)}
        >
          Rejeitar
        </Button>
      </div>
    );
  }

  if (currentEstado === 'rejeitado') {
    return (
      <div className="flex items-center gap-2">
        {error && (
          <div className="text-red-600 dark:text-red-400 text-sm" role="alert">
            {error}
          </div>
        )}
        {success && (
          <div className="text-green-600 dark:text-green-400 text-sm" role="status">
            {success}
          </div>
        )}
        <Button
          variant="primary"
          size="sm"
          disabled={isPending}
          onClick={() => handleAction(aprovarVaga, 'aprovado', 'Aprovar', false)}
        >
          Aprovar
        </Button>
      </div>
    );
  }

  return null;
}