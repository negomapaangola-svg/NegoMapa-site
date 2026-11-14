'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutAction } from '@/lib/actions/logout'
import { obterContextoNavegacao } from '@/lib/actions/permissoes'
import { acompanharSistema, definirTema } from '@/lib/tema'
import { GRUPOS_MENU_MOBILE, ITENS_NAVEGACAO, podeVerItem, type ItemNavegacao } from '@/lib/navegacao'

type Contexto = Awaited<ReturnType<typeof obterContextoNavegacao>>
type Tema = 'claro' | 'escuro' | 'sistema'

function IconePerfil() {
  return <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><circle cx="12" cy="8" r="3.5" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></svg>
}

export function AuthUserMenu({ variante = 'cabecalho', onNavigate }: { variante?: 'cabecalho' | 'lista'; onNavigate?: () => void }) {
  const [contexto, setContexto] = useState<Contexto | null>(null)
  const [aberto, setAberto] = useState(false)
  const [tema, setTema] = useState<Tema>('sistema')
  const pathname = usePathname()
  useEffect(() => {
    let activo = true
    const carregar = () => obterContextoNavegacao().then((c) => { if (activo) setContexto(c) }).catch(() => { if (activo) setContexto({ autenticado:false, profissional:false, estadoProfissional:null, empresa:false, empresaAprovada:false, administrador:false, accountType:null }) })
    carregar()
    const aoSair = () => { setContexto({ autenticado:false, profissional:false, estadoProfissional:null, empresa:false, empresaAprovada:false, administrador:false, accountType:null }); setAberto(false) }
    window.addEventListener('negomapa:auth-logout-started', aoSair)
    try {
      const escolha = localStorage.getItem('negomapa-tema')
      setTema(escolha === 'claro' || escolha === 'escuro' ? escolha : 'sistema')
    } catch { setTema('sistema') }
    const pararAcompanharSistema = acompanharSistema()
    return () => { activo = false; window.removeEventListener('negomapa:auth-logout-started', aoSair); pararAcompanharSistema() }
  }, [])

  if (!contexto) return null
  const lista = variante === 'lista'
  const classeLink = lista
    ? 'flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-navy hover:bg-cream hover:text-orange-600 dark:text-cream dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500'
    : 'inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium text-navy hover:text-orange-600 dark:text-cream dark:hover:text-orange-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500'
  const link = (item: ItemNavegacao) => <Link key={item.id} href={item.rota} onClick={() => { setAberto(false); onNavigate?.() }} aria-label={item.rotulo} aria-current={pathname === item.rota || (item.rota !== '/' && pathname.startsWith(item.rota + '/')) ? 'page' : undefined} className={classeLink}>{item.rotulo}</Link>

  if (!lista) {
    if (!contexto.autenticado) return <Link href="/login" aria-label="Entrar na conta" title="Entrar" className="inline-flex h-11 w-11 min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-card-border bg-white/70 text-navy transition-colors hover:border-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:bg-navy-dark/70 dark:text-cream"><IconePerfil /></Link>
    const itemPerfil = ITENS_NAVEGACAO.find((i) => i.id === 'perfil')!
    return <div className="relative shrink-0">
      <button type="button" onClick={() => setAberto((valor) => !valor)} aria-expanded={aberto} aria-haspopup="true" aria-label="Abrir menu da conta" title="A minha conta" className="inline-flex h-11 w-11 min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-card-border bg-white/70 text-navy transition-colors hover:border-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:bg-navy-dark/70 dark:text-cream"><IconePerfil /></button>
      {aberto && <div aria-label="Menu da conta" className="absolute right-0 top-14 z-[250] w-64 rounded-2xl border border-card-border bg-white p-3 shadow-xl dark:bg-neutral-900">
        <div className="px-3 pb-2 text-xs text-neutral-500">A minha conta</div>
        <div className="space-y-1">
          <Link href={itemPerfil.rota} onClick={() => setAberto(false)} className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-cream dark:hover:bg-white/10">Perfil</Link>
          <Link href="/configuracoes" onClick={() => setAberto(false)} className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-cream dark:hover:bg-white/10">Configurações</Link>
          {contexto.profissional && <Link role="menuitem" href="/profissional/painel" onClick={() => setAberto(false)} className="block rounded-lg px-3 py-2.5 text-sm hover:bg-cream dark:hover:bg-white/10">Painel profissional</Link>}
          {contexto.empresa && <Link role="menuitem" href="/empresa/painel" onClick={() => setAberto(false)} className="block rounded-lg px-3 py-2.5 text-sm hover:bg-cream dark:hover:bg-white/10">Painel empresarial</Link>}
          <Link role="menuitem" href="/mensagens" onClick={() => setAberto(false)} className="block rounded-lg px-3 py-2.5 text-sm hover:bg-cream dark:hover:bg-white/10">Mensagens</Link>
          <Link role="menuitem" href="/notificacoes" onClick={() => setAberto(false)} className="block rounded-lg px-3 py-2.5 text-sm hover:bg-cream dark:hover:bg-white/10">Notificações</Link>
          {contexto.administrador && <Link role="menuitem" href="/admin" onClick={() => setAberto(false)} className="block rounded-lg px-3 py-2.5 text-sm hover:bg-cream dark:hover:bg-white/10">Administração</Link>}
        </div>
        <div className="my-2 border-t border-card-border" />
        <p className="px-3 pb-1 text-xs font-semibold text-neutral-500">Tema</p>
        <div className="grid grid-cols-3 gap-1" aria-label="Preferência de tema">
          {(['claro', 'escuro', 'sistema'] as const).map((opcao) => <button key={opcao} type="button" aria-pressed={tema === opcao} onClick={() => { definirTema(opcao); setTema(opcao) }} className={`rounded-lg px-2 py-2 text-xs capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${tema === opcao ? 'bg-orange-500/15 font-semibold text-orange-700 dark:text-orange-300' : 'hover:bg-cream dark:hover:bg-white/10'}`}>{opcao === 'sistema' ? 'Sistema' : opcao}</button>)}
        </div>
        <div className="my-2 border-t border-card-border" />
        <form action={logoutAction}><button type="submit" onClick={() => setAberto(false)} className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:text-red-300 dark:hover:bg-red-950/30">Terminar sessão</button></form>
      </div>}
    </div>
  }

  return <nav aria-label="Menu da conta" className="space-y-5">
    {GRUPOS_MENU_MOBILE.map((grupo) => {
      const itens = grupo.itens.map((id) => ITENS_NAVEGACAO.find((item) => item.id === id)).filter((item): item is ItemNavegacao => { if (!item) return false; return item.locais.includes('menu_mobile') && podeVerItem(item, contexto) })
      if (!itens.length) return null
      return <section key={grupo.id} aria-labelledby={`menu-${grupo.id}`}>
        <h2 id={`menu-${grupo.id}`} className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-cream-text/70">{grupo.titulo}</h2>
        <ul className="space-y-1">{itens.map((item) => <li key={item.id}>{item.id === 'sair' ? <form action={logoutAction}><button type="submit" onClick={onNavigate} className={`${classeLink} w-full text-left`}>Sair</button></form> : link(item)}</li>)}</ul>
      </section>
    })}
    <section aria-labelledby="menu-tema">
      <h2 id="menu-tema" className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-cream-text/70">Tema</h2>
      <div className="grid grid-cols-3 gap-2 px-3">{(['claro', 'escuro', 'sistema'] as const).map((opcao) => <button key={opcao} type="button" onClick={() => definirTema(opcao)} className="min-h-11 rounded-lg border border-card-border px-2 text-sm capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500">{opcao}</button>)}</div>
    </section>
  </nav>
}
