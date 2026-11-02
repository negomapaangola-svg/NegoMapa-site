import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { obterPerfilProfissionalDoUtilizador } from '@/lib/actions/profissional-painel'
import { listarPedidosDoProfissional } from '@/lib/actions/pedidos-profissional'
import { PedidosProfissional } from './_components/PedidosProfissional'

export const metadata: Metadata = {
  title: 'Pedidos Recebidos | NegóMapa',
  description: 'Consulte e responda aos pedidos de serviço dirigidos ao seu perfil.',
}

export default async function ProfissionalPedidosPage() {
  const user = await getUser()
  if (!user) {
    redirect('/login?redirectTo=/profissional/painel/pedidos')
  }

  const perfil = await obterPerfilProfissionalDoUtilizador()

  return (
    <MainLayout>
      <section className="py-12 lg:py-16 bg-cream dark:bg-navy-dark">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Card variant="liquid" padding="lg">
            <CardHeader className="space-y-2">
              <CardTitle as="h1" className="text-3xl md:text-4xl">Pedidos Recebidos</CardTitle>
              <p className="text-neutral-600 dark:text-cream-text/80">
                Pedidos de serviço dirigidos ao seu perfil profissional.
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
                  O seu perfil ainda não foi aprovado. Os pedidos aparecem depois da aprovação.
                </div>
              ) : (
                <PedidosLista />
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </MainLayout>
  )
}

async function PedidosLista() {
  const resultado = await listarPedidosDoProfissional()
  if (!resultado.success) {
    return <p role="alert" className="text-red-700 dark:text-red-300">{resultado.error}</p>
  }
  return <PedidosProfissional pedidos={resultado.data} />
}
