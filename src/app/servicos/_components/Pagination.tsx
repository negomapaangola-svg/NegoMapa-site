import Link from 'next/link';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}

const botao =
  'inline-flex items-center justify-center gap-1.5 rounded-[4px] border-2 border-orange-500 px-3 py-1.5 text-sm font-bold text-orange-500 hover:bg-orange-50 dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-900/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500';

const botaoAtivo =
  'inline-flex items-center justify-center rounded-[4px] border-2 border-orange-500 bg-orange-500 px-3 py-1.5 text-sm font-bold text-ink';

const botaoDesativado =
  'inline-flex items-center justify-center gap-1.5 rounded-[4px] border-2 border-card-border px-3 py-1.5 text-sm font-bold text-neutral-400 opacity-60';

/** Paginação por links GET. Preserva os filtros atuais (q, categoria, provincia, municipio). */
export function Pagination({ currentPage, totalPages, searchParams }: PaginationProps) {
  if (totalPages <= 1) return null;

  const hrefPagina = (page: number) => {
    const params = new URLSearchParams();
    for (const [chave, valor] of Object.entries(searchParams)) {
      if (chave !== 'page' && valor) params.set(chave, valor);
    }
    if (page > 1) params.set('page', String(page));
    const query = params.toString();
    return query ? `/servicos?${query}` : '/servicos';
  };

  return (
    <nav className="flex items-center justify-center gap-2 mt-8" aria-label="Paginação">
      {currentPage > 1 ? (
        <Link href={hrefPagina(currentPage - 1)} className={botao}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Anterior
        </Link>
      ) : (
        <span aria-disabled="true" className={botaoDesativado}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Anterior
        </span>
      )}

      <div className="flex items-center gap-1" role="list" aria-label="Páginas">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
          if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
            return page === currentPage ? (
              <span key={page} role="listitem" aria-current="page" className={botaoAtivo}>
                {page}
              </span>
            ) : (
              <Link key={page} href={hrefPagina(page)} role="listitem" className={botao}>
                {page}
              </Link>
            );
          }
          if (page === currentPage - 2 || page === currentPage + 2) {
            return (
              <span key={page} className="px-2 text-neutral-400">
                …
              </span>
            );
          }
          return null;
        })}
      </div>

      {currentPage < totalPages ? (
        <Link href={hrefPagina(currentPage + 1)} className={botao}>
          Próxima
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      ) : (
        <span aria-disabled="true" className={botaoDesativado}>
          Próxima
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      )}
    </nav>
  );
}
