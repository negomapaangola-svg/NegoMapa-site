import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isAdmin } from '@/lib/auth'
import { getProfissionaisAdmin, ProfissionalAdmin } from '@/lib/actions/profissionais-admin'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card } from '@/components/ui/Card'
import { ProfissionaisAdminList } from './_components/ProfissionaisAdminList'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Administração de Profissionais | NegóMapa Admin',
  description: 'Aprove, rejeite ou reveja profissionais registados',
}

async function AdminProfissionaisContent() {
  const result = await getProfissionaisAdmin()

  if (!result.success) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-cream dark:bg-navy-dark">
          <main className="max-w-7xl mx-auto px-6 py-8">
            <Card variant="default" padding="lg" className="border-card-border text-center">
              <p className="text-neutral-600 dark:text-cream-text/80">{result.error}</p>
            </Card>
          </main>
        </div>
      </MainLayout>
    )
  }

  const profissionais: ProfissionalAdmin[] = result.data

  return (
    <MainLayout>
      <div className="min-h-screen bg-cream dark:bg-navy-dark">
        <header className="bg-navy dark:bg-navy-dark border-b border-card-border">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-cream">
              Administração de Profissionais
            </h1>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          <ProfissionaisAdminList profissionais={profissionais} />
        </main>
      </div>
    </MainLayout>
  )
}

export default async function AdminProfissionaisPage() {
  if (!(await isAdmin())) {
    notFound()
  }

  return <AdminProfissionaisContent />
}
