import Link from 'next/link';
import { hrefDescobrir, type ParamsDescobrir } from '@/lib/descobrir/params';

interface PaginacaoDescobrirProps {
  params: ParamsDescobrir;
  totalPaginas: number;
}

const botao =
  'inline-flex min-h-[44px] items-center justify-center rounded-[4px] border border-orange-500 px-3 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-orange-400 dark:text-orange-300 dark:hover:bg-orange-900/20';
const botaoActivo =
  'inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[4px] border border-orange-500 bg-orange-500 px-3 py-2 text-sm font-bold text-ink';
const botaoDesactivado =
  'inline-flex min-h-[44px] items-center justify-center rounded-[4px] border border-card-border px-3 py-2 text-sm font-semibold text-neutral-400 opacity-60';

export function PaginacaoDescobrir({ params, totalPaginas }: PaginacaoDescobrirProps) {
  if (totalPaginas <= 1) return null;

  const paginaActual = params.pagina;
  const paginas = Array.from({ length: totalPaginas }, (_, indice) => indice + 1).filter(
    (pagina) =>
      pagina === 1 ||
      pagina === totalPaginas ||
      (pagina >= paginaActual - 1 && pagina <= paginaActual + 1),
  );

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Paginação dos resultados">
      {paginaActual > 1 ? (
        <Link href={hrefDescobrir(params, { pagina: paginaActual - 1 })} className={botao}>
          Anterior
        </Link>
      ) : (
        <span aria-disabled="true" className={botaoDesactivado}>Anterior</span>
      )}

      <div className="flex flex-wrap items-center gap-1" aria-label="Páginas">
        {paginas.map((pagina, indice) => {
          const anterior = paginas[indice - 1];
          return (
            <span key={pagina} className="contents">
              {anterior !== undefined && pagina - anterior > 1 && (
                <span aria-hidden="true" className="px-1 text-neutral-500">…</span>
              )}
              {pagina === paginaActual ? (
                <span aria-current="page" className={botaoActivo}>{pagina}</span>
              ) : (
                <Link href={hrefDescobrir(params, { pagina })} className={botao} aria-label={`Ir para a página ${pagina}`}>
                  {pagina}
                </Link>
              )}
            </span>
          );
        })}
      </div>

      {paginaActual < totalPaginas ? (
        <Link href={hrefDescobrir(params, { pagina: paginaActual + 1 })} className={botao}>
          Próxima
        </Link>
      ) : (
        <span aria-disabled="true" className={botaoDesactivado}>Próxima</span>
      )}
    </nav>
  );
}
