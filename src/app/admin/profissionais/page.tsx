import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isAdmin } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card } from '@/components/ui/Card'
import { ProfissionalAdminActions } from './_components/ProfissionalAdminActions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Administração de Profissionais | NegóMapa Admin',
  description: 'Aprovar ou rejeitar perfis profissionais',
}

type Estado = 'pendente' | 'aprovado' | 'rejeitado'

// Apenas colunas a que o role authenticated tem SELECT (telefone, bi_numero e motivo_rejeicao não são legíveis).
type ProfissionalAdmin = {
  id: string
  nome: string
  estado: Estado
  provincia: string | null
  municipio: string | null
  whatsapp: string | null
  slug: string | null
  created_at: string
}

const SECOES: { estado: Estado; titulo: string; badge: string }[] = [
  { estado: 'pendente', titulo: 'Pendentes', badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  { estado: 'aprovado', titulo: 'Aprovados', badge: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  { estado: 'rejeitado', titulo: 'Rejeitados', badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
]

export default async function AdminProfissionaisPage() {
  if (!(await isAdmin())) {
    notFound()
  }

  const supabase = await createSupabaseServerClient()
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

          {SECOES.map((secao) => {
            const itens = profissionais.filter((p) => p.estado === secao.estado)
            return (
              <section key={secao.estado} className="mb-12">
                <h2 className="text-xl font-bold text-ink dark:text-cream mb-6 flex items-center gap-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${secao.badge}`}>
                    {itens.length}
                  </span>
                  {secao.titulo}
                </h2>

                {itens.length === 0 ? (
                  <Card variant="default" padding="lg" className="border-card-border text-center">
                    <p className="text-neutral-500 dark:text-cream-text/70">
                      Nenhum profissional {secao.titulo.toLowerCase()}.
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {itens.map((p) => (
                      <Card key={p.id} variant="default" padding="lg" className="border-card-border">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                          <div className="space-y-1 min-w-0">
                            <h3 className="text-lg font-semibold text-ink dark:text-cream break-words">{p.nome}</h3>
                            <p className="text-sm text-neutral-600 dark:text-cream-text">
                              {[p.municipio, p.provincia].filter(Boolean).join(', ') || 'Localização não indicada'}
                            </p>
                            {p.whatsapp && (
                              <p className="text-sm text-neutral-600 dark:text-cream-text">WhatsApp: {p.whatsapp}</p>
                            )}
                            <p className="text-xs text-neutral-500 dark:text-cream-text/70">
                              Registado em {new Date(p.created_at).toLocaleDateString('pt-PT')}
                            </p>
                          </div>
                          <div className="w-full lg:w-auto lg:min-w-[260px]">
                            <ProfissionalAdminActions profissionalId={p.id} estado={p.estado} />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </section>
            )
          })}
        </main>
      </div>
    </MainLayout>
  )
}
