'use client';

import { AppImage } from './AppImage';
import { cn } from '@/lib/utils';

export interface AvatarProps {
  src?: string | null;
  alt: string;
  name?: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

function iniciais(nome?: string) {
  if (!nome) return '?';
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? '';
  const segunda = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + segunda).toUpperCase();
}

/**
 * Avatar de profissional.
 * - Mostra a foto quando existe.
 * - Mostra iniciais quando não há foto.
 */
export function Avatar({
  src,
  alt,
  name,
  width = 48,
  height = 48,
  className,
  priority = false,
}: AvatarProps) {
  return (
    <AppImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={cn('rounded-full object-cover', className)}
      fallback={
        <span className="flex h-full w-full items-center justify-center bg-orange-50 font-heading text-sm font-bold text-orange-600 dark:bg-orange-950/30 dark:text-orange-300">
          {iniciais(name)}
        </span>
      }
    />
  );
}
