import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { listarMeusPedidos, obterServicoParaPedido } from '@/lib/actions/pedidos-servico'
import { PedidosCliente } from './_components/PedidosCliente'

export const metadata: Metadata = {
  title: 'Os Meus Pedidos | NegóMapa',
  description: 'Crie e acompanhe os seus pedidos de serviço na NegóMapa.',
}

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ servico?: string; profissional?: string }>
}) {
  const user = await getUser()
  if (!user) {
    redirect('/login?redirectTo=/pedidos')
  }

  const { servico, profissional } = await searchParams
  const prefill = servico && profissional
    ? await obterServicoParaPedido(servico, profissional)
    : null

  const resultado = await listarMeusPedidos()

  return (
    <MainLayout>
      <section className="py-12 lg:py-16 bg-cream dark:bg-navy-dark">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Card variant="liquid" padding="lg">
            <CardHeader className="space-y-2">
              <CardTitle as="h1" className="text-3xl md:text-4xl">Os Meus Pedidos</CardTitle>
              <p className="text-neutral-600 dark:text-cream-text/80">
                Descreva o serviço que procura e acompanhe os pedidos enviados.
              </p>
            </CardHeader>
            <CardContent className="mt-6">
              {resultado.success ? (
                <PedidosCliente pedidos={resultado.data} prefill={prefill} />
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
