'use client';

import { AppImage } from './AppImage';
import { cn } from '@/lib/utils';

export interface EmptyStateImageProps {
  src?: string | null;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

/**
 * Ilustração para estados vazios.
 * - Mostra a ilustração quando existe.
 * - Mostra um placeholder neutro quando não há ilustração.
 */
export function EmptyStateImage({
  src,
  alt,
  width = 240,
  height = 180,
  className,
  priority = false,
}: EmptyStateImageProps) {
  return (
    <AppImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={cn('object-contain', className)}
      fallback={
        <span className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500">
          <svg aria-hidden="true" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </span>
      }
    />
  );
}
