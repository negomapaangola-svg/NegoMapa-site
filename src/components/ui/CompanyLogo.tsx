'use client';

import { AppImage } from './AppImage';
import { cn } from '@/lib/utils';

export interface CompanyLogoProps {
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
 * Logótipo de empresa.
 * - Mostra o logótipo quando existe.
 * - Mostra iniciais quando não há logótipo.
 */
export function CompanyLogo({
  src,
  alt,
  name,
  width = 48,
  height = 48,
  className,
  priority = false,
}: CompanyLogoProps) {
  return (
    <AppImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={cn('rounded-lg object-contain', className)}
      fallback={
        <span className="flex h-full w-full items-center justify-center bg-neutral-100 font-heading text-sm font-bold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
          {iniciais(name)}
        </span>
      }
    />
  );
}
