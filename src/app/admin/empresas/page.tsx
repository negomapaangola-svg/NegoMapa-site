import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isAdmin } from '@/lib/auth'
import { getAllEmpresasAdmin, aprovarEmpresa, rejeitarEmpresa, suspenderEmpresa, EmpresaAdmin, EmpresasAdminResult } from '@/lib/actions/empresas'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

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
      <div className="min-h-screen bg-cream dark:bg-navy-dark">
        <header className="bg-navy dark:bg-navy-dark border-b border-card-border">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="text-2xl md:text-3xl font-heading font-bold text-cream">
                Administração de Empresas
              </h1>
              <a
                href="/empresas"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-navy dark:text-cream border border-card-border rounded-[4px] hover:bg-cream dark:hover:bg-navy-dark hover:border-orange-500 dark:hover:border-orange-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-dark"
              >
                Ver empresas aprovadas
              </a>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Empresas Pendentes */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-ink dark:text-cream mb-6 flex items-center gap-2">
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
              <div className="space-y-4">
                {empresasPendentes.map((empresa) => (
                  <EmpresaCard key={empresa.id} empresa={empresa} onApprove={aprovarEmpresa} onReject={rejeitarEmpresa} />
                ))}
              </div>
            )}
          </section>

          {/* Empresas Aprovadas */}
          <section>
            <h2 className="text-xl font-bold text-ink dark:text-cream mb-6 flex items-center gap-2">
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
              <div className="space-y-4">
                {empresasAprovadas.map((empresa) => (
                  <EmpresaCard key={empresa.id} empresa={empresa} onApprove={aprovarEmpresa} onReject={rejeitarEmpresa} onSuspend={suspenderEmpresa} />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </MainLayout>
  )
}

interface EmpresaCardProps {
  empresa: EmpresaAdmin
  onApprove: (id: string) => Promise<{ success: boolean; error?: string }>
  onReject: (id: string) => Promise<{ success: boolean; error?: string }>
  onSuspend?: (id: string) => Promise<{ success: boolean; error?: string }>
}

function EmpresaCard({ empresa, onApprove, onReject, onSuspend }: EmpresaCardProps) {
  return (
    <form action={async () => {
      // This form is just for the buttons, actual actions are handled by the buttons' formActions
    }} className="contents">
      <Card variant="default" padding="none" className="overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-0">
          <div className="p-4 md:p-5 border-b md:border-b-0 md:border-r border-card-border bg-white/50 dark:bg-neutral-800/50">
            <p className="text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider mb-1">Nome</p>
            <p className="text-ink dark:text-cream font-medium">{empresa.name}</p>
          </div>
          <div className="p-4 md:p-5 border-b md:border-b-0 md:border-r border-card-border bg-white/50 dark:bg-neutral-800/50 hidden md:block">
            <p className="text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider mb-1">Setor</p>
            <p className="text-neutral-600 dark:text-cream-text/70">{empresa.sector || "-"}</p>
          </div>
          <div className="p-4 md:p-5 border-b md:border-b-0 md:border-r border-card-border bg-white/50 dark:bg-neutral-800/50 hidden md:block">
            <p className="text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider mb-1">Província</p>
            <p className="text-neutral-600 dark:text-cream-text/70">{empresa.province || "-"}</p>
          </div>
          <div className="p-4 md:p-5 border-b md:border-b-0 md:border-r border-card-border bg-white/50 dark:bg-neutral-800/50 hidden md:block">
            <p className="text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider mb-1">Email</p>
            <p className="text-neutral-600 dark:text-cream-text/70">{empresa.email || "-"}</p>
          </div>
          <div className="p-4 md:p-5 border-b md:border-b-0 md:border-r border-card-border bg-white/50 dark:bg-neutral-800/50 hidden md:block">
            <p className="text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider mb-1">Contacto</p>
            <p className="text-neutral-600 dark:text-cream-text/70">{empresa.phone || "-"}</p>
          </div>
          <div className="p-4 md:p-5 flex items-center justify-center md:justify-end">
            {!empresa.is_approved ? (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="sm"
                  formAction={async () => {
                    const result = await onApprove(empresa.id)
                    if (!result.success) alert(result.error)
                  }}
                  className="w-full sm:w-auto"
                >
                  Aprovar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  formAction={async () => {
                    const result = await onReject(empresa.id)
                    if (!result.success) alert(result.error)
                  }}
                  className="w-full sm:w-auto"
                >
                  Rejeitar
                </Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <span className="text-sm font-medium text-green-600 dark:text-green-400 self-center sm:self-auto">
                  Aprovada
                </span>
                {onSuspend && (
                  <Button
                    variant="secondary"
                    size="sm"
                    formAction={async () => {
                      const result = await onSuspend(empresa.id)
                      if (!result.success) alert(result.error)
                    }}
                    className="w-full sm:w-auto"
                  >
                    Suspender
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="md:hidden p-4 border-t border-card-border bg-white/50 dark:bg-neutral-800/50 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider mb-1">Setor</p>
            <p className="text-neutral-600 dark:text-cream-text/70">{empresa.sector || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider mb-1">Província</p>
            <p className="text-neutral-600 dark:text-cream-text/70">{empresa.province || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider mb-1">Email</p>
            <p className="text-neutral-600 dark:text-cream-text/70">{empresa.email || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider mb-1">Contacto</p>
            <p className="text-neutral-600 dark:text-cream-text/70">{empresa.phone || "-"}</p>
          </div>
        </div>
      </Card>
    </form>
  )
}

export default async function AdminEmpresasPage() {
  const adminCheck = await isAdmin()
  if (!adminCheck) {
    notFound()
  }

  return <AdminEmpresasContent />
}