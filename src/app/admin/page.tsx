import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isAdmin } from '@/lib/auth'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Painel Administrativo | NegóMapa Admin',
  description: 'Painel de administração do NegóMapa',
}

type Entrada = {
  href: string
  titulo: string
  descricao: string
  icone: string
  corIcone: string
  corFundo: string
}

// Todas as páginas de gestão já existentes. Cada entrada abre a página correspondente,
// onde estão as ações (aprovar, rejeitar, suspender, moderar, etc.).
const GESTAO: Entrada[] = [
  {
    href: '/admin/profissionais',
    titulo: 'Profissionais',
    descricao: 'Aprovar ou rejeitar perfis profissionais, com motivo',
    icone: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    corIcone: 'text-teal-500 dark:text-teal-400',
    corFundo: 'bg-teal-100 dark:bg-teal-900/30',
  },
  {
    href: '/admin/empresas',
    titulo: 'Empresas',
    descricao: 'Aprovar, rejeitar ou suspender empresas',
    icone: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    corIcone: 'text-blue-500 dark:text-blue-400',
    corFundo: 'bg-blue-100 dark:bg-blue-900/30',
  },
  {
    href: '/admin/servicos',
    titulo: 'Serviços',
    descricao: 'Gerir serviços cadastrados',
    icone: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    corIcone: 'text-green-500 dark:text-green-400',
    corFundo: 'bg-green-100 dark:bg-green-900/30',
  },
  {
    href: '/admin/vagas',
    titulo: 'Vagas',
    descricao: 'Gerir vagas de emprego',
    icone: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    corIcone: 'text-purple-500 dark:text-purple-400',
    corFundo: 'bg-purple-100 dark:bg-purple-900/30',
  },
  {
    href: '/admin/denuncias',
    titulo: 'Denúncias',
    descricao: 'Moderar denúncias de utilizadores',
    icone: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    corIcone: 'text-orange-500 dark:text-orange-400',
    corFundo: 'bg-orange-100 dark:bg-orange-900/30',
  },
  {
    href: '/admin/teste-upload',
    titulo: 'Teste de upload',
    descricao: 'Página técnica para testar uploads de ficheiros',
    icone: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
    corIcone: 'text-neutral-500 dark:text-cream-text',
    corFundo: 'bg-neutral-100 dark:bg-navy/40',
  },
]

export default async function AdminDashboardPage() {
  const adminCheck = await isAdmin()
  if (!adminCheck) {
    notFound()
  }

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 md:p-8 bg-cream dark:bg-navy-dark">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-ink dark:text-cream">Painel Administrativo</h1>
            <p className="text-neutral-500 dark:text-cream-text/70 mt-1">
              Bem-vindo ao painel de administração do NegóMapa
            </p>
          </div>

          <section aria-labelledby="gestao-titulo">
            <h2 id="gestao-titulo" className="text-lg font-semibold text-ink dark:text-cream mb-4">
              Gestão
            </h2>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {GESTAO.map((entrada) => (
                <li key={entrada.href}>
                  <Card
                    variant="liquid"
                    padding="lg"
                    className="h-full hover:border-orange-500 dark:hover:border-orange-400 transition-colors"
                  >
                    <Link
                      href={entrada.href}
                      className="block h-full rounded-[4px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`shrink-0 p-3 rounded-[4px] ${entrada.corFundo}`}>
                          <svg className={`h-6 w-6 ${entrada.corIcone}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={entrada.icone} />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-lg font-semibold text-ink dark:text-cream">{entrada.titulo}</h3>
                          <p className="text-sm text-neutral-500 dark:text-cream-text/70 mt-1">{entrada.descricao}</p>
                        </div>
                      </div>
                    </Link>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </MainLayout>
  )
}
