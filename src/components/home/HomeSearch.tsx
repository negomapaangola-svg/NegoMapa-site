import { PROVINCIAS } from './constants';
import { Button } from '@/components/ui/Button';

/** Pesquisa sem JavaScript: envia para /servicos com os parâmetros q e provincia. */
export function HomeSearch() {
  return (
    <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8" aria-labelledby="pesquisa-titulo">
      <h2 id="pesquisa-titulo" className="sr-only">Pesquisar serviços</h2>
      <form
        action="/servicos"
        method="get"
        role="search"
        className="liquid-glass-card rounded-[4px] p-4 sm:p-5 grid grid-cols-1 md:grid-cols-[1fr_200px_auto] gap-3"
      >
        <label className="flex flex-col gap-1 text-sm font-medium text-ink dark:text-cream">
          Serviço ou categoria
          <input
            type="search"
            name="q"
            placeholder="Ex.: eletricista, restauração, design"
            className="rounded-[4px] border border-card-border bg-white dark:bg-neutral-900 px-3 py-2 text-ink dark:text-cream focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-ink dark:text-cream">
          Província
          <select
            name="provincia"
            defaultValue=""
            className="rounded-[4px] border border-card-border bg-white dark:bg-neutral-900 px-3 py-2 text-ink dark:text-cream focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Todas as províncias</option>
            {PROVINCIAS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <Button type="submit" size="lg" className="w-full md:w-auto">Pesquisar</Button>
        </div>
      </form>
    </section>
  );
}
