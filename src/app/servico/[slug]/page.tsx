import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import { ServiceWhatsApp } from './__components/ServiceWhatsApp';
import { getUser } from '@/lib/auth';
import { getMediaAvaliacoes, getAvaliacoesPorAlvo, AlvoAvaliacao } from '@/lib/actions/avaliacoes';
import { Rating, RatingStarsOnly } from '@/components/avaliacoes/Rating';
import { ReviewForm } from '@/components/avaliacoes/ReviewForm';
import { ReportForm } from '@/components/denuncias/ReportForm';
import { AlvoDenuncia } from '@/lib/actions/denuncias';

interface PortfolioItem {
  titulo: string;
  descricao?: string | null;
  url_projeto?: string | null;
}

interface DisponibilidadeHorarios {
  manha: boolean;
  tarde: boolean;
  noite: boolean;
}

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
    avatar_url: string | null;
    anos_experiencia: number | null;
    disponibilidade_dias: string[] | null;
    disponibilidade_horarios: DisponibilidadeHorarios | null;
    portfolio: PortfolioItem[] | null;
  } | { id: string; nome: string; slug: string; whatsapp: string | null; bio: string | null; telefone: string | null; provincia: string | null; municipio: string | null; estado: string; avatar_url: string | null; anos_experiencia: number | null; disponibilidade_dias: string[] | null; disponibilidade_horarios: DisponibilidadeHorarios | null; portfolio: PortfolioItem[] | null }[] | null;
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
    avatar_url: string | null;
    anos_experiencia: number | null;
    disponibilidade_dias: string[] | null;
    disponibilidade_horarios: DisponibilidadeHorarios | null;
    portfolio: PortfolioItem[] | null;
  } | null;
}

async function getService(slug: string): Promise<ServiceDetail | null> {
  const supabase = await createSupabaseServerClient();

  const selectQuery = 'id,slug,titulo,descricao,preco,preco_tipo,whatsapp,provincia,municipio,created_at,estado,categoria:categoria_id(id,nome,slug,ativo),profissional:profissional_id(id,nome,slug,whatsapp,bio,telefone,provincia,municipio,estado,avatar_url,anos_experiencia,disponibilidade_dias,disponibilidade_horarios,portfolio)';

  const { data, error } = await supabase
    .from('servicos')
    .select(selectQuery)
    .eq('slug', slug)
    .eq('estado', 'aprovado')
    .eq('profissional_id.estado', 'aprovado')
    .eq('categoria_id.ativo', true)
    .single();

  if (error) {
    console.error('Erro ao buscar servi\u00e7o:', error);
    return null;
  }

  const raw = data as ServiceDetailRaw;

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
      title: 'Servi\u00e7o n\u00e3o encontrado',
    };
  }

  return {
    title: service.titulo,
    description: service.descricao || `Servi\u00e7o de ${service.titulo} por ${service.profissional?.nome}`,
    openGraph: {
      title: service.titulo,
      description: service.descricao || `Servi\u00e7o de ${service.titulo}`,
      type: 'website',
    },
  };
}

function formatDias(dias: string[] | null): string {
  if (!dias || dias.length === 0) return '';
  const dayLabels: Record<string, string> = {
    seg: 'Segunda',
    ter: 'Ter\u00e7a',
    qua: 'Quarta',
    qui: 'Quinta',
    sex: 'Sexta',
    sab: 'S\u00e1bado',
    dom: 'Domingo',
  };
  return dias.map(d => dayLabels[d] || d).join(', ');
}

function formatHorarios(horarios: DisponibilidadeHorarios | null): string {
  if (!horarios) return '';
  const labels: string[] = [];
  if (horarios.manha) labels.push('Manh\u00e3');
  if (horarios.tarde) labels.push('Tarde');
  if (horarios.noite) labels.push('Noite');
  return labels.join(', ');
}

export default async function ServicoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = await getService(slug);

  if (!service) {
    notFound();
  }

  const [user, media, avaliacoes] = await Promise.all([
    getUser(),
    getMediaAvaliacoes({ tipo: 'servico', id: service.id }),
    getAvaliacoesPorAlvo({ tipo: 'servico', id: service.id }),
  ]);

  const serviceWhatsApp = service.whatsapp || service.profissional?.whatsapp;
  const profissional = service.profissional;

  const alvo: AlvoAvaliacao = { tipo: 'servico', id: service.id };
  const alvoDenuncia: AlvoDenuncia = { tipo: 'servico', id: service.id };

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
              Voltar aos servi\u00e7os
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
                  <p className="text-sm text-neutral-500 dark:text-cream-text/70">Pre\u00e7o</p>
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
                  <p className="text-sm text-neutral-500 dark:text-cream-text/70">Localiza\u00e7\u00e3o</p>
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
                      <span className="text-neutral-500 dark:text-cream-text/70">N\u00e3o informada</span>
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
                <h2 className="text-lg font-semibold text-ink dark:text-cream mb-3">Descri\u00e7\u00e3o</h2>
                <div className="prose prose-neutral dark:prose-invert max-w-none text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  <p className="whitespace-pre-wrap">{service.descricao}</p>
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-card-border">
              <h2 className="text-lg font-semibold text-ink dark:text-cream mb-4">Profissional</h2>
              {profissional ? (
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-2xl md:text-3xl font-bold text-orange-500 dark:text-orange-400 flex-shrink-0 overflow-hidden">
                    {profissional.avatar_url ? (
                      <img
                        src={profissional.avatar_url}
                        alt={profissional.nome}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      profissional.nome.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-ink dark:text-cream truncate">
                      {profissional.nome}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-neutral-600 dark:text-cream-text/80">
                      {profissional.provincia && (
                        <span className="flex items-center gap-1">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {profissional.provincia}
                        </span>
                      )}
                      {profissional.municipio && (
                        <span className="flex items-center gap-1">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          {profissional.municipio}
                        </span>
                      )}
                    </div>
                    {profissional.bio && (
                      <p className="mt-3 text-sm text-neutral-600 dark:text-cream-text line-clamp-2">
                        {profissional.bio}
                      </p>
                    )}

                    {profissional.anos_experiencia !== null && profissional.anos_experiencia !== undefined && profissional.anos_experiencia > 0 && (
                      <div className="mt-4 flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                        <svg className="h-5 w-5 text-orange-500 dark:text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{profissional.anos_experiencia} ano{profissional.anos_experiencia > 1 ? 's' : ''} de experi\u00eancia</span>
                      </div>
                    )}

                    {profissional.disponibilidade_dias && profissional.disponibilidade_dias.length > 0 && (
                      <div className="mt-4 flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                        <svg className="h-5 w-5 text-orange-500 dark:text-orange-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <p className="font-medium">Disponibilidade: {formatDias(profissional.disponibilidade_dias)}</p>
                          {formatHorarios(profissional.disponibilidade_horarios) && (
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{formatHorarios(profissional.disponibilidade_horarios)}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {profissional.portfolio && profissional.portfolio.length > 0 && (
                      <div className="mt-4">
                        <p className="font-medium text-sm text-neutral-700 dark:text-neutral-300 mb-2">Portf\u00f3lio</p>
                        <div className="space-y-3">
                          {profissional.portfolio.map((item, index) => (
                            <div key={index} className="border border-card-border rounded-[4px] p-3 bg-white/50 dark:bg-neutral-800/50">
                              <h4 className="font-medium text-ink dark:text-cream">{item.titulo}</h4>
                              {item.descricao && (
                                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{item.descricao}</p>
                              )}
                              {item.url_projeto && (
                                <a
                                  href={item.url_projeto}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-2 inline-flex items-center gap-1 text-sm text-orange-500 dark:text-orange-400 hover:underline"
                                >
                                  Ver projeto
                                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 w-full md:w-auto">
                    <ServiceWhatsApp telefone={profissional.whatsapp} label="WhatsApp" />
{profissional.telefone && (
                      <a
                        href={`tel:${profissional.telefone}`}
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
                <p className="text-neutral-500 dark:text-cream-text/70">Informa\u00e7\u00f5es do profissional n\u00e3o dispon\u00edveis</p>
              )}
            </div>

            <div className="pt-4 border-t border-card-border">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink dark:text-cream">Segurança</h2>
                {user && <ReportForm alvo={alvoDenuncia} userId={user.id} triggerLabel="Denunciar este serviço" />}
              </div>
            </div>

            <div className="pt-6 border-t border-card-border">
              <h2 className="text-lg font-semibold text-ink dark:text-cream mb-4">Avalia\u00e7\u00f5es</h2>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Rating media={media.media} total={media.total} size="lg" />
                </div>

                {avaliacoes.length > 0 ? (
                  <div className="space-y-4">
                    {avaliacoes.map((avaliacao) => (
                      <Card key={avaliacao.id} variant="outlined" padding="md" className="border-card-border">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-lg font-bold text-orange-500 dark:text-orange-400 flex-shrink-0">
                            {avaliacao.user?.email?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium text-ink dark:text-cream truncate">
                                {avaliacao.user?.email?.split('@')[0] || 'Utilizador'}
                              </p>
                              <div className="flex items-center gap-2">
                                <RatingStarsOnly media={avaliacao.nota} size="sm" />
                                <time className="text-xs text-neutral-500 dark:text-neutral-400">
                                  {new Date(avaliacao.created_at).toLocaleDateString('pt-AO', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                  })}
                                </time>
                              </div>
                            </div>
                            {avaliacao.comentario && (
                              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">
                                {avaliacao.comentario}
                              </p>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-neutral-500 dark:text-cream-text/70 text-center py-8">Sem avalia\u00e7\u00f5es</p>
                )}

                {user && (
                  <ReviewForm alvo={alvo} userId={user.id} />
                )}
              </div>
            </div>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
}
