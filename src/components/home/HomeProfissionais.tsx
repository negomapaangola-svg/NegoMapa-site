import { HomeSection, EstadoVazio } from './HomeSection';

export type ProfissionalHome = {
  id: string;
  nome: string;
  slug: string;
  provincia: string | null;
  municipio: string | null;
  anos_experiencia: number | null;
  avatar_url: string | null;
};

interface Props {
  profissionais: ProfissionalHome[];
  erro: boolean;
}

export function HomeProfissionais({ profissionais, erro }: Props) {
  return (
    <HomeSection
      id="home-profissionais"
      titulo="Profissionais em destaque"
      descricao="Técnicos e especialistas aprovados pela NegóMapa."
    >
      {erro ? (
        <EstadoVazio titulo="" texto="" erro />
      ) : profissionais.length === 0 ? (
        <EstadoVazio
          titulo="Ainda não há profissionais em destaque"
          texto="Os perfis aprovados aparecerão aqui."
        />
      ) : (
        <ul className="nm-grid3" aria-label="Profissionais em destaque" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {profissionais.map((p) => (
            <li key={p.id}>
              <div className="nm-card">
                <div className="nm-head">
                  <div className="nm-avatar">
                    {p.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.avatar_url} alt="" width={56} height={56} />
                    ) : (
                      <span aria-hidden="true">{p.nome.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <h3>{p.nome}</h3>
                    <p>{[p.municipio, p.provincia].filter(Boolean).join(', ') || 'Angola'}</p>
                  </div>
                </div>
                {p.anos_experiencia != null && (
                  <p>
                    {p.anos_experiencia} {p.anos_experiencia === 1 ? 'ano' : 'anos'} de experiência
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </HomeSection>
  );
}
