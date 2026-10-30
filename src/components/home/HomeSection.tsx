import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface HomeSectionProps {
  id: string;
  titulo: string;
  descricao?: string;
  children: ReactNode;
  className?: string;
}

export function HomeSection({ id, titulo, descricao, children, className }: HomeSectionProps) {
  return (
    <section className={cn('mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16', className)} aria-labelledby={id}>
      <div className="mb-8 max-w-2xl">
        <h2 id={id} className="text-2xl sm:text-3xl font-bold tracking-tight text-ink dark:text-cream">
          {titulo}
        </h2>
        {descricao && (
          <p className="mt-2 text-neutral-600 dark:text-cream-text">{descricao}</p>
        )}
      </div>
      {children}
    </section>
  );
}

interface EstadoVazioProps {
  titulo: string;
  texto: string;
  erro?: boolean;
  children?: ReactNode;
}

/** Estado vazio explícito: não substitui dados por exemplos. */
export function EstadoVazio({ titulo, texto, erro, children }: EstadoVazioProps) {
  return (
    <div
      role="status"
      className="liquid-glass-card rounded-[4px] p-6 sm:p-8 text-center"
    >
      <p className="font-semibold text-ink dark:text-cream">
        {erro ? 'Não foi possível carregar esta secção' : titulo}
      </p>
      <p className="mt-2 text-sm text-neutral-600 dark:text-cream-text">
        {erro ? 'Tente novamente dentro de instantes.' : texto}
      </p>
      {children && <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  );
}
