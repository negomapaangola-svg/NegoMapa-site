import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import { ServiceWhatsApp } from './__components/ServiceWhatsApp';

interface ServiceDetailRaw {
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
  estado: string;
  categoria: {
    id: string;
    nome: string;
    slug: string;
    ativo: boolean;
  } | { id: string; nome: string; slug: string; ativo: boolean }[] | null;
  profissional: {
    id: string;
    nome: string;
    slug: string;
    whatsapp: string | null;
    bio: string | null;
    telefone: string | null;
    provincia: string | null;
    municipio: string | null;
    estado: string;
  } | { id: string; nome: string; slug: string; whatsapp: string | null; bio: string | null; telefone: string | null; provincia: string | null; municipio: string | null; estado: string }[] | null;
}

interface ServiceDetail {
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
  estado: string;
  categoria: {
    id: string;
    nome: string;
    slug: string;
    ativo: boolean;
  } | null;
  profissional: {
    id: string;
    nome: string;
    slug: string;
    whatsapp: string | null;
    bio: string | null;
    telefone: string | null;
    provincia: string | null;
    municipio: string | null;
    estado: string;
  } | null;
}

async function getService(slug: string): Promise<ServiceDetail | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
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
      estado,
      categoria:categoria_id (id, nome, slug, ativo),
      profissional:profissional_id (id, nome, slug, whatsapp, bio, telefone, provincia, municipio, estado)
    `)
    .eq('slug', slug)
    .eq('estado', 'aprovado')
    .eq('profissional_id.estado', 'aprovado')
    .eq('categoria_id.ativo', true)
    .single();

  if (error) {
    console.error('Erro ao buscar serviço:', error);
    return null;
  }

  const raw = data as ServiceDetailRaw;

  // Normalize relationships (Supabase returns arrays for joined tables)
  const service: ServiceDetail = {
    ...raw,
    categoria: Array.isArray(raw.categoria) ? raw.categoria[0] : raw.categoria,
    profissional: Array.isArray(raw.profissional) ? raw.profissional[0] : raw.profissional,
  };

  return service;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = await getService(slug);

  if (!service) {
    return {
      title: 'Serviço não encontrado',
    };
  }

  return {
    title: service.titulo,
    description: service.descricao || `Serviço de ${service.categoria?.nome || 'categoria não informada'} por ${service.profissional?.nome || 'profissional'}.`,
    openGraph: {
      title: service.titulo,
      description: service.descricao || `Serviço de ${service.categoria?.nome || 'categoria não informada'}`,
      type: 'website',
    },
  };
}

export default async function ServicoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = await getService(slug);

  if (!service) {
    notFound();
  }

  const serviceWhatsApp = service.whatsapp || service.profissional?.whatsapp;

  return (
    <MainLayout>
      <section className="py-12 lg:py-16 bg-cream dark:bg-navy-dark" aria-labelledby="service-title">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link
              href="/servicos"
              className="inline-flex items-center gap-1 text-sm text-neutral-500 dark:text-cream-text/70 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar aos serviços
            </Link>
          </div>

          <Card variant="liquid" padding="lg" className="border-card-border">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                {service.categoria && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-sm font-medium mb-3">
                    {service.categoria.nome}
                  </span>
                )}
                <h1 id="service-title" className="text-3xl md:text-4xl font-bold text-ink dark:text-cream">
                  {service.titulo}
                </h1>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-neutral-500 dark:text-cream-text/70">Preço</p>
                  {service.preco !== null && service.preco !== undefined ? (
                    <p className="text-2xl font-bold text-orange-500 dark:text-orange-400 mt-1">
                      {formatCurrency(service.preco)}
                      {service.preco_tipo && <span className="text-lg font-normal text-neutral-500 dark:text-cream-text/70 ml-2">/ {service.preco_tipo}</span>}
                    </p>
                  ) : (
                    <p className="text-ink dark:text-cream mt-1">Sob consulta</p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-neutral-500 dark:text-cream-text/70">Localização</p>
                  <p className="text-ink dark:text-cream mt-1 flex flex-wrap items-center gap-2">
                    {service.provincia && (
                      <span className="flex items-center gap-1">
                        <svg className="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {service.provincia}
                      </span>
                    )}
                    {service.municipio && (
                      <span className="flex items-center gap-1">
                        <svg className="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {service.municipio}
                      </span>
                    )}
                    {!service.provincia && !service.municipio && (
                      <span className="text-neutral-500 dark:text-cream-text/70">Não informada</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="space-y-4 md:justify-self-end">
                <ServiceWhatsApp telefone={serviceWhatsApp} label="Contactar via WhatsApp" />
              </div>
            </div>

            {service.descricao && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-ink dark:text-cream mb-3">Descrição</h2>
                <div className="prose prose-neutral dark:prose-invert max-w-none text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  <p className="whitespace-pre-wrap">{service.descricao}</p>
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-card-border">
              <h2 className="text-lg font-semibold text-ink dark:text-cream mb-4">Profissional</h2>
              {service.profissional ? (
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-2xl md:text-3xl font-bold text-orange-500 dark:text-orange-400 flex-shrink-0">
                    {service.profissional.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-ink dark:text-cream truncate">
                      {service.profissional.nome}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-neutral-600 dark:text-cream-text/80">
                      {service.profissional.provincia && (
                        <span className="flex items-center gap-1">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {service.profissional.provincia}
                        </span>
                      )}
                      {service.profissional.municipio && (
                        <span className="flex items-center gap-1">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          {service.profissional.municipio}
                        </span>
                      )}
                    </div>
                    {service.profissional.bio && (
                      <p className="mt-3 text-sm text-neutral-600 dark:text-cream-text line-clamp-2">
                        {service.profissional.bio}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 w-full md:w-auto">
                    <ServiceWhatsApp telefone={service.profissional.whatsapp} label="WhatsApp" />
                    {service.profissional.telefone && (
                      <a
                        href={`tel:${service.profissional.telefone}`}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-card-border rounded-[4px] bg-white text-ink dark:text-cream hover:bg-cream dark:hover:bg-navy-dark transition-colors"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a1 1 0 011-1h3a1 1 0 011 1v4a1 1 0 01-1 1h-3a1 1 0 01-1-1V5zM6 8v8h8v-8H6zm5 1v2H9v-2h5zm-5 4v2H4v-2h5zm5-8l-5 2H16l-5 2v-5zM11 16l-2-5h5l2 5h-5z" />
                        </svg>
                        Telefone
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-neutral-500 dark:text-cream-text/70">Informações do profissional não disponíveis</p>
              )}
            </div>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
}