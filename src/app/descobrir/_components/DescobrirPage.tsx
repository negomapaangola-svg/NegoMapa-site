import type { ParamsDescobrir } from '@/lib/descobrir/params';
import type { CategoriaDescobrir, ResultadoDescobrir } from '@/lib/descobrir/buscar-servicos';
import type { ResultadoProdutos } from '@/lib/descobrir/buscar-produtos';
import { PesquisaPrincipal } from './PesquisaPrincipal';
import { SeparadoresTipo } from './SeparadoresTipo';
import { FiltrosDescobrir } from './FiltrosDescobrir';
import { ResultadoCard } from './ResultadoCard';
import { EstadoSemResultados } from './EstadoSemResultados';
import { PaginacaoDescobrir } from './PaginacaoDescobrir';

interface DescobrirPageProps {
  params: ParamsDescobrir;
  categorias: CategoriaDescobrir[];
  municipios: string[];
  totalPaginas: number;
  servicos?: ResultadoDescobrir;
  produtos?: ResultadoProdutos;
}

export function DescobrirPage({
  params,
  categorias,
  municipios,
  totalPaginas,
  servicos,
  produtos,
}: DescobrirPageProps) {
  const ehProdutos = params.tipo === 'produtos';
  const resultados = ehProdutos ? produtos?.produtos ?? [] : servicos?.servicos ?? [];
  const total = ehProdutos ? produtos?.total ?? 0 : servicos?.total ?? 0;
  const limitado = !ehProdutos && Boolean(servicos?.limitado);

  return (
    <section className="bg-cream py-10 dark:bg-navy-dark lg:py-16" aria-labelledby="descobrir-titulo">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-6 text-center sm:text-left">
          <h1 id="descobrir-titulo" className="text-3xl font-bold tracking-tight text-ink dark:text-cream sm:text-4xl">
            Descobrir
          </h1>
          <p className="mt-2 text-neutral-600 dark:text-cream-text">
            {ehProdutos
              ? 'Encontre produtos de empresas angolanas por pesquisa, categoria, província, preço e estado.'
              : 'Encontre serviços em Angola por pesquisa, categoria, província, preço e avaliação.'}
          </p>
        </header>

        <PesquisaPrincipal key={`${params.tipo}-${params.q}`} params={params} />
        <SeparadoresTipo params={params} />

        <div className="mt-6">
          <FiltrosDescobrir params={params} categorias={categorias} municipios={municipios} />
        </div>

        <p role="status" aria-live="polite" className="mb-4 mt-6 text-sm text-neutral-600 dark:text-cream-text">
          {resultados.length === 0
            ? ehProdutos ? 'Nenhum produto encontrado' : 'Nenhum serviço encontrado'
            : `Exibindo ${resultados.length} de ${total} ${ehProdutos ? 'produto' : 'serviço'}${total !== 1 ? 's' : ''}`}
        </p>

        {limitado && (
          <p className="mb-4 text-sm text-neutral-600 dark:text-cream-text">
            Para filtrar por avaliação, analisámos os primeiros 300 serviços desta pesquisa.
          </p>
        )}

        {resultados.length > 0 ? (
          <ul
            className="grid grid-cols-1 gap-5 md:grid-cols-3 xl:grid-cols-4"
            aria-label={ehProdutos ? 'Resultados de produtos' : 'Resultados de serviços'}
          >
            {resultados.map((item) => (
              <li key={item.id}>
                <ResultadoCard item={item} />
              </li>
            ))}
          </ul>
        ) : (
          <EstadoSemResultados params={params} categorias={categorias} />
        )}

        <PaginacaoDescobrir params={params} totalPaginas={totalPaginas} />
      </div>
    </section>
  );
}
