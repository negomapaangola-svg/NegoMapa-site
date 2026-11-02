import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getUserCompany } from '@/lib/actions/vagas'
import { listarCandidaturasDaEmpresa } from '@/lib/actions/candidaturas'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { CandidaturasEmpresa } from './_components/CandidaturasEmpresa'

export const metadata: Metadata = {
  title: 'Candidaturas às Vagas | Painel da Empresa | NegóMapa',
  description: 'Consulte e acompanhe as candidaturas às vagas da sua empresa.',
}

export default async function EmpresaCandidaturasPage() {
  const company = await getUserCompany()
  if (!company) {
    redirect('/login?redirectTo=/empresa/painel/candidaturas')
  }

  const resultado = await listarCandidaturasDaEmpresa()

  return (
    <MainLayout>
      <section className="py-12 lg:py-16 bg-cream dark:bg-navy-dark">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Card variant="liquid" padding="lg">
            <CardHeader className="space-y-2">
              <CardTitle as="h1" className="text-3xl md:text-4xl">Candidaturas às Vagas</CardTitle>
              <p className="text-neutral-600 dark:text-cream-text/80">
                Empresa: <span className="font-medium text-ink dark:text-cream">{company.name}</span>
              </p>
            </CardHeader>
            <CardContent className="mt-6 space-y-6">
              {!company.is_approved && (
                <div className="p-4 rounded-[4px] border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20 text-sm text-yellow-800 dark:text-yellow-300">
                  A sua empresa ainda não foi aprovada. As candidaturas aparecem apenas para vagas publicadas.
                </div>
              )}

              {resultado.success ? (
                <CandidaturasEmpresa candidaturas={resultado.data} />
              ) : (
                <p role="alert" className="text-red-700 dark:text-red-300">{resultado.error}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </MainLayout>
  )
}
