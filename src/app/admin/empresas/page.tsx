import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isAdmin } from '@/lib/auth'
import { getAllEmpresasAdmin, EmpresaAdmin, EmpresasAdminResult } from '@/lib/actions/empresas'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card } from '@/components/ui/Card'
import { EmpresaAdminActions } from './_components/EmpresaAdminActions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Administração de Empresas | NegóMapa Admin',
  description: 'Gerencie empresas pendentes de aprovação',
}

async function AdminEmpresasContent() {
  const result: EmpresasAdminResult = await getAllEmpresasAdmin()
  const empresas: EmpresaAdmin[] = result.success ? result.data : []

  const empresasPendentes = empresas.filter(e => !e.is_approved)
  const empresasAprovadas = empresas.filter(e => e.is_approved)

  return (
    <MainLayout>
      <div className="min-h-screen min-w-0 bg-cream dark:bg-navy-dark">
        <header className="bg-navy dark:bg-navy-dark border-b border-card-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex min-w-0 flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="min-w-0 break-words text-2xl md:text-3xl font-heading font-bold text-cream">
                Administração de Empresas
              </h1>
              <a
                href="/empresas"
                className="inline-flex w-fit max-w-full items-center gap-2 px-4 py-2 text-sm font-medium text-cream border border-card-border rounded-[4px] hover:bg-cream/10 hover:border-orange-500 dark:hover:border-orange-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              >
                Ver empresas aprovadas
              </a>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl min-w-0 px-4 sm:px-6 py-8">
          <section className="mb-12 min-w-0">
            <h2 className="text-xl font-bold text-ink dark:text-cream mb-6 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                {empresasPendentes.length}
              </span>
              Empresas Pendentes
            </h2>

            {empresasPendentes.length === 0 ? (
              <Card variant="default" padding="lg" className="border-card-border text-center">
                <p className="text-neutral-500 dark:text-cream-text/70">Nenhuma empresa pendente de aprovação.</p>
              </Card>
            ) : (
              <div className="min-w-0 space-y-4">
                {empresasPendentes.map((empresa) => (
                  <EmpresaCard key={empresa.id} empresa={empresa} />
                ))}
              </div>
            )}
          </section>

          <section className="min-w-0">
            <h2 className="text-xl font-bold text-ink dark:text-cream mb-6 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                {empresasAprovadas.length}
              </span>
              Empresas Aprovadas
            </h2>

            {empresasAprovadas.length === 0 ? (
              <Card variant="default" padding="lg" className="border-card-border text-center">
                <p className="text-neutral-500 dark:text-cream-text/70">Nenhuma empresa aprovada.</p>
              </Card>
            ) : (
              <div className="min-w-0 space-y-4">
                {empresasAprovadas.map((empresa) => (
                  <EmpresaCard key={empresa.id} empresa={empresa} />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </MainLayout>
  )
}

function EmpresaCard({ empresa }: { empresa: EmpresaAdmin }) {
  return (
    <Card variant="default" padding="none" className="min-w-0 overflow-hidden">
      <div className="grid min-w-0 grid-cols-1 gap-0 md:grid-cols-2 xl:grid-cols-6">
        <div className="min-w-0 break-words p-4 md:p-5 border-b md:border-r border-card-border bg-white/50 dark:bg-neutral-800/50">
          <p className="text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider mb-1">Nome</p>
          <Link
            href={`/admin/empresas/${empresa.id}`}
            className="block min-w-0 break-words text-ink dark:text-cream font-medium hover:text-orange-600 dark:hover:text-orange-400 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-[2px]"
          >
            {empresa.name}
          </Link>
        </div>
        <div className="hidden min-w-0 break-words p-4 md:block md:p-5 md:border-b md:border-r border-card-border bg-white/50 dark:bg-neutral-800/50">
          <p className="text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider mb-1">Setor</p>
          <p className="break-words text-neutral-600 dark:text-cream-text/70">{empresa.sector || '-'}</p>
        </div>
        <div className="hidden min-w-0 break-words p-4 md:block md:p-5 md:border-b md:border-r border-card-border bg-white/50 dark:bg-neutral-800/50">
          <p className="text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider mb-1">Província</p>
          <p className="break-words text-neutral-600 dark:text-cream-text/70">{empresa.province || '-'}</p>
        </div>
        <div className="hidden min-w-0 break-words p-4 md:block md:p-5 md:border-b md:border-r border-card-border bg-white/50 dark:bg-neutral-800/50">
          <p className="text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider mb-1">Email</p>
          <p className="break-all text-neutral-600 dark:text-cream-text/70">{empresa.email || '-'}</p>
        </div>
        <div className="hidden min-w-0 break-words p-4 md:block md:p-5 md:border-b md:border-r border-card-border bg-white/50 dark:bg-neutral-800/50">
          <p className="text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider mb-1">Contacto</p>
          <p className="break-words text-neutral-600 dark:text-cream-text/70">{empresa.phone || '-'}</p>
        </div>
        <div className="flex min-w-0 flex-wrap items-center justify-start gap-2 p-4 md:justify-end md:p-5">
          <EmpresaAdminActions empresaId={empresa.id} isApproved={empresa.is_approved} />
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 border-t border-card-border bg-white/50 p-4 dark:bg-neutral-800/50 sm:grid-cols-2 md:hidden">
        <div className="min-w-0">
          <p className="text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider mb-1">Setor</p>
          <p className="break-words text-neutral-600 dark:text-cream-text/70">{empresa.sector || '-'}</p>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider mb-1">Província</p>
          <p className="break-words text-neutral-600 dark:text-cream-text/70">{empresa.province || '-'}</p>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider mb-1">Email</p>
          <p className="break-all text-neutral-600 dark:text-cream-text/70">{empresa.email || '-'}</p>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider mb-1">Contacto</p>
          <p className="break-words text-neutral-600 dark:text-cream-text/70">{empresa.phone || '-'}</p>
        </div>
      </div>
    </Card>
  )
}

export default async function AdminEmpresasPage() {
  const adminCheck = await isAdmin()
  if (!adminCheck) {
    notFound()
  }

  return <AdminEmpresasContent />
}
