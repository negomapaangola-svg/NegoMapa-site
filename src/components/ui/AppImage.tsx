'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface AppImageProps {
  src?: string | null;
  alt: string;
  width: number;
  height: number;
  className?: string;
  fallback?: React.ReactNode;
  priority?: boolean;
}

/**
 * Componente base para todas as imagens do NegóMapa.
 * - Usa next/image.
 * - Exige width e height para evitar layout shift.
 * - Mostra fallback quando não há imagem ou quando falha o carregamento.
 */
export function AppImage({
  src,
  alt,
  width,
  height,
  className,
  fallback,
  priority = false,
}: AppImageProps) {
  const [falhou, setFalhou] = useState(false);

  if (!src || falhou) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          'flex items-center justify-center overflow-hidden bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500',
          className
        )}
        style={{ width, height }}
      >
        {fallback ?? (
          <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        )}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      onError={() => setFalhou(true)}
    />
  );
}
