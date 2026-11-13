import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { getUserCompanies, getUserCompany, getUserVagas } from '@/lib/actions/vagas'
import { listarCandidaturasDaEmpresa } from '@/lib/actions/candidaturas'
import { listarConversas } from '@/lib/actions/conversas'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { LocalizacaoPrestadorForm } from '@/components/localizacao/LocalizacaoPrestadorForm'
import { DashboardMetric } from '@/components/ui/DashboardMetric'

export const metadata: Metadata = { title: 'Painel da Empresa | NegóMapa', description: 'Resumo da empresa, vagas, candidaturas e mensagens.' }
const acaoSecundaria = 'flex min-h-11 items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:text-neutral-100 dark:hover:bg-neutral-800'
function dataLegivel(valor: string) {
  const data = new Date(valor)
  return Number.isNaN(data.getTime()) ? 'Data não disponível' : new Intl.DateTimeFormat('pt-PT', { dateStyle: 'medium' }).format(data)
}

export default async function EmpresaPainelPage({ searchParams }: { searchParams: Promise<{ empresa?: string }> }) {
  const user = await getUser()
  if (!user) redirect('/login?redirectTo=/empresa/painel')
  const empresas = await getUserCompanies()
  if (empresas === null) redirect('/login?redirectTo=/empresa/painel')
  if (empresas.length === 0) return <MainLayout><section className="bg-cream px-4 py-12 dark:bg-navy-dark"><div className="mx-auto max-w-3xl"><Card variant="liquid" padding="lg"><CardHeader><CardTitle as="h1">Painel empresarial</CardTitle><p className="text-sm text-neutral-600 dark:text-cream-text">{user.email ?? 'Conta autenticada'}</p></CardHeader><CardContent className="space-y-4"><p className="text-sm text-neutral-700 dark:text-neutral-300">Esta conta ainda não tem empresas registadas.</p><Link href="/cadastrar-empresa" className="inline-flex min-h-11 items-center rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500">Cadastrar empresa</Link></CardContent></Card></div></section></MainLayout>

  const { empresa: empresaSolicitada } = await searchParams
  const company = await getUserCompany(empresaSolicitada)
  if (!company) redirect('/empresa/painel')
  const [vagas, candidaturas, resultadoConversas] = await Promise.all([getUserVagas(company.id), listarCandidaturasDaEmpresa(company.id), listarConversas()])
  const queryEmpresa = '?empresa=' + encodeURIComponent(company.id)
  const conversasEmpresa = resultadoConversas.success ? resultadoConversas.data.filter((conversa) => conversa.papel === 'empresa' && conversa.empresa_id === company.id) : []
  const mensagensPorLer = resultadoConversas.success ? conversasEmpresa.reduce((total, conversa) => total + conversa.nao_lidas, 0) : null
  const vagasActivas = vagas.filter((vaga) => vaga.estado === 'aprovado').length
  const vagasEmAnalise = vagas.filter((vaga) => vaga.estado === 'pendente').length
  const candidaturasRecentes = candidaturas.success ? candidaturas.data.slice(0, 3) : []
  const vagasRecentes = vagas.slice(0, 3)

  return <MainLayout>
    <main id="main-content" className="min-h-[60vh] bg-cream px-4 py-6 dark:bg-navy-dark sm:py-8">
      <div className="mx-auto max-w-6xl space-y-4 sm:space-y-5">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-700 dark:text-orange-300">Área empresarial</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink dark:text-cream sm:text-3xl">O seu painel</h1><p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">Estado, recrutamento e gestão da empresa.</p></div>
          <Link href={'/empresa/' + company.slug} className="inline-flex min-h-10 w-fit items-center rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-neutral-700 dark:text-cream dark:hover:bg-neutral-800">Ver perfil público</Link>
        </header>
        <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-900 sm:p-5" aria-labelledby="estado-empresa">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Avatar name={company.name} alt={'Logótipo de ' + company.name} width={56} height={56} className="h-14 w-14" />
            <div className="min-w-0 flex-1"><p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Estado da empresa</p><h2 id="estado-empresa" className="mt-0.5 text-xl font-semibold text-ink dark:text-cream">{company.name}</h2><p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{[company.sector, company.province, company.city].filter(Boolean).join(' · ') || 'Localização por indicar'}</p></div>
            <span className={'inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ' + (company.is_approved ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300')}>{company.is_approved ? 'Aprovada' : 'A aguardar aprovação'}</span>
          </div>
          {empresas.length > 1 && <form method="get" className="mt-3 flex flex-col gap-2 border-t border-neutral-100 pt-3 dark:border-neutral-800 sm:flex-row sm:items-end"><div className="min-w-0 flex-1"><label htmlFor="empresa-activa" className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-300">Empresa activa</label><select id="empresa-activa" name="empresa" defaultValue={company.id} className="min-h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-cream">{empresas.map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.name}{empresa.is_approved ? ' — aprovada' : ' — não aprovada'}</option>)}</select></div><Button type="submit" size="sm" variant="secondary">Seleccionar</Button></form>}
          {!company.is_approved && <p role="status" className="mt-3 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">A aprovação é necessária para publicar novas vagas.</p>}
          <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-neutral-100 pt-4 dark:border-neutral-800 sm:grid-cols-4">
            <DashboardMetric label="Vagas activas" value={vagasActivas} />
            <DashboardMetric label="Candidaturas" value={candidaturas.success ? candidaturas.data.length : '—'} />
            <DashboardMetric label="Mensagens por ler" value={mensagensPorLer ?? '—'} />
            <DashboardMetric label="Vagas em análise" value={vagasEmAnalise} />
          </dl>
        </section>
        <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-900 sm:p-5" aria-labelledby="acoes-empresa">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 id="acoes-empresa" className="text-base font-semibold text-ink dark:text-cream">Acções principais</h2><p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Atalhos para o recrutamento e a presença da empresa.</p></div>
            <Link href={'/empresa/painel/vagas/nova' + queryEmpresa} aria-disabled={!company.is_approved} className={'inline-flex min-h-10 items-center justify-center rounded-lg px-4 py-2 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ' + (company.is_approved ? 'bg-orange-600 hover:bg-orange-700' : 'pointer-events-none bg-neutral-400')}>Publicar vaga</Link>
          </div>
          <nav className="mt-3 grid gap-1 sm:grid-cols-2" aria-label="Acções principais da empresa">
            <Link className={acaoSecundaria} href={'/empresa/painel/vagas' + queryEmpresa}>Gerir vagas <span aria-hidden="true" className="text-neutral-400">→</span></Link>
            <Link className={acaoSecundaria} href={'/empresa/painel/candidaturas' + queryEmpresa}>Ver candidaturas <span aria-hidden="true" className="text-neutral-400">→</span></Link>
            <Link className={acaoSecundaria} href={'/empresa/painel/mensagens' + queryEmpresa}>Mensagens <span aria-hidden="true" className="text-neutral-400">→</span></Link>
            <Link className={acaoSecundaria} href="/perfil">Perfil e dados da conta <span aria-hidden="true" className="text-neutral-400">→</span></Link>
            <a className={acaoSecundaria} href="#localizacao-empresa">Actualizar localização <span aria-hidden="true" className="text-neutral-400">→</span></a>
          </nav>
        </section>
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]" aria-label="Histórico e informação complementar">
          <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-900 sm:p-5">
            <div className="flex items-center justify-between gap-3"><div><h2 className="text-base font-semibold text-ink dark:text-cream">Histórico recente</h2><p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Vagas e candidaturas mais recentes.</p></div><Link href={'/empresa/painel/vagas' + queryEmpresa} className="text-xs font-semibold text-orange-700 underline underline-offset-2 dark:text-orange-300">Ver vagas</Link></div>
            <h3 className="mt-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Vagas</h3>
            {vagasRecentes.length ? <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">{vagasRecentes.map((vaga) => <li key={vaga.id} className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-medium text-ink dark:text-neutral-100">{vaga.titulo}</p><p className="text-xs text-neutral-500 dark:text-neutral-400">{dataLegivel(vaga.created_at)}</p></div><span className="w-fit rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">{vaga.estado.replaceAll('_', ' ')}</span></li>)}</ul> : <p className="py-2 text-sm text-neutral-500 dark:text-neutral-400">Ainda não existem vagas registadas.</p>}
            <h3 className="mt-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Candidaturas</h3>
            {candidaturas.success ? candidaturasRecentes.length ? <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">{candidaturasRecentes.map((item) => <li key={item.id} className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-medium text-ink dark:text-neutral-100">{item.nome_candidato}</p><p className="text-xs text-neutral-500 dark:text-neutral-400">{item.vaga?.titulo ?? 'Vaga'} · {dataLegivel(item.criada_em)}</p></div><span className="w-fit rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">{item.estado.replaceAll('_', ' ')}</span></li>)}</ul> : <p className="py-2 text-sm text-neutral-500 dark:text-neutral-400">Ainda não existem candidaturas.</p> : <p role="status" className="py-2 text-sm text-neutral-500 dark:text-neutral-400">Não foi possível carregar as candidaturas.</p>}
          </div>
          <div className="space-y-4">
            <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-900 sm:p-5" aria-labelledby="produtos-empresa"><h2 id="produtos-empresa" className="text-base font-semibold text-ink dark:text-cream">Produtos</h2><p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">A gestão de produtos ainda não está disponível no painel empresarial desta versão.</p></section>
            <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-900 sm:p-5" aria-labelledby="dados-empresa"><h2 id="dados-empresa" className="text-base font-semibold text-ink dark:text-cream">Dados complementares</h2><dl className="mt-3 space-y-2.5"><div><dt className="text-xs text-neutral-500 dark:text-neutral-400">Sector</dt><dd className="text-sm font-medium text-ink dark:text-neutral-100">{company.sector ?? 'Não indicado'}</dd></div><div><dt className="text-xs text-neutral-500 dark:text-neutral-400">Localização</dt><dd className="text-sm font-medium text-ink dark:text-neutral-100">{[company.province, company.city].filter(Boolean).join(' · ') || 'Não indicada'}</dd></div><div><dt className="text-xs text-neutral-500 dark:text-neutral-400">Empresas associadas à conta</dt><dd className="text-sm font-medium text-ink dark:text-neutral-100">{empresas.length}</dd></div></dl><Link href="/perfil" className="mt-3 inline-flex min-h-9 items-center text-sm font-semibold text-orange-700 underline underline-offset-2 dark:text-orange-300">Dados da conta</Link></section>
            <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-900 sm:p-5" aria-labelledby="config-empresa"><h2 id="config-empresa" className="text-base font-semibold text-ink dark:text-cream">Configurações</h2><p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Preferências, notificações e privacidade da conta.</p><Link href="/configuracoes" className="mt-3 inline-flex min-h-9 items-center text-sm font-semibold text-orange-700 underline underline-offset-2 dark:text-orange-300">Abrir configurações</Link></section>
          </div>
        </section>
        <section id="localizacao-empresa" className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-900 sm:p-5" aria-labelledby="localizacao-heading"><h2 id="localizacao-heading" className="mb-3 text-base font-semibold text-ink dark:text-cream">Localização da empresa</h2><LocalizacaoPrestadorForm tipo="empresa" entidadeId={company.id} /></section>
      </div>
    </main>
  </MainLayout>
}
