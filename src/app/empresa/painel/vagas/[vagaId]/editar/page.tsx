import { redirect, notFound } from 'next/navigation'
import { getUserCompany, getUserVaga } from '@/lib/actions/vagas'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { EditarVagaForm } from './EditarVagaForm'

export const dynamic = 'force-dynamic'

export default async function EditarVagaPage({
  params,
  searchParams,
}: {
  params: Promise<{ vagaId: string }>
  searchParams: Promise<{ empresa?: string }>
}) {
  const [{ vagaId }, { empresa }] = await Promise.all([params, searchParams])
  const company = await getUserCompany(empresa)
  if (!company) redirect('/login?redirectTo=/empresa/painel/vagas')

  const vaga = await getUserVaga(company.id, vagaId)
  if (!vaga) notFound()
  if (vaga.encerrada_em) redirect(`/empresa/painel/vagas?empresa=${encodeURIComponent(company.id)}`)

  return (
    <MainLayout>
      <section className="min-h-[60vh] bg-cream px-4 py-10 dark:bg-navy-dark">
        <div className="mx-auto max-w-3xl">
          <Card variant="liquid" padding="lg">
            <CardHeader>
              <CardTitle as="h1" className="text-2xl md:text-3xl">Editar vaga</CardTitle>
              <p className="text-sm text-neutral-600 dark:text-cream-text">Empresa: {company.name}</p>
            </CardHeader>
            <CardContent>
              <EditarVagaForm vaga={vaga} empresaId={company.id} />
            </CardContent>
          </Card>
        </div>
      </section>
    </MainLayout>
  )
}
