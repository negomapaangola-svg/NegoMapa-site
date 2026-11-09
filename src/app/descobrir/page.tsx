import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { hrefDescobrir, lerParametros, type SearchParamsRaw } from '@/lib/descobrir/params';
import {
  RESULTADOS_POR_PAGINA,
  buscarServicosDescobrir,
  obterCategoriasDescobrir,
  obterMunicipiosDescobrir,
} from '@/lib/descobrir/buscar-servicos';
import { DescobrirPage } from './_components/DescobrirPage';

export const metadata: Metadata = {
  title: 'Descobrir',
  description: 'Pesquise serviços em Angola por categoria, província, preço e avaliação.',
};

export default async function Page({ searchParams }: { searchParams: Promise<SearchParamsRaw> }) {
  const raw = await searchParams;
  const params = lerParametros(raw);

  // O separador activo fica sempre na URL. Nesta fase só existe "servicos".
  if (raw.tipo !== 'servicos') {
    redirect(hrefDescobrir(params));
  }

  const [resultado, categorias, municipios] = await Promise.all([
    buscarServicosDescobrir(params),
    obterCategoriasDescobrir(),
    obterMunicipiosDescobrir(params.provincia),
  ]);

  const totalPaginas = Math.max(1, Math.ceil(resultado.total / RESULTADOS_POR_PAGINA));

  return (
    <MainLayout>
      <DescobrirPage
        params={params}
        resultado={resultado}
        categorias={categorias}
        municipios={municipios}
        totalPaginas={totalPaginas}
      />
    </MainLayout>
  );
}
