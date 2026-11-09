import Link from 'next/link';
import { hrefDescobrir, type ParamsDescobrir } from '@/lib/descobrir/params';

const botao =
  'inline-flex min-h-[44px] items-center justify-center rounded-[4px] border-2 border-orange-500 px-4 text-sm font-bold text-orange-600 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-orange-400 dark:text-orange-300 dark:hover:bg-orange-900/20';

const botaoDesativado =
  'inline-flex min-h-[44px] items-center justify-center rounded-[4px] border-2 border-card-border px-4 text-sm font-bold text-neutral-400 opacity-60 dark:text-neutral-500';

/** Paginação por links. Mantém todos os filtros e o separador activo. */
export function PaginacaoDescobrir({ params, totalPaginas }: { params: ParamsDescobrir; totalPaginas: number }) {
  if (totalPaginas <= 1) return null;

  const temAnterior = params.pagina > 1;
  const temSeguinte = params.pagina < totalPaginas;

  return (
    <nav aria-label="Paginação" className="mt-10 flex flex-wrap items-center justify-center gap-3">
      {temAnterior ? (
        <Link href={hrefDescobrir(params, { pagina: params.pagina - 1 })} className={botao}>
          <span aria-hidden="true" className="mr-1">←</span> Anterior
        </Link>
      ) : (
        <span aria-disabled="true" className={botaoDesativado}>
          <span aria-hidden="true" className="mr-1">←</span> Anterior
        </span>
      )}

      <span className="text-sm text-neutral-600 dark:text-cream-text">
        Página {params.pagina} de {totalPaginas}
      </span>

      {temSeguinte ? (
        <Link href={hrefDescobrir(params, { pagina: params.pagina + 1 })} className={botao}>
          Seguinte <span aria-hidden="true" className="ml-1">→</span>
        </Link>
      ) : (
        <span aria-disabled="true" className={botaoDesativado}>
          Seguinte <span aria-hidden="true" className="ml-1">→</span>
        </span>
      )}
    </nav>
  );
}
