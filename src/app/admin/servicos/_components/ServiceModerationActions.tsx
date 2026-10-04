'use client';

import { useState } from 'react';
import { approveService, rejectService, suspendService, reactivateService } from '@/lib/actions/servicos';
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
  const [isPending, setIsPending] = useState(false);
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
      const confirmed = window.confirm(
        `Tem a certeza que deseja ${actionLabel.toLowerCase()} o serviço "${serviceTitulo}"?`
      );
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
          onClick={() => handleAction(approveService, 'aprovado', 'Aprovar', false)}
        >
          Aprovar
        </Button>
        <Button
          variant="destructive"
          size="sm"
          disabled={isPending}
          onClick={() => handleAction(rejectService, 'rejeitado', 'Rejeitar', true)}
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
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => handleAction(suspendService, 'suspenso', 'Suspender', true)}
        >
          Suspender
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
          onClick={() => handleAction(approveService, 'aprovado', 'Aprovar', false)}
        >
          Aprovar
        </Button>
      </div>
    );
  }

  if (currentEstado === 'suspenso') {
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
          onClick={() => handleAction(reactivateService, 'aprovado', 'Reativar', false)}
        >
          Reativar
        </Button>
      </div>
    );
  }

  return null;
}