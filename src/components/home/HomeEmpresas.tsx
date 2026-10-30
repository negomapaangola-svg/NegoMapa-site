import Link from 'next/link';
import { HomeSection, EstadoVazio } from './HomeSection';

export type EmpresaHome = {
  id: string;
  name: string;
  slug: string;
  sector: string | null;
  province: string | null;
  city: string | null;
};

interface Props {
  empresas: EmpresaHome[];
  erro: boolean;
}

export function HomeEmpresas({ empresas, erro }: Props) {
  return (
    <HomeSection
      id="home-empresas"
      titulo="Empresas em destaque"
      descricao="Empresas aprovadas em Angola e os seus setores de atuação."
    >
      {erro ? (
        <EstadoVazio titulo="" texto="" erro />
      ) : empresas.length === 0 ? (
        <EstadoVazio
          titulo="Ainda não há empresas em destaque"
          texto="As empresas aprovadas aparecerão aqui."
        />
      ) : (
        <ul className="nm-grid3" aria-label="Empresas em destaque" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {empresas.map((e) => (
            <li key={e.id}>
              <Link href={`/empresa/${e.slug}`} className="nm-card">
                <h3>{e.name}</h3>
                <p>{[e.sector, e.city || e.province].filter(Boolean).join(' · ') || 'Angola'}</p>
                <span className="nm-go">Ver empresa →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="nm-foot-note">
        Produtos das empresas: ainda sem listagem pública. Aparecerão aqui quando a funcionalidade estiver disponível.
      </p>
    </HomeSection>
  );
}
