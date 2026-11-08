import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { IMAGENS } from '@/lib/imagens';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import { ServiceWhatsApp } from './__components/ServiceWhatsApp';
import { getUser } from '@/lib/auth';
import { getMediaAvaliacoes, getAvaliacoesPorAlvo, AlvoAvaliacao } from '@/lib/actions/avaliacoes';
import { Rating, RatingStarsOnly } from '@/components/avaliacoes/Rating';
import { ReviewForm } from '@/components/avaliacoes/ReviewForm';
import { ReportForm } from '@/components/denuncias/ReportForm';
import { AlvoDenuncia } from '@/lib/actions/denuncias';
import { obterPerfilProfissionalDoUtilizador } from '@/lib/actions/profissional-painel';
import { MENSAGEM_BLOQUEIO_PROFISSIONAL } from '@/lib/mensagens-bloqueio';
import {
  obterProfissionalContactoPorId,
  type DisponibilidadeHorarios,
  type PortfolioItem,
  type ProfissionalContactoPublico,
} from '@/lib/actions/profissionais-publicos';
import { BotoesContactoServico } from './_components/BotoesContactoServico';

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
  estado: string;
  profissional_id: string;
  categoria: {
    id: string;
    nome: string;
    slug: string;
    ativo: boolean;
  } | { id: string; nome: string; slug: string; ativo: boolean }[] | null;
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
  profissional_id: string;
  categoria: {
    id: string;
    nome: string;
    slug: string;
    ativo: boolean;
  } | null;
}

/**
 * Serviço aprovado com categoria ativa. O profissional NÃO é embutido: é obtido numa segunda
 * consulta à vista public.profissionais_publicos (só aprovados, colunas seguras).
 */
async function getService(slug: string): Promise<ServiceDetail | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('servicos')
    .select('id,slug,titulo,descricao,preco,preco_tipo,whatsapp,provincia,municipio,created_at,estado,profissional_id,categoria:categoria_id(id,nome,slug,ativo)')
    .eq('slug', slug)
    .eq('estado', 'aprovado')
    .eq('categoria_id.ativo', true)
    .single();

  if (error) {
    console.error('Erro ao buscar serviço. Código:', error.code);
    return null;
  }

  const raw = data as ServiceRaw;

  return {
    ...raw,
    categoria: Array.isArray(raw.categoria) ? raw.categoria[0] ?? null : raw.categoria,
  };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = await getService(slug);

  if (!service) {
    return {
      title: 'Serviço não encontrado',
    };
  }

  const profissional = await obterProfissionalContactoPorId(service.profissional_id);

  return {
    title: service.titulo,
    description: service.descricao || `Serviço de ${service.titulo} por ${profissional?.nome ?? 'profissional'}`,
    openGraph: {
      title: service.titulo,
      description: service.descricao || `Serviço de ${service.titulo}`,
      type: 'website',
    },
  };
}

function formatDias(dias: string[] | null): string {
  if (!dias || dias.length === 0) return '';
  const dayLabels: Record<string, string> = {
    seg: 'Segunda',
    ter: 'Terça',
    qua: 'Quarta',
    qui: 'Quinta',
    sex: 'Sexta',
    sab: 'Sábado',
    dom: 'Domingo',
  };
  return dias.map(d => dayLabels[d] || d).join(', ');
}

function formatHorarios(horarios: DisponibilidadeHorarios | null): string {
  if (!horarios) return '';
  const labels: string[] = [];
  if (horarios.manha) labels.push('Manhã');
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

  // Profissional via vista pública. Se não estiver aprovado, a vista não o devolve e o serviço não se mostra.
  const profissional: ProfissionalContactoPublico | null = await obterProfissionalContactoPorId(service.profissional_id);
  if (!profissional) {
    notFound();
  }

  const [user, media, avaliacoes] = await Promise.all([
    getUser(),
    getMediaAvaliacoes({ tipo: 'servico', id: service.id }),
    getAvaliacoesPorAlvo({ tipo: 'servico', id: service.id }),
  ]);

  // O próprio profissional não pede orçamento nem se contacta a si mesmo.
  const perfilProprio = user ? await obterPerfilProfissionalDoUtilizador() : null;
  const ehProprio = !!perfilProprio && perfilProprio.id === profissional.id;
  // Contas de profissional não iniciam conversas nem pedidos (também barrado na RLS).
  const ehProfissional = !!perfilProprio;

  // WhatsApp público: o do serviço, ou o do profissional (contacto público por decisão de produto).
  const serviceWhatsApp = service.whatsapp || profissional.whatsapp;

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
              Voltar aos serviços
            </Link>
          </div>

          <Card variant="liquid" padding="lg" className="border-card-border">
            <Image
              src={IMAGENS.servicoPadrao}
              alt=""
              width={1200}
              height={800}
              sizes="(max-width: 768px) 100vw, 768px"
              className="mb-6 h-56 w-full rounded-[4px] object-cover"
            />
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
                  {profissional.categoria && (
                    <p className="mt-1 text-sm text-neutral-600 dark:text-cream-text/80">{profissional.categoria}</p>
                  )}
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
                      <span>{profissional.anos_experiencia} ano{profissional.anos_experiencia > 1 ? 's' : ''} de experiência</span>
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
                      <p className="font-medium text-sm text-neutral-700 dark:text-neutral-300 mb-2">Portfólio</p>
                      <div className="space-y-3">
                        {profissional.portfolio.map((item: PortfolioItem, index: number) => (
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
                </div>
              </div>
            </div>

            {!ehProprio && (
              <div className="pt-6 border-t border-card-border">
                <h2 className="text-lg font-semibold text-ink dark:text-cream mb-4">Pedir orçamento ou contactar</h2>
                {user && ehProfissional ? (
                  <p role="status" className="text-neutral-600 dark:text-cream-text/80">
                    {MENSAGEM_BLOQUEIO_PROFISSIONAL}
                  </p>
                ) : user ? (
                  <BotoesContactoServico servicoId={service.id} profissionalId={profissional.id} />
                ) : (
                  <div className="space-y-3">
                    <p className="text-neutral-600 dark:text-cream-text/80">
                      Entre na sua conta ou crie uma para pedir orçamento ou enviar mensagem a este profissional.
                    </p>
                    <Link
                      href={`/registar?redirectTo=${encodeURIComponent(`/servico/${slug}`)}`}
                      className="inline-flex items-center justify-center px-4 py-2 rounded-[4px] bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                    >
                      Entrar ou criar conta
                    </Link>
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-card-border">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink dark:text-cream">Segurança</h2>
                {user && <ReportForm alvo={alvoDenuncia} userId={user.id} triggerLabel="Denunciar este serviço" />}
              </div>
            </div>

            <div className="pt-6 border-t border-card-border">
              <h2 className="text-lg font-semibold text-ink dark:text-cream mb-4">Avaliações</h2>
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
                  <p className="text-neutral-500 dark:text-cream-text/70 text-center py-8">Sem avaliações</p>
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
