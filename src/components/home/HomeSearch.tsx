import { PROVINCIAS } from './constants';

export function HomeSearch() {
  return (
    <section aria-labelledby="pesquisa-titulo">
      <h2 id="pesquisa-titulo" className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
        Pesquisar serviços
      </h2>
      <form action="/servicos" method="get" role="search" className="nm-search">
        <label className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }} htmlFor="hq">
          Serviço ou categoria
        </label>
        <input
          id="hq"
          type="search"
          name="q"
          placeholder="Ex.: eletricista em Viana"
        />
        <label className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }} htmlFor="hprov">
          Província
        </label>
        <select id="hprov" name="provincia" defaultValue="">
          <option value="">Todas as províncias</option>
          {PROVINCIAS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <button type="submit" className="nm-btn nm-btn-p nm-btn-lg">
          Procurar agora
        </button>
      </form>
    </section>
  );
}
