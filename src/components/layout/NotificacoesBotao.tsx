'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { contarNotificacoesNaoLidas } from '@/lib/actions/notificacoes';

const INTERVALO_ATUALIZACAO_MS = 30000;

function IconeSino() {
  return (
    <svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

export function NotificacoesBotao() {
  const pathname = usePathname();
  const [naoLidas, setNaoLidas] = useState(0);

  const atualizarContador = useCallback(async () => {
    const total = await contarNotificacoesNaoLidas();
    setNaoLidas(total);
  }, []);

  useEffect(() => {
    let ativo = true;

    atualizarContador();

    const intervalo = setInterval(() => {
      if (ativo) {
        atualizarContador();
      }
    }, INTERVALO_ATUALIZACAO_MS);

    return () => {
      ativo = false;
      clearInterval(intervalo);
    };
  }, [atualizarContador]);

  useEffect(() => {
    if (pathname === '/notificacoes') {
      atualizarContador();
    }
  }, [pathname, atualizarContador]);

  return (
    <Link
      href="/notificacoes"
      aria-label={naoLidas > 0 ? `Ver ${naoLidas} notificações não lidas` : 'Ver notificações'}
      className="relative inline-flex min-h-11 items-center gap-2 rounded-md border border-card-border bg-white px-3 text-sm font-semibold text-navy hover:border-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:bg-navy-dark dark:text-cream"
    >
      <IconeSino />
      <span className="hidden sm:inline">Notificações</span>
      {naoLidas > 0 && (
        <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 py-0.5 text-xs font-bold text-white">
          {naoLidas > 99 ? '99+' : naoLidas}
        </span>
      )}
    </Link>
  );
}
