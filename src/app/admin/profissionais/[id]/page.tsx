import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isAdmin } from '@/lib/auth'
import { getProfissionalAdminDetalhe } from '@/lib/actions/profissionais-admin'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card } from '@/components/ui/Card'
import { ProfissionalAdminDetalheActions } from './_components/ProfissionalAdminDetalheActions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Detalhe do Profissional | NegóMapa Admin',
  description: 'Consulte os dados administrativos essenciais de um profissional',
}

function Campo({ titulo, valor }: { titulo: string; valor: string | null | undefined }) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-cream-text/70">{titulo}</dt>
      <dd className="break-words text-sm text-ink dark:text-cream">{valor?.trim() || '—'}</dd>
    </div>
  )
}

export default async function ProfissionalAdminDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  if (!(await isAdmin())) notFound()

  const { id } = await params
  const result = await getProfissionalAdminDetalhe(id)

  return (
    <MainLayout>
      <div className="min-h-screen min-w-0 bg-cream px-4 py-8 dark:bg-navy-dark sm:px-6">
        <main className="mx-auto max-w-4xl min-w-0 space-y-6">
          <Link
            href="/admin/profissionais"
            className="inline-flex min-h-10 items-center rounded-[4px] text-sm font-medium text-navy underline-offset-4 hover:text-orange-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:text-cream"
          >
            ← Voltar à gestão de profissionais
          </Link>

          {!result.success ? (
            <Card variant="default" padding="lg" className="border-card-border">
              <h1 className="text-xl font-bold text-ink dark:text-cream">Não foi possível abrir o detalhe</h1>
              <p role="alert" className="mt-3 break-words text-sm text-neutral-700 dark:text-cream-text/90">{result.error}</p>
            </Card>
          ) : (
            <>
              <header className="space-y-2">
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Gestão de profissionais</p>
                <h1 className="break-words text-2xl font-bold text-ink dark:text-cream md:text-3xl">{result.data.nome}</h1>
              </header>

              <Card variant="default" padding="lg" className="min-w-0 border-card-border">
                <dl className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2">
                  <Campo titulo="Nome" valor={result.data.nome} />
                  <Campo titulo="Categoria" valor={result.data.categoria} />
                  <Campo titulo="Província" valor={result.data.provincia} />
                  <Campo titulo="Município" valor={result.data.municipio} />
                  <Campo titulo="WhatsApp" valor={result.data.whatsapp} />
                  <div className="min-w-0 space-y-1">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-cream-text/70">Estado</dt>
                    <dd className="break-words text-sm font-semibold text-ink dark:text-cream">{result.data.estado}</dd>
                  </div>
                  <div className="min-w-0 space-y-1 sm:col-span-2">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-cream-text/70">Descrição</dt>
                    <dd className="whitespace-pre-wrap break-words text-sm text-ink dark:text-cream">{result.data.descricao?.trim() || '—'}</dd>
                  </div>
                  {result.data.avaliado_em && (
                    <Campo
                      titulo="Avaliado em"
                      valor={new Intl.DateTimeFormat('pt-AO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(result.data.avaliado_em))}
                    />
                  )}
                  {result.data.motivo_rejeicao && (
                    <div className="min-w-0 space-y-1 sm:col-span-2">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-cream-text/70">Informação de avaliação / motivo</dt>
                      <dd className="whitespace-pre-wrap break-words text-sm text-ink dark:text-cream">{result.data.motivo_rejeicao}</dd>
                    </div>
                  )}
                </dl>
              </Card>

              <ProfissionalAdminDetalheActions
                profissionalId={result.data.id}
                nome={result.data.nome}
                estado={result.data.estado}
              />
            </>
          )}
        </main>
      </div>
    </MainLayout>
  )
}
