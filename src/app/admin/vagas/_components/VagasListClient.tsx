'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { aprovarVaga, rejeitarVaga, type ActionResult } from '@/lib/actions/vagas';
import { eliminarConteudoAdmin } from '@/lib/actions/admin-eliminacao';
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
  company: { id: string; name: string }[] | null;
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
      return `${base} bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300`;
    case 'rejeitado':
      return `${base} bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300`;
    default:
      return `${base} bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300`;
  }
}

export function VagasListClient({ initialVagas, currentEstadoFilter }: VagasListClientProps) {
  const [vagas, setVagas] = useState<VagaAdminItem[]>(initialVagas);

  const handleStateChange = (vagaId: string, newEstado: EstadoVaga) => {
    setVagas((prev) => prev.map((vaga) => (vaga.id === vagaId ? { ...vaga, estado: newEstado } : vaga)));
  };

  const handleEliminado = (vagaId: string) => {
    setVagas((prev) => prev.filter((vaga) => vaga.id !== vagaId));
  };

  if (vagas.length === 0) {
    return (
      <div className="text-center py-16" role="alert">
        <h2 className="text-xl font-semibold text-ink dark:text-cream">Nenhuma vaga encontrada</h2>
        <p className="mt-2 text-neutral-600 dark:text-cream-text max-w-md mx-auto">
          {currentEstadoFilter ? `Nenhuma vaga com estado "${currentEstadoFilter}".` : 'Ainda não há vagas cadastradas.'}
        </p>
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
              <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-card-border">
            {vagas.map((vaga) => (
              <tr key={vaga.id} className="bg-white dark:bg-neutral-900">
                <td className="px-4 py-4 font-medium text-ink dark:text-cream">{vaga.titulo}</td>
                <td className="px-4 py-4 text-neutral-600 dark:text-cream-text/70 hidden md:table-cell">{vaga.company?.[0]?.name || '—'}</td>
                <td className="px-4 py-4"><span className={getEstadoBadgeClass(vaga.estado)}>{vaga.estado}</span></td>
                <td className="px-4 py-4">
                  <VagaModerationActions vagaId={vaga.id} vagaTitulo={vaga.titulo} currentEstado={vaga.estado as EstadoVaga} onStateChange={handleStateChange} onEliminado={handleEliminado} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3 mt-4">
        {vagas.map((vaga) => (
          <Card key={vaga.id} variant="default" padding="md" className="border-card-border">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-semibold text-ink dark:text-cream flex-1 min-w-0 truncate">{vaga.titulo}</h3>
                <span className={getEstadoBadgeClass(vaga.estado)}>{vaga.estado}</span>
              </div>
              <div className="pt-3 border-t border-card-border">
                <VagaModerationActions vagaId={vaga.id} vagaTitulo={vaga.titulo} currentEstado={vaga.estado as EstadoVaga} onStateChange={handleStateChange} onEliminado={handleEliminado} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

function VagaModerationActions({ vagaId, vagaTitulo, currentEstado, onStateChange, onEliminado }: {
  vagaId: string;
  vagaTitulo: string;
  currentEstado: EstadoVaga;
  onStateChange: (vagaId: string, newEstado: EstadoVaga) => void;
  onEliminado: (vagaId: string) => void;
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
      const confirmed = window.confirm(`Tem a certeza que deseja ${actionLabel.toLowerCase()} a vaga "${vagaTitulo}"?`);
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

  const eliminar = async () => {
    if (isPending) return;
    if (!window.confirm('Tem certeza? Esta ação não pode ser revertida.')) return;
    clearMessages();
    setIsPending(true);
    const result = await eliminarConteudoAdmin('vaga', vagaId);
    setIsPending(false);
    if (result.success) {
      onEliminado(vagaId);
    } else {
      setError(result.error || 'Erro ao eliminar vaga.');
    }
  };

  const acoes = currentEstado === 'pendente' ? (
    <>
      <Button variant="primary" size="sm" disabled={isPending} onClick={() => handleAction(aprovarVaga, 'aprovado', 'Aprovar', false)}>Aprovar</Button>
      <Button variant="destructive" size="sm" disabled={isPending} onClick={() => handleAction(rejeitarVaga, 'rejeitado', 'Rejeitar', true)}>Rejeitar</Button>
    </>
  ) : currentEstado === 'aprovado' ? (
    <Button variant="destructive" size="sm" disabled={isPending} onClick={() => handleAction(rejeitarVaga, 'rejeitado', 'Rejeitar', true)}>Rejeitar</Button>
  ) : currentEstado === 'rejeitado' ? (
    <Button variant="primary" size="sm" disabled={isPending} onClick={() => handleAction(aprovarVaga, 'aprovado', 'Aprovar', false)}>Aprovar</Button>
  ) : null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {error && <div className="text-red-600 dark:text-red-400 text-sm" role="alert">{error}</div>}
      {success && <div className="text-green-600 dark:text-green-400 text-sm" role="status">{success}</div>}
      {acoes}
      <Button variant="destructive" size="sm" disabled={isPending} onClick={eliminar}>
        {isPending ? 'A eliminar…' : 'Eliminar'}
      </Button>
    </div>
  );
}
