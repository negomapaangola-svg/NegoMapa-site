'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { iniciarConversaComProfissional } from '@/lib/actions/conversas';

/** Visível apenas a utilizadores autenticados. A RLS valida a criação da conversa no servidor. */
export function EnviarMensagemButton({ profissionalId }: { profissionalId: string }) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    setErro(null);
    startTransition(async () => {
      const resultado = await iniciarConversaComProfissional(profissionalId);
      if (!resultado.success) {
        setErro(resultado.error);
        return;
      }
      router.push(`/mensagens?conversa=${resultado.conversaId}`);
    });
  }

  return (
    <div>
      <Button size="lg" onClick={handleClick} disabled={pending}>
        {pending ? 'A abrir conversa…' : 'Enviar mensagem'}
      </Button>
      {erro && (
        <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
          {erro}
        </p>
      )}
    </div>
  );
}
