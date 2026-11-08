'use client';

import { useSyncExternalStore } from 'react';

function subscrever(aoMudar: () => void) {
  const observador = new MutationObserver(aoMudar);
  observador.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observador.disconnect();
}

function lerEscuro() {
  return document.documentElement.classList.contains('dark');
}

/** Devolve true quando o tema escuro está ativo. No servidor (e na primeira hidratação) devolve false. */
export function useTemaEscuro(): boolean {
  return useSyncExternalStore(subscrever, lerEscuro, () => false);
}
