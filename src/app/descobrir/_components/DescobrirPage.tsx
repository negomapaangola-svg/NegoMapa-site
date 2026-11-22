import { hrefDescobrir, type ParamsDescobrir } from '@/lib/descobrir/params';
import type { CategoriaDescobrir, ResultadoDescobrir } from '@/lib/descobrir/buscar-servicos';
import type { ResultadoProdutos } from '@/lib/descobrir/buscar-produtos';
import { SeparadoresTipo } from './SeparadoresTipo';
import { FiltrosDescobrir } from './FiltrosDescobrir';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/EmptyState';
import { PaginacaoDescobrir } from './PaginacaoDescobrir';
import { RecomendacoesCliente } from './RecomendacoesCliente';
import type { RecomendacaoDescobrir } from '@/lib/descobrir/recomendacoes';
import { PageHeader, SearchBar, FilterChips, SettingsSheet, ResultsHeader, ProductCard, ServiceCard } from '@/components/ui/CatalogComponents';
import { EditorialPageImage } from '@/components/ui/EditorialPageImage';

interface DescobrirPageProps {
  params: ParamsDescobrir;
  categorias: CategoriaDescobrir[];
  municipios: string[];
  totalPaginas: number;
  servicos?: ResultadoDescobrir;
  produtos?: ResultadoProdutos;
  recomendacoes: RecomendacaoDescobrir[];
}

export function DescobrirPage({ params, categorias, municipios, totalPaginas, servicos, produtos, recomendacoes }: DescobrirPageProps) {
  const ehProdutos = params.tipo === 'produtos';
  const resultados = ehProdutos ? produtos?.produtos ?? [] : servicos?.servicos ?? [];
  const total = ehProdutos ? produtos?.total ?? 0 : servicos?.total ?? 0;
  const limitado = !ehProdutos && Boolean(servicos?.limitado);
  const categoriasRapidas = categorias.slice(0, 8).map((categoria) => ({
    label: categoria.nome,
    value: categoria.slug,
    href: hrefDescobrir(params, { categoria: categoria.slug, pagina: 1 }),
  }));

  return (
    <section className="bg-cream py-10 dark:bg-navy-dark lg:py-16" aria-labelledby="descobrir-titulo">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <EditorialPageImage src={ehProdutos ? "/images/home/produtos.webp" : "/images/home/servicos.webp"} alt={ehProdutos ? "Produtos disponíveis numa empresa angolana" : "Técnico angolano a trabalhar numa instalação eléctrica"} />
        <PageHeader title="Descobrir" description={ehProdutos
          ? 'Encontre produtos de empresas angolanas por pesquisa, categoria, província, preço e estado.'
          : 'Encontre serviços em Angola por pesquisa, categoria, província, preço e avaliação.'} />
        <div className="mt-5">
          <SearchBar action={`/descobrir?tipo=${params.tipo}`} defaultValue={params.q} placeholder="O que procura hoje?" />
        </div>
        <RecomendacoesCliente itens={recomendacoes} />
        <SeparadoresTipo params={params} />
        <div className="mt-5 space-y-4">
          <FilterChips items={categoriasRapidas} value={params.categoria} />
          <SettingsSheet activeCount={[params.q, params.categoria, params.provincia, params.municipio, params.preco, ehProdutos ? params.estado_produto : params.avaliacao, ehProdutos ? params.entrega : ""].filter(Boolean).length}>
            <FiltrosDescobrir params={params} categorias={categorias} municipios={municipios} />
          </SettingsSheet>
        </div>
        <div className="mt-6">
          <ResultsHeader count={total} label={ehProdutos ? 'produtos' : 'serviços'}>
            {limitado && <span className="text-xs text-neutral-500">Avaliação aplicada aos primeiros 300 serviços</span>}
          </ResultsHeader>
        </div>
        {resultados.length > 0 ? (
          <ul className="grid grid-cols-1 gap-5 md:grid-cols-3 xl:grid-cols-4" aria-label={ehProdutos ? 'Resultados de produtos' : 'Resultados de serviços'}>
            {ehProdutos ? (produtos?.produtos ?? []).map((item) => (
              <li key={item.id}>
                <ProductCard product={{ name: item.titulo, description: item.descricao, href: `/produto/${item.slug}`, price: item.preco,
                  priceType: item.preco_tipo, fulfilment: item.entrega ? (item.entrega === 'entrega' ? 'Entrega disponível' : item.entrega) : undefined, location: [item.municipio, item.provincia].filter(Boolean).join(', ') || 'Angola',
                  image: item.imagem }} />
              </li>
            )) : (servicos?.servicos ?? []).map((item) => (
              <li key={item.id}>
                <ServiceCard service={{ name: item.titulo, description: item.descricao, href: `/servico/${item.slug}`, price: item.preco,
                  priceType: item.preco_tipo, providerName: item.prestador_nome ?? undefined,
                  providerHref: item.prestador_slug ? `/profissional/${item.prestador_slug}` : undefined,
                  whatsapp: item.prestador_whatsapp, location: [item.municipio, item.provincia].filter(Boolean).join(', ') || 'Angola' }} />
              </li>
            ))}
          </ul>
        ) : <EmptyState title={ehProdutos ? 'Nenhum produto encontrado.' : 'Nenhum serviço encontrado.'} description="Experimente alterar a pesquisa ou remover os filtros aplicados." action={<Link href={`/descobrir?tipo=${params.tipo}`} className="text-sm font-semibold text-orange-600 underline">Remover filtros</Link>} />}
        <PaginacaoDescobrir params={params} totalPaginas={totalPaginas} />
      </div>
    </section>
  );
}
