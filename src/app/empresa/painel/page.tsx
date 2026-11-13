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
  const metricas = [
    { label: 'Visitas ao perfil', valor: 0, pendente: true },
    { label: 'Contactos recebidos', valor: 0, pendente: true },
    { label: 'Vagas activas', valor: vagas.filter((vaga) => vaga.estado === 'aprovado').length, pendente: false },
    { label: 'Candidaturas', valor: candidaturas.success ? candidaturas.data.length : 0, pendente: false },
  ]
  const atalhos = [
    { href: `/empresa/painel/vagas${queryEmpresa}`, label: 'Vagas' },
    { href: `/empresa/painel/candidaturas${queryEmpresa}`, label: 'Candidaturas' },
    { href: `/empresa/painel/mensagens${queryEmpresa}`, label: 'Mensagens' },
    { href: `/empresa/${company.slug}`, label: 'Ver perfil público' },
    { href: '/perfil', label: 'Perfil da conta' },
  ]

  return <MainLayout><section className="bg-cream py-10 dark:bg-navy-dark lg:py-14"><div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6 lg:px-8">
    <Card variant="liquid" padding="lg">
      <CardHeader className="space-y-2"><CardTitle as="h1" className="text-2xl md:text-3xl">Painel empresarial</CardTitle><p className="text-sm text-neutral-600 dark:text-cream-text">{nomeUtilizador ? `Olá, ${nomeUtilizador}` : 'Conta autenticada'} · {user.email ?? 'Email não disponível'}</p></CardHeader>
      <CardContent className="space-y-6">
        <LocalizacaoPrestadorForm tipo="empresa" entidadeId={company.id} />
        <div className="grid grid-cols-3 gap-3">
          {[{ label: 'Empresas associadas', value: empresas.length }, { label: 'Aprovadas', value: aprovadas }, { label: 'Não aprovadas', value: empresas.length - aprovadas }].map((item) => <div key={item.label} className="rounded-xl border border-card-border p-3 sm:p-4"><p className="text-2xl font-semibold text-ink dark:text-cream">{item.value}</p><p className="mt-1 text-xs text-neutral-600 dark:text-cream-text sm:text-sm">{item.label}</p></div>)}
        </div>
        <div className="flex flex-col gap-3 border-t border-card-border pt-5 sm:flex-row sm:items-center">
          <Avatar name={nomeUtilizador ?? user.email ?? 'Conta'} alt="Avatar da conta" width={52} height={52} className="h-13 w-13" />
          <div className="min-w-0 flex-1"><p className="font-semibold text-ink dark:text-cream">{company.name}</p><p className="text-sm text-neutral-600 dark:text-cream-text">{[company.sector, company.province, company.city].filter(Boolean).join(' · ') || 'Dados de localização não indicados'}</p></div>
          <span className={`inline-flex w-fit rounded-full px-3 py-1 text-sm font-medium ${company.is_approved ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'}`}>{company.is_approved ? 'Aprovada' : 'Não aprovada'}</span>
        </div>
        {empresas.length > 1 && <form method="get" className="flex flex-col gap-2 border-t border-card-border pt-5 sm:flex-row sm:items-end"><div className="flex-1"><label htmlFor="empresa-activa" className="mb-1 block text-sm font-medium">Empresa activa</label><select id="empresa-activa" name="empresa" defaultValue={company.id} className="min-h-11 w-full rounded-xl border border-card-border bg-white px-3 text-sm dark:bg-neutral-800">{empresas.map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.name}{empresa.is_approved ? ' — aprovada' : ' — não aprovada'}</option>)}</select></div><Button type="submit" size="md">Seleccionar</Button></form>}
        {!company.is_approved && <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-200">A empresa seleccionada ainda não foi aprovada.</div>}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{metricas.map((metrica) => <div key={metrica.label} className="rounded-xl border border-card-border p-4"><p className="text-2xl font-semibold text-ink dark:text-cream">{metrica.valor}</p><p className="mt-1 text-sm text-neutral-600 dark:text-cream-text">{metrica.label}</p>{metrica.pendente && <p className="mt-1 text-xs text-neutral-500">Métrica pendente</p>}</div>)}</div>
        <div><h2 className="text-lg font-semibold text-ink dark:text-cream">Acesso rápido</h2><ul className="mt-3 grid gap-3 sm:grid-cols-2">{atalhos.map((atalho) => <li key={atalho.href}><Link href={atalho.href} className="block min-h-12 rounded-xl border border-card-border p-4 text-sm font-medium text-ink hover:border-orange-400 dark:text-cream">{atalho.label}</Link></li>)}</ul></div>
      </CardContent>
    </Card>
  </div></section></MainLayout>
}
