import Link from 'next/link';
import { hrefDescobrir, type ParamsDescobrir } from '@/lib/descobrir/params';

/** Separadores Serviços | Produtos. Produtos fica desactivado nesta fase. */
export function SeparadoresTipo({ params }: { params: ParamsDescobrir }) {
  return (
    <nav aria-label="Tipo de resultados" className="mt-6 flex flex-wrap items-center gap-x-2 border-b border-card-border">
      <Link
        href={hrefDescobrir(params)}
        aria-current="page"
        className="inline-flex min-h-[44px] items-center border-b-2 border-orange-500 px-4 font-bold text-ink dark:text-cream"
      >
        Serviços
      </Link>
      <button
        type="button"
        disabled
        aria-describedby="produtos-em-breve"
        className="inline-flex min-h-[44px] cursor-not-allowed items-center border-b-2 border-transparent px-4 font-medium text-neutral-400 dark:text-neutral-500"
      >
        Produtos
      </button>
      <span id="produtos-em-breve" className="text-sm text-neutral-500 dark:text-cream-text/70">
        Produtos em breve.
      </span>
    </nav>
  );
}
