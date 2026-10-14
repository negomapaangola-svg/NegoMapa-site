'use client'

import { useState, useEffect } from 'react'
import { criarAvaliacao, atualizarAvaliacao, removerAvaliacao, getAvaliacaoDoUsuario, AvaliacaoInput, AlvoAvaliacao, AvaliacaoWithUser } from '@/lib/actions/avaliacoes'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

type ReviewFormProps = {
  alvo: AlvoAvaliacao
  userId?: string
  className?: string
}

export function ReviewForm({ alvo, userId, className }: ReviewFormProps) {
  const [nota, setNota] = useState<number>(0)
  const [comentario, setComentario] = useState<string>('')
  const [hoveredStar, setHoveredStar] = useState<number>(0)
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'sucesso' | 'erro'>('idle')
  const [erro, setErro] = useState<string>('')
  const [avaliacaoExistente, setAvaliacaoExistente] = useState<AvaliacaoWithUser | null>(null)
  const [editando, setEditando] = useState<boolean>(false)

  useEffect(() => {
    if (userId) {
      carregarAvaliacaoExistente()
    }
  }, [userId, alvo])

  const carregarAvaliacaoExistente = async () => {
    const avaliacao = await getAvaliacaoDoUsuario(alvo, userId!)
    if (avaliacao) {
      setAvaliacaoExistente(avaliacao)
      setNota(avaliacao.nota)
      setComentario(avaliacao.comentario || '')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (nota < 1 || nota > 5) {
      setErro('Selecione uma nota de 1 a 5')
      return
    }

    if (comentario.length > 1000) {
      setErro('Comentário deve ter no máximo 1000 caracteres')
      return
    }

    setEstado('enviando')
    setErro('')

    try {
      let resultado

      if (avaliacaoExistente && !editando) {
        return
      }

      if (avaliacaoExistente && editando) {
        resultado = await atualizarAvaliacao({
          avaliacaoId: avaliacaoExistente.id,
          nota,
          comentario: comentario || undefined,
        })
      } else {
        resultado = await criarAvaliacao({
          alvo,
          nota,
          comentario: comentario || undefined,
        })
      }

      if (resultado.success) {
        setEstado('sucesso')
        setEditando(false)
        if (!avaliacaoExistente) {
          await carregarAvaliacaoExistente()
        }
      } else {
        setEstado('erro')
        setErro(resultado.error || 'Erro ao processar avaliação')
      }
    } catch {
      setEstado('erro')
      setErro('Erro inesperado. Tente novamente.')
    }
  }

  const handleRemover = async () => {
    if (!avaliacaoExistente) return

    if (!confirm('Tem a certeza que deseja remover esta avaliação?')) return

    setEstado('enviando')
    setErro('')

    const resultado = await removerAvaliacao(avaliacaoExistente.id)

    if (resultado.success) {
      setAvaliacaoExistente(null)
      setNota(0)
      setComentario('')
      setEstado('idle')
    } else {
      setEstado('erro')
      setErro(resultado.error || 'Erro ao remover avaliação')
    }
  }

  const handleEditar = () => {
    setEditando(true)
    setEstado('idle')
  }

  const handleCancelar = () => {
    if (avaliacaoExistente) {
      setNota(avaliacaoExistente.nota)
      setComentario(avaliacaoExistente.comentario || '')
    } else {
      setNota(0)
      setComentario('')
    }
    setEditando(false)
    setEstado('idle')
  }

  const renderStars = (isInteractive: boolean) => {
    return (
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Avaliação de 1 a 5 estrelas">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => isInteractive && setNota(star)}
            onMouseEnter={() => isInteractive && setHoveredStar(star)}
            onMouseLeave={() => isInteractive && setHoveredStar(0)}
            disabled={!isInteractive}
            className={cn(
              'p-1 text-2xl transition-colors duration-100',
              star <= (hoveredStar || nota) ? 'text-orange-400' : 'text-neutral-300 dark:text-neutral-600',
              isInteractive && 'hover:scale-110 active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900 rounded'
            )}
            aria-label={`${star} estrela${star > 1 ? 's' : ''}`}
            aria-pressed={star === nota}
          >
            ★
          </button>
        ))}
      </div>
    )
  }

  if (!userId) {
    return (
      <Card variant="outlined" padding="md" className={cn('space-y-4', className)}>
        <div className="space-y-2">
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Faça login para avaliar
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Apenas utilizadores autenticados podem deixar avaliações.
          </p>
        </div>
      </Card>
    )
  }

  if (avaliacaoExistente && !editando) {
    return (
      <Card variant="outlined" padding="md" className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            A sua avaliação
          </h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {renderStars(false)}
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {avaliacaoExistente.nota}/5
            </span>
          </div>

          {avaliacaoExistente.comentario && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400 italic">
              "{avaliacaoExistente.comentario}"
            </p>
          )}

          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <time dateTime={avaliacaoExistente.created_at}>
              {new Date(avaliacaoExistente.created_at).toLocaleDateString('pt-AO', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </time>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
          <Button variant="ghost" size="sm" onClick={handleEditar}>
            Editar
          </Button>
          <Button variant="ghost" size="sm" onClick={handleRemover} className="text-red-600 hover:text-red-700">
            Remover
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card variant="outlined" padding="md" className={cn('space-y-4', className)}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
          {avaliacaoExistente ? 'Editar avaliação' : 'Deixar a sua avaliação'}
        </h3>

        <div className="space-y-2">
          <label htmlFor="nota" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Nota <span className="text-orange-500">*</span>
          </label>
          <div className="flex items-center gap-3">
            {renderStars(true)}
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              {nota > 0 ? `${nota}/5` : 'Clique nas estrelas'}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="comentario" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Comentário (opcional)
          </label>
          <textarea
            id="comentario"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            maxLength={1000}
            rows={4}
            className={cn(
              'w-full px-3 py-2 text-sm border rounded-[4px] bg-white dark:bg-neutral-900',
              'border-neutral-300 dark:border-neutral-600',
              'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent',
              'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            placeholder="O que achou? A sua experiência ajuda outros utilizadores..."
            disabled={estado === 'enviando'}
          />
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span>{comentario.length}/1000</span>
          </div>
        </div>

        {erro && (
          <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-[4px]">
            {erro}
          </div>
        )}

        {estado === 'sucesso' && (
          <div className="p-3 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-[4px]">
            Avaliação {avaliacaoExistente ? 'actualizada' : 'enviada'} com sucesso!
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button
            type="submit"
            disabled={estado === 'enviando' || nota < 1}
            loading={estado === 'enviando'}
            fullWidth={!avaliacaoExistente}
          >
            {estado === 'enviando'
              ? 'A enviar...'
              : avaliacaoExistente
                ? 'Guardar alterações'
                : 'Enviar avaliação'}
          </Button>

          {avaliacaoExistente && (
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={handleCancelar}
              disabled={estado === 'enviando'}
            >
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </Card>
  )
}