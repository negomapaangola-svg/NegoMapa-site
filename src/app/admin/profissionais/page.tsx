import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isAdmin } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card } from '@/components/ui/Card'
import { AdminProfissionaisLista, type ProfissionalAdmin } from './_components/AdminProfissionaisLista'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Administração de Profissionais | NegóMapa Admin',
  description: 'Aprovar ou rejeitar perfis profissionais',
}

export default async function AdminProfissionaisPage() {
  if (!(await isAdmin())) {
    notFound()
  }

  const supabase = await createSupabaseServerClient()
  // Só colunas a que authenticated tem SELECT. motivo_rejeicao e avaliado_em
  // ficam para a RPC admin_listar_profissionais (ver supabase/pendentes).
  const { data, error } = await supabase
    .from('profissionais')
    .select('id, nome, estado, provincia, municipio, whatsapp, slug, created_at')
    .order('created_at', { ascending: false })

  const profissionais = (data ?? []) as ProfissionalAdmin[]

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
          {error && (
            <Card variant="default" padding="lg" className="border-card-border mb-8">
              <p role="alert" className="text-red-600 dark:text-red-400">
                Não foi possível carregar os profissionais. Tente novamente.
              </p>
            </Card>
          )}
          <AdminProfissionaisLista profissionais={profissionais} />
        </main>
      </div>
    </MainLayout>
  )
}
