'use client'

import { useState, useEffect } from 'react'
import { criarDenuncia, getDenunciaPendenteDoUsuario, AlvoDenuncia, DenunciaWithDetails } from '@/lib/actions/denuncias'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

type ReportFormProps = {
  alvo: AlvoDenuncia
  userId?: string
  className?: string
  triggerLabel?: string
}

const MOTIVOS = [
  { value: 'conteudo_inadequado', label: 'Conteúdo inadequado' },
  { value: 'fraude', label: 'Fraude' },
  { value: 'informacao_falsa', label: 'Informação falsa' },
  { value: 'spam', label: 'Spam' },
  { value: 'comportamento_abusivo', label: 'Comportamento abusivo' },
  { value: 'outro', label: 'Outro' },
] as const

export function ReportForm({ alvo, userId, className, triggerLabel = 'Denunciar' }: ReportFormProps) {
  const [aberto, setAberto] = useState(false)
  const [motivo, setMotivo] = useState<'conteudo_inadequado' | 'fraude' | 'informacao_falsa' | 'spam' | 'comportamento_abusivo' | 'outro'>('conteudo_inadequado')
  const [detalhes, setDetalhes] = useState('')
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'sucesso' | 'erro'>('idle')
  const [erro, setErro] = useState('')
  const [denunciaPendente, setDenunciaPendente] = useState<DenunciaWithDetails | null>(null)

  useEffect(() => {
    if (userId) {
      verificarDenunciaPendente()
    }
  }, [userId, alvo])

  const verificarDenunciaPendente = async () => {
    const denuncia = await getDenunciaPendenteDoUsuario(alvo, userId!)
    setDenunciaPendente(denuncia)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (detalhes.length > 1000) {
      setErro('Detalhes devem ter no máximo 1000 caracteres')
      return
    }

    setEstado('enviando')
    setErro('')

    try {
      const resultado = await criarDenuncia({
        alvo,
        motivo,
        detalhes: detalhes || undefined,
      })

      if (resultado.success) {
        setEstado('sucesso')
        setAberto(false)
        setMotivo('conteudo_inadequado')
        setDetalhes('')
        await verificarDenunciaPendente()
      } else {
        setEstado('erro')
        setErro(resultado.error || 'Erro ao enviar denúncia')
      }
    } catch {
      setEstado('erro')
      setErro('Erro inesperado. Tente novamente.')
    }
  }

  if (!userId) {
    return null
  }

  if (denunciaPendente) {
    return (
      <Card variant="outlined" padding="md" className={cn('border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20', className)}>
        <div className="flex items-start gap-3">
          <svg className="h-5 w-5 text-orange-500 dark:text-orange-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
              Já existe uma denúncia pendente para este alvo
            </p>
            <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
              A sua denúncia está a ser analisada. Obrigado por ajudar a manter a plataforma segura.
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
              Motivo: {MOTIVOS.find(m => m.value === denunciaPendente.motivo)?.label || denunciaPendente.motivo}
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className={className}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setAberto(true)}
        className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        {triggerLabel}
      </Button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card variant="default" padding="lg" className="w-full max-w-md bg-white dark:bg-neutral-900">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-ink dark:text-cream">Denunciar</h2>
              <button
                onClick={() => { setAberto(false); setEstado('idle'); setErro(''); }}
                className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="motivo" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Motivo <span className="text-red-500">*</span>
                </label>
                <select
                  id="motivo"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value as typeof motivo)}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-[4px] bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  disabled={estado === 'enviando'}
                >
                  {MOTIVOS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="detalhes" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Detalhes (opcional)
                </label>
                <textarea
                  id="detalhes"
                  value={detalhes}
                  onChange={(e) => setDetalhes(e.target.value)}
                  maxLength={1000}
                  rows={4}
                  className={cn(
                    'w-full px-3 py-2 text-sm border rounded-[4px] bg-white dark:bg-neutral-900',
                    'border-neutral-300 dark:border-neutral-600',
                    'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent',
                    'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                  placeholder="Descreva o problema com mais detalhes..."
                  disabled={estado === 'enviando'}
                />
                <div className="flex justify-end text-xs text-neutral-500 dark:text-neutral-400">
                  <span>{detalhes.length}/1000</span>
                </div>
              </div>

              {erro && (
                <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-[4px]">
                  {erro}
                </div>
              )}

              {estado === 'sucesso' && (
                <div className="p-3 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-[4px]">
                  Denúncia enviada com sucesso! A equipa de moderação irá analisar.
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={estado === 'enviando'}
                  loading={estado === 'enviando'}
                  className="flex-1"
                >
                  {estado === 'enviando' ? 'A enviar...' : 'Enviar denúncia'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => { setAberto(false); setEstado('idle'); setErro(''); }}
                  disabled={estado === 'enviando'}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}