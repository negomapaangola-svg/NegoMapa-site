'use client';

import { forwardRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { AuthUserMenu } from './AuthUserMenu';

interface HeaderProps {
  className?: string;
  children?: React.ReactNode;
}

const NAV_LINKS = [
  { href: '/', label: 'Início' },
  { href: '/servicos', label: 'Serviços' },
  { href: '/empresas', label: 'Empresas' },
  { href: '/profissionais', label: 'Profissionais' },
  { href: '/vagas', label: 'Vagas' },
];

const linkClass =
  'text-sm font-medium text-neutral-600 dark:text-cream-text hover:text-orange-500 dark:hover:text-orange-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 rounded-[4px]';

export const Header = forwardRef<HTMLElement, HeaderProps>(
  ({ className }, ref) => {
    const [isDark, setIsDark] = useState(false);
    const [menuAberto, setMenuAberto] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setIsDark(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
      mediaQuery.addEventListener('change', handler);

      return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    // Fecha o menu móvel ao navegar.
    useEffect(() => {
      setMenuAberto(false);
    }, [pathname]);

    // Fecha o menu móvel com a tecla Escape.
    useEffect(() => {
      if (!menuAberto) return;
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setMenuAberto(false);
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
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
            <div className="flex items-center gap-8 min-w-0">
              <Link
                href="/"
                className="flex shrink-0 items-center gap-2 text-xl font-bold text-navy dark:text-cream"
                aria-label="NegóMapa - Página inicial"
              >
                <img
                  src={isDark ? '/identidade/logo-negomapa-fundo-escuro.svg' : '/identidade/logo-negomapa-fundo-claro.svg'}
                  alt="NegóMapa"
                  className="h-10 w-auto max-w-[160px] object-contain"
                  width="560"
                  height="120"
                />
              </Link>

              <nav className="hidden lg:flex items-center gap-5" role="navigation" aria-label="Navegação principal">
                {NAV_LINKS.map((link) => (
                  <Link key={link.href} href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <AuthUserMenu variant="inline" />
            </div>

            <button
              type="button"
              className="lg:hidden inline-flex h-11 w-11 items-center justify-center rounded-[4px] text-navy dark:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              aria-expanded={menuAberto}
              aria-controls="menu-movel"
              aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
              onClick={() => setMenuAberto((v) => !v)}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                {menuAberto ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {menuAberto && (
          <div
            id="menu-movel"
            className="lg:hidden liquid-glass border-t border-card-border max-h-[calc(100vh-4rem)] overflow-y-auto"
          >
            <nav className="mx-auto max-w-7xl px-4 py-4 flex flex-col gap-1" aria-label="Menu principal">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${linkClass} block px-3 py-3`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="my-3 border-t border-card-border" />
              <AuthUserMenu variant="stacked" />
            </nav>
          </div>
        )}
      </header>
    );
  }
);

Header.displayName = 'Header';
