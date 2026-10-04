'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

interface ServiceFiltersProps {
  initialSearchParams: {
    q?: string;
    estado?: string;
  };
  estados: { value: string; label: string }[];
}

export function ServiceFilters({ initialSearchParams, estados }: ServiceFiltersProps) {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams();

    const q = formData.get('q');
    const estado = formData.get('estado');

    if (q) params.set('q', q as string);
    if (estado) params.set('estado', estado as string);

    router.push(`/admin/servicos?${params.toString()}`);
  };

  const handleClear = () => {
    router.push('/admin/servicos');
  };

  const hasActiveFilters = initialSearchParams.q || initialSearchParams.estado;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-0 md:flex md:items-end md:gap-4 flex-wrap" role="search" aria-label="Filtros de serviços">
      <div className="md:flex-1 min-w-[200px]">
        <label htmlFor="q" className="sr-only">Buscar serviços</label>
        <input
          type="search"
          id="q"
          name="q"
          defaultValue={initialSearchParams.q || ''}
          placeholder="Buscar por título ou profissional..."
          className="w-full px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
        />
      </div>

      <div className="md:w-[180px]">
        <label htmlFor="estado" className="block text-sm font-medium text-ink dark:text-cream-text mb-1">
          Estado
        </label>
        <select
          id="estado"
          name="estado"
          defaultValue={initialSearchParams.estado || ''}
          className="w-full px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
        >
          {estados.map((est) => (
            <option key={est.value} value={est.value}>{est.label}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" size="sm">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 18a9 9 0 009-9 9 9 0 00-9 9 9 9 0 009 9z" />
          </svg>
          Filtrar
        </Button>
        {hasActiveFilters && (
          <Button type="button" variant="outline" size="sm" onClick={handleClear}>
            Limpar
          </Button>
        )}
      </div>
    </form>
  );
}