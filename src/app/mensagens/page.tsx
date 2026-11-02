import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { MensagensPainel } from '@/components/mensagens/MensagensPainel'
import { listarConversas } from '@/lib/actions/conversas'

export const metadata: Metadata = {
  title: 'Mensagens | NegóMapa',
  description: 'Leia e responda às suas conversas na NegóMapa.',
}

export default async function MensagensPage({
  searchParams,
}: {
  searchParams: Promise<{ conversa?: string }>
}) {
  const user = await getUser()
  if (!user) {
    redirect('/login?redirectTo=/mensagens')
  }

  const { conversa } = await searchParams
  const resultado = await listarConversas()

  return (
    <MainLayout>
      <section className="py-12 lg:py-16 bg-cream dark:bg-navy-dark">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Card variant="liquid" padding="lg">
            <CardHeader className="space-y-2">
              <CardTitle as="h1" className="text-3xl md:text-4xl">Mensagens</CardTitle>
              <p className="text-neutral-600 dark:text-cream-text/80">
                Conversas com profissionais, empresas e clientes.
              </p>
            </CardHeader>
            <CardContent className="mt-6">
              {resultado.success ? (
                <MensagensPainel
                  conversas={resultado.data}
                  userId={user.id}
                  basePath="/mensagens"
                  conversaInicial={conversa ?? null}
                />
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
