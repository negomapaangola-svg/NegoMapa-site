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
import { listarConversas } from '@/lib/actions/conversas'
import { LocalizacaoPrestadorForm } from '@/components/localizacao/LocalizacaoPrestadorForm'

export const metadata: Metadata = { title: 'Painel do Profissional | NegóMapa', description: 'Resumo do seu perfil, serviços, pedidos e mensagens.' }
const estados: Record<string, string> = { pendente: 'Pendente', aprovado: 'Aprovado', rejeitado: 'Rejeitado', suspenso: 'Suspenso' }
const acaoSecundaria = 'flex min-h-11 items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:text-neutral-100 dark:hover:bg-neutral-800'
function dataLegivel(valor: string | null) {
  if (!valor) return 'Data não disponível'
  const data = new Date(valor)
  return Number.isNaN(data.getTime()) ? 'Data não disponível' : new Intl.DateTimeFormat('pt-PT', { dateStyle: 'medium' }).format(data)
}

export default async function ProfissionalPainelPage() {
  const user = await getUser()
  if (!user) redirect('/login?redirectTo=/profissional/painel')
  const perfil = await obterPerfilProfissionalDoUtilizador()
  if (!perfil) return <MainLayout><section className="bg-cream px-4 py-12 dark:bg-navy-dark"><div className="mx-auto max-w-3xl"><Card variant="liquid" padding="lg"><CardHeader><CardTitle as="h1">Painel do profissional</CardTitle><p className="text-sm text-neutral-600 dark:text-cream-text">Ainda não existe um perfil profissional associado a esta conta.</p></CardHeader><CardContent><Link href="/cadastrar-profissional" className="inline-flex min-h-11 items-center rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500">Concluir registo</Link></CardContent></Card></div></section></MainLayout>

  const supabase = await createSupabaseServerClient()
  let categoriaNome: string | null = null
  if (perfil.categoria_id) {
    const { data } = await supabase.from('categorias').select('nome').eq('id', perfil.categoria_id).maybeSingle()
    categoriaNome = data?.nome ?? null
  }
  const aprovado = perfil.estado === 'aprovado'
  const [pedidos, avaliacoes, conversas, servicos] = await Promise.all([
    aprovado ? listarPedidosDoProfissional() : Promise.resolve(null),
    aprovado ? getMediaAvaliacoes({ tipo: 'profissional', id: perfil.id }) : Promise.resolve(null),
    aprovado ? listarConversas() : Promise.resolve(null),
    aprovado ? supabase.from('servicos').select('id', { count: 'exact', head: true }).eq('profissional_id', perfil.id).eq('estado', 'aprovado') : Promise.resolve(null),
  ])
  const pedidosNovos = pedidos?.success ? pedidos.data.filter((pedido) => pedido.estado === 'novo').length : null
  const mensagensPorLer = conversas?.success ? conversas.data.filter((conversa) => conversa.papel === 'profissional').reduce((total, conversa) => total + conversa.nao_lidas, 0) : null
  const servicosActivos = servicos && !servicos.error ? servicos.count ?? 0 : null
  const portfolio = Array.isArray(perfil.portfolio) ? perfil.portfolio : []
  const estado = estados[perfil.estado] ?? perfil.estado
  const pedidosRecentes = pedidos?.success ? pedidos.data.slice(0, 3) : []
  const localizacao = [perfil.provincia, perfil.municipio].filter(Boolean).join(' · ') || 'Por indicar'

  return <MainLayout>
    <main id="main-content" className="min-h-[60vh] bg-cream px-4 py-6 dark:bg-navy-dark sm:py-8">
      <div className="mx-auto max-w-6xl space-y-4 sm:space-y-5">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-700 dark:text-orange-300">Área profissional</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink dark:text-cream sm:text-3xl">O seu painel</h1><p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">Estado, actividade e gestão do seu trabalho.</p></div>
          <Link href={'/profissionais/' + perfil.slug} className="inline-flex min-h-10 w-fit items-center rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-neutral-700 dark:text-cream dark:hover:bg-neutral-800">Ver perfil público</Link>
        </header>
        <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-900 sm:p-5" aria-labelledby="estado-profissional">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Avatar src={perfil.avatar_url} alt={perfil.nome} name={perfil.nome} width={56} height={56} className="h-14 w-14" />
            <div className="min-w-0 flex-1"><p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Estado do perfil</p><h2 id="estado-profissional" className="mt-0.5 text-xl font-semibold text-ink dark:text-cream">{perfil.nome}</h2><p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{[categoriaNome, localizacao].filter(Boolean).join(' · ')}</p></div>
            <span className={'inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ' + (perfil.estado === 'aprovado' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' : perfil.estado === 'rejeitado' || perfil.estado === 'suspenso' ? 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300' : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300')}>{estado}</span>
          </div>
          {perfil.estado === 'rejeitado' && perfil.motivo_rejeicao && <p role="status" className="mt-3 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200"><strong>Motivo da rejeição:</strong> {perfil.motivo_rejeicao}</p>}
          {aprovado ? <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-neutral-100 pt-4 dark:border-neutral-800 sm:grid-cols-4">
            <DashboardMetric label="Pedidos novos" value={pedidosNovos ?? '—'} />
            <DashboardMetric label="Avaliações" value={avaliacoes?.total ?? '—'} />
            <DashboardMetric label="Serviços activos" value={servicosActivos ?? '—'} />
            <DashboardMetric label="Mensagens por ler" value={mensagensPorLer ?? '—'} />
          </dl> : <p role="status" className="mt-3 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">A aprovação do perfil desbloqueia a publicação de serviços e a gestão de pedidos e mensagens.</p>}
        </section>
        <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-900 sm:p-5" aria-labelledby="acoes-profissional">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 id="acoes-profissional" className="text-base font-semibold text-ink dark:text-cream">Acções principais</h2><p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">As tarefas mais importantes ficam aqui.</p></div>
            <Link href="/cadastrar-servico" aria-disabled={!aprovado} className={'inline-flex min-h-10 items-center justify-center rounded-lg px-4 py-2 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ' + (aprovado ? 'bg-orange-600 hover:bg-orange-700' : 'pointer-events-none bg-neutral-400')}>Publicar serviço</Link>
          </div>
          <nav className="mt-3 grid gap-1 sm:grid-cols-2" aria-label="Acções principais do profissional">
            <Link className={acaoSecundaria} href="/servicos">Gerir e consultar serviços <span aria-hidden="true" className="text-neutral-400">→</span></Link>
            <Link className={acaoSecundaria} href="/profissional/painel/pedidos">Ver pedidos <span aria-hidden="true" className="text-neutral-400">→</span></Link>
            <Link className={acaoSecundaria} href="/editar-perfil#portfolio">Editar portfólio <span aria-hidden="true" className="text-neutral-400">→</span></Link>
            <Link className={acaoSecundaria} href="/editar-perfil#disponibilidade">Actualizar disponibilidade <span aria-hidden="true" className="text-neutral-400">→</span></Link>
          </nav>
          {!aprovado && <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">A publicação de serviços fica bloqueada até à aprovação.</p>}
        </section>
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]" aria-label="Histórico e dados complementares">
          <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-900 sm:p-5">
            <div className="flex items-center justify-between gap-3"><div><h2 className="text-base font-semibold text-ink dark:text-cream">Histórico recente</h2><p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Os últimos pedidos recebidos.</p></div><Link href="/profissional/painel/pedidos" className="text-xs font-semibold text-orange-700 underline underline-offset-2 dark:text-orange-300">Ver tudo</Link></div>
            {pedidos?.success ? pedidosRecentes.length ? <ul className="mt-3 divide-y divide-neutral-100 dark:divide-neutral-800">{pedidosRecentes.map((pedido) => <li key={pedido.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-medium text-ink dark:text-neutral-100">{pedido.titulo}</p><p className="text-xs text-neutral-500 dark:text-neutral-400">{dataLegivel(pedido.criada_em)}</p></div><span className="w-fit rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">{pedido.estado.replaceAll('_', ' ')}</span></li>)}</ul> : <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">Ainda não existem pedidos registados.</p> : <p role="status" className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">Não foi possível carregar o histórico neste momento.</p>}
          </div>
          <div className="space-y-4">
            <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-900 sm:p-5" aria-labelledby="dados-complementares">
              <h2 id="dados-complementares" className="text-base font-semibold text-ink dark:text-cream">Dados complementares</h2>
              <dl className="mt-3 space-y-2.5"><div><dt className="text-xs text-neutral-500 dark:text-neutral-400">Categoria</dt><dd className="text-sm font-medium text-ink dark:text-neutral-100">{categoriaNome ?? 'Não indicada'}</dd></div><div><dt className="text-xs text-neutral-500 dark:text-neutral-400">Localização</dt><dd className="text-sm font-medium text-ink dark:text-neutral-100">{localizacao}</dd></div><div><dt className="text-xs text-neutral-500 dark:text-neutral-400">Portfólio</dt><dd className="text-sm font-medium text-ink dark:text-neutral-100">{portfolio.length} {portfolio.length === 1 ? 'item' : 'itens'}</dd></div><div><dt className="text-xs text-neutral-500 dark:text-neutral-400">Perfil avaliado em</dt><dd className="text-sm font-medium text-ink dark:text-neutral-100">{dataLegivel(perfil.avaliado_em)}</dd></div></dl>
            </section>
            <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-900 sm:p-5" aria-labelledby="config-profissional"><h2 id="config-profissional" className="text-base font-semibold text-ink dark:text-cream">Configurações</h2><p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Preferências, notificações e privacidade da conta.</p><Link href="/configuracoes" className="mt-3 inline-flex min-h-9 items-center text-sm font-semibold text-orange-700 underline underline-offset-2 dark:text-orange-300">Abrir configurações</Link></section>
          </div>
        </section>
        {aprovado && <section id="localizacao-profissional" className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-900 sm:p-5" aria-labelledby="localizacao-heading"><h2 id="localizacao-heading" className="mb-3 text-base font-semibold text-ink dark:text-cream">Localização de atendimento</h2><LocalizacaoPrestadorForm tipo="profissional" entidadeId={perfil.id} /></section>}
      </div>
    </main>
  </MainLayout>
}
