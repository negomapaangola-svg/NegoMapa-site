import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { getUserCompany } from '@/lib/actions/vagas'
import { listarConversas } from '@/lib/actions/conversas'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { MensagensPainel } from '@/components/mensagens/MensagensPainel'

export const metadata: Metadata = {
  title: 'Mensagens | Painel da Empresa | NegóMapa',
  description: 'Leia e responda às mensagens dos clientes da sua empresa.',
}

export default async function EmpresaMensagensPage({
  searchParams,
}: {
  searchParams: Promise<{ conversa?: string; empresa?: string }>
}) {
  const user = await getUser()
  const { conversa, empresa } = await searchParams
  const company = user ? await getUserCompany(empresa) : null
  if (!user || !company) {
    redirect('/login?redirectTo=/empresa/painel/mensagens')
  }

  const resultado = await listarConversas()
  // Só as conversas em que atua como empresa; as de cliente ficam em /mensagens.
  const conversasEmpresa = resultado.success
    ? resultado.data.filter((item) => item.papel === 'empresa' && item.empresa_id === company.id)
    : []

  return (
    <MainLayout>
      <section className="py-12 lg:py-16 bg-cream dark:bg-navy-dark">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Card variant="liquid" padding="lg">
            <CardHeader className="space-y-2">
              <CardTitle as="h1" className="text-3xl md:text-4xl">Mensagens</CardTitle>
              <p className="text-neutral-600 dark:text-cream-text/80">
                Conversas da empresa <span className="font-medium text-ink dark:text-cream">{company.name}</span>.
              </p>
            </CardHeader>
            <CardContent className="mt-6">
              {resultado.success ? (
                <div className="h-[calc(100dvh-12rem)] min-h-[520px]">
                  <MensagensPainel
                    conversas={conversasEmpresa}
                    userId={user.id}
                    basePath="/empresa/painel/mensagens"
                    conversaInicial={conversa ?? null}
                  />
                </div>
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
