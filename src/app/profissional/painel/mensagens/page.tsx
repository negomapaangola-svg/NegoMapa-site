import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { MensagensPainel } from '@/components/mensagens/MensagensPainel'
import { obterPerfilProfissionalDoUtilizador } from '@/lib/actions/profissional-painel'
import { listarConversas } from '@/lib/actions/conversas'

export const metadata: Metadata = {
  title: 'Mensagens | Painel do Profissional | NegóMapa',
  description: 'Leia e responda às mensagens dos clientes que o contactaram.',
}

export default async function ProfissionalMensagensPage({
  searchParams,
}: {
  searchParams: Promise<{ conversa?: string }>
}) {
  const user = await getUser()
  if (!user) {
    redirect('/login?redirectTo=/profissional/painel/mensagens')
  }

  const perfil = await obterPerfilProfissionalDoUtilizador()
  const { conversa } = await searchParams

  return (
    <MainLayout>
      <section className="py-12 lg:py-16 bg-cream dark:bg-navy-dark">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Card variant="liquid" padding="lg">
            <CardHeader className="space-y-2">
              <CardTitle as="h1" className="text-3xl md:text-4xl">Mensagens</CardTitle>
              <p className="text-neutral-600 dark:text-cream-text/80">
                Conversas com clientes que o contactaram pelo seu perfil profissional.
              </p>
            </CardHeader>
            <CardContent className="mt-6">
              {!perfil ? (
                <div className="space-y-3">
                  <p className="text-neutral-700 dark:text-cream-text">Ainda não tem um perfil de profissional.</p>
                  <Link href="/cadastrar-profissional" className="text-orange-500 dark:text-orange-400 underline">
                    Fazer o cadastro de profissional
                  </Link>
                </div>
              ) : perfil.estado !== 'aprovado' ? (
                <div role="status" className="p-4 rounded-[4px] border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20 text-sm text-yellow-800 dark:text-yellow-300">
                  O seu perfil ainda não foi aprovado. As conversas ficam disponíveis depois da aprovação.
                </div>
              ) : (
                <ConversasDoProfissional
                  userId={user.id}
                  conversaInicial={conversa ?? null}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </MainLayout>
  )
}

async function ConversasDoProfissional({
  userId,
  conversaInicial,
}: {
  userId: string
  conversaInicial: string | null
}) {
  const resultado = await listarConversas()
  if (!resultado.success) {
    return <p role="alert" className="text-red-700 dark:text-red-300">{resultado.error}</p>
  }

  // Só as conversas em que atua como profissional; as de cliente ficam em /mensagens.
  const conversas = resultado.data.filter((conversa) => conversa.papel === 'profissional')

  return (
    <div className="h-[calc(100dvh-12rem)] min-h-[520px]">
      <MensagensPainel
        conversas={conversas}
        userId={userId}
        basePath="/profissional/painel/mensagens"
        conversaInicial={conversaInicial}
      />
    </div>
  )
}
