import Link from 'next/link';
import { HomeSection, EstadoVazio } from './HomeSection';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
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
        <ul className="flex flex-wrap gap-2" aria-label="Categorias">
          {categorias.map((c) => (
            <li key={c.id}>
              <Link
                href={`/servicos?categoria=${encodeURIComponent(c.slug)}`}
                className="inline-block rounded-full border border-card-border px-4 py-2 text-sm font-medium text-ink dark:text-cream hover:border-orange-500 hover:text-orange-500 transition-colors"
              >
                {c.nome}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10">
        <h3 className="text-lg font-semibold text-ink dark:text-cream mb-4">Serviços recentes</h3>
        {erroServicos ? (
          <EstadoVazio titulo="" texto="" erro />
        ) : servicos.length === 0 ? (
          <EstadoVazio
            titulo="Ainda não há serviços publicados"
            texto="Os serviços aprovados pelos profissionais aparecerão aqui."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicos.map((s) => (
              <Link key={s.id} href={`/servico/${s.slug}`} className="block">
                <Card variant="liquid" padding="lg" hover className="h-full">
                  <CardHeader>
                    <CardTitle>{s.titulo}</CardTitle>
                    <CardDescription>
                      {[s.municipio, s.provincia].filter(Boolean).join(', ') || 'Angola'}
                    </CardDescription>
                  </CardHeader>
                  <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                    {s.preco != null ? formatCurrency(s.preco) : 'Preço a combinar'}
                    {s.preco != null && s.preco_tipo ? ` · ${s.preco_tipo}` : ''}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </HomeSection>
  );
}
