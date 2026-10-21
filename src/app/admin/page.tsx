import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isAdmin } from '@/lib/auth'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent } from '@/components/ui/Card'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Painel Administrativo | NegóMapa Admin',
  description: 'Painel de administração do NegóMapa',
}

export default async function AdminDashboardPage() {
  const adminCheck = await isAdmin()
  if (!adminCheck) {
    notFound()
  }

  return (
    <MainLayout>
      <div className="p-6 md:p-8 bg-cream dark:bg-navy-dark">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-ink dark:text-cream">Painel Administrativo</h1>
            <p className="text-neutral-500 dark:text-cream-text/70 mt-1">
              Bem-vindo ao painel de administração do NegóMapa
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card variant="default" padding="lg" className="border-card-border hover:border-orange-500 dark:hover:border-orange-400 transition-colors">
              <Link href="/admin/denuncias" className="block">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-[4px]">
                    <svg className="h-6 w-6 text-orange-500 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-ink dark:text-cream">Denúncias</h3>
                    <p className="text-sm text-neutral-500 dark:text-cream-text/70 mt-1">Moderar denúncias de utilizadores</p>
                  </div>
                </div>
              </Link>
            </Card>

            <Card variant="default" padding="lg" className="border-card-border hover:border-orange-500 dark:hover:border-orange-400 transition-colors">
              <Link href="/admin/empresas" className="block">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-[4px]">
                    <svg className="h-6 w-6 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-ink dark:text-cream">Empresas</h3>
                    <p className="text-sm text-neutral-500 dark:text-cream-text/70 mt-1">Aprovar ou rejeitar empresas pendentes</p>
                  </div>
                </div>
              </Link>
            </Card>

            <Card variant="default" padding="lg" className="border-card-border hover:border-orange-500 dark:hover:border-orange-400 transition-colors">
              <Link href="/admin/servicos" className="block">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-[4px]">
                    <svg className="h-6 w-6 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-ink dark:text-cream">Serviços</h3>
                    <p className="text-sm text-neutral-500 dark:text-cream-text/70 mt-1">Gerenciar serviços cadastrados</p>
                  </div>
                </div>
              </Link>
            </Card>

            <Card variant="default" padding="lg" className="border-card-border hover:border-orange-500 dark:hover:border-orange-400 transition-colors">
              <Link href="/admin/vagas" className="block">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-[4px]">
                    <svg className="h-6 w-6 text-purple-500 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-ink dark:text-cream">Vagas</h3>
                    <p className="text-sm text-neutral-500 dark:text-cream-text/70 mt-1">Gerenciar vagas de emprego</p>
                  </div>
                </div>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}