import type { Metadata } from 'next';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  RESULTADOS_POR_PAGINA as RESULTADOS_SERVICOS,
  buscarServicosDescobrir,
  obterCategoriasDescobrir,
  obterMunicipiosDescobrir,
} from '@/lib/descobrir/buscar-servicos';
import {
  RESULTADOS_POR_PAGINA as RESULTADOS_PRODUTOS,
  buscarProdutosDescobrir,
  obterCategoriasProdutos,
  obterMunicipiosProdutos,
} from '@/lib/descobrir/buscar-produtos';
import { lerParametros, type SearchParamsRaw } from '@/lib/descobrir/params';
import { DescobrirPage } from './_components/DescobrirPage';
import { obterLocalizacaoCliente } from '@/lib/actions/perfil-pessoal';
import { obterRecomendacoesDescobrir } from '@/lib/descobrir/recomendacoes';

export const metadata: Metadata = {
  title: 'Descobrir',
  description: 'Pesquise serviços e produtos em Angola por categoria, província, preço e estado.',
};

export default async function Page({ searchParams }: { searchParams: Promise<SearchParamsRaw> }) {
  const raw = await searchParams;
  const params = lerParametros(raw);
  const localizacao = await obterLocalizacaoCliente();

  if (params.tipo === 'produtos') {
    const [resultado, categorias, municipios] = await Promise.all([
      buscarProdutosDescobrir(params, localizacao),
      obterCategoriasProdutos(),
      obterMunicipiosProdutos(params.provincia),
      obterRecomendacoesDescobrir({ provincia: params.provincia, municipio: params.municipio }),
    ]);

    const totalPaginas = Math.max(1, Math.ceil(resultado.total / RESULTADOS_PRODUTOS));

    return (
      <MainLayout>
        <DescobrirPage
          params={params}
          categorias={categorias}
          municipios={municipios}
          totalPaginas={totalPaginas}
          produtos={resultado}
          recomendacoes={recomendacoes}
        />
      </MainLayout>
    );
  }

  const [resultado, categorias, municipios] = await Promise.all([
    buscarServicosDescobrir(params, localizacao),
    obterCategoriasDescobrir(),
    obterMunicipiosDescobrir(params.provincia),
    obterRecomendacoesDescobrir({ provincia: params.provincia, municipio: params.municipio }),
  ]);

  const totalPaginas = Math.max(1, Math.ceil(resultado.total / RESULTADOS_SERVICOS));

  return (
    <MainLayout>
      <DescobrirPage
        params={params}
        categorias={categorias}
        municipios={municipios}
        totalPaginas={totalPaginas}
        servicos={resultado}
        recomendacoes={recomendacoes}
      />
    </MainLayout>
  );
}
