import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUser, isAdmin } from '@/lib/auth'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'

export const metadata: Metadata = {
  title: 'Localização e interesses | NegóMapa',
  description: 'Actualize a localização privada e as categorias de interesse no seu perfil NegóMapa.',
  robots: { index: false, follow: false },
}

export default async function ConfiguracoesLocalizacaoPage() {
  if (await isAdmin()) redirect('/admin')
  const user = await getUser()

  if (!user) redirect('/login?redirectTo=/configuracoes/localizacao')

  return (
    <MainLayout>
      <main id="main-content" className="min-h-[60vh] bg-cream px-4 py-10 dark:bg-navy-dark sm:py-14">
        <div className="mx-auto max-w-3xl space-y-6">
          <header className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-700 dark:text-orange-300">
              Configurações
            </p>
            <h1 className="mt-2 text-3xl font-bold text-ink dark:text-cream">Localização e interesses</h1>
            <p className="mt-2 text-sm text-neutral-600 dark:text-cream-text">
              Actualize a sua localização privada e as categorias de interesse para receber sugestões mais relevantes.
            </p>
          </header>

          <Card variant="liquid" padding="md">
            <CardHeader>
              <CardTitle as="h2" className="text-lg">Localização privada</CardTitle>
              <CardDescription>
                A sua localização é utilizada para melhorar as recomendações de serviços, profissionais e vagas próximas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-neutral-700 dark:text-cream-text">
              <p>
                Para actualizar a localização e as preferências associadas, abra a secção dedicada no seu perfil.
              </p>
              <Link
                href="/perfil#localizacao-preferencias"
                className="inline-flex min-h-9 items-center rounded-lg border border-card-border px-3 py-1.5 text-sm font-semibold text-ink transition-colors hover:border-orange-500 hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:text-cream dark:hover:text-orange-300"
              >
                Abrir localização e interesses
              </Link>
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
