'use client'

import * as React from 'react'
import { Card } from '@/components/ui/Card'
import { ProfissionalAdminActions, type FeedbackAvaliacao } from './ProfissionalAdminActions'

export type Estado = 'pendente' | 'aprovado' | 'rejeitado'

export type ProfissionalAdmin = {
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

export function AdminProfissionaisLista({ profissionais }: { profissionais: ProfissionalAdmin[] }) {
  // O estado da mensagem vive aqui, no pai, para sobreviver à mudança de secção do cartão.
  const [feedback, setFeedback] = React.useState<FeedbackAvaliacao | null>(null)

  return (
    <>
      {feedback && (
        <div
          role={feedback.tipo === 'erro' ? 'alert' : 'status'}
          className={
            feedback.tipo === 'erro'
              ? 'mb-8 rounded-[4px] border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300'
              : 'mb-8 rounded-[4px] border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300'
          }
        >
          <div className="flex items-start justify-between gap-4">
            <p>{feedback.texto}</p>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-xs underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              Fechar
            </button>
          </div>
        </div>
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
                        <ProfissionalAdminActions
                          profissionalId={p.id}
                          estado={p.estado}
                          onResultado={setFeedback}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )
      })}
    </>
  )
}
