import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface FiltrosProfissionaisProps {
  q: string;
  categoria: string;
  provincia: string;
  categorias: string[];
  provincias: string[];
}

const campo =
  'w-full px-3 py-2 border border-card-border rounded-[4px] shadow-sm bg-white text-ink focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream';

/** Filtros simples por GET (nome, categoria, província). Funcionam sem JavaScript. */
export function FiltrosProfissionais({
  q,
  categoria,
  provincia,
  categorias,
  provincias,
}: FiltrosProfissionaisProps) {
  const temFiltros = Boolean(q || categoria || provincia);

  return (
    <form method="get" action="/profissionais" role="search" className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
      <div className="md:col-span-2">
        <label htmlFor="filtro-q" className="block text-sm font-medium text-ink dark:text-cream-text mb-1">
          Pesquisar
        </label>
        <input
          id="filtro-q"
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Nome, categoria ou província"
          className={campo}
        />
      </div>

      <div>
        <label htmlFor="filtro-categoria" className="block text-sm font-medium text-ink dark:text-cream-text mb-1">
          Categoria
        </label>
        <select id="filtro-categoria" name="categoria" defaultValue={categoria} className={campo}>
          <option value="">Todas as categorias</option>
          {categorias.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="filtro-provincia" className="block text-sm font-medium text-ink dark:text-cream-text mb-1">
          Província
        </label>
        <select id="filtro-provincia" name="provincia" defaultValue={provincia} className={campo}>
          <option value="">Todas as províncias</option>
          {provincias.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="md:col-span-4 flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" size="sm">
          Filtrar
        </Button>
        {temFiltros && (
          <Link href="/profissionais" className="text-sm text-neutral-600 dark:text-cream-text hover:underline">
            Limpar filtros
          </Link>
        )}
      </div>
    </form>
  );
}
