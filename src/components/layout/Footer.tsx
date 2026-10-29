'use client';

import { forwardRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface FooterProps {
  className?: string;
}

const footerLinks = {
  servicos: [
    { label: 'Todos os Serviços', href: '/servicos' },
  ],
};

const socialLinks = [
  { label: 'Facebook', href: 'https://facebook.com', icon: 'facebook' },
  { label: 'LinkedIn', href: 'https://linkedin.com', icon: 'linkedin' },
  { label: 'Instagram', href: 'https://instagram.com', icon: 'instagram' },
  { label: 'Twitter', href: 'https://twitter.com', icon: 'twitter' },
];

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
          <div className="grid grid-cols-2 gap-8 md:grid-cols-2 lg:grid-cols-2">
            <div className="col-span-2 lg:col-span-1">
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
              <div className="mt-6 flex gap-4" role="list" aria-label="Redes sociais">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cream-text hover:text-orange-500 transition-colors"
                    aria-label={social.label}
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      {social.icon === 'facebook' && (
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                      )}
                      {social.icon === 'linkedin' && (
                        <path d="M20 4.4v15.2A2.4 2.4 0 0 1 17.6 22H6.4A2.4 2.4 0 0 1 4 19.6V4.4A2.4 2.4 0 0 1 6.4 2h11.2a2.4 2.4 0 0 1 2.4 2.4z" />
                      )}
                      {social.icon === 'instagram' && (
                        <path d="M12 2.2C6.5 2.2 2 6.7 2 12.2c0 5.5 4.5 10 10 10s10-4.5 10-10C22 6.7 17.5 2.2 12 2.2zM12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm0 2c5.5 0 10 4.5 10 10s-4.5 10-10 10S2 17.5 2 12 6.5 2 12 2zm0 2a8 8 0 0 0-8 8 8 8 0 0 0 8 8 8 8 0 0 0 8-8 8 8 0 0 0-8-8z" />
                      )}
                      {social.icon === 'twitter' && (
                        <path d="M23 3a10.9 10.9 0 0 1-3.1 1.1 5.4 5.4 0 0 0-7.3 3.3 5.4 5.4 0 0 0 1.4 6.9 15.4 15.4 0 0 1-11.2-5.8 5.4 5.4 0 0 0 6.7 7.1 5.4 5.4 0 0 1-3.5-1.4v.1a5.4 5.4 0 0 0 5.4 5.4 5.4 5.4 0 0 1-8.1-2.8 15.3 15.3 0 0 0 8.4 2.4c10 0 15.5-8.3 15.5-15.5 0-.2 0-.5 0-.7a10.9 10.9 0 0 0 3.1-3.3z" />
                      )}
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            <nav aria-label="Serviços">
              <h3 className="text-sm font-semibold text-cream uppercase tracking-wider">Serviços</h3>
              <ul className="mt-4 space-y-3" role="list">
                {footerLinks.servicos.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-cream-text hover:text-orange-500 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

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