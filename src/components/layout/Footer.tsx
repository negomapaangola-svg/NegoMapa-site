'use client';

import { forwardRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ITENS_NAVEGACAO } from '@/lib/navegacao';

interface FooterProps { className?: string }
const footerGroups = [
  { title:'Plataforma', ids:['servicos','profissionais','empresas','produtos','vagas','descobrir'] },
  { title:'Informação', ids:['contacto','regras-profissionais','regras-empresas'] },
  { title:'Legal', ids:['termos','privacidade','cookies'] },
] as const

export const Footer = forwardRef<HTMLElement, FooterProps>(({ className }, ref) => <footer ref={ref} className={cn('min-w-0 overflow-x-clip bg-navy-dark border-t border-card-border', className)} role="contentinfo">
  <div className="mx-auto min-w-0 max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
    <div className="grid min-w-0 grid-cols-2 gap-x-5 gap-y-4 md:grid-cols-4 lg:grid-cols-5">
      <div className="col-span-2 min-w-0 md:col-span-1"><Link href="/" className="flex min-w-0 items-center gap-2 text-lg font-bold text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400" aria-label="NegóMapa - Página inicial"><img src="/identidade/logo-negomapa-fundo-escuro.svg" alt="NegóMapa" className="h-7 w-auto max-w-[120px] object-contain" width="560" height="120" /></Link><p className="mt-2 max-w-xs text-xs leading-5 text-cream-text">Uma plataforma para encontrar serviços profissionais e oportunidades de emprego em Angola.</p></div>
      {footerGroups.map((grupo) => <nav key={grupo.title} className="min-w-0" aria-label={grupo.title}><h3 className="text-xs font-semibold uppercase tracking-wider text-cream">{grupo.title}</h3><ul className="mt-2 space-y-1.5">{grupo.ids.map((id) => { const item = ITENS_NAVEGACAO.find((i) => i.id === id); return item ? <li key={id}><Link href={item.rota} className="break-words text-sm text-cream-text transition-colors hover:text-orange-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">{item.rotulo}</Link></li> : null })}</ul></nav>)}
    </div>
    <div className="mt-4 border-t border-card-border pt-3"><div className="flex flex-col items-center justify-between gap-2 md:flex-row"><p className="text-xs text-cream-text">© {new Date().getFullYear()} NegóMapa. Todos os direitos reservados.</p><div className="flex items-center gap-4 text-xs text-cream-text"><span>Feito em Angola 🇦🇴</span><span>Versão 1.0.0</span></div></div></div>
  </div>
</footer>);
Footer.displayName = 'Footer';