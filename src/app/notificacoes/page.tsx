import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { listarNotificacoes } from '@/lib/actions/notificacoes'
import { NotificacoesLista } from './_components/NotificacoesLista'

export const metadata: Metadata = {
  title: 'Notificações | NegóMapa',
  description: 'Consulte as notificações da sua conta na NegóMapa.',
}

export default async function NotificacoesPage() {
  const user = await getUser()
  if (!user) {
    redirect('/login?redirectTo=/notificacoes')
  }

  const resultado = await listarNotificacoes()

  return (
    <MainLayout>
      <section className="py-12 lg:py-16 bg-cream dark:bg-navy-dark">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Card variant="liquid" padding="lg">
            <CardHeader className="space-y-2">
              <CardTitle as="h1" className="text-3xl md:text-4xl">Notificações</CardTitle>
              <p className="text-neutral-600 dark:text-cream-text/80">
                Avisos sobre a sua conta, pedidos e candidaturas.
              </p>
            </CardHeader>
            <CardContent className="mt-6">
              {resultado.success ? (
                <NotificacoesLista notificacoes={resultado.data} />
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
