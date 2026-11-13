import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { MainLayout } from '@/components/layout/MainLayout'
import { Avatar } from '@/components/ui/Avatar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { obterPerfilProfissionalDoUtilizador } from '@/lib/actions/profissional-painel'
import { listarPedidosDoProfissional } from '@/lib/actions/pedidos-profissional'
import { getMediaAvaliacoes } from '@/lib/actions/avaliacoes'
import { LocalizacaoPrestadorForm } from '@/components/localizacao/LocalizacaoPrestadorForm'

export const metadata: Metadata = { title: 'Painel do Profissional | NegóMapa', description: 'Resumo do seu perfil, pedidos, avaliações e mensagens.' }

const estados: Record<string, string> = { pendente: 'Pendente', aprovado: 'Aprovado', rejeitado: 'Rejeitado', suspenso: 'Suspenso' }
function dataLegivel(valor: string | null) {
  if (!valor) return null
  const data = new Date(valor)
  return Number.isNaN(data.getTime()) ? null : new Intl.DateTimeFormat('pt-PT', { dateStyle: 'medium' }).format(data)
}

export default async function ProfissionalPainelPage() {
  const user = await getUser()
  if (!user) redirect('/login?redirectTo=/profissional/painel')
  const perfil = await obterPerfilProfissionalDoUtilizador()
  if (!perfil) return <MainLayout><section className="bg-cream py-12 dark:bg-navy-dark"><div className="mx-auto max-w-3xl px-4"><Card variant="liquid" padding="lg"><CardHeader><CardTitle as="h1">Painel do profissional</CardTitle><p className="text-sm text-neutral-600 dark:text-cream-text">Ainda não existe um perfil profissional associado a esta conta.</p></CardHeader><CardContent><Link href="/cadastrar-profissional" className="inline-flex min-h-11 items-center rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white hover:bg-orange-600">Concluir registo</Link></CardContent></Card></div></section></MainLayout>

  const supabase = await createSupabaseServerClient()
  let categoriaNome: string | null = null
  if (perfil.categoria_id) {
    const { data } = await supabase.from('categorias').select('nome').eq('id', perfil.categoria_id).maybeSingle()
    categoriaNome = data?.nome ?? null
  }
  const aprovado = perfil.estado === 'aprovado'
  const [pedidos, avaliacoes] = aprovado ? await Promise.all([listarPedidosDoProfissional(), getMediaAvaliacoes({ tipo: 'profissional', id: perfil.id })]) : [null, null]
  const portfolio = Array.isArray(perfil.portfolio) ? perfil.portfolio : []
  const metricas = [
    { label: 'Pedidos', valor: pedidos?.success ? pedidos.data.length : 0 },
    { label: 'Avaliações', valor: avaliacoes?.total ?? 0 },
    { label: 'Mensagens', valor: 'Abrir' },
  ]
  const estado = estados[perfil.estado] ?? perfil.estado
  const atalhos = [
    { href: '/profissional/painel/pedidos', label: 'Pedidos' },
    { href: '/profissional/painel/mensagens', label: 'Mensagens' },
    { href: '/editar-perfil', label: 'Editar perfil e portfólio' },
    { href: `/profissionais/${perfil.slug}`, label: 'Perfil público' },
  ]

  return <MainLayout><section className="bg-cream py-10 dark:bg-navy-dark lg:py-14"><div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
    <Card variant="liquid" padding="lg">
      <CardHeader><CardTitle as="h1" className="text-2xl md:text-3xl">Painel do profissional</CardTitle><p className="text-sm text-neutral-600 dark:text-cream-text">Resumo do seu perfil e actividade na NegóMapa.</p></CardHeader>
      <CardContent className="space-y-7">
        {perfil.estado === 'aprovado' && <LocalizacaoPrestadorForm tipo="profissional" entidadeId={perfil.id} />}
        <div className="flex flex-col gap-4 border-b border-card-border pb-6 sm:flex-row sm:items-center">
          <Avatar src={perfil.avatar_url} alt={perfil.nome} name={perfil.nome} width={80} height={80} className="h-20 w-20" />
          <div className="min-w-0 flex-1"><h2 className="text-xl font-semibold text-ink dark:text-cream">{perfil.nome}</h2><p className="mt-1 text-sm text-neutral-600 dark:text-cream-text">{[categoriaNome, perfil.provincia, perfil.municipio].filter(Boolean).join(' · ') || 'Dados profissionais'}</p><span className="mt-3 inline-flex rounded-full border border-card-border px-3 py-1 text-sm font-medium">{estado}</span></div>
          <Link href="/editar-perfil" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-orange-500 px-5 py-3 text-sm font-bold text-orange-700 hover:bg-orange-50 dark:text-orange-300 dark:hover:bg-orange-950/30">Editar perfil</Link>
        </div>
        {perfil.estado === 'rejeitado' && perfil.motivo_rejeicao && <div role="status" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"><strong>Motivo da rejeição:</strong> {perfil.motivo_rejeicao}</div>}
        <dl className="grid gap-4 sm:grid-cols-2"><div><dt className="text-xs text-neutral-500">Categoria</dt><dd className="mt-1 text-sm">{categoriaNome ?? 'Não indicada'}</dd></div><div><dt className="text-xs text-neutral-500">Localização</dt><dd className="mt-1 text-sm">{[perfil.provincia, perfil.municipio].filter(Boolean).join(' · ') || 'Não indicada'}</dd></div><div><dt className="text-xs text-neutral-500">Data de avaliação</dt><dd className="mt-1 text-sm">{dataLegivel(perfil.avaliado_em) ?? 'Ainda não avaliado'}</dd></div><div><dt className="text-xs text-neutral-500">Portfólio</dt><dd className="mt-1 text-sm">{portfolio.length} {portfolio.length === 1 ? 'item' : 'itens'}</dd></div></dl>
        {aprovado ? <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">{metricas.map((item) => <div key={item.label} className="rounded-xl border border-card-border p-4"><p className="text-2xl font-semibold text-ink dark:text-cream">{item.valor}</p><p className="mt-1 text-sm text-neutral-600 dark:text-cream-text">{item.label}</p></div>)}</div> : <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-200">As funcionalidades de pedidos e avaliações ficam disponíveis quando o perfil estiver aprovado. O estado actual é apresentado sem alterações.</div>}
        <div><h2 className="text-lg font-semibold text-ink dark:text-cream">Acesso rápido</h2><ul className="mt-3 grid gap-3 sm:grid-cols-2">{atalhos.map((item) => <li key={item.href}><Link href={item.href} className="block min-h-12 rounded-xl border border-card-border p-4 text-sm font-medium text-ink hover:border-orange-400 dark:text-cream">{item.label}</Link></li>)}</ul></div>
      </CardContent>
    </Card>
  </div></section></MainLayout>
}
