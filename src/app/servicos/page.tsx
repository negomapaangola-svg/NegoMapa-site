import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Serviços',
  description: 'Encontre os melhores serviços profissionais em Angola. Filtre por categoria, província e município.',
};

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
  } | null | undefined;
  profissional: {
    id: string;
    nome: string;
    slug: string;
    whatsapp: string | null;
  } | null | undefined;
}

interface Category {
  id: string;
  nome: string;
  slug: string;
}

const SERVICES_PER_PAGE = 12;

async function getServices(searchParams: Promise<{
  q?: string;
  categoria?: string;
  provincia?: string;
  municipio?: string;
  page?: string;
}>) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();

  const page = parseInt(params.page || '1', 10);
  const from = (page - 1) * SERVICES_PER_PAGE;
  const to = from + SERVICES_PER_PAGE - 1;

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
      categoria:categorias!inner (id, nome, slug),
      profissional:profissionais!inner (id, nome, slug, whatsapp)
    `, { count: 'exact' })
    .eq('estado', 'aprovado')
    .eq('profissional.estado', 'aprovado')
    .eq('categoria.ativo', true)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (params.q) {
    query = query.ilike('titulo', `%${params.q}%`);
  }

  if (params.categoria) {
    query = query.eq('categoria.slug', params.categoria);
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

  const services = (data || []).map((item: any) => ({
    ...item,
    categoria: Array.isArray(item.categoria) ? item.categoria[0] : item.categoria,
    profissional: Array.isArray(item.profissional) ? item.profissional[0] : item.profissional,
  })) as Service[];

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

function WhatsAppButton({ telefone }: { telefone: string | null | undefined }) {
  if (!telefone) return null;

  const cleanNumber = telefone.replace(/\D/g, '');
  const url = `https://wa.me/244${cleanNumber}`;

  return (
    <Button variant="primary" size="sm" asChild>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 16v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h10a2 2 0 012 2v1m-3.678-1.636A16.039 16.039 0 016 12.353 16.083 16.083 0 0112.05 3s10.03 8.347 10.323 9.378a7.97 7.97 0 00-1.677 2.043 7.926 7.926 0 01-3.062.094A11.956 11.956 0 0018 16z" />
        </svg>
        <span>WhatsApp</span>
      </a>
    </Button>
  );
}

function ServiceCard({ service }: { service: Service }) {
  const whatsappNumber = service.whatsapp || service.profissional?.whatsapp;

  return (
    <Card variant="liquid" padding="md" hover className="h-full flex flex-col border-card-border">
      <CardHeader>
        <CardTitle className="text-lg line-clamp-2">{service.titulo}</CardTitle>
        <CardDescription className="text-sm">
          {service.categoria?.nome && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-medium">
              {service.categoria.nome}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600 dark:text-cream-text/80">
          {service.provincia && (
            <span className="flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {service.provincia}
            </span>
          )}
          {service.municipio && (
            <span className="flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {service.municipio}
            </span>
          )}
        </div>

        {service.preco !== null && service.preco !== undefined && (
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-orange-500 dark:text-orange-400">
              {formatCurrency(service.preco)}
            </span>
            {service.preco_tipo && (
              <span className="text-sm text-neutral-500 dark:text-cream-text/70">
                / {service.preco_tipo}
              </span>
            )}
          </div>
        )}

        {service.descricao && (
          <p className="text-sm text-neutral-600 dark:text-cream-text line-clamp-3 mt-2">
            {service.descricao}
          </p>
        )}
      </CardContent>
      <CardFooter className="pt-4">
        <div className="flex items-center justify-between w-full gap-2">
          <span className="text-xs text-neutral-500 dark:text-cream-text/70 flex-1 truncate">
            Por: {service.profissional?.nome || 'Profissional'}
          </span>
          <WhatsAppButton telefone={whatsappNumber} />
        </div>
      </CardFooter>
    </Card>
  );
}

function FiltersForm({
  searchParams,
  categorias,
  provincias,
  municipios,
}: {
  searchParams: {
    q?: string;
    categoria?: string;
    provincia?: string;
    municipio?: string;
  };
  categorias: Category[];
  provincias: string[];
  municipios: string[];
}) {
  const params = new URLSearchParams();

  if (searchParams.q) params.set('q', searchParams.q);
  if (searchParams.categoria) params.set('categoria', searchParams.categoria);
  if (searchParams.provincia) params.set('provincia', searchParams.provincia);
  if (searchParams.municipio) params.set('municipio', searchParams.municipio);

  const baseUrl = `/servicos?${params.toString()}`;

  return (
    <form className="space-y-4 md:space-y-0 md:flex md:items-end md:gap-4 flex-wrap" role="search" aria-label="Filtros de serviços">
      <div className="md:flex-1 min-w-[200px]">
        <label htmlFor="q" className="sr-only">Buscar serviços</label>
        <input
          type="search"
          id="q"
          name="q"
          value={searchParams.q || ''}
          placeholder="Buscar por título..."
          className="w-full px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
        />
      </div>

      <div className="md:w-[180px]">
        <label htmlFor="categoria" className="block text-sm font-medium text-ink dark:text-cream-text mb-1">
          Categoria
        </label>
        <select
          id="categoria"
          name="categoria"
          value={searchParams.categoria || ''}
          onChange={(e) => window.location.href = `${baseUrl}${baseUrl.includes('categoria=') ? '' : (baseUrl.includes('?') ? '&' : '?')}categoria=${e.target.value}`}
          className="w-full px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
        >
          <option value="">Todas as categorias</option>
          {categorias.map((cat) => (
            <option key={cat.id} value={cat.slug}>{cat.nome}</option>
          ))}
        </select>
      </div>

      <div className="md:w-[180px]">
        <label htmlFor="provincia" className="block text-sm font-medium text-ink dark:text-cream-text mb-1">
          Província
        </label>
        <select
          id="provincia"
          name="provincia"
          value={searchParams.provincia || ''}
          className="w-full px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
        >
          <option value="">Todas as províncias</option>
          {provincias.map((prov) => (
            <option key={prov} value={prov}>{prov}</option>
          ))}
        </select>
      </div>

      <div className="md:w-[180px]">
        <label htmlFor="municipio" className="block text-sm font-medium text-ink dark:text-cream-text mb-1">
          Município
        </label>
        <select
          id="municipio"
          name="municipio"
          value={searchParams.municipio || ''}
          className="w-full px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
        >
          <option value="">Todos os municípios</option>
          {municipios.map((mun) => (
            <option key={mun} value={mun}>{mun}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" size="sm">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 18a9 9 0 009-9 9 9 0 00-9 9 9 9 0 009 9z" />
          </svg>
          Filtrar
        </Button>
        {(searchParams.q || searchParams.categoria || searchParams.provincia || searchParams.municipio) && (
          <Button type="button" variant="outline" size="sm" onClick={() => window.location.href = '/servicos'}>
            Limpar
          </Button>
        )}
      </div>
    </form>
  );
}

function Pagination({ currentPage, totalPages, searchParams }: {
  currentPage: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const params = new URLSearchParams(searchParams as Record<string, string>);
  params.delete('page');

  const baseUrl = `/servicos?${params.toString()}`;

  return (
    <nav className="flex items-center justify-center gap-2 mt-8" aria-label="Paginação">
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === 1}
        onClick={() => window.location.href = `${baseUrl}${baseUrl ? '&' : '?'}page=${currentPage - 1}`}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Anterior
      </Button>

      <div className="flex items-center gap-1" role="list" aria-label="Páginas">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
          if (
            page === 1 ||
            page === totalPages ||
            (page >= currentPage - 1 && page <= currentPage + 1)
          ) {
            return (
              <Button
                key={page}
                variant={page === currentPage ? 'primary' : 'outline'}
                size="sm"
                onClick={() => window.location.href = `${baseUrl}${baseUrl ? '&' : '?'}page=${page}`}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </Button>
            );
          }
          if (
            page === currentPage - 2 ||
            page === currentPage + 2
          ) {
            return <span key={page} className="px-2 text-neutral-400">…</span>;
          }
          return null;
        })}
      </div>

      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === totalPages}
        onClick={() => window.location.href = `${baseUrl}${baseUrl ? '&' : '?'}page=${currentPage + 1}`}
      >
        Próxima
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Button>
    </nav>
  );
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
    getServices(searchParamsPromise),
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
              searchParams={{
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
                    <Link href={`/servico/${service.slug}`} className="block">
                      <ServiceCard service={service} />
                    </Link>
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
                <Button variant="outline" size="sm" className="mt-4" onClick={() => window.location.href = '/servicos'}>
                  Limpar filtros
                </Button>
              )}
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}