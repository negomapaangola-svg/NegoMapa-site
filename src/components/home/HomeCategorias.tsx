import Link from 'next/link';
import { HomeSection, EstadoVazio } from './HomeSection';
import { formatCurrency } from '@/lib/utils';

export type CategoriaHome = { id: string; nome: string; slug: string };
export type ServicoHome = {
  id: string;
  titulo: string;
  slug: string;
  preco: number | null;
  preco_tipo: string | null;
  provincia: string | null;
  municipio: string | null;
};

interface Props {
  categorias: CategoriaHome[];
  servicos: ServicoHome[];
  erroCategorias: boolean;
  erroServicos: boolean;
}

export function HomeCategorias({ categorias, servicos, erroCategorias, erroServicos }: Props) {
  return (
    <HomeSection
      id="home-categorias"
      titulo="Categorias e serviços"
      descricao="Escolha uma categoria ou veja os serviços publicados pelos profissionais."
    >
      {erroCategorias ? (
        <EstadoVazio titulo="" texto="" erro />
      ) : categorias.length === 0 ? (
        <EstadoVazio
          titulo="Ainda não há categorias ativas"
          texto="As categorias aparecerão aqui assim que forem publicadas."
        />
      ) : (
        <ul className="nm-chips" aria-label="Categorias" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {categorias.map((c) => (
            <li key={c.id}>
              <Link href={`/servicos?categoria=${encodeURIComponent(c.slug)}`} className="nm-chip">
                {c.nome}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div style={{ marginTop: 28 }}>
        <h3 style={{ marginBottom: 12 }}>Serviços recentes</h3>
        {erroServicos ? (
          <EstadoVazio titulo="" texto="" erro />
        ) : servicos.length === 0 ? (
          <EstadoVazio
            titulo="Ainda não há serviços publicados"
            texto="Os serviços aprovados pelos profissionais aparecerão aqui."
          />
        ) : (
          <ul className="nm-grid3" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {servicos.map((s) => (
              <li key={s.id}>
                <Link href={`/servico/${s.slug}`} className="nm-card">
                  <h3>{s.titulo}</h3>
                  <p>{[s.municipio, s.provincia].filter(Boolean).join(', ') || 'Angola'}</p>
                  <p className="nm-price">
                    {s.preco != null ? formatCurrency(s.preco) : 'Preço a combinar'}
                    {s.preco != null && s.preco_tipo ? ` · ${s.preco_tipo}` : ''}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </HomeSection>
  );
}
