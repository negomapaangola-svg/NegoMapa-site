'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { AuthUserMenu } from './AuthUserMenu';

const LINKS = [
  { href: '/descobrir', label: 'Descobrir' },
  { href: '/servicos', label: 'Serviços' },
  { href: '/empresas', label: 'Empresas' },
  { href: '/vagas', label: 'Vagas' },
] as const;

interface MobileMenuProps {
  aberto: boolean;
  onFechar: () => void;
  pathname: string;
}

export function MobileMenu({ aberto, onFechar, pathname }: MobileMenuProps) {
  const painelRef = useRef<HTMLDivElement>(null);
  const botaoMenu = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!aberto) return;

    const anteriorOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const primeiroItem = painelRef.current?.querySelector<HTMLElement>('a, button');
    primeiroItem?.focus();

    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') onFechar();
    }

    document.addEventListener('keydown', aoTeclar);

    return () => {
      document.body.style.overflow = anteriorOverflow;
      document.removeEventListener('keydown', aoTeclar);
      botaoMenu.current = document.querySelector<HTMLButtonElement>(
        'button[aria-controls="mobile-menu"]'
      );
      botaoMenu.current?.focus();
    };
  }, [aberto, onFechar]);

  if (!aberto) return null;

  const estaActivo = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div
      className="fixed inset-0 z-300 lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Menu principal"
    >
      <button
        type="button"
        aria-label="Fechar menu"
        onClick={onFechar}
        className="absolute inset-0 h-full w-full bg-black/40"
      />

      <div
        id="mobile-menu"
        ref={painelRef}
        className="absolute right-0 top-0 flex h-full w-[85%] max-w-sm flex-col overflow-y-auto border-l border-card-border bg-white/95 shadow-2xl backdrop-blur-xl dark:bg-navy-dark/95"
      >
        <div className="flex items-center justify-between border-b border-card-border px-4 py-3">
          <span className="text-sm font-semibold text-navy dark:text-cream">Menu</span>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar menu"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-navy transition-colors hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:text-cream dark:hover:bg-white/10"
          >
            <svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <nav aria-label="Navegação principal" className="flex-1 px-2 py-3">
          <ul className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={onFechar}
                  aria-current={estaActivo(link.href) ? 'page' : undefined}
                  className={cn(
                    'flex min-h-12 items-center rounded-md px-3 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500',
                    estaActivo(link.href)
                      ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                      : 'text-navy hover:bg-cream hover:text-orange-500 dark:text-cream dark:hover:bg-white/10 dark:hover:text-orange-400'
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-card-border px-4 py-4">
          <Link
            href="/cadastrar-servico"
            onClick={onFechar}
            className="flex min-h-12 items-center justify-center rounded-full bg-orange-500 px-4 text-base font-semibold text-white transition-colors hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
          >
            Publicar
          </Link>

          <div className="mt-3">
            <AuthUserMenu variante="lista" />
          </div>
        </div>
      </div>
    </div>
  );
}
