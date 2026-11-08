'use client';

import { AppImage } from './AppImage';
import { cn } from '@/lib/utils';

export interface HeroImageProps {
  src?: string | null;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

/**
 * Imagem do hero na página inicial.
 * - Usa priority por defeito, pois está na primeira dobra.
 * - Mostra um placeholder neutro quando não há imagem.
 */
export function HeroImage({
  src,
  alt,
  width = 800,
  height = 600,
  className,
  priority = true,
}: HeroImageProps) {
  return (
    <AppImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={cn('object-cover', className)}
      fallback={
        <span className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500">
          <svg aria-hidden="true" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </span>
      }
    />
  );
}
