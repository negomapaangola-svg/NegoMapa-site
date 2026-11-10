'use client';

import { forwardRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { AuthUserMenu } from './AuthUserMenu';
import { MobileMenu } from './MobileMenu';
import { NotificacoesBotao } from './NotificacoesBotao';
import { PesquisaGlobal } from './PesquisaGlobal';
import { ThemeToggle } from './ThemeToggle';
import { useTemaEscuro } from '@/hooks/useTemaEscuro';
import { obterContextoNavegacao } from '@/lib/actions/permissoes';
import { ITENS_NAVEGACAO } from '@/lib/navegacao';

type Contexto = Awaited<ReturnType<typeof obterContextoNavegacao>>

function IconeMenu() { return <svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg> }

export const Header = forwardRef<HTMLElement, { className?: string; hideGlobalSearch?: boolean }>(
  ({ className, hideGlobalSearch = false }, ref) => {
    const pathname = usePathname()
    const isDark = useTemaEscuro()
    const [menuAberto, setMenuAberto] = useState(false)
    const [contexto, setContexto] = useState<Contexto | null>(null)

    useEffect(() => {
      let activo = true
      const carregar = () => obterContextoNavegacao().then((c) => { if (activo) setContexto(c) }).catch(() => { if (activo) setContexto({ userId:null, autenticado:false, profissional:false, estadoProfissional:null, empresa:false, empresaAprovada:false, administrador:false }) })
      carregar()
      return () => { activo = false }
    }, [])

    const estaActivo = (href: string) => pathname === href || pathname.startsWith(`${href}/`)
    const linksCabecalho = ['inicio','descobrir','servicos','empresas','vagas'].map((id) => ITENS_NAVEGACAO.find((item) => item.id === id)!).filter(Boolean)
    const publicar = contexto?.administrador ? null : contexto && contexto.profissional && contexto.estadoProfissional === 'aprovado'
      ? { href:'/cadastrar-servico', label:'Publicar serviço' }
      : contexto?.empresa && contexto.empresaAprovada ? { href:'/empresa/painel/vagas/nova', label:'Publicar vaga' } : null

    return <>
      <a href="#main-content" className="skip-link">Ir para o conteúdo principal</a>
      <header ref={ref} className={cn('liquid-glass-navbar sticky top-0 z-200 w-full', className)} role="banner">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-2 sm:gap-4">
            <div className="flex min-w-0 items-center gap-2">
              <Link href="/" aria-label="NegóMapa - Página inicial" className="inline-flex min-h-11 items-center rounded-full px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"><img src={isDark ? '/identidade/logo-negomapa-fundo-escuro.svg' : '/identidade/logo-negomapa-fundo-claro.svg'} alt="NegóMapa" className="h-8 w-auto max-w-[120px] object-contain sm:h-10 sm:max-w-[180px]" width="560" height="120" /></Link>
              <nav aria-label="Navegação principal" className="hidden items-center gap-1 lg:flex xl:gap-2">
                {linksCabecalho.map((item) => <Link key={item.id} href={item.rota} aria-current={estaActivo(item.rota) ? 'page' : undefined} className={cn('inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500', estaActivo(item.rota) ? 'bg-orange-500/10 text-orange-700 dark:text-orange-400' : 'text-neutral-800 hover:bg-white/50 hover:text-orange-600 dark:text-cream-text dark:hover:bg-white/10 dark:hover:text-orange-400')}>{item.rotulo}</Link>)}
              </nav>
            </div>
            <div className="flex min-w-0 items-center gap-1 sm:gap-2">
              {!hideGlobalSearch && <div className="hidden min-w-0 flex-1 justify-end md:flex lg:max-w-xs"><PesquisaGlobal /></div>}
              <Link href="/descobrir" aria-label="Pesquisar" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-card-border bg-white/70 text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:bg-navy-dark/70 dark:text-cream md:hidden"><svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg></Link>
              {publicar && <Link href={publicar.href} className="hidden min-h-11 items-center rounded-full bg-orange-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 lg:inline-flex">{publicar.label}</Link>}
              <ThemeToggle />
              {contexto?.autenticado && <NotificacoesBotao />}
              <div className="hidden lg:block"><AuthUserMenu /></div>
              <button type="button" onClick={() => setMenuAberto(true)} aria-expanded={menuAberto} aria-controls="mobile-menu" aria-label="Abrir menu" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-card-border bg-white/70 text-navy transition-colors hover:border-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:bg-navy-dark/70 dark:text-cream lg:hidden"><IconeMenu /></button>
            </div>
          </div>
          {!hideGlobalSearch && <div className="pb-3 md:hidden"><PesquisaGlobal /></div>}
        </div>
      </header>
      <MobileMenu aberto={menuAberto} onFechar={() => setMenuAberto(false)} pathname={pathname} />
    </>
  }
)
Header.displayName = 'Header'
