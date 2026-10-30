import Link from 'next/link';
import { HomeSection, EstadoVazio } from './HomeSection';
import type { Perfil } from './constants';

export type VagaHome = {
  id: string;
  titulo: string;
  slug: string;
  categoria: string;
  provincia: string;
  municipio: string | null;
  tipo_contrato: string | null;
  company: { name: string }[] | { name: string } | null;
};

interface Props {
  perfil: Perfil;
  vagas: VagaHome[];
  erro: boolean;
}

function nomeEmpresa(company: VagaHome['company']) {
  if (!company) return 'Empresa';
  return Array.isArray(company) ? company[0]?.name ?? 'Empresa' : company.name;
}

export function HomeVagas({ perfil, vagas, erro }: Props) {
  const descricao = 'Oportunidades de emprego publicadas por empresas aprovadas.';

  // Visitante: não vê vagas (regra de acesso do prompt B.6.15).
  if (perfil === 'visitante') {
    return (
      <HomeSection id="home-vagas" titulo="Vagas de emprego" descricao={descricao}>
        <EstadoVazio
          titulo="As vagas são para profissionais registados"
          texto="Entre ou crie uma conta de profissional para ver as vagas disponíveis em Angola."
        >
          <Link href="/login?redirectTo=/" className="nm-btn nm-btn-p">Entrar</Link>
          <Link href="/editar-perfil" className="nm-btn nm-btn-g">Tornar-me profissional</Link>
        </EstadoVazio>
      </HomeSection>
    );
  }

  if (perfil === 'empresa') {
    return (
      <HomeSection id="home-vagas" titulo="Vagas de emprego" descricao="Publique vagas para profissionais de todas as províncias.">
        <EstadoVazio
          titulo="Publique a sua primeira vaga"
          texto="As vagas só aparecem publicamente depois de aprovadas pela moderação."
        >
          <Link href="/empresa/painel/vagas/nova" className="nm-btn nm-btn-p">Publicar vaga</Link>
          <Link href="/empresa/painel/vagas" className="nm-btn nm-btn-g">Gerir as minhas vagas</Link>
        </EstadoVazio>
      </HomeSection>
    );
  }

  // Profissional autenticado
  return (
    <HomeSection id="home-vagas" titulo="Vagas de emprego" descricao={descricao}>
      {erro ? (
        <EstadoVazio titulo="" texto="" erro />
      ) : vagas.length === 0 ? (
        <EstadoVazio titulo="Não há vagas publicadas de momento" texto="Volte mais tarde ou consulte todas as vagas.">
          <Link href="/vagas" className="nm-btn nm-btn-g">Ver todas as vagas</Link>
        </EstadoVazio>
      ) : (
        <>
          <ul className="nm-grid3" aria-label="Vagas em destaque" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {vagas.map((v) => (
              <li key={v.id}>
                <Link href={`/vaga/${v.slug}`} className="nm-card">
                  <h3>{v.titulo}</h3>
                  <p>
                    {nomeEmpresa(v.company)} · {[v.municipio, v.provincia].filter(Boolean).join(', ')}
                  </p>
                  <p>{[v.categoria, v.tipo_contrato].filter(Boolean).join(' · ')}</p>
                </Link>
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Link href="/vagas" className="nm-btn nm-btn-g">Ver todas as vagas</Link>
          </div>
        </>
      )}
    </HomeSection>
  );
}
