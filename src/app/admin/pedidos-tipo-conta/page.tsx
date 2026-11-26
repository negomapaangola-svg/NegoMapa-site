import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { isAdmin } from '@/lib/auth'
import { listarPedidosMudancaTipoConta } from '@/lib/actions/conta-tipo'
import { PedidosTipoContaList } from './_components/PedidosTipoContaList'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Pedidos de mudança de tipo | NegóMapa',
  description: 'Rever pedidos de mudança de tipo de conta.',
}

export default async function AdminPedidosTipoContaPage() {
  if (!(await isAdmin())) notFound()
  const resultado = await listarPedidosMudancaTipoConta()

  return (
    <MainLayout>
      <main className="min-h-screen bg-cream px-4 py-8 dark:bg-navy-dark sm:px-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <header>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-700 dark:text-orange-400">Área restrita</p>
            <h1 className="mt-2 text-3xl font-bold text-ink dark:text-cream">Pedidos de mudança de tipo</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              A aprovação altera o tipo de conta. O perfil profissional ou empresarial mantém o seu estado de avaliação próprio.
            </p>
          </header>
          {!resultado.ok && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">{resultado.message}</p>}
          <PedidosTipoContaList pedidos={resultado.pedidos} />
        </div>
      </main>
    </MainLayout>
  )
}
