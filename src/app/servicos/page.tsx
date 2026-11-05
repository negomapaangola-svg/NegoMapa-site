import { Metadata } from 'next';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';
import {
  obterIdsProfissionaisPublicos,
  obterIdsProfissionaisPublicosPorNome,
  obterProfissionaisContactoPorIds,
} from '@/lib/actions/profissionais-publicos';
import { FiltersForm } from './_components/FiltersForm';
import { ServiceCard } from './_components/ServiceCard';
import { Pagination } from './_components/Pagination';

export const metadata: Metadata = {
  title: 'Serviços',
  description: 'Encontre os melhores serviços profissionais em Angola. Filtre por categoria, província e município.',
};

interface ServiceRaw {
  id: string;
  slug: string;
  titulo: string;
  descricao: string | null;
  preco: number | null;
  preco_tipo: string | null;
  whatsapp: string | null;
  provincia: string | null;
  municipio: string | null;
  created_at: string;
  profissional_id: string;
  categoria: {
    id: string;
    nome: string;
    slug: string;
  } | { id: string; nome: string; slug: string }[] | null;
}

interface Service {
  id: string;
  slug: string;
  titulo: string;
  descricao: string | null;
  preco: number | null;
  preco_tipo: string | null;
  whatsapp: string | null;
  provincia: string | null;
  municipio: string | null;
  created_at: string;
  categoria: {
    id: string;
    nome: string;
    slug: string;
  } | null;
  profissional: {
    id: string;
    nome: string;
    slug: string;
    whatsapp: string | null;
  } | null;
}

interface Category {
  id: string;
  nome: string;
  slug: string;
}

const SERVICES_PER_PAGE = 12;

async function getServices(params: {
  q?: string;
  categoria?: string;
  provincia?: string;
  municipio?: string;
  page?: string;
}) {
  const supabase = await createSupabaseServerClient();

  // Profissionais aprovados, pela vista pública. Os serviços filtram-se por estes ids (sem embed).
  const idsProfissionais = await obterIdsProfissionaisPublicos();
  if (idsProfissionais.length === 0) {
    return { services: [], total: 0 };
  }

  // Categorias ativas: só estas aparecem, e o filtro de categoria resolve o slug para id.
  const categoriasAtivas = await getCategories();
  const idsCategoriasAtivas = categoriasAtivas.map((c) => c.id);
  if (idsCategoriasAtivas.length === 0) {
    return { services: [], total: 0 };
  }

  const page = parseInt(params.page || '1', 10);
  const from = (page - 1) * SERVICES_PER_PAGE;
  const to = from + SERVICES_PER_PAGE - 1;

  // Texto de pesquisa sem caracteres que quebram a sintaxe do filtro .or().
  const termo = (params.q || '').replace(/[,()*"\\%_]/g, ' ').trim().slice(0, 100);

  let query = supabase
    .from('servicos')
    .select(`
      id,
      slug,
      titulo,
      descricao,
      preco,
      preco_tipo,
      whatsapp,
      provincia,
      municipio,
      created_at,
      profissional_id,
      categoria:categoria_id (id, nome, slug)
    `, { count: 'exact' })
    .eq('estado', 'aprovado')
    .in('profissional_id', idsProfissionais)
    .in('categoria_id', idsCategoriasAtivas)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (termo) {
    // Título do serviço OU nome do profissional aprovado.
    const idsPorNome = await obterIdsProfissionaisPublicosPorNome(termo);
    const condicoes = [`titulo.ilike.*${termo}*`];
    if (idsPorNome.length > 0) {
      condicoes.push(`profissional_id.in.(${idsPorNome.join(',')})`);
    }
    query = query.or(condicoes.join(','));
  }

  if (params.categoria) {
    const categoria = categoriasAtivas.find((c) => c.slug === params.categoria);
    if (!categoria) {
      return { services: [], total: 0 };
    }
    query = query.eq('categoria_id', categoria.id);
  }

  if (params.provincia) {
    query = query.eq('provincia', params.provincia);
  }

  if (params.municipio) {
    query = query.eq('municipio', params.municipio);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Erro ao buscar serviços:', error);
    return { services: [], total: 0 };
  }

  const rawData = data as ServiceRaw[];

  // Segunda consulta à vista, só para os profissionais desta página.
  const profissionais = await obterProfissionaisContactoPorIds(rawData.map((item) => item.profissional_id));

  const services: Service[] = rawData.map((item) => {
    const p = profissionais.get(item.profissional_id);
    return {
      id: item.id,
      slug: item.slug,
      titulo: item.titulo,
      descricao: item.descricao,
      preco: item.preco,
      preco_tipo: item.preco_tipo,
      whatsapp: item.whatsapp,
      provincia: item.provincia,
      municipio: item.municipio,
      created_at: item.created_at,
      categoria: Array.isArray(item.categoria) ? item.categoria[0] ?? null : item.categoria,
      profissional: p ? { id: p.id, nome: p.nome, slug: p.slug, whatsapp: p.whatsapp } : null,
    };
  });

  return { services, total: count || 0 };
}

async function getCategories() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('categorias')
    .select('id, nome, slug')
    .eq('ativo', true)
    .order('nome');

  if (error) {
    console.error('Erro ao buscar categorias:', error);
    return [];
  }

  return data as Category[];
}

async function getProvincias() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('servicos')
    .select('provincia')
    .eq('estado', 'aprovado')
    .not('provincia', 'is', null);

  if (error) {
    console.error('Erro ao buscar províncias:', error);
    return [];
  }

  const provincias = [...new Set(data.map((s) => s.provincia).filter(Boolean))].sort();
  return provincias;
}

async function getMunicipios(provincia?: string) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from('servicos')
    .select('municipio')
    .eq('estado', 'aprovado')
    .not('municipio', 'is', null);

  if (provincia) {
    query = query.eq('provincia', provincia);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar municípios:', error);
    return [];
  }

  const municipios = [...new Set(data.map((s) => s.municipio).filter(Boolean))].sort();
  return municipios;
}

export default async function ServicosPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{
    q?: string;
    categoria?: string;
    provincia?: string;
    municipio?: string;
    page?: string;
  }>;
}) {
  const searchParams = await searchParamsPromise;
  const page = parseInt(searchParams.page || '1', 10);

  const [servicesResult, categorias, provincias, municipios] = await Promise.all([
    getServices(searchParams),
    getCategories(),
    getProvincias(),
    getMunicipios(searchParams.provincia),
  ]);

  const { services, total } = servicesResult;
  const totalPages = Math.ceil(total / SERVICES_PER_PAGE);

  return (
    <MainLayout>
      <section className="py-16 lg:py-24 bg-cream dark:bg-navy-dark" aria-labelledby="servicos-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 id="servicos-title" className="text-4xl sm:text-5xl font-bold tracking-tight text-ink dark:text-cream">
              Serviços Profissionais
            </h1>
            <p className="mt-4 text-lg text-neutral-600 dark:text-cream-text">
              Encontre o profissional ideal para o seu projeto. Filtre por categoria, localização e mais.
            </p>
          </div>

          <div className="mb-8">
            <FiltersForm
              initialSearchParams={{
                q: searchParams.q,
                categoria: searchParams.categoria,
                provincia: searchParams.provincia,
                municipio: searchParams.municipio,
              }}
              categorias={categorias}
              provincias={provincias}
              municipios={municipios}
            />
          </div>

          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-neutral-600 dark:text-cream-text" role="status" aria-live="polite">
              {total === 0
                ? 'Nenhum serviço encontrado'
                : `Exibindo ${services.length} de ${total} serviço${total !== 1 ? 's' : ''}`}
            </p>
          </div>

          {services.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="list" aria-label="Lista de serviços">
                {services.map((service) => (
                  <article key={service.id} role="listitem">
                    <ServiceCard service={service} />
                  </article>
                ))}
              </div>

              <Pagination
                currentPage={page}
                totalPages={totalPages}
                searchParams={{
                  q: searchParams.q,
                  categoria: searchParams.categoria,
                  provincia: searchParams.provincia,
                  municipio: searchParams.municipio,
                }}
              />
            </>
          ) : (
            <div className="text-center py-16" role="alert">
              <svg className="mx-auto h-16 w-16 text-neutral-300 dark:text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="mt-4 text-xl font-semibold text-ink dark:text-cream">Nenhum serviço encontrado</h2>
              <p className="mt-2 text-neutral-600 dark:text-cream-text max-w-md mx-auto">
                {searchParams.q || searchParams.categoria || searchParams.provincia || searchParams.municipio
                  ? 'Tente ajustar os filtros ou buscar por outro termo.'
                  : 'Ainda não há serviços cadastrados.'}
              </p>
              {(searchParams.q || searchParams.categoria || searchParams.provincia || searchParams.municipio) && (
                <a href="/servicos" className="mt-4 inline-block px-4 py-2 border border-card-border rounded-[4px] bg-white text-ink dark:text-cream hover:bg-cream dark:hover:bg-navy-dark transition-colors">
                  Limpar filtros
                </a>
              )}
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}