import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUser, isAdmin } from '@/lib/auth'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'

export const metadata: Metadata = {
  title: 'Conta e segurança | NegóMapa',
  description: 'Consulte as informações de acesso, segurança e gestão da sua conta NegóMapa.',
  robots: { index: false, follow: false },
}

export default async function ConfiguracoesContaSegurancaPage() {
  if (await isAdmin()) redirect('/admin')
  const user = await getUser()

  if (!user) redirect('/login?redirectTo=/configuracoes/conta-seguranca')

  return (
    <MainLayout>
      <main id="main-content" className="min-h-[60vh] bg-cream px-4 py-10 dark:bg-navy-dark sm:py-14">
        <div className="mx-auto max-w-3xl space-y-6">
          <header className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-700 dark:text-orange-300">
              Configurações
            </p>
            <h1 className="mt-2 text-3xl font-bold text-ink dark:text-cream">Conta e segurança</h1>
            <p className="mt-2 text-sm text-neutral-600 dark:text-cream-text">
              Consulte as informações relacionadas com o acesso e a segurança da sua conta NegóMapa.
            </p>
          </header>

          <Card variant="liquid" padding="md">
            <CardHeader>
              <CardTitle as="h2" className="text-lg">Informações da conta</CardTitle>
              <CardDescription>
                O email e o tipo de conta são protegidos e não podem ser alterados nesta área.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-neutral-700 dark:text-cream-text">
              <p>O email associado à conta e o tipo de conta são geridos de forma segura pela plataforma.</p>
              <p>A gestão de sessões activas e a alteração de credenciais ainda não estão disponíveis nesta versão.</p>
              <p>
                Para consultar os dados pessoais associados à conta, abra o{' '}
                <Link href="/perfil" className="font-semibold text-orange-700 underline underline-offset-2 dark:text-orange-300">
                  perfil
                </Link>.
              </p>
            </CardContent>
          </Card>

          <Link
            href="/configuracoes"
            className="inline-flex min-h-9 items-center rounded-lg border border-card-border px-3 py-1.5 text-sm font-semibold text-ink transition-colors hover:border-orange-500 hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:text-cream dark:hover:text-orange-300"
          >
            Voltar às configurações
          </Link>
        </div>
      </main>
    </MainLayout>
  )
}
