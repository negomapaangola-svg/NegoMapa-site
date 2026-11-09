import { PROVINCIAS } from './constants';

export function HomeSearch() {
  return (
    <section className="nm-search-section" aria-labelledby="pesquisa-titulo">
      <h2 id="pesquisa-titulo" className="sr-only">Pesquisar serviços</h2>
      <form action="/servicos" method="get" role="search" className="nm-search">
        <label className="sr-only" htmlFor="hq">Serviço ou categoria</label>
        <input
          id="hq"
          type="search"
          name="q"
          placeholder="Que serviço procura?"
        />
        <label className="sr-only" htmlFor="hprov">Província</label>
        <select id="hprov" name="provincia" defaultValue="">
          <option value="">Todas as províncias</option>
          {PROVINCIAS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <button type="submit" className="nm-btn nm-btn-p nm-btn-lg">
          Pesquisar
        </button>
      </form>
    </section>
  );
}
