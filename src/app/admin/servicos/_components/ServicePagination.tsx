'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

interface ServicePaginationProps {
  currentPage: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}

export function ServicePagination({ currentPage, totalPages, searchParams }: ServicePaginationProps) {
  const router = useRouter();

  if (totalPages <= 1) return null;

  const params = new URLSearchParams(searchParams as Record<string, string>);
  params.delete('page');

  const navigate = (page: number) => {
    const newParams = new URLSearchParams(searchParams as Record<string, string>);
    newParams.set('page', page.toString());
    router.push(`/admin/servicos?${newParams.toString()}`);
  };

  return (
    <nav className="flex items-center justify-center gap-2 mt-8" aria-label="Paginação">
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === 1}
        onClick={() => navigate(currentPage - 1)}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Anterior
      </Button>

      <div className="flex items-center gap-1" role="list" aria-label="Páginas">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
          if (
            page === 1 ||
            page === totalPages ||
            (page >= currentPage - 1 && page <= currentPage + 1)
          ) {
            return (
              <Button
                key={page}
                variant={page === currentPage ? 'primary' : 'outline'}
                size="sm"
                onClick={() => navigate(page)}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </Button>
            );
          }
          if (
            page === currentPage - 2 ||
            page === currentPage + 2
          ) {
            return <span key={page} className="px-2 text-neutral-400">…</span>;
          }
          return null;
        })}
      </div>

      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === totalPages}
        onClick={() => navigate(currentPage + 1)}
      >
        Próxima
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Button>
    </nav>
  );
}