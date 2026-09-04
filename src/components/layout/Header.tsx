'use client';

import { forwardRef } from 'react';
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
                className="flex items-center gap-2 text-xl font-bold text-primary-600 dark:text-primary-400"
                aria-label="NegóMapa - Página inicial"
              >
                <svg
                  className="h-8 w-8"
                  viewBox="0 0 32 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <rect width="32" height="32" rx="8" className="fill-primary-600" />
                  <path
                    d="M16 8L22 16L16 24L10 16L16 8Z"
                    className="fill-white"
                  />
                  <circle cx="16" cy="16" r="4" className="fill-primary-600" />
                </svg>
                <span className="hidden sm:block">NegóMapa</span>
              </Link>

              <nav className="hidden md:flex items-center gap-6" role="navigation" aria-label="Navegação principal">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/login" className="hidden sm:block text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400">
                Entrar
              </Link>
              <Button size="sm" asChild>
                <Link href="/cadastrar">Cadastrar</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>
    );
  }
);

Header.displayName = 'Header';