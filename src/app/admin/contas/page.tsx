import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { isAdmin } from '@/lib/auth'
import { getAdminAccountDeletionData } from '@/lib/actions/admin-account-deletion'
import { AdminAccountDeletionPanel } from './_components/AdminAccountDeletionPanel'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Eliminar conta | Administração NegóMapa',
  description: 'Desactivação segura e auditada de contas.',
}

export default async function AdminAccountDeletionPage() {
  if (!(await isAdmin())) notFound()

  const data = await getAdminAccountDeletionData()

  return (
    <MainLayout>
      <main className="min-h-screen bg-cream px-4 py-7 dark:bg-navy-dark sm:px-6 lg:py-9">
        <div className="mx-auto max-w-6xl space-y-7">
          <header className="border-b border-slate-200 pb-5 dark:border-slate-700">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-700 dark:text-orange-400">Área restrita</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Eliminar conta</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Desactivação administrativa de clientes, profissionais e empresas, com confirmação obrigatória e histórico de auditoria.
            </p>
          </header>

          {!data.success ? (
            <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              {data.error}
            </div>
          ) : (
            <AdminAccountDeletionPanel accounts={data.accounts} audit={data.audit} />
          )}
        </div>
      </main>
    </MainLayout>
  )
}
