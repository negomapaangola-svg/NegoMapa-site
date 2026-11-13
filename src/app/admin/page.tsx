import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { isAdmin } from '@/lib/auth'
import { getAdminDashboardStats, type AdminMetric } from '@/lib/actions/admin-foundation'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Painel Administrativo | NegóMapa',
  description: 'Estatísticas e ferramentas de administração do NegóMapa.',
}

function metric(value: AdminMetric): string {
  return value === null ? 'Métrica não disponível nesta versão' : new Intl.NumberFormat('pt-PT').format(value)
}

function Metric({ label, value, detail }: { label: string; value: AdminMetric; detail?: string }) {
  return (
    <div className="min-w-0 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className={value === null ? 'mt-2 text-sm font-medium text-neutral-500 dark:text-neutral-400' : 'mt-2 text-3xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50'}>
        {metric(value)}
      </p>
      {detail ? <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{detail}</p> : null}
    </div>
  )
}

function ActionLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="group rounded-lg px-3 py-3 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:hover:bg-neutral-900"
    >
      <span className="block text-sm font-semibold text-neutral-900 group-hover:text-orange-700 dark:text-neutral-100 dark:group-hover:text-orange-300">{title}</span>
      <span className="mt-1 block text-xs leading-5 text-neutral-500 dark:text-neutral-400">{description}</span>
    </Link>
  )
}

export default async function AdminDashboardPage() {
  if (!(await isAdmin())) notFound()

  const stats = await getAdminDashboardStats()

  if (!stats) notFound()

  return (
    <MainLayout>
      <main className="min-h-screen bg-cream px-4 py-8 dark:bg-navy-dark sm:px-6 lg:py-10">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400">Área restrita</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink dark:text-cream">Painel administrativo</h1>
              <p className="mt-2 text-sm text-neutral-600 dark:text-cream-text/70">Visão operacional da plataforma e ferramentas de gestão.</p>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Dados consultados em tempo real</p>
          </header>

          <section aria-labelledby="admin-overview" className="mb-10">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="admin-overview" className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Estado geral</h2>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">Indicadores principais</span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 border-y border-neutral-200 py-3 dark:border-neutral-800 sm:grid-cols-3 lg:grid-cols-5">
              <Metric label="Contas" value={stats.accountsTotal} detail={`+ ${metric(stats.accountsLast7Days)} em 7 dias`} />
              <Metric label="Profissionais" value={stats.professionalsTotal} detail={`${metric(stats.professionalsPending)} pendentes`} />
              <Metric label="Empresas" value={stats.companiesTotal} detail={`${metric(stats.companiesPending)} pendentes`} />
              <Metric label="Serviços" value={stats.servicesTotal} />
              <Metric label="Mensagens por ler" value={stats.messagesUnread} />
            </div>
          </section>

          <section aria-labelledby="admin-actions" className="mb-10">
            <h2 id="admin-actions" className="mb-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200">Acções administrativas</h2>
            <div className="grid grid-cols-1 gap-1 border-y border-neutral-200 py-2 dark:border-neutral-800 sm:grid-cols-2 lg:grid-cols-3">
              <ActionLink href="/admin/profissionais" title="Profissionais" description="Rever, aprovar, rejeitar e consultar perfis." />
              <ActionLink href="/admin/empresas" title="Empresas" description="Consultar e gerir estados de aprovação." />
              <ActionLink href="/admin/mensagens" title="Caixa de entrada" description="Responder, marcar como lida e arquivar contactos." />
              <ActionLink href="/admin/servicos" title="Serviços" description="Consultar e moderar serviços publicados." />
              <ActionLink href="/admin/vagas" title="Vagas" description="Consultar vagas e respectivo estado." />
              <ActionLink href="/admin/denuncias" title="Denúncias" description="Consultar alertas e actividade reportada." />
            </div>
          </section>

          <section aria-labelledby="admin-details">
            <h2 id="admin-details" className="mb-4 text-sm font-semibold text-neutral-800 dark:text-neutral-200">Indicadores detalhados</h2>
            <div className="grid gap-x-12 gap-y-8 border-t border-neutral-200 pt-5 dark:border-neutral-800 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Visitas e contas</h3>
                <Metric label="Visitantes totais" value={stats.visitorsTotal} />
                <Metric label="Visitantes activos" value={stats.visitorsActive} />
                <Metric label="Clientes" value={stats.accountsClient} />
                <Metric label="Profissionais" value={stats.accountsProfessional} />
                <Metric label="Empresas (contas)" value={stats.accountsCompany} />
                <Metric label="Novas contas · 7 dias" value={stats.accountsLast7Days} />
                <Metric label="Novas contas · 30 dias" value={stats.accountsLast30Days} />
              </div>
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Aprovações</h3>
                <Metric label="Profissionais pendentes" value={stats.professionalsPending} />
                <Metric label="Profissionais aprovados" value={stats.professionalsApproved} />
                <Metric label="Profissionais rejeitados" value={stats.professionalsRejected} />
                <Metric label="Empresas pendentes" value={stats.companiesPending} />
                <Metric label="Empresas aprovadas" value={stats.companiesApproved} />
                <Metric label="Empresas rejeitadas" value={stats.companiesRejected} />
              </div>
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Conteúdos e actividade</h3>
                <Metric label="Produtos" value={stats.productsTotal} />
                <Metric label="Vagas" value={stats.vacanciesTotal} />
                <Metric label="Candidaturas" value={stats.applicationsTotal} />
                <Metric label="Pedidos de serviço" value={stats.requestsTotal} />
                <Metric label="Mensagens administrativas" value={stats.messagesTotal} />
                <Metric label="Alertas / denúncias" value={stats.alertsTotal} />
              </div>
            </div>
            <p className="mt-6 text-xs text-neutral-500 dark:text-neutral-400">
              Visitantes totais e activos não estão disponíveis porque o esquema auditado não contém uma fonte de analytics de visitas. As mensagens contabilizadas são as do canal administrativo, separado das conversas privadas.
            </p>
          </section>
        </div>
      </main>
    </MainLayout>
  )
}
