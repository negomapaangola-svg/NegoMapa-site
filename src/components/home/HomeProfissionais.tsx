import Link from 'next/link';
import { HomeSection, EstadoVazio } from './HomeSection';
import { Avatar } from '@/components/ui/Avatar';
import { IMAGENS } from '@/lib/imagens';

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
          titulo="Ainda não há profissionais disponíveis nesta província"
          texto="Os perfis aprovados aparecerão aqui."
          imagem={IMAGENS.estadoVazio.profissionais}
          acao={
            <Link href="/profissionais" className="nm-btn nm-btn-g">
              Procurar noutra província
            </Link>
          }
        />
      ) : (
        <ul className="nm-grid3" aria-label="Profissionais em destaque" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {profissionais.map((p) => (
            <li key={p.id}>
              <div className="nm-card">
                <div className="nm-head">
                  <Avatar
                    src={p.avatar_url}
                    alt={`Foto de ${p.nome}`}
                    name={p.nome}
                    width={56}
                    height={56}
                    className="nm-avatar"
                  />
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
