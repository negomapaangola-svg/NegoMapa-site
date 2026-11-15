import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { isAdmin } from '@/lib/auth'
import { getAdminMessages } from '@/lib/actions/admin-foundation'
import { AdminMessagesClient } from './_components/AdminMessagesClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Mensagens administrativas | NegóMapa',
  description: 'Caixa de entrada de mensagens dos utilizadores.',
}

export default async function AdminMessagesPage() {
  if (!(await isAdmin())) notFound()

  const messages = await getAdminMessages('all')

  return (
    <MainLayout>
      <main className="min-h-screen bg-cream px-4 py-8 dark:bg-navy-dark sm:px-6">
        <div className="mx-auto max-w-6xl">
          <header className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400">Administração</p>
            <h1 className="mt-2 text-3xl font-bold text-ink dark:text-cream">Mensagens</h1>
            <p className="mt-2 max-w-2xl text-sm text-neutral-600 dark:text-cream-text/70">Pedidos de contacto enviados pelos utilizadores. As conversas privadas entre utilizadores permanecem separadas.</p>
          </header>
          {messages === null ? (
            <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">Não foi possível carregar a caixa de entrada. Confirme a migração da fundação administrativa.</p>
          ) : (
            <AdminMessagesClient initialMessages={messages} />
          )}
        </div>
      </main>
    </MainLayout>
  )
}
