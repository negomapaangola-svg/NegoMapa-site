'use client';

import { forwardRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface HeaderProps {
  className?: string;
  children?: React.ReactNode;
}

export const Header = forwardRef<HTMLElement, HeaderProps>(
  ({ className }, ref) => {
    const navLinks = [
      { href: '/servicos', label: 'Serviços' },
      { href: '/empregos', label: 'Empregos' },
      { href: '/empresas', label: 'Empresas' },
      { href: '/sobre', label: 'Sobre' },
    ];

    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setIsDark(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
      mediaQuery.addEventListener('change', handler);

      return () => mediaQuery.removeEventListener('change', handler);
    }, []);

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
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
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

              <nav className="hidden md:flex items-center gap-6" role="navigation" aria-label="Navegação principal">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm font-medium text-neutral-600 dark:text-cream-text hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-navy dark:text-cream hover:text-orange-500 dark:hover:text-orange-400 px-3 py-2 rounded-[4px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
              >
                Entrar
              </Link>
              <Button size="sm" asChild>
                <Link href="/cadastrar-empresa">Cadastrar</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>
    );
  }
);

Header.displayName = 'Header';