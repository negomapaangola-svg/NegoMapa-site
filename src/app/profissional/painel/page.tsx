import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { MainLayout } from '@/components/layout/MainLayout'
import { Avatar } from '@/components/ui/Avatar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { DashboardMetric } from '@/components/ui/DashboardMetric'
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
  const estado = estados[perfil.estado] ?? perfil.estado
  const atalhos = [
    { href: '/profissional/painel/pedidos', label: 'Pedidos' },
    { href: '/profissional/painel/mensagens', label: 'Mensagens' },
    { href: '/editar-perfil', label: 'Editar perfil e portfólio' },
    { href: `/profissionais/${perfil.slug}`, label: 'Perfil público' },
  ]

  return <MainLayout>
    <section className="min-h-[60vh] bg-cream px-4 py-6 dark:bg-navy-dark sm:py-8">
      <div className="mx-auto max-w-6xl space-y-4 sm:space-y-5">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-700 dark:text-orange-300">Área profissional</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink dark:text-cream sm:text-3xl">O seu painel</h1><p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">Acompanhe o perfil e a actividade num só lugar.</p></div>
          <Link href="/editar-perfil" className="inline-flex min-h-10 w-fit items-center justify-center rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-neutral-700 dark:text-cream dark:hover:bg-neutral-800">Editar perfil</Link>
        </header>
        <section className="rounded-2xl bg-white p-5 shadow-sm dark:bg-neutral-900 sm:p-6" aria-labelledby="perfil-profissional-heading">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar src={perfil.avatar_url} alt={perfil.nome} name={perfil.nome} width={64} height={64} className="h-16 w-16" />
            <div className="min-w-0 flex-1"><h2 id="perfil-profissional-heading" className="text-xl font-semibold text-ink dark:text-cream">{perfil.nome}</h2><p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{[categoriaNome, perfil.provincia, perfil.municipio].filter(Boolean).join(' · ') || 'Dados profissionais por completar'}</p></div>
            <span className={'inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ' + (perfil.estado === 'aprovado' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' : perfil.estado === 'rejeitado' || perfil.estado === 'suspenso' ? 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300' : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300')}>{estado}</span>
          </div>
          {perfil.estado === 'rejeitado' && perfil.motivo_rejeicao && <p role="status" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200"><strong>Motivo da rejeição:</strong> {perfil.motivo_rejeicao}</p>}
          {aprovado ? <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-neutral-100 pt-4 dark:border-neutral-800 sm:grid-cols-3"><DashboardMetric label="Pedidos recebidos" value={pedidos?.success ? pedidos.data.length : 0} /><DashboardMetric label="Avaliações" value={avaliacoes?.total ?? 0} /><DashboardMetric label="Portfólio" value={portfolio.length} detail={portfolio.length === 1 ? 'item' : 'itens'} /></dl> : <p role="status" className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">As áreas de pedidos e avaliações ficam disponíveis após a aprovação do perfil.</p>}
        </section>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.85fr)]">
          <section className="rounded-2xl bg-white p-5 shadow-sm dark:bg-neutral-900 sm:p-6" aria-labelledby="actividade-heading"><h2 id="actividade-heading" className="text-base font-semibold text-ink dark:text-cream">Actividade</h2><p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Acesso directo às tarefas do dia-a-dia.</p><nav className="mt-3 divide-y divide-neutral-100 dark:divide-neutral-800" aria-label="Acções do profissional">{atalhos.map((item) => <Link key={item.href} href={item.href} className="flex min-h-11 items-center justify-between gap-3 py-3 text-sm font-medium text-ink transition-colors hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:text-neutral-100 dark:hover:text-orange-300">{item.label}<span aria-hidden="true" className="text-neutral-400">→</span></Link>)}</nav></section>
          <section className="rounded-2xl bg-white p-5 shadow-sm dark:bg-neutral-900 sm:p-6" aria-labelledby="dados-heading"><h2 id="dados-heading" className="text-base font-semibold text-ink dark:text-cream">Dados do perfil</h2><dl className="mt-3 space-y-3"><div><dt className="text-xs text-neutral-500 dark:text-neutral-400">Categoria</dt><dd className="mt-0.5 text-sm font-medium text-ink dark:text-neutral-100">{categoriaNome ?? 'Não indicada'}</dd></div><div><dt className="text-xs text-neutral-500 dark:text-neutral-400">Localização</dt><dd className="mt-0.5 text-sm font-medium text-ink dark:text-neutral-100">{[perfil.provincia, perfil.municipio].filter(Boolean).join(' · ') || 'Não indicada'}</dd></div><div><dt className="text-xs text-neutral-500 dark:text-neutral-400">Avaliação do perfil</dt><dd className="mt-0.5 text-sm font-medium text-ink dark:text-neutral-100">{dataLegivel(perfil.avaliado_em) ?? 'Ainda não avaliado'}</dd></div></dl></section>
        </div>
        {aprovado && <section className="rounded-2xl bg-white p-5 shadow-sm dark:bg-neutral-900 sm:p-6" aria-labelledby="localizacao-heading"><h2 id="localizacao-heading" className="mb-3 text-base font-semibold text-ink dark:text-cream">Localização de atendimento</h2><LocalizacaoPrestadorForm tipo="profissional" entidadeId={perfil.id} /></section>}
      </div>
    </section>
  </MainLayout>
}
