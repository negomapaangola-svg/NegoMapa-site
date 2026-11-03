import Link from 'next/link';
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

const campo =
  'w-full px-3 py-2 border border-card-border rounded-[4px] shadow-sm bg-white text-ink focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream';

/** Filtros por GET: título do serviço ou nome do profissional, categoria, província e município. */
export function FiltersForm({ initialSearchParams, categorias, provincias, municipios }: FiltersFormProps) {
  const hasActiveFilters = Boolean(
    initialSearchParams.q ||
      initialSearchParams.categoria ||
      initialSearchParams.provincia ||
      initialSearchParams.municipio
  );

  return (
    <form method="get" action="/servicos" role="search" aria-label="Filtros de serviços" className="grid grid-cols-1 gap-4 md:grid-cols-4">
      <div className="md:col-span-2">
        <label htmlFor="q" className="block text-sm font-medium text-ink dark:text-cream-text mb-1">
          Pesquisar
        </label>
        <input
          type="search"
          id="q"
          name="q"
          defaultValue={initialSearchParams.q || ''}
          placeholder="Título do serviço ou nome do profissional"
          className={campo}
        />
      </div>

      <div>
        <label htmlFor="categoria" className="block text-sm font-medium text-ink dark:text-cream-text mb-1">
          Categoria
        </label>
        <select id="categoria" name="categoria" defaultValue={initialSearchParams.categoria || ''} className={campo}>
          <option value="">Todas as categorias</option>
          {categorias.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {cat.nome}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="provincia" className="block text-sm font-medium text-ink dark:text-cream-text mb-1">
          Província
        </label>
        <select id="provincia" name="provincia" defaultValue={initialSearchParams.provincia || ''} className={campo}>
          <option value="">Todas as províncias</option>
          {provincias.map((prov) => (
            <option key={prov} value={prov}>
              {prov}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="municipio" className="block text-sm font-medium text-ink dark:text-cream-text mb-1">
          Município
        </label>
        <select id="municipio" name="municipio" defaultValue={initialSearchParams.municipio || ''} className={campo}>
          <option value="">Todos os municípios</option>
          {municipios.map((mun) => (
            <option key={mun} value={mun}>
              {mun}
            </option>
          ))}
        </select>
      </div>

      <div className="md:col-span-4 flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" size="sm">
          Filtrar
        </Button>
        {hasActiveFilters && (
          <Link href="/servicos" className="text-sm text-neutral-600 dark:text-cream-text hover:underline">
            Limpar filtros
          </Link>
        )}
      </div>
    </form>
  );
}
