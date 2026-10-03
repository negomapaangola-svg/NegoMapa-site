'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';

interface FiltersFormProps {
  initialSearchParams: {
    q?: string;
    categoria?: string;
    provincia?: string;
    municipio?: string;
  };
  categorias: { id: string; nome: string; slug: string }[];
  provincias: string[];
  municipios: string[];
}

export function FiltersForm({ initialSearchParams, categorias, provincias, municipios }: FiltersFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams();

    const q = formData.get('q');
    const categoria = formData.get('categoria');
    const provincia = formData.get('provincia');
    const municipio = formData.get('municipio');

    if (q) params.set('q', q as string);
    if (categoria) params.set('categoria', categoria as string);
    if (provincia) params.set('provincia', provincia as string);
    if (municipio) params.set('municipio', municipio as string);

    router.push(`/servicos?${params.toString()}`);
  };

  const handleClear = () => {
    router.push('/servicos');
  };

  const hasActiveFilters = initialSearchParams.q || initialSearchParams.categoria || initialSearchParams.provincia || initialSearchParams.municipio;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-0 md:flex md:items-end md:gap-4 flex-wrap" role="search" aria-label="Filtros de serviços">
      <div className="md:flex-1 min-w-[200px]">
        <label htmlFor="q" className="sr-only">Buscar serviços</label>
        <input
          type="search"
          id="q"
          name="q"
          defaultValue={initialSearchParams.q || ''}
          placeholder="Buscar por título..."
          className="w-full px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
        />
      </div>

      <div className="md:w-[180px]">
        <label htmlFor="categoria" className="block text-sm font-medium text-ink dark:text-cream-text mb-1">
          Categoria
        </label>
        <select
          id="categoria"
          name="categoria"
          defaultValue={initialSearchParams.categoria || ''}
          className="w-full px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
        >
          <option value="">Todas as categorias</option>
          {categorias.map((cat) => (
            <option key={cat.id} value={cat.slug}>{cat.nome}</option>
          ))}
        </select>
      </div>

      <div className="md:w-[180px]">
        <label htmlFor="provincia" className="block text-sm font-medium text-ink dark:text-cream-text mb-1">
          Província
        </label>
        <select
          id="provincia"
          name="provincia"
          defaultValue={initialSearchParams.provincia || ''}
          className="w-full px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
        >
          <option value="">Todas as províncias</option>
          {provincias.map((prov) => (
            <option key={prov} value={prov}>{prov}</option>
          ))}
        </select>
      </div>

      <div className="md:w-[180px]">
        <label htmlFor="municipio" className="block text-sm font-medium text-ink dark:text-cream-text mb-1">
          Município
        </label>
        <select
          id="municipio"
          name="municipio"
          defaultValue={initialSearchParams.municipio || ''}
          className="w-full px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
        >
          <option value="">Todos os municípios</option>
          {municipios.map((mun) => (
            <option key={mun} value={mun}>{mun}</option>
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