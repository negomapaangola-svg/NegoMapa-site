'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import {
  CandidaturaEmpresa,
  EstadoCandidatura,
  atualizarEstadoCandidatura,
} from '@/lib/actions/candidaturas'
import { formatDate } from '@/lib/utils'

type Props = {
  candidaturas: CandidaturaEmpresa[]
}

const ESTADOS: { valor: Exclude<EstadoCandidatura, 'enviada'>; rotulo: string }[] = [
  { valor: 'em_analise', rotulo: 'Em análise' },
  { valor: 'aceite', rotulo: 'Aceite' },
  { valor: 'rejeitada', rotulo: 'Rejeitada' },
]

const ESTADO_ROTULO: Record<string, string> = {
  enviada: 'Enviada',
  em_analise: 'Em análise',
  aceite: 'Aceite',
  rejeitada: 'Rejeitada',
}

const ESTADO_ESTILO: Record<string, string> = {
  enviada: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200',
  em_analise: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  aceite: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  rejeitada: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}

export function CandidaturasEmpresa({ candidaturas }: Props) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()
  const [feedback, setFeedback] = React.useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)

  function alterar(candidatura: CandidaturaEmpresa, estado: EstadoCandidatura) {
    const rotulo = ESTADO_ROTULO[estado] ?? estado
    if (!window.confirm(`Alterar o estado desta candidatura para "${rotulo}"?`)) return
    setFeedback(null)
    startTransition(async () => {
      const resultado = await atualizarEstadoCandidatura(candidatura.id, estado)
      if (resultado.success) {
        setFeedback({ tipo: 'sucesso', texto: `Estado alterado para ${rotulo}.` })
        router.refresh()
      } else {
        setFeedback({ tipo: 'erro', texto: resultado.error ?? 'Não foi possível alterar o estado.' })
      }
    })
  }

  if (candidaturas.length === 0) {
    return <p className="text-neutral-500 dark:text-cream-text/70">Ainda não recebeu candidaturas.</p>
  }

  return (
    <div className="space-y-4">
      {feedback && (
        <div role="status" aria-live="polite" className={feedback.tipo === 'sucesso'
          ? 'px-4 py-3 rounded-[4px] border border-green-300 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
          : 'px-4 py-3 rounded-[4px] border border-red-300 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'}>
          {feedback.texto}
        </div>
      )}

      {candidaturas.map((candidatura) => (
        <div key={candidatura.id} className="p-4 rounded-[4px] border border-card-border bg-white/50 dark:bg-neutral-800/50 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <p className="font-medium text-ink dark:text-cream">{candidatura.vaga?.titulo ?? 'Vaga indisponível'}</p>
              <p className="text-sm text-neutral-700 dark:text-cream-text">Candidato: <span className="font-medium">{candidatura.nome_candidato}</span></p>
              <p className="text-sm text-neutral-700 dark:text-cream-text">
                Contacto: <span className="font-medium break-all">{candidatura.contacto || 'Não indicado'}</span>
              </p>
              <p className="text-xs text-neutral-500 dark:text-cream-text/70">Recebida em {formatDate(candidatura.criada_em)}</p>
            </div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium self-start sm:self-auto ${ESTADO_ESTILO[candidatura.estado] ?? ''}`}>
              {ESTADO_ROTULO[candidatura.estado] ?? candidatura.estado}
            </span>
          </div>

          <p className="text-sm text-neutral-700 dark:text-cream-text whitespace-pre-wrap">{candidatura.mensagem}</p>

          {candidatura.cv_url && (
            <a
              href={candidatura.cv_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm text-orange-600 dark:text-orange-400 underline"
            >
              Ver CV
            </a>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1 text-sm">
            {candidatura.conversa_id ? (
              <Link
                href={`/empresa/painel/mensagens?conversa=${encodeURIComponent(candidatura.conversa_id)}`}
                className="inline-flex items-center px-3 py-1.5 rounded-[4px] border border-orange-500 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
              >
                Ver conversa
              </Link>
            ) : (
              <span className="text-neutral-500 dark:text-cream-text/70">O candidato ainda não iniciou conversa.</span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {ESTADOS.map((opcao) => (
              <Button
                key={opcao.valor}
                variant={opcao.valor === 'rejeitada' ? 'destructive' : 'outline'}
                size="sm"
                disabled={pending || candidatura.estado === opcao.valor}
                onClick={() => alterar(candidatura, opcao.valor)}
              >
                {opcao.rotulo}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
