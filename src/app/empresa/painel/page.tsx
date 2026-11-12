import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUserCompanies, getUserCompany, getUserVagas } from '@/lib/actions/vagas'
import { listarCandidaturasDaEmpresa } from '@/lib/actions/candidaturas'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

export const metadata: Metadata = {
  title: 'Painel da Empresa | NegóMapa',
  description: 'Resumo das vagas, candidaturas, contactos e visitas da sua empresa.',
}

export default async function EmpresaPainelPage({ searchParams }: { searchParams: Promise<{ empresa?: string }> }) {
  const empresas = await getUserCompanies()
  if (empresas === null) redirect('/login?redirectTo=/empresa/painel')

  if (empresas.length === 0) {
    return (
      <MainLayout>
        <section className="py-12 bg-cream dark:bg-navy-dark">
          <div className="mx-auto max-w-3xl px-4">
            <Card variant="liquid" padding="lg">
              <CardHeader><CardTitle as="h1">Painel empresarial</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p>Esta conta ainda não tem empresas registadas.</p>
                <Link href="/cadastrar-empresa" className="inline-flex min-h-11 items-center rounded-[4px] bg-orange-600 px-4 font-semibold text-white">Cadastrar empresa</Link>
              </CardContent>
            </Card>
          </div>
        </section>
      </MainLayout>
    )
  }

  const { empresa: empresaSolicitada } = await searchParams
  const company = await getUserCompany(empresaSolicitada)
  if (!company) redirect('/empresa/painel')

  const [vagas, candidaturas] = await Promise.all([
    getUserVagas(company.id),
    listarCandidaturasDaEmpresa(company.id),
  ])
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
  ]

  return (
    <MainLayout>
      <section className="py-12 lg:py-16 bg-cream dark:bg-navy-dark">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Card variant="liquid" padding="lg">
            <CardHeader className="space-y-2">
              <CardTitle as="h1" className="text-3xl md:text-4xl">Painel da Empresa</CardTitle>
              <p className="text-neutral-600 dark:text-cream-text/80">Resumo da actividade de {company.name}.</p>
            </CardHeader>
            <CardContent className="mt-6 space-y-8">
              {empresas.length > 1 && (
                <form method="get" className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <label htmlFor="empresa-activa" className="mb-1 block text-sm font-medium">Empresa activa</label>
                    <select id="empresa-activa" name="empresa" defaultValue={company.id} className="min-h-11 w-full rounded-[4px] border border-card-border bg-white px-3 text-sm dark:bg-neutral-800">
                      {empresas.map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.name}{empresa.is_approved ? ' — aprovada' : ' — pendente'}</option>)}
                    </select>
                  </div>
                  <button type="submit" className="min-h-11 rounded-[4px] bg-orange-600 px-4 font-semibold text-white">Seleccionar</button>
                </form>
              )}
              {!company.is_approved && (
                <div role="status" className="p-4 rounded-[4px] border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20 text-sm text-yellow-800 dark:text-yellow-300">
                  A empresa seleccionada ainda não foi aprovada.
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {metricas.map((metrica) => (
                  <div key={metrica.label} className="rounded-[4px] border border-neutral-200 dark:border-white/10 p-4">
                    <p className="text-2xl font-semibold text-neutral-900 dark:text-cream">{metrica.valor}</p>
                    <p className="mt-1 text-sm text-neutral-600 dark:text-cream-text/80">{metrica.label}</p>
                    {metrica.pendente && <p className="mt-1 text-xs text-neutral-500">Métrica pendente</p>}
                  </div>
                ))}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-cream">Acesso rápido</h2>
                <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                  {atalhos.map((atalho) => <li key={atalho.href}><Link href={atalho.href} className="block rounded-[4px] border border-neutral-200 dark:border-white/10 p-4 text-neutral-800 dark:text-cream-text hover:border-orange-400">{atalho.label}</Link></li>)}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </MainLayout>
  )
}
