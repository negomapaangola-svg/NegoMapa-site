import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { listarMinhasCandidaturas } from '@/lib/actions/candidaturas'
import { formatDate } from '@/lib/utils'
import { BotaoMensagemEmpresa } from './_components/BotaoMensagemEmpresa'

export const metadata: Metadata = {
  title: 'As Minhas Candidaturas | NegóMapa',
  description: 'Acompanhe o estado das suas candidaturas a vagas.',
}

const ESTADO_ROTULO: Record<string, string> = {
  enviada: 'Enviada',
  vista: 'Vista',
  em_analise: 'Em análise',
  aceite: 'Aceite',
  rejeitada: 'Rejeitada',
  arquivada: 'Arquivada',
}

const ESTADO_ESTILO: Record<string, string> = {
  enviada: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200',
  vista: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  em_analise: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  aceite: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  rejeitada: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  arquivada: 'bg-neutral-200 text-neutral-600 dark:bg-neutral-600 dark:text-neutral-300',
}

export default async function CandidaturasPage() {
  const user = await getUser()
  if (!user) {
    redirect('/login?redirectTo=/candidaturas')
  }

  const resultado = await listarMinhasCandidaturas()

  return (
    <MainLayout>
      <section className="py-12 lg:py-16 bg-cream dark:bg-navy-dark">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Card variant="liquid" padding="lg">
            <CardHeader className="space-y-2">
              <CardTitle as="h1" className="text-3xl md:text-4xl">As Minhas Candidaturas</CardTitle>
              <p className="text-neutral-600 dark:text-cream-text/80">
                Acompanhe o estado das candidaturas que enviou.
              </p>
            </CardHeader>
            <CardContent className="mt-6 space-y-4">
              {!resultado.success && (
                <p role="alert" className="text-red-700 dark:text-red-300">{resultado.error}</p>
              )}

              {resultado.success && resultado.data.length === 0 && (
                <p className="text-neutral-500 dark:text-cream-text/70">
                  Ainda não enviou candidaturas. Pode consultar as{' '}
                  <Link href="/vagas" className="text-orange-600 dark:text-orange-400 underline">vagas disponíveis</Link>.
                </p>
              )}

              {resultado.success && resultado.data.map((candidatura) => (
                <div
                  key={candidatura.id}
                  className="p-4 rounded-[4px] border border-card-border bg-white/50 dark:bg-neutral-800/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div>
                    <p className="font-medium text-ink dark:text-cream">
                      {candidatura.vaga?.titulo ?? 'Vaga indisponível'}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-cream-text/70">
                      Enviada em {formatDate(candidatura.criada_em)}
                    </p>
                  </div>
                  <div className="flex flex-col sm:items-end gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium self-start sm:self-auto ${ESTADO_ESTILO[candidatura.estado] ?? ''}`}>
                      {ESTADO_ROTULO[candidatura.estado] ?? candidatura.estado}
                    </span>
                    {candidatura.vaga?.company_id && (
                      <BotaoMensagemEmpresa empresaId={candidatura.vaga.company_id} />
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </MainLayout>
  )
}
