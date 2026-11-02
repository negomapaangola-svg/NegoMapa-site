'use client';

import { forwardRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface FooterProps {
  className?: string;
}

const footerLinks = {
  plataforma: [
    { label: 'Serviços', href: '/servicos' },
    { label: 'Profissionais', href: '/profissionais' },
    { label: 'Empresas', href: '/empresas' },
    { label: 'Vagas', href: '/vagas' },
  ],
  informacao: [
    { label: 'Regras para Profissionais', href: '/regras-profissionais' },
    { label: 'Regras para Empresas', href: '/regras-empresas' },
    { label: 'Contacto', href: '/contacto' },
  ],
  legal: [
    { label: 'Termos de Utilização', href: '/termos' },
    { label: 'Política de Privacidade', href: '/privacidade' },
    { label: 'Política de Cookies', href: '/cookies' },
  ],
};

const TITULOS_GRUPO: Record<string, string> = {
  plataforma: 'Plataforma',
  informacao: 'Informação',
  legal: 'Legal',
};

export const Footer = forwardRef<HTMLElement, FooterProps>(
  ({ className }, ref) => {
    return (
      <footer
        ref={ref}
        className={cn(
          'bg-navy-dark border-t border-card-border',
          className
        )}
        role="contentinfo"
      >
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 text-xl font-bold text-cream" aria-label="NegóMapa - Página inicial">
                <img
                  src="/identidade/logo-negomapa-fundo-escuro.svg"
                  alt="NegóMapa"
                  className="h-8 w-auto max-w-[140px] object-contain"
                  width="560"
                  height="120"
                />
                <span>NegóMapa</span>
              </Link>
              <p className="mt-4 text-sm text-cream-text max-w-xs">
                A plataforma líder em Angola para encontrar serviços profissionais e oportunidades de emprego. Conectamos pessoas e empresas.
              </p>
            </div>

            {Object.entries(footerLinks).map(([grupo, links]) => (
              <nav key={grupo} aria-label={TITULOS_GRUPO[grupo]}>
                <h3 className="text-sm font-semibold text-cream uppercase tracking-wider">{TITULOS_GRUPO[grupo]}</h3>
                <ul className="mt-4 space-y-3" role="list">
                  {links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-sm text-cream-text hover:text-orange-500 transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}

          </div>

          <div className="mt-12 border-t border-card-border pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-cream-text">
                © {new Date().getFullYear()} NegóMapa. Todos os direitos reservados.
              </p>
              <div className="flex items-center gap-6 text-sm text-cream-text">
                <span>Feito em Angola 🇦🇴</span>
                <span>Versão 1.0.0</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    );
  }
);

Footer.displayName = 'Footer';