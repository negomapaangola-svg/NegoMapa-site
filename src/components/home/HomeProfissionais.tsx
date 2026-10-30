import { HomeSection, EstadoVazio } from './HomeSection';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

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
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-label="Profissionais em destaque">
          {profissionais.map((p) => (
            <li key={p.id}>
              <Card variant="liquid" padding="lg" className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    {p.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" width={48} height={48} />
                    ) : (
                      <span className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 font-bold" aria-hidden="true">
                        {p.nome.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div>
                      <CardTitle>{p.nome}</CardTitle>
                      <CardDescription>
                        {[p.municipio, p.provincia].filter(Boolean).join(', ') || 'Angola'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                {p.anos_experiencia != null && (
                  <p className="text-sm text-neutral-600 dark:text-cream-text">
                    {p.anos_experiencia} {p.anos_experiencia === 1 ? 'ano' : 'anos'} de experiência
                  </p>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </HomeSection>
  );
}
