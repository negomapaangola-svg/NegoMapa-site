import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { isAdmin } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Conteúdos e actividade | NegóMapa',
  description: 'Consulta administrativa de produtos, candidaturas e pedidos.',
}

type ContentType = 'produtos' | 'candidaturas' | 'pedidos'
type Row = { id: string; title: string; status: string; createdAt: string; detail: string }

const TABS: Array<{ value: ContentType; label: string }> = [
  { value: 'produtos', label: 'Produtos' },
  { value: 'candidaturas', label: 'Candidaturas' },
  { value: 'pedidos', label: 'Pedidos' },
]

export default async function AdminContentPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ tipo?: string; q?: string; estado?: string }>
}) {
  if (!(await isAdmin())) notFound()

  const params = await searchParamsPromise
  const type: ContentType = TABS.some((tab) => tab.value === params.tipo) ? params.tipo as ContentType : 'produtos'
  const search = (params.q || '').trim().slice(0, 100)
  const status = (params.estado || '').trim().slice(0, 40)
  const supabase = await createSupabaseServerClient()
  let rows: Row[] = []
  let error = false

  if (type === 'produtos') {
    let query = supabase.from('produtos').select('id,titulo,estado_aprovacao,criado_em,company_id').order('criado_em', { ascending: false }).limit(100)
    if (search) query = query.ilike('titulo', `%${search}%`)
    if (status) query = query.eq('estado_aprovacao', status)
    const result = await query
    error = Boolean(result.error)
    rows = (result.data ?? []).map((item) => ({
      id: item.id,
      title: item.titulo,
      status: item.estado_aprovacao,
      createdAt: item.criado_em,
      detail: `Empresa: ${item.company_id}`,
    }))
  } else if (type === 'candidaturas') {
    let query = supabase.from('candidaturas').select('id,nome_candidato,estado,criada_em,vaga_id').order('criada_em', { ascending: false }).limit(100)
    if (search) query = query.ilike('nome_candidato', `%${search}%`)
    if (status) query = query.eq('estado', status)
    const result = await query
    error = Boolean(result.error)
    rows = (result.data ?? []).map((item) => ({
      id: item.id,
      title: item.nome_candidato,
      status: item.estado,
      createdAt: item.criada_em,
      detail: `Vaga: ${item.vaga_id}`,
    }))
  } else {
    let query = supabase.from('pedidos_servico').select('id,titulo,estado,criada_em,profissional_id,servico_id').order('criada_em', { ascending: false }).limit(100)
    if (search) query = query.ilike('titulo', `%${search}%`)
    if (status) query = query.eq('estado', status)
    const result = await query
    error = Boolean(result.error)
    rows = (result.data ?? []).map((item) => ({
      id: item.id,
      title: item.titulo,
      status: item.estado,
      createdAt: item.criada_em,
      detail: `Profissional: ${item.profissional_id} · Serviço: ${item.servico_id}`,
    }))
  }

  return (
    <MainLayout>
      <main className="min-h-screen bg-cream px-4 py-8 dark:bg-navy-dark sm:px-6">
        <div className="mx-auto max-w-7xl">
          <header className="mb-7">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400">Administração</p>
            <h1 className="mt-2 text-3xl font-bold text-ink dark:text-cream">Conteúdos e actividade</h1>
            <p className="mt-2 text-sm text-neutral-600 dark:text-cream-text/70">Consulta, pesquisa e filtragem de registos. Os estados e datas são apresentados a partir das tabelas de origem.</p>
          </header>

          <nav className="mb-5 flex flex-wrap gap-2" aria-label="Tipo de conteúdo">
            {TABS.map((tab) => (
              <Link key={tab.value} href={`/admin/conteudos?tipo=${tab.value}`} aria-current={type === tab.value ? 'page' : undefined}
                className={`rounded-md px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${type === tab.value ? 'bg-orange-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700'}`}>
                {tab.label}
              </Link>
            ))}
            <Link href="/admin/servicos" className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:text-neutral-200 dark:hover:bg-neutral-800">Serviços</Link>
            <Link href="/admin/vagas" className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:text-neutral-200 dark:hover:bg-neutral-800">Vagas</Link>
          </nav>

          <form className="mb-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px_auto]" action="/admin/conteudos">
            <input type="hidden" name="tipo" value={type} />
            <label className="sr-only" htmlFor="content-search">Pesquisar</label>
            <input id="content-search" name="q" defaultValue={search} placeholder="Pesquisar registos..." className="min-w-0 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100" />
            <label className="sr-only" htmlFor="content-status">Estado</label>
            <input id="content-status" name="estado" defaultValue={status} placeholder="Filtrar por estado" className="min-w-0 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100" />
            <button type="submit" className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white">Pesquisar</button>
          </form>

          {error ? (
            <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">Não foi possível consultar estes registos. Confirme as permissões RLS e a migração correspondente.</p>
          ) : rows.length === 0 ? (
            <p className="rounded-lg bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300">Não foram encontrados registos.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((row) => (
                <article key={row.id} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/10">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="min-w-0 break-words text-base font-semibold text-slate-950 dark:text-white">{row.title || 'Registo sem título'}</h2>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">{row.status || 'Sem estado'}</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Criado em {new Date(row.createdAt).toLocaleDateString('pt-PT')}</p>
                  <details className="mt-4 border-t border-slate-200 pt-3 text-sm dark:border-slate-700">
                    <summary className="min-h-10 cursor-pointer content-center font-semibold text-orange-800 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:text-orange-300">Ver detalhes</summary>
                    <dl className="mt-3 space-y-2">
                      <div><dt className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Referência</dt><dd className="break-words text-slate-800 dark:text-slate-200">{row.detail}</dd></div>
                      <div><dt className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Identificador</dt><dd className="break-all font-mono text-xs text-slate-600 dark:text-slate-300">{row.id}</dd></div>
                    </dl>
                  </details>
                </article>
              ))}
            </div>
          )}
          <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">Por segurança, esta primeira versão é de consulta. A edição e remoção de registos dependem de regras de integridade e de Storage específicas para cada tipo de conteúdo.</p>
        </div>
      </main>
    </MainLayout>
  )
}
