'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { approveService, rejectService, suspendService, reactivateService } from '@/lib/actions/servicos';
import { eliminarConteudoAdmin } from '@/lib/actions/admin-eliminacao';
import { Button } from '@/components/ui/Button';
import { ActionResult } from '@/lib/actions/servicos';

type EstadoServico = 'pendente' | 'aprovado' | 'rejeitado' | 'suspenso';

interface ServiceModerationActionsProps {
  serviceId: string;
  serviceTitulo: string;
  currentEstado: string;
  onStateChange: (serviceId: string, newEstado: EstadoServico) => void;
}

export function ServiceModerationActions({ serviceId, serviceTitulo, currentEstado, onStateChange }: ServiceModerationActionsProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [eliminado, setEliminado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleAction = async (
    action: typeof approveService | typeof rejectService | typeof suspendService | typeof reactivateService,
    newEstado: EstadoServico,
    actionLabel: string,
    requiresConfirmation: boolean
  ) => {
    if (isPending) return;

    if (requiresConfirmation) {
      const confirmed = window.confirm(`Tem a certeza que deseja ${actionLabel.toLowerCase()} o serviço "${serviceTitulo}"?`);
      if (!confirmed) return;
    }

    clearMessages();
    setIsPending(true);

    const result: ActionResult = await action(serviceId);
    setIsPending(false);

    if (result.success) {
      setSuccess(`Serviço ${actionLabel.toLowerCase()} com sucesso.`);
      onStateChange(serviceId, newEstado);
      setTimeout(clearMessages, 3000);
    } else {
      setError(result.error || `Erro ao ${actionLabel.toLowerCase()} serviço.`);
    }
  };

  const eliminar = async () => {
    if (isPending) return;
    if (!window.confirm('Tem certeza? Esta ação não pode ser revertida.')) return;

    clearMessages();
    setIsPending(true);
    const result = await eliminarConteudoAdmin('servico', serviceId);
    setIsPending(false);

    if (result.success) {
      setEliminado(true);
      router.refresh();
    } else {
      setError(result.error || 'Erro ao eliminar serviço.');
    }
  };

  if (eliminado) return null;

  const acoes = currentEstado === 'pendente' ? (
    <>
      <Button variant="primary" size="sm" disabled={isPending} onClick={() => handleAction(approveService, 'aprovado', 'Aprovar', false)}>Aprovar</Button>
      <Button variant="destructive" size="sm" disabled={isPending} onClick={() => handleAction(rejectService, 'rejeitado', 'Rejeitar', true)}>Rejeitar</Button>
    </>
  ) : currentEstado === 'aprovado' ? (
    <Button variant="outline" size="sm" disabled={isPending} onClick={() => handleAction(suspendService, 'suspenso', 'Suspender', true)}>Suspender</Button>
  ) : currentEstado === 'rejeitado' ? (
    <Button variant="primary" size="sm" disabled={isPending} onClick={() => handleAction(approveService, 'aprovado', 'Aprovar', false)}>Aprovar</Button>
  ) : currentEstado === 'suspenso' ? (
    <Button variant="primary" size="sm" disabled={isPending} onClick={() => handleAction(reactivateService, 'aprovado', 'Reativar', false)}>Reativar</Button>
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
