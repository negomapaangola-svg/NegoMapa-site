'use client'

import { cn } from '@/lib/utils'

type RatingProps = {
  media: number
  total: number
  size?: 'sm' | 'md' | 'lg'
  showTotal?: boolean
  className?: string
}

export function Rating({ media, total, size = 'md', showTotal = true, className }: RatingProps) {
  const starSize = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  }[size]

  const getStarFill = (star: number): 'full' | 'half' | 'empty' => {
    if (media >= star) return 'full'
    if (media >= star - 0.5) return 'half'
    return 'empty'
  }

  if (total === 0) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <span className={cn('text-neutral-500 dark:text-neutral-400', starSize)}>
          {'★'.repeat(5)}
        </span>
        {showTotal && (
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            Sem avaliações
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center gap-0.5" role="img" aria-label={`Avaliação média de ${media.toFixed(1)} de 5 estrelas, baseada em ${total} avaliação${total > 1 ? 'ões' : ''}`}>
        {[1, 2, 3, 4, 5].map((star) => {
          const fill = getStarFill(star)
          return (
            <span
              key={star}
              className={cn(starSize, 'select-none')}
              aria-hidden="true"
            >
              {fill === 'full' && '★'}
              {fill === 'half' && '⯨'}
              {fill === 'empty' && '☆'}
            </span>
          )
        })}
      </div>

      <div className="flex items-center gap-1">
        <span className={cn('font-semibold', size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg', 'text-neutral-900 dark:text-neutral-50')}>
          {media.toFixed(1)}
        </span>
        {showTotal && (
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            ({total} avaliação{total > 1 ? 'ões' : ''})
          </span>
        )}
      </div>
    </div>
  )
}

export function RatingStarsOnly({ media, size = 'md', className }: { media: number; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const starSize = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  }[size]

  const getStarFill = (star: number): 'full' | 'half' | 'empty' => {
    if (media >= star) return 'full'
    if (media >= star - 0.5) return 'half'
    return 'empty'
  }

  return (
    <div className={cn('flex items-center gap-0.5', className)} role="img" aria-label={`Avaliação de ${media.toFixed(1)} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = getStarFill(star)
        return (
          <span
            key={star}
            className={cn(starSize, 'select-none')}
            aria-hidden="true"
          >
            {fill === 'full' && '★'}
            {fill === 'half' && '⯨'}
            {fill === 'empty' && '☆'}
          </span>
        )
      })}
    </div>
  )
}