import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import {
  obterPreferenciasNotificacao,
  guardarPreferenciasNotificacao,
} from '@/lib/actions/preferencias-notificacao'

export const metadata: Metadata = {
  title: 'Preferências de notificação | NegóMapa',
  description: 'Escolha como quer receber os avisos da NegóMapa.',
}

export default async function PreferenciasNotificacoesPage() {
  const user = await getUser()

  if (!user) {
    redirect('/login?redirectTo=/preferencias-notificacoes')
  }

  const resultado = await obterPreferenciasNotificacao()
  const preferencias = resultado.success
    ? resultado.data
    : { plataforma: true, email: false, whatsapp: false }

  return (
    <MainLayout>
      <section className="py-12 lg:py-16 bg-cream dark:bg-navy-dark">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Card variant="liquid" padding="lg">
            <CardHeader className="space-y-2">
              <CardTitle as="h1" className="text-3xl md:text-4xl">
                Preferências de notificação
              </CardTitle>
              <p className="text-neutral-600 dark:text-cream-text/80">
                Escolha os canais pelos quais quer receber avisos importantes.
              </p>
            </CardHeader>

            <CardContent className="mt-6">
              {!resultado.success && (
                <p role="alert" className="mb-4 text-red-700 dark:text-red-300">
                  {resultado.error}
                </p>
              )}

              <form action={guardarPreferenciasNotificacao} className="space-y-5">
                <label className="flex items-start gap-3 rounded-[4px] border border-card-border p-4">
                  <input
                    type="checkbox"
                    name="plataforma"
                    defaultChecked={preferencias.plataforma}
                    className="mt-1 h-5 w-5 accent-orange-500"
                  />
                  <span>
                    <span className="block font-medium text-ink dark:text-cream">Notificações na plataforma</span>
                    <span className="block text-sm text-neutral-600 dark:text-cream-text/80">
                      Avisos visíveis no sino do cabeçalho.
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-3 rounded-[4px] border border-card-border p-4">
                  <input
                    type="checkbox"
                    name="email"
                    defaultChecked={preferencias.email}
                    className="mt-1 h-5 w-5 accent-orange-500"
                  />
                  <span>
                    <span className="block font-medium text-ink dark:text-cream">Email</span>
                    <span className="block text-sm text-neutral-600 dark:text-cream-text/80">
                      Receber avisos importantes no seu email.
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-3 rounded-[4px] border border-card-border p-4">
                  <input
                    type="checkbox"
                    name="whatsapp"
                    defaultChecked={preferencias.whatsapp}
                    className="mt-1 h-5 w-5 accent-orange-500"
                  />
                  <span>
                    <span className="block font-medium text-ink dark:text-cream">WhatsApp</span>
                    <span className="block text-sm text-neutral-600 dark:text-cream-text/80">
                      Receber avisos importantes por WhatsApp.
                    </span>
                  </span>
                </label>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-[4px] bg-orange-500 px-[26px] py-[12px] text-[14px] font-bold text-ink transition-colors hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                >
                  Guardar preferências
                </button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </MainLayout>
  )
}
