'use client';

import { forwardRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { AuthUserMenu } from './AuthUserMenu';
import { NotificacoesBotao } from './NotificacoesBotao';
import { PesquisaGlobal } from './PesquisaGlobal';

interface HeaderProps {
  className?: string;
  children?: React.ReactNode;
}

const NAV_LINKS = [
  { href: '/servicos', label: 'Serviços' },
  { href: '/profissionais', label: 'Profissionais' },
  { href: '/empresas', label: 'Empresas' },
  { href: '/vagas', label: 'Vagas' },
  { href: '/investimentos', label: 'Investimentos' },
] as const;

function IconeMenu({ aberto }: { aberto: boolean }) {
  return (
    <svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      {aberto ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
    </svg>
  );
}

function IconeSino() {
  return (
    <svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

export const Header = forwardRef<HTMLElement, HeaderProps>(
  ({ className }, ref) => {
    const router = useRouter();
    const [isDark, setIsDark] = useState(false);
    const [menuAberto, setMenuAberto] = useState(false);

    useEffect(() => {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setIsDark(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    useEffect(() => {
      if (!menuAberto) return;
      function aoTeclar(e: KeyboardEvent) {
        if (e.key === 'Escape') setMenuAberto(false);
      }
      document.addEventListener('keydown', aoTeclar);
      return () => document.removeEventListener('keydown', aoTeclar);
    }, [menuAberto]);

    return (
      <header
        ref={ref}
        className={cn(
          'liquid-glass-navbar sticky top-0 z-200 w-full',
          'dark:liquid-glass-navbar-dark',
          className
        )}
        role="banner"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-card-border bg-white px-3 text-sm font-semibold text-navy hover:border-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:bg-navy-dark dark:text-cream"
              >
                <svg aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5" />
                  <path d="M12 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Voltar</span>
              </button>

              <Link
                href="/"
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-card-border bg-white px-3 text-sm font-semibold text-navy hover:border-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:bg-navy-dark dark:text-cream"
              >
                <svg aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 10.5L12 3l9 7.5" />
                  <path d="M5 10v10h14V10" />
                </svg>
                <span className="hidden sm:inline">Início</span>
              </Link>

              <Link
                href="/"
                className="flex items-center gap-2 text-xl font-bold text-navy dark:text-cream"
                aria-label="NegóMapa - Página inicial"
              >
                <img
                  src={isDark ? '/identidade/logo-negomapa-fundo-escuro.svg' : '/identidade/logo-negomapa-fundo-claro.svg'}
                  alt="NegóMapa"
                  className="h-10 w-auto max-w-[180px] object-contain"
                  width="560"
                  height="120"
                />
              </Link>
            </div>

            <nav className="hidden xl:flex items-center gap-6" role="navigation" aria-label="Navegação principal">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="whitespace-nowrap text-sm font-medium text-neutral-700 dark:text-cream-text hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="hidden flex-1 justify-center lg:flex">
              <PesquisaGlobal />
            </div>

            <div className="flex items-center gap-3">
              <NotificacoesBotao />

              <div className="hidden lg:block">
                <AuthUserMenu />
              </div>

              <button
                type="button"
                onClick={() => setMenuAberto((aberto) => !aberto)}
                aria-expanded={menuAberto}
                aria-controls="menu-principal"
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-card-border bg-white px-3 text-sm font-semibold text-navy hover:border-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:bg-navy-dark dark:text-cream lg:hidden"
              >
                <IconeMenu aberto={menuAberto} />
                <span>{menuAberto ? 'Fechar' : 'Menu'}</span>
              </button>
            </div>
          </div>

          <div className="pb-3 lg:hidden">
            <PesquisaGlobal />
          </div>
        </div>

        {menuAberto && (
          <div
            id="menu-principal"
            className="absolute inset-x-0 top-full border-t border-card-border bg-white shadow-lg dark:bg-navy-dark lg:hidden"
          >
            <nav aria-label="Navegação principal (menu)" className="mx-auto max-w-7xl px-4 py-3">
              <ul className="flex flex-col">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setMenuAberto(false)}
                      className="flex min-h-12 items-center rounded-md px-3 text-base font-medium text-navy hover:bg-cream hover:text-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:text-cream dark:hover:bg-white/5 dark:hover:text-orange-400"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/notificacoes"
                    onClick={() => setMenuAberto(false)}
                    className="flex min-h-12 items-center gap-2 rounded-md px-3 text-base font-medium text-navy hover:bg-cream hover:text-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:text-cream dark:hover:bg-white/5 dark:hover:text-orange-400"
                  >
                    <IconeSino />
                    Notificações
                  </Link>
                </li>
              </ul>
              <div className="mt-3 border-t border-card-border pt-3">
                <AuthUserMenu variante="lista" />
              </div>
            </nav>
          </div>
        )}
      </header>
    );
  }
);

Header.displayName = 'Header';
