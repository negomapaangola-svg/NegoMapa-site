import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { isAdmin, getUser } from '@/lib/auth'
import { MainLayout } from '@/components/layout/MainLayout'
import { TestBucketCard } from './_components/TestBucketCard'

export const metadata: Metadata = {
  title: 'Teste de Upload - Admin',
  description: 'Página temporária para testar o componente FileUpload',
}

const testBuckets = [
  { bucket: 'empresas-logos' as const, folder: 'testes', label: 'Empresas Logos (público, 2MB, imagens)' },
  { bucket: 'profissionais-avatars' as const, folder: 'testes', label: 'Profissionais Avatars (público, 1MB, imagens)' },
  { bucket: 'servicos-imagens' as const, folder: 'testes', label: 'Serviços Imagens (público, 5MB, imagens)' },
  { bucket: 'documentos-privados' as const, folder: 'testes', label: 'Documentos Privados (privado, 10MB, PDF/imagens)' },
]

export default async function TesteUploadPage() {
  const adminCheck = await isAdmin()

  if (!adminCheck) {
    const user = await getUser()
    if (!user) {
      redirect('/login?redirectTo=/admin/teste-upload')
    }
    return (
      <MainLayout>
        <div className="min-h-screen p-8 bg-cream dark:bg-navy-dark flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-[4px] p-8 shadow dark:bg-neutral-800 border border-card-border text-center">
            <h2 className="text-2xl font-bold text-center mb-4 text-ink dark:text-cream">
              Acesso Negado
            </h2>
            <p className="text-neutral-600 dark:text-cream-text mb-6">
              Você não tem privilégios de administrador para aceder a esta página.
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 border border-card-border rounded-[4px] bg-white text-ink dark:text-cream hover:bg-cream dark:hover:bg-navy-dark transition-colors"
            >
              Voltar ao início
            </a>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-cream dark:bg-navy-dark">
        <header className="bg-navy dark:bg-navy-dark border-b border-card-border">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="text-2xl md:text-3xl font-heading font-bold text-cream">
                Teste de Upload de Ficheiros
              </h1>
              <a
                href="/admin/servicos"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-navy dark:text-cream border border-card-border rounded-[4px] hover:bg-cream dark:hover:bg-navy-dark hover:border-orange-500 dark:hover:border-orange-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-dark"
              >
                ← Voltar à administração
              </a>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-[4px]">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-heading font-semibold text-amber-900 dark:text-amber-100">
                  ⚠️ Página Temporária de Teste
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Esta página foi criada apenas para testar o componente <code className="bg-amber-100 dark:bg-amber-800 px-1 rounded">FileUpload</code> e a server action <code className="bg-amber-100 dark:bg-amber-800 px-1 rounded">uploadFile</code>.
                  Não integra com formulários reais nem grava em tabelas.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {testBuckets.map(({ bucket, folder, label }) => (
              <TestBucketCard key={bucket} bucket={bucket} folder={folder} label={label} />
            ))}
          </div>
        </main>
      </div>
    </MainLayout>
  )
}