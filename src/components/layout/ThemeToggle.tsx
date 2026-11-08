'use client';

import { useEffect } from 'react';
import { acompanharSistema, alternarTema } from '@/lib/tema';
import { useTemaEscuro } from '@/hooks/useTemaEscuro';

function IconeSol() {
  return (
    <svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function IconeLua() {
  return (
    <svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

/** Botão de alternância claro/escuro. Mostra a ação: sol para ir ao claro, lua para ir ao escuro. */
export function ThemeToggle() {
  const escuro = useTemaEscuro();

  useEffect(() => acompanharSistema(), []);

  return (
    <button
      type="button"
      onClick={alternarTema}
      aria-label={escuro ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
      title={escuro ? 'Modo claro' : 'Modo escuro'}
      className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md border border-card-border bg-white text-navy hover:border-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-cream"
    >
      {escuro ? <IconeSol /> : <IconeLua />}
    </button>
  );
}
