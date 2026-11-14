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
  description: 'Indicadores e ferramentas de administração do NegóMapa.',
}

function number(value: AdminMetric): string {
  return value === null ? '—' : new Intl.NumberFormat('pt-AO').format(value)
}

function percentage(part: AdminMetric, total: AdminMetric): string {
  if (part === null || total === null || total <= 0) return '—'
  return `${Math.round((part / total) * 100)}%`
}

function MetricCard({ label, value, detail, href, action, share }: {
  label: string
  value: AdminMetric
  detail: string
  href: string
  action: string
  share?: string
}) {
  return (
    <article className="flex min-h-44 flex-col justify-between rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/10 sm:p-6">
      <div>
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">{label}</h3>
          {share ? <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-800 dark:bg-orange-950/60 dark:text-orange-200">{share}</span> : null}
        </div>
        <p className="mt-3 text-4xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-5xl">{number(value)}</p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{detail}</p>
      </div>
      <Link href={href} className="mt-5 inline-flex min-h-10 w-fit items-center rounded-lg bg-orange-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 dark:bg-orange-600 dark:hover:bg-orange-500 dark:focus-visible:ring-offset-slate-900">
        {action}
      </Link>
    </article>
  )
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      {children}
    </section>
  )
}

export default async function AdminDashboardPage() {
  if (!(await isAdmin())) notFound()
  const stats = await getAdminDashboardStats()
  if (!stats) notFound()

  return (
    <MainLayout>
      <main className="min-h-screen bg-cream px-4 py-7 dark:bg-navy-dark sm:px-6 lg:py-9">
        <div className="mx-auto max-w-7xl space-y-9">
          <header className="flex flex-col gap-2 border-b border-slate-200 pb-6 dark:border-slate-700 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-700 dark:text-orange-400">Área restrita</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink dark:text-cream sm:text-4xl">Painel administrativo</h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Estado da plataforma, tarefas prioritárias e acesso aos registos.</p>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Indicadores actualizados na consulta</p>
          </header>

          <Section title="Estado prioritário" description="As pendências e mensagens que exigem atenção.">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <MetricCard label="Profissionais pendentes" value={stats.professionalsPending} detail={`${number(stats.professionalsTotal)} profissionais registados`} href="/admin/profissionais" action="Rever profissionais" share={percentage(stats.professionalsPending, stats.professionalsTotal)} />
              <MetricCard label="Empresas pendentes" value={stats.companiesPending} detail={`${number(stats.companiesTotal)} empresas registadas`} href="/admin/empresas" action="Rever empresas" share={percentage(stats.companiesPending, stats.companiesTotal)} />
              <MetricCard label="Mensagens não lidas" value={stats.messagesUnread} detail={`${number(stats.messagesInboxTotal)} mensagens recebidas`} href="/admin/mensagens" action="Abrir mensagens" share={percentage(stats.messagesUnread, stats.messagesInboxTotal)} />
            </div>
          </Section>

          <Section title="Contas e comunidade" description="Dimensão e composição das contas registadas.">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <MetricCard label="Total de contas" value={stats.accountsTotal} detail={`${number(stats.accountsLast7Days)} novas nos últimos 7 dias · ${number(stats.accountsLast30Days)} nos últimos 30 dias`} href="/admin/profissionais" action="Consultar contas" />
              <MetricCard label="Profissionais" value={stats.professionalsTotal} detail={`${number(stats.professionalsApproved)} aprovados · ${number(stats.professionalsRejected)} rejeitados`} href="/admin/profissionais" action="Gerir profissionais" share={percentage(stats.professionalsApproved, stats.professionalsTotal)} />
              <MetricCard label="Empresas" value={stats.companiesTotal} detail={`${number(stats.companiesApproved)} aprovadas · ${number(stats.companiesRejected)} rejeitadas`} href="/admin/empresas" action="Gerir empresas" share={percentage(stats.companiesApproved, stats.companiesTotal)} />
            </div>
          </Section>

          <Section title="Publicações" description="Conteúdos e oportunidades disponíveis na plataforma.">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <MetricCard label="Serviços activos" value={stats.servicesActive} detail={`${number(stats.servicesTotal)} serviços registados`} href="/admin/servicos" action="Ver serviços" share={percentage(stats.servicesActive, stats.servicesTotal)} />
              <MetricCard label="Produtos activos" value={stats.productsActive} detail={`${number(stats.productsTotal)} produtos registados`} href="/admin/conteudos?tipo=produtos" action="Ver produtos" share={percentage(stats.productsActive, stats.productsTotal)} />
              <MetricCard label="Vagas activas" value={stats.vacanciesActive} detail={`${number(stats.vacanciesTotal)} vagas registadas`} href="/admin/vagas" action="Ver vagas" share={percentage(stats.vacanciesActive, stats.vacanciesTotal)} />
            </div>
          </Section>

          <Section title="Actividade e acompanhamento" description="Registos operacionais que podem exigir consulta.">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <MetricCard label="Candidaturas" value={stats.applicationsTotal} detail="Candidaturas registadas" href="/admin/conteudos?tipo=candidaturas" action="Ver candidaturas" />
              <MetricCard label="Pedidos" value={stats.requestsTotal} detail="Pedidos de serviço registados" href="/admin/conteudos?tipo=pedidos" action="Ver pedidos" />
              <MetricCard label="Denúncias" value={stats.alertsTotal} detail="Denúncias submetidas" href="/admin/denuncias" action="Consultar denúncias" />
            </div>
          </Section>

          <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
            As percentagens representam a proporção da métrica indicada sobre o total correspondente. Quando não existe denominador válido, é apresentado “—”. Visitantes e analytics não são apresentados porque não existe uma fonte de dados confirmada para essas métricas.
          </p>
        </div>
      </main>
    </MainLayout>
  )
}
