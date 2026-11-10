'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/lib/actions/logout';
import { obterContextoNavegacao } from '@/lib/actions/permissoes';
import { GRUPOS_MENU_MOBILE, ITENS_NAVEGACAO, podeVerItem, type ItemNavegacao } from '@/lib/navegacao';

type Contexto = Awaited<ReturnType<typeof obterContextoNavegacao>>;

const ICONES: Record<string, ReactNode> = {
  inicio: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-7h6v7" /></>,
  descobrir: <><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5M11 7v4l3 2" /></>,
  servicos: <><path d="m14.7 6.3 3-3a5 5 0 0 1-6.4 6.4L5 16l3 3 6.3-6.3a5 5 0 0 1 6.4-6.4l-3 3-3-3Z" /><path d="m4 20 2-2" /></>,
  profissionais: <><circle cx="12" cy="8" r="3.5" /><path d="M5 21v-2a7 7 0 0 1 14 0v2Z" /></>,
  empresas: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M9 7h2m2 0h2M9 11h2m2 0h2M10 21v-5h4v5" /></>,
  produtos: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="M3 8v9l9 5 9-5V8M12 13v9" /></>,
  vagas: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18m-11 0v2h4v-2" /></>,
  'publicar-servico': <><path d="m15 5 4 4M4 20l4-.8L19 8a2.8 2.8 0 0 0-4-4L4 15l-.0 5Z" /><path d="M13 20h8" /></>,
  'publicar-vaga': <><path d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M14 3v6h5M9 14h6m-6 4h6" /></>,
  'cadastrar-empresa': <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M9 7h2m2 0h2M9 11h2m2 0h2M10 21v-5h4v5" /></>,
  'cadastrar-profissional': <><circle cx="12" cy="8" r="3.5" /><path d="M5 21v-2a7 7 0 0 1 14 0v2Z" /><path d="M19 5v4m-2-2h4" /></>,
  entrar: <><path d="M10 17l5-5-5-5m5 5H3" /><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" /></>,
  registar: <><circle cx="9" cy="8" r="3.5" /><path d="M3 21v-2a6 6 0 0 1 12 0v2m4-13v6m-3-3h6" /></>,
  perfil: <><circle cx="12" cy="8" r="3.5" /><path d="M5 21v-2a7 7 0 0 1 14 0v2Z" /></>,
  candidaturas: <><path d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M14 3v6h5M9 14h6m-6 4h6" /></>,
  mensagens: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
  pedidos: <><path d="M8 4h11v17H5V4h3Zm0-2h8v4H8z" /><path d="M9 11h6m-6 4h6" /></>,
  notificacoes: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4" /></>,
  preferencias: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 2Z" transform="translate(-1 -1) scale(1.08)" /></>,
  'painel-profissional': <><path d="m14.7 6.3 3-3a5 5 0 0 1-6.4 6.4L5 16l3 3 6.3-6.3a5 5 0 0 1 6.4-6.4l-3 3-3-3Z" /></>,
  'painel-empresa': <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M9 7h2m2 0h2M9 11h2m2 0h2M10 21v-5h4v5" /></>,
  administracao: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
  sair: <><path d="m14 7 5 5-5 5m5-5H8" /><path d="M11 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6" /></>,
  contacto: <><path d="M5 4h4l2 5-3 2a15 15 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" /></>,
  termos: <><path d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M14 3v6h5M9 14h6m-6 4h6" /></>,
  privacidade: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3" /></>,
  cookies: <><path d="M20 13a8 8 0 1 1-9-9 5 5 0 0 0 9 9Z" /><path d="M8 11h.01M12 15h.01M14 8h.01" /></>,
  'regras-empresas': <><path d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M14 3v6h5M9 14h6m-6 4h6" /></>,
  'regras-profissionais': <><path d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M14 3v6h5M9 14h6m-6 4h6" /></>,
};

function IconeMenu({ id }: { id: string }) {
  return <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-700 dark:bg-orange-400/10 dark:text-orange-300">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">{ICONES[id] ?? <><circle cx="12" cy="12" r="8" /><path d="M12 8v8m-4-4h8" /></>}</svg>
  </span>;
}

interface MobileMenuProps { aberto: boolean; onFechar: () => void; pathname: string }

export function MobileMenu({ aberto, onFechar, pathname }: MobileMenuProps) {
  const painelRef = useRef<HTMLDivElement>(null);
  const [contexto, setContexto] = useState<Contexto | null>(null);

  useEffect(() => {
    let activo = true;
    obterContextoNavegacao()
      .then((valor) => { if (activo) setContexto(valor); })
      .catch(() => {
        if (activo) setContexto({ autenticado: false, profissional: false, estadoProfissional: null, empresa: false, empresaAprovada: false, administrador: false });
      });
    return () => { activo = false; };
  }, []);

  useEffect(() => {
    if (!aberto) return;
    const anteriorOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    painelRef.current?.querySelector<HTMLElement>('a, button')?.focus();

    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') { evento.preventDefault(); onFechar(); return; }
      if (evento.key !== 'Tab' || !painelRef.current) return;
      const focaveis = Array.from(painelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'));
      if (!focaveis.length) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (evento.shiftKey && document.activeElement === primeiro) { evento.preventDefault(); ultimo.focus(); }
      else if (!evento.shiftKey && document.activeElement === ultimo) { evento.preventDefault(); primeiro.focus(); }
    };

    document.addEventListener('keydown', aoTeclar);
    return () => {
      document.body.style.overflow = anteriorOverflow;
      document.removeEventListener('keydown', aoTeclar);
      document.querySelector<HTMLButtonElement>('button[aria-controls="mobile-menu"]')?.focus();
    };
  }, [aberto, onFechar]);

  if (!aberto) return null;

  const classeLink = 'group flex min-h-12 min-w-0 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-navy transition-colors hover:bg-white/80 hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:text-cream dark:hover:bg-white/10 dark:hover:text-orange-300';
  const itemLink = (item: ItemNavegacao) => {
    const activo = pathname === item.rota || (item.rota !== '/' && pathname.startsWith(item.rota.split('?')[0] + '/'));
    return <Link key={item.id} href={item.rota} onClick={onFechar} aria-current={activo ? 'page' : undefined} className={`${classeLink} ${activo ? 'bg-orange-500/10 text-orange-800 dark:bg-orange-400/15 dark:text-orange-200' : ''}`}>
      <IconeMenu id={item.id} />
      <span className="min-w-0 flex-1 truncate">{item.rotulo}</span>
      {activo && <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />}
    </Link>;
  };

  return <div className="fixed inset-0 z-300 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu principal">
    <button type="button" aria-label="Fechar menu" onClick={onFechar} className="absolute inset-0 h-full w-full bg-navy/45 backdrop-blur-[2px] dark:bg-black/60" />
    <div id="mobile-menu" ref={painelRef} className="absolute right-0 top-0 flex h-full w-[85%] max-w-sm flex-col overflow-hidden rounded-l-3xl border-l border-white/60 bg-white/90 shadow-2xl shadow-navy/20 backdrop-blur-xl dark:border-white/10 dark:bg-navy-dark/95 dark:shadow-black/40">
      <div className="flex min-h-16 shrink-0 items-center justify-between border-b border-card-border/80 bg-white/55 px-5 py-3 dark:bg-white/[0.04]">
        <div>
          <p className="text-base font-semibold tracking-tight text-navy dark:text-cream">Menu</p>
          <p className="text-xs text-neutral-500 dark:text-cream-text/65">Explore a NegóMapa</p>
        </div>
        <button type="button" onClick={onFechar} aria-label="Fechar menu" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-card-border bg-white/70 text-navy transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-white/10 dark:bg-white/10 dark:text-cream dark:hover:bg-white/15">✕</button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5">
        {!contexto ? <div role="status" className="rounded-2xl border border-card-border/80 bg-white/60 p-4 text-sm text-neutral-600 dark:border-white/10 dark:bg-white/5 dark:text-cream-text/75">A carregar menu…</div> : <nav aria-label="Menu principal" className="space-y-4">
          {GRUPOS_MENU_MOBILE.map((grupo) => {
            const itens = grupo.itens
              .map((id) => ITENS_NAVEGACAO.find((item) => item.id === id))
              .filter((item): item is ItemNavegacao => !!item && item.locais.includes('menu_mobile') && podeVerItem(item, contexto));
            if (!itens.length) return null;
            return <section key={grupo.id} aria-labelledby={`menu-${grupo.id}`} className="rounded-2xl border border-white/80 bg-white/65 p-3 shadow-sm shadow-navy/[0.04] dark:border-white/10 dark:bg-white/[0.055] dark:shadow-black/10">
              <h2 id={`menu-${grupo.id}`} className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500 dark:text-cream-text/65">{grupo.titulo}</h2>
              <ul className="space-y-1">
                {itens.map((item) => <li key={item.id}>{item.id === 'sair' ? <form action={logoutAction}><button type="submit" onClick={onFechar} className={`${classeLink} w-full text-left`}><IconeMenu id={item.id} /><span className="flex-1">Sair</span></button></form> : itemLink(item)}</li>)}
              </ul>
            </section>;
          })}
        </nav>}
      </div>
      <div className="shrink-0 border-t border-card-border/70 bg-white/45 px-5 py-3 text-center text-[11px] text-neutral-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-cream-text/55">NegóMapa · Oportunidades perto de si</div>
    </div>
  </div>;
}
