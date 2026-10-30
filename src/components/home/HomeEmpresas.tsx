import Link from 'next/link';
import { HomeSection, EstadoVazio } from './HomeSection';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

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
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-label="Empresas em destaque">
          {empresas.map((e) => (
            <li key={e.id}>
              <Link href={`/empresa/${e.slug}`} className="block h-full">
                <Card variant="liquid" padding="lg" hover className="h-full">
                  <CardHeader>
                    <CardTitle>{e.name}</CardTitle>
                    <CardDescription>
                      {[e.sector, e.city || e.province].filter(Boolean).join(' · ') || 'Angola'}
                    </CardDescription>
                  </CardHeader>
                  <span className="text-sm font-medium text-orange-600 dark:text-orange-400">Ver empresa →</span>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-6 text-sm text-neutral-600 dark:text-cream-text">
        Produtos das empresas: ainda sem listagem pública. Aparecerão aqui quando a funcionalidade estiver disponível.
      </p>
    </HomeSection>
  );
}
