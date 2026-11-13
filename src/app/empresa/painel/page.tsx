import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getUserCompanies, getUserCompany, getUserVagas } from '@/lib/actions/vagas'
import { listarCandidaturasDaEmpresa } from '@/lib/actions/candidaturas'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { LocalizacaoPrestadorForm } from '@/components/localizacao/LocalizacaoPrestadorForm'
import { DashboardMetric } from '@/components/ui/DashboardMetric'

export const metadata: Metadata = { title: 'Painel da Empresa | NegóMapa', description: 'Resumo das empresas, vagas, candidaturas e actividade.' }

export default async function EmpresaPainelPage({ searchParams }: { searchParams: Promise<{ empresa?: string }> }) {
  const user = await getUser()
  if (!user) redirect('/login?redirectTo=/empresa/painel')
  const empresas = await getUserCompanies()
  if (empresas === null) redirect('/login?redirectTo=/empresa/painel')
  const supabase = await createSupabaseServerClient()
  const { data: perfilConta } = await supabase.from('profissionais').select('nome').eq('user_id', user.id).maybeSingle()
  const nomeUtilizador = ([user.user_metadata?.full_name, user.user_metadata?.name, perfilConta?.nome].find((valor) => typeof valor === 'string' && valor.trim()) as string | undefined) ?? 'Nome não disponível'
  const aprovadas = empresas.filter((empresa) => empresa.is_approved).length

  if (empresas.length === 0) return <MainLayout><section className="bg-cream py-12 dark:bg-navy-dark"><div className="mx-auto max-w-3xl px-4"><Card variant="liquid" padding="lg"><CardHeader><CardTitle as="h1">Painel empresarial</CardTitle><p className="text-sm text-neutral-600 dark:text-cream-text">{nomeUtilizador} · {user.email ?? 'Email não disponível'}</p></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-3 gap-3">{['Empresas associadas','Aprovadas','Não aprovadas'].map((label) => <div key={label} className="rounded-xl border border-card-border p-3"><p className="text-2xl font-semibold">0</p><p className="text-xs text-neutral-600 dark:text-cream-text">{label}</p></div>)}</div><p>Esta conta ainda não tem empresas registadas.</p><Link href="/cadastrar-empresa" className="inline-flex min-h-11 items-center rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white hover:bg-orange-600">Cadastrar empresa</Link></CardContent></Card></div></section></MainLayout>

  const { empresa: empresaSolicitada } = await searchParams
  const company = await getUserCompany(empresaSolicitada)
  if (!company) redirect('/empresa/painel')
  const [vagas, candidaturas] = await Promise.all([getUserVagas(company.id), listarCandidaturasDaEmpresa(company.id)])
  const queryEmpresa = `?empresa=${encodeURIComponent(company.id)}`
  const atalhos = [
    { href: `/empresa/painel/vagas${queryEmpresa}`, label: 'Vagas' },
    { href: `/empresa/painel/candidaturas${queryEmpresa}`, label: 'Candidaturas' },
    { href: `/empresa/painel/mensagens${queryEmpresa}`, label: 'Mensagens' },
    { href: `/empresa/${company.slug}`, label: 'Ver perfil público' },
    { href: '/perfil', label: 'Perfil da conta' },
  ]

  return <MainLayout>
    <section className="min-h-[60vh] bg-cream px-4 py-6 dark:bg-navy-dark sm:py-8">
      <div className="mx-auto max-w-6xl space-y-4 sm:space-y-5">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-700 dark:text-orange-300">Área empresarial</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink dark:text-cream sm:text-3xl">O seu painel</h1><p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">Acompanhe a empresa, as vagas e os candidatos.</p></div><Link href={'/empresa/' + company.slug} className="inline-flex min-h-10 w-fit items-center justify-center rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-neutral-700 dark:text-cream dark:hover:bg-neutral-800">Ver perfil público</Link></header>
        <section className="rounded-2xl bg-white p-5 shadow-sm dark:bg-neutral-900 sm:p-6" aria-labelledby="empresa-activa-heading">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center"><Avatar name={company.name} alt={'Logótipo de ' + company.name} width={60} height={60} className="h-15 w-15" /><div className="min-w-0 flex-1"><h2 id="empresa-activa-heading" className="text-xl font-semibold text-ink dark:text-cream">{company.name}</h2><p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{[company.sector, company.province, company.city].filter(Boolean).join(' · ') || 'Localização por indicar'}</p></div><span className={'inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ' + (company.is_approved ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300')}>{company.is_approved ? 'Aprovada' : 'A aguardar aprovação'}</span></div>
          {empresas.length > 1 && <form method="get" className="mt-4 flex flex-col gap-2 border-t border-neutral-100 pt-4 dark:border-neutral-800 sm:flex-row sm:items-end"><div className="min-w-0 flex-1"><label htmlFor="empresa-activa" className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-300">Empresa activa</label><select id="empresa-activa" name="empresa" defaultValue={company.id} className="min-h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-cream">{empresas.map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.name}{empresa.is_approved ? ' — aprovada' : ' — não aprovada'}</option>)}</select></div><Button type="submit" size="sm">Seleccionar</Button></form>}
          {!company.is_approved && <p role="status" className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">Algumas funcionalidades de publicação podem depender da aprovação da empresa.</p>}
          <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-neutral-100 pt-4 dark:border-neutral-800 sm:grid-cols-3"><DashboardMetric label="Empresas associadas" value={empresas.length} /><DashboardMetric label="Vagas aprovadas" value={vagas.filter((vaga) => vaga.estado === 'aprovado').length} /><DashboardMetric label="Candidaturas" value={candidaturas.success ? candidaturas.data.length : 0} /></dl>
        </section>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.85fr)]">
          <section className="rounded-2xl bg-white p-5 shadow-sm dark:bg-neutral-900 sm:p-6" aria-labelledby="gestao-heading"><h2 id="gestao-heading" className="text-base font-semibold text-ink dark:text-cream">Gestão da empresa</h2><p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">As tarefas mais frequentes, reunidas num só espaço.</p><nav className="mt-3 divide-y divide-neutral-100 dark:divide-neutral-800" aria-label="Acções da empresa">{atalhos.map((atalho) => <Link key={atalho.href} href={atalho.href} className="flex min-h-14 items-center justify-between gap-3 py-3 transition-colors hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:hover:text-orange-300"><span className="min-w-0"><span className="block text-sm font-medium text-ink dark:text-neutral-100">{atalho.label}</span><span className="mt-0.5 block text-xs text-neutral-500 dark:text-neutral-400">{atalho.label === 'Vagas' ? 'Publicações e estado das oportunidades' : atalho.label === 'Candidaturas' ? 'Candidatos às suas oportunidades' : atalho.label === 'Mensagens' ? 'Conversas e contactos recebidos' : 'Ver a apresentação da empresa'}</span></span><span aria-hidden="true" className="shrink-0 text-neutral-400">→</span></Link>)}</nav></section>
          <section className="rounded-2xl bg-white p-5 shadow-sm dark:bg-neutral-900 sm:p-6" aria-labelledby="localizacao-heading"><h2 id="localizacao-heading" className="text-base font-semibold text-ink dark:text-cream">Localização da empresa</h2><p className="mb-3 mt-1 text-xs text-neutral-500 dark:text-neutral-400">Mantenha a localização actualizada para facilitar a descoberta.</p><LocalizacaoPrestadorForm tipo="empresa" entidadeId={company.id} /></section>
        </div>
      </div>
    </section>
  </MainLayout>
}
