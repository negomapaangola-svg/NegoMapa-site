'use client';

import { AppImage } from './AppImage';
import { cn } from '@/lib/utils';

export interface ServiceImageProps {
  src?: string | null;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

/**
 * Imagem de serviço.
 * - Mostra a foto quando existe.
 * - Mostra um ícone neutro quando não há foto.
 */
export function ServiceImage({
  src,
  alt,
  width = 400,
  height = 300,
  className,
  priority = false,
}: ServiceImageProps) {
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
          <svg aria-hidden="true" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </span>
      }
    />
  );
}
