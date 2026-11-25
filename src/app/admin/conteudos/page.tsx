import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { SettingsSheet } from '@/components/ui/CatalogComponents'
import { isAdmin } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { AdminConteudosClient } from './_components/AdminConteudosClient'

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
            <p className="mt-2 text-sm text-neutral-600 dark:text-cream-text/70">Consulta, pesquisa e filtragem de registos.</p>
          </header>

          <nav className="mb-5 flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <Link key={tab.value} href={`/admin/conteudos?tipo=${tab.value}`} className={`rounded-md px-3 py-2 text-sm font-medium ${type === tab.value ? 'bg-orange-600 text-white' : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200'}`}>
                {tab.label}
              </Link>
            ))}
            <Link href="/admin/servicos" className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">Serviços</Link>
            <Link href="/admin/vagas" className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">Vagas</Link>
          </nav>

          {error ? (
            <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">Não foi possível consultar estes registos.</p>
          ) : (
            <AdminConteudosClient tipo={type} initialRows={rows} />
          )}
        </div>
      </main>
    </MainLayout>
  )
}
