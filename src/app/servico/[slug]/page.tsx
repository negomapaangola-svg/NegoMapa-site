import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Rating, RatingStarsOnly } from '@/components/avaliacoes/Rating';
import { ReviewForm } from '@/components/avaliacoes/ReviewForm';
import { ReportForm } from '@/components/denuncias/ReportForm';
import { IMAGENS } from '@/lib/imagens';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { formatCurrency } from '@/lib/utils';
import { getUser } from '@/lib/auth';
import { getMediaAvaliacoes, getAvaliacoesPorAlvo, type AlvoAvaliacao } from '@/lib/actions/avaliacoes';
import { type AlvoDenuncia } from '@/lib/actions/denuncias';
import {
  obterIdsProfissionaisPublicos,
  obterProfissionalContactoPorId,
  type DisponibilidadeHorarios,
  type PortfolioItem,
  type ProfissionalContactoPublico,
} from '@/lib/actions/profissionais-publicos';
import { obterPerfilProfissionalDoUtilizador } from '@/lib/actions/profissional-painel';
import { MENSAGEM_BLOQUEIO_PROFISSIONAL } from '@/lib/mensagens-bloqueio';
import { ServiceWhatsApp } from './__components/ServiceWhatsApp';
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
  categoria:
    | { id: string; nome: string; slug: string; ativo: boolean }
    | { id: string; nome: string; slug: string; ativo: boolean }[]
    | null;
}

interface ServiceDetail extends Omit<ServiceRaw, 'categoria'> {
  categoria: { id: string; nome: string; slug: string; ativo: boolean } | null;
}

interface RelatedService {
  id: string;
  slug: string;
  titulo: string;
  preco: number | null;
  preco_tipo: string | null;
  provincia: string | null;
  municipio: string | null;
}

async function getService(slug: string): Promise<ServiceDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('servicos')
    .select('id,slug,titulo,descricao,preco,preco_tipo,whatsapp,provincia,municipio,created_at,estado,profissional_id,categoria:categoria_id(id,nome,slug,ativo)')
    .eq('slug', slug)
    .eq('estado', 'aprovado')
    .eq('categoria_id.ativo', true)
    .maybeSingle();

  if (error) {
    console.error('Erro ao obter serviço público. Código:', error.code);
    return null;
  }
  if (!data) return null;

  const raw = data as unknown as ServiceRaw;
  return {
    ...raw,
    categoria: Array.isArray(raw.categoria) ? raw.categoria[0] ?? null : raw.categoria,
  };
}

async function getRelatedServices(service: ServiceDetail): Promise<RelatedService[]> {
  if (!service.categoria?.id) return [];

  const professionalIds = await obterIdsProfissionaisPublicos();
  if (professionalIds.length === 0) return [];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('servicos')
    .select('id,slug,titulo,preco,preco_tipo,provincia,municipio')
    .eq('estado', 'aprovado')
    .eq('categoria_id', service.categoria.id)
    .neq('id', service.id)
    .in('profissional_id', professionalIds)
    .order('created_at', { ascending: false })
    .limit(3);

  if (error) {
    console.error('Erro ao obter serviços relacionados. Código:', error.code);
    return [];
  }
  return (data ?? []) as RelatedService[];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) return { title: 'Serviço não encontrado | NegóMapa' };

  const profissional = await obterProfissionalContactoPorId(service.profissional_id);
  return {
    title: `${service.titulo} | NegóMapa`,
    description: service.descricao || `Serviço de ${service.titulo} por ${profissional?.nome ?? 'profissional'}.`,
    openGraph: {
      title: service.titulo,
      description: service.descricao || `Conheça este serviço no NegóMapa.`,
      type: 'website',
    },
  };
}

function formatDias(dias: string[] | null): string {
  if (!dias?.length) return '';
  const labels: Record<string, string> = {
    seg: 'Segunda', ter: 'Terça', qua: 'Quarta', qui: 'Quinta',
    sex: 'Sexta', sab: 'Sábado', dom: 'Domingo',
  };
  return dias.map((dia) => labels[dia] ?? dia).join(', ');
}

function formatHorarios(horarios: DisponibilidadeHorarios | null): string {
  if (!horarios) return '';
  const labels: string[] = [];
  if (horarios.manha) labels.push('Manhã');
  if (horarios.tarde) labels.push('Tarde');
  if (horarios.noite) labels.push('Noite');
  return labels.join(', ');
}

function formatPreco(service: Pick<ServiceDetail, 'preco' | 'preco_tipo'>): string {
  if (service.preco === null || service.preco === undefined) return 'Preço sob consulta';
  const tipo: Record<string, string> = {
    fixo: '',
    a_partir_de: 'A partir de ',
    por_hora: 'Por hora · ',
    sob_consulta: '',
  };
  if (service.preco_tipo === 'sob_consulta') return 'Preço sob consulta';
  return `${tipo[service.preco_tipo ?? ''] ?? ''}${formatCurrency(service.preco)}`;
}

export default async function ServicoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) notFound();

  // A vista pública só devolve profissionais aprovados; se não existir, o serviço não é publicado.
  const profissional: ProfissionalContactoPublico | null =
    await obterProfissionalContactoPorId(service.profissional_id);
  if (!profissional) notFound();

  const [user, media, avaliacoes, relacionados] = await Promise.all([
    getUser(),
    getMediaAvaliacoes({ tipo: 'servico', id: service.id }),
    getAvaliacoesPorAlvo({ tipo: 'servico', id: service.id }),
    getRelatedServices(service),
  ]);

  const perfilProprio = user ? await obterPerfilProfissionalDoUtilizador() : null;
  const ehProprio = !!perfilProprio && perfilProprio.id === profissional.id;
  const ehProfissional = !!perfilProprio;
  const alvo: AlvoAvaliacao = { tipo: 'servico', id: service.id };
  const alvoDenuncia: AlvoDenuncia = { tipo: 'servico', id: service.id };
  const localizacao = [service.municipio, service.provincia].filter(Boolean).join(', ');
  const dias = formatDias(profissional.disponibilidade_dias);
  const horarios = formatHorarios(profissional.disponibilidade_horarios);
  const preco = formatPreco(service);

  return (
    <MainLayout>
      <section className="min-h-screen bg-cream py-8 dark:bg-navy-dark sm:py-12" aria-labelledby="service-title">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <nav aria-label="Navegação" className="mb-6">
            <Link
              href="/servicos"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg px-2 text-sm font-semibold text-neutral-700 transition-colors hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:text-cream-text dark:hover:text-orange-300"
            >
              <span aria-hidden="true">←</span>
              Voltar aos serviços
            </Link>
          </nav>

          <div className="grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
            <div className="min-w-0 space-y-6">
              <Card variant="liquid" padding="none" className="overflow-hidden border border-white/60 shadow-lg shadow-slate-900/5 dark:border-white/10 dark:shadow-black/20">
                <div className="relative overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                  <Image
                    src={IMAGENS.servicoPadrao}
                    alt={`Imagem ilustrativa para o serviço ${service.titulo}; não foi fornecida uma fotografia deste serviço.`}
                    width={1600}
                    height={900}
                    priority
                    sizes="(max-width: 1024px) 100vw, 65vw"
                    className="h-56 w-full object-cover sm:h-72 lg:h-80"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                </div>

                <div className="p-5 sm:p-8">
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    {service.categoria && <Badge variant="primary">{service.categoria.nome}</Badge>}
                    <Badge variant="neutral">Serviço aprovado</Badge>
                  </div>

                  <h1 id="service-title" className="break-words text-3xl font-bold leading-tight tracking-tight text-ink dark:text-cream sm:text-4xl">
                    {service.titulo}
                  </h1>

                  <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-neutral-700 dark:text-cream-text">
                    {localizacao ? (
                      <span className="inline-flex min-w-0 items-center gap-2">
                        <svg className="h-5 w-5 flex-shrink-0 text-orange-600 dark:text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
                          <circle cx="12" cy="10" r="2.5" strokeWidth="1.8" />
                        </svg>
                        <span className="break-words">{localizacao}</span>
                      </span>
                    ) : (
                      <span>Localização não informada</span>
                    )}
                    <span className="inline-flex items-center gap-2">
                      <RatingStarsOnly media={media.media} size="sm" />
                      <span>{media.total > 0 ? `${media.media.toFixed(1)} · ${media.total} avaliação(ões)` : 'Sem avaliações'}</span>
                    </span>
                  </div>

                  <div className="mt-7 rounded-2xl border border-orange-200/80 bg-orange-50/80 p-4 dark:border-orange-400/20 dark:bg-orange-950/25 sm:p-5">
                    <p className="text-sm font-medium text-neutral-600 dark:text-cream-text">Preço</p>
                    <p className="mt-1 break-words text-2xl font-bold text-orange-700 dark:text-orange-300 sm:text-3xl">{preco}</p>
                    {service.preco_tipo && service.preco_tipo !== 'fixo' && service.preco_tipo !== 'sob_consulta' && (
                      <p className="mt-1 text-xs text-neutral-600 dark:text-cream-text/80">
                        {service.preco_tipo === 'por_hora' ? 'Valor por hora' : service.preco_tipo === 'a_partir_de' ? 'Valor inicial indicativo' : ''}
                      </p>
                    )}
                  </div>

                  <section className="mt-8" aria-labelledby="descricao-titulo">
                    <h2 id="descricao-titulo" className="text-xl font-semibold text-ink dark:text-cream">Sobre este serviço</h2>
                    <p className="mt-3 whitespace-pre-wrap break-words leading-relaxed text-neutral-700 dark:text-neutral-200">
                      {service.descricao?.trim() || 'O profissional ainda não adicionou uma descrição para este serviço.'}
                    </p>
                  </section>

                  <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-card-border pt-6">
                    <ServiceWhatsApp
                      telefone={service.whatsapp}
                      fallbackTelefone={profissional.whatsapp}
                      label="Contactar no WhatsApp"
                    />
                    <Link
                      href={`/profissional/${profissional.slug}`}
                      aria-label={`Ver perfil público de ${profissional.nome}`}
                      className="inline-flex min-h-[52px] w-full items-center justify-center rounded-xl border border-card-border bg-white/80 px-5 py-3 text-center text-sm font-semibold text-ink shadow-sm transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:bg-white/5 dark:text-cream dark:hover:bg-white/10 sm:w-auto"
                    >
                      Ver perfil do profissional
                    </Link>
                  </div>
                </div>
              </Card>

              <Card variant="liquid" padding="md" className="border border-white/60 shadow-md shadow-slate-900/5 dark:border-white/10 dark:shadow-black/20 sm:p-7">
                <h2 className="text-xl font-semibold text-ink dark:text-cream">Avaliações do serviço</h2>
                <div className="mt-4">
                  <Rating media={media.media} total={media.total} size="lg" />
                </div>

                {avaliacoes.length > 0 ? (
                  <div className="mt-6 space-y-4">
                    {avaliacoes.map((avaliacao) => (
                      <article key={avaliacao.id} className="rounded-xl border border-card-border bg-white/70 p-4 dark:bg-white/5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-ink dark:text-cream">Cliente</p>
                            <RatingStarsOnly media={avaliacao.nota} size="sm" />
                          </div>
                          <time dateTime={avaliacao.created_at} className="text-xs text-neutral-500 dark:text-neutral-400">
                            {new Date(avaliacao.created_at).toLocaleDateString('pt-AO', {
                              day: '2-digit', month: 'long', year: 'numeric',
                            })}
                          </time>
                        </div>
                        {avaliacao.comentario && (
                          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-700 dark:text-neutral-200">
                            {avaliacao.comentario}
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="mt-5 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-600 dark:bg-white/5 dark:text-cream-text">
                    Este serviço ainda não recebeu avaliações.
                  </p>
                )}

                {user && <div className="mt-6"><ReviewForm alvo={alvo} userId={user.id} /></div>}
              </Card>
            </div>

            <aside className="min-w-0 space-y-6" aria-label="Informações do profissional e contacto">
              <Card variant="liquid" padding="md" className="border border-white/60 shadow-lg shadow-slate-900/5 dark:border-white/10 dark:shadow-black/20 sm:p-6">
                <h2 className="text-lg font-semibold text-ink dark:text-cream">O profissional</h2>
                <div className="mt-5 flex min-w-0 items-center gap-4">
                  <Avatar
                    src={profissional.avatar_url}
                    alt={`Fotografia de perfil de ${profissional.nome}`}
                    name={profissional.nome}
                    width={72}
                    height={72}
                    className="h-[72px] w-[72px] flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="break-words text-lg font-bold text-ink dark:text-cream">{profissional.nome}</h3>
                    {profissional.categoria && <p className="mt-1 break-words text-sm text-neutral-600 dark:text-cream-text">{profissional.categoria}</p>}
                  </div>
                </div>

                <div className="mt-5 space-y-3 text-sm text-neutral-700 dark:text-cream-text">
                  {(profissional.municipio || profissional.provincia) && (
                    <p><span className="font-semibold text-ink dark:text-cream">Localização:</span> {[profissional.municipio, profissional.provincia].filter(Boolean).join(', ')}</p>
                  )}
                  {profissional.anos_experiencia != null && profissional.anos_experiencia > 0 && (
                    <p><span className="font-semibold text-ink dark:text-cream">Experiência:</span> {profissional.anos_experiencia} {profissional.anos_experiencia === 1 ? 'ano' : 'anos'}</p>
                  )}
                  {profissional.bio && <p className="break-words leading-relaxed">{profissional.bio}</p>}
                  {dias && <p><span className="font-semibold text-ink dark:text-cream">Dias:</span> {dias}</p>}
                  {horarios && <p><span className="font-semibold text-ink dark:text-cream">Horários:</span> {horarios}</p>}
                </div>

                <Link
                  href={`/profissional/${profissional.slug}`}
                  className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-card-border bg-white/80 px-4 py-3 text-sm font-semibold text-ink transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:bg-white/5 dark:text-cream dark:hover:bg-white/10"
                >
                  Ver perfil completo
                </Link>
              </Card>

              <Card variant="liquid" padding="md" className="border border-white/60 shadow-md shadow-slate-900/5 dark:border-white/10 dark:shadow-black/20 sm:p-6">
                <h2 className="text-lg font-semibold text-ink dark:text-cream">Contactar o profissional</h2>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-cream-text">
                  Fale directamente com o profissional ou envie um pedido através do NegóMapa.
                </p>
                {!ehProprio && (
                  <div className="mt-4">
                    {user && ehProfissional ? (
                      <p role="status" className="text-sm text-neutral-600 dark:text-cream-text">{MENSAGEM_BLOQUEIO_PROFISSIONAL}</p>
                    ) : user ? (
                      <BotoesContactoServico servicoId={service.id} profissionalId={profissional.id} />
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-neutral-600 dark:text-cream-text">Entre na sua conta ou crie uma para pedir orçamento ou enviar mensagem.</p>
                        <Link
                          href={`/registar?redirectTo=${encodeURIComponent(`/servico/${slug}`)}`}
                          className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                        >
                          Entrar ou criar conta
                        </Link>
                      </div>
                    )}
                  </div>
                )}
                {ehProprio && <p className="mt-4 text-sm text-neutral-600 dark:text-cream-text">Este é o seu próprio serviço.</p>}
              </Card>

              <Card variant="liquid" padding="md" className="border border-white/60 dark:border-white/10 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-ink dark:text-cream">Segurança</h2>
                  {user && <ReportForm alvo={alvoDenuncia} userId={user.id} triggerLabel="Denunciar serviço" />}
                </div>
                <p className="mt-2 text-sm text-neutral-600 dark:text-cream-text">
                  Nunca partilhe passwords ou documentos pessoais numa conversa.
                </p>
              </Card>
            </aside>
          </div>

          <section className="mt-12 sm:mt-16" aria-labelledby="related-title">
            <div className="mb-6">
              <h2 id="related-title" className="text-2xl font-bold text-ink dark:text-cream">Serviços relacionados</h2>
              <p className="mt-2 text-sm text-neutral-600 dark:text-cream-text">
                Outros serviços aprovados na categoria {service.categoria?.nome ?? 'seleccionada'}.
              </p>
            </div>
            {relacionados.length > 0 ? (
              <div className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {relacionados.map((relacionado) => (
                  <Link key={relacionado.id} href={`/servico/${relacionado.slug}`} className="group block min-w-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500">
                    <Card variant="liquid" padding="md" hover className="h-full min-w-0 border border-white/60 shadow-md shadow-slate-900/5 dark:border-white/10 dark:shadow-black/20">
                      <h3 className="break-words text-lg font-semibold text-ink group-hover:text-orange-700 dark:text-cream dark:group-hover:text-orange-300">{relacionado.titulo}</h3>
                      <p className="mt-3 break-words text-sm font-semibold text-orange-700 dark:text-orange-300">
                        {relacionado.preco != null ? `${formatCurrency(relacionado.preco)}${relacionado.preco_tipo === 'por_hora' ? ' / hora' : ''}` : 'Preço sob consulta'}
                      </p>
                      <p className="mt-2 break-words text-sm text-neutral-600 dark:text-cream-text">
                        {[relacionado.municipio, relacionado.provincia].filter(Boolean).join(', ') || 'Localização não informada'}
                      </p>
                      <span className="mt-4 inline-flex min-h-[44px] items-center text-sm font-semibold text-orange-700 dark:text-orange-300">Ver serviço <span aria-hidden="true" className="ml-2 transition-transform group-hover:translate-x-1">→</span></span>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-card-border bg-white/60 p-6 text-sm text-neutral-600 dark:bg-white/5 dark:text-cream-text">
                Ainda não existem outros serviços aprovados nesta categoria.
              </p>
            )}
          </section>
        </div>
      </section>
    </MainLayout>
  );
}
