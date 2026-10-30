import Link from 'next/link';
import { HomeSection, EstadoVazio } from './HomeSection';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
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
          <Button asChild>
            <Link href="/login?redirectTo=/">Entrar</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/editar-perfil">Tornar-me profissional</Link>
          </Button>
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
          <Button asChild>
            <Link href="/empresa/painel/vagas/nova">Publicar vaga</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/empresa/painel/vagas">Gerir as minhas vagas</Link>
          </Button>
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
        <EstadoVazio
          titulo="Não há vagas publicadas de momento"
          texto="Volte mais tarde ou consulte todas as vagas."
        >
          <Button variant="outline" asChild>
            <Link href="/vagas">Ver todas as vagas</Link>
          </Button>
        </EstadoVazio>
      ) : (
        <>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-label="Vagas em destaque">
            {vagas.map((v) => (
              <li key={v.id}>
                <Link href={`/vaga/${v.slug}`} className="block h-full">
                  <Card variant="liquid" padding="lg" hover className="h-full">
                    <CardHeader>
                      <CardTitle>{v.titulo}</CardTitle>
                      <CardDescription>
                        {nomeEmpresa(v.company)} · {[v.municipio, v.provincia].filter(Boolean).join(', ')}
                      </CardDescription>
                    </CardHeader>
                    <p className="text-sm text-neutral-600 dark:text-cream-text">
                      {[v.categoria, v.tipo_contrato].filter(Boolean).join(' · ')}
                    </p>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-8 text-center">
            <Button variant="outline" asChild>
              <Link href="/vagas">Ver todas as vagas</Link>
            </Button>
          </div>
        </>
      )}
    </HomeSection>
  );
}
