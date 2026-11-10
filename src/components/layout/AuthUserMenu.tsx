'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { logoutAction } from '@/lib/actions/logout'
import { obterContextoNavegacao } from '@/lib/actions/permissoes'
import { GRUPOS_MENU_MOBILE, ITENS_NAVEGACAO, podeVerItem, type ItemNavegacao } from '@/lib/navegacao'

type Contexto = Awaited<ReturnType<typeof obterContextoNavegacao>>

export function AuthUserMenu({ variante = 'cabecalho', onNavigate }: { variante?: 'cabecalho' | 'lista'; onNavigate?: () => void }) {
  const [contexto, setContexto] = useState<Contexto | null>(null)
  useEffect(() => {
    let activo = true
    const carregar = () => obterContextoNavegacao().then((c) => { if (activo) setContexto(c) }).catch(() => { if (activo) setContexto({ autenticado:false, profissional:false, estadoProfissional:null, empresa:false, empresaAprovada:false, administrador:false }) })
    carregar()
    return () => { activo = false }
  }, [])

  if (!contexto) return null
  const lista = variante === 'lista'
  const classeLink = lista
    ? 'flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-navy hover:bg-cream hover:text-orange-600 dark:text-cream dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500'
    : 'inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium text-navy hover:text-orange-600 dark:text-cream dark:hover:text-orange-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500'
  const link = (item: ItemNavegacao) => <Link key={item.id} href={item.rota} onClick={onNavigate} aria-label={item.rotulo} className={classeLink}>{item.rotulo}</Link>

  if (!lista) {
    if (!contexto.autenticado) return <Link href="/login" className={classeLink}>Entrar</Link>
    const itemConta = ITENS_NAVEGACAO.find((i) => i.id === (contexto.profissional ? 'perfil' : contexto.empresa ? 'painel-empresa' : 'pedidos'))!
    return <div className="flex items-center gap-2">{contexto.administrador && link(ITENS_NAVEGACAO.find(i => i.id === 'administracao')!)}{link(itemConta)}<form action={logoutAction}><button type="submit" className={classeLink}>Sair</button></form></div>
  }

  return <nav aria-label="Menu da conta" className="space-y-5">
    {GRUPOS_MENU_MOBILE.map((grupo) => {
      const itens = grupo.itens.map((id) => ITENS_NAVEGACAO.find((item) => item.id === id)).filter((item): item is ItemNavegacao => { if (!item) return false; return item.locais.includes('menu_mobile') && podeVerItem(item, { ...contexto, userId: null }) })
      if (!itens.length) return null
      return <section key={grupo.id} aria-labelledby={`menu-${grupo.id}`}>
        <h2 id={`menu-${grupo.id}`} className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-cream-text/70">{grupo.titulo}</h2>
        <ul className="space-y-1">{itens.map((item) => <li key={item.id}>{item.id === 'sair' ? <form action={logoutAction}><button type="submit" onClick={onNavigate} className={`${classeLink} w-full text-left`}>Sair</button></form> : link(item)}</li>)}</ul>
      </section>
    })}
  </nav>
}
