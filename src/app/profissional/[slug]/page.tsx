import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Rating } from '@/components/avaliacoes/Rating';
import { IMAGENS } from '@/lib/imagens';
import { formatCurrency } from '@/lib/utils';
import { getUser } from '@/lib/auth';
import {
  obterProfissionalPublicoPorSlug,
  obterProfissionalContactoPorId,
  listarServicosAprovadosDoProfissional,
  listarServicosRelacionadosDoProfissional,
  type DisponibilidadeHorarios,
  type ProfissionalContactoPublico,
} from '@/lib/actions/profissionais-publicos';
import { obterPerfilProfissionalDoUtilizador } from '@/lib/actions/profissional-painel';
import { getAvaliacoesPublicasPorProfissional, getMediaAvaliacoes } from '@/lib/actions/avaliacoes';
import { EnviarMensagemButton } from './_components/EnviarMensagemButton';
import { ProfissionalWhatsApp } from './_components/ProfissionalWhatsApp';
import { AvaliacoesProfissional } from './_components/AvaliacoesProfissional';
import { PortfolioProfissional } from './_components/PortfolioProfissional';
import { MENSAGEM_BLOQUEIO_PROFISSIONAL } from '@/lib/mensagens-bloqueio';

type Params = Promise<{ slug: string }>;

const DIAS: Record<string, string> = {
  seg: 'Seg', ter: 'Ter', qua: 'Qua', qui: 'Qui',
  sex: 'Sex', sab: 'Sáb', dom: 'Dom',
};

const HORARIOS: Record<string, string> = {
  manha: 'Manhã', tarde: 'Tarde', noite: 'Noite',
};

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const profissional = await obterProfissionalPublicoPorSlug(slug);
  if (!profissional) return { title: 'Profissional não encontrado | NegóMapa' };

  return {
    title: `${profissional.nome} | NegóMapa`,
    description: profissional.categoria
      ? `Conheça ${profissional.nome}, profissional de ${profissional.categoria} em Angola.`
      : `Conheça o perfil profissional de ${profissional.nome} no NegóMapa.`,
  };
}

function Disponibilidade({ dias, horarios }: {
  dias: string[] | null;
  horarios: DisponibilidadeHorarios | null;
}) {
  const diasTexto = (dias ?? []).map((dia) => DIAS[dia] ?? dia).join(', ');
  const horariosTexto = horarios
    ? Object.entries(horarios).filter(([, ativo]) => ativo === true)
        .map(([chave]) => HORARIOS[chave] ?? chave).join(', ')
    : '';
  const texto = [diasTexto, horariosTexto].filter(Boolean).join(' · ');
  return texto ? <Badge variant="neutral">Disponibilidade: {texto}</Badge> : null;
}

function precoServico(preco: number | null, tipo: string | null) {
  if (preco == null || tipo === 'sob_consulta') return 'Preço sob consulta';
  const prefixo = tipo === 'a_partir_de' ? 'A partir de ' : '';
  const sufixo = tipo === 'por_hora' ? ' / hora' : '';
  return `${prefixo}${formatCurrency(preco)}${sufixo}`;
}

export default async function ProfissionalPublicoPage({ params }: { params: Params }) {
  const { slug } = await params;
  const profissional = await obterProfissionalPublicoPorSlug(slug);
  // A vista profissionais_publicos só devolve registos com estado aprovado.
  if (!profissional) notFound();

  const [contacto, servicos, avaliacoes, resumo, user] = await Promise.all([
    obterProfissionalContactoPorId(profissional.id),
    listarServicosAprovadosDoProfissional(profissional.id),
    getAvaliacoesPublicasPorProfissional(profissional.id),
    getMediaAvaliacoes({ tipo: 'profissional', id: profissional.id }),
    getUser(),
  ]);

  const dados: ProfissionalContactoPublico = contacto ?? {
    ...profissional,
    whatsapp: null,
    avatar_url: null,
    portfolio: null,
    disponibilidade_dias: null,
    disponibilidade_horarios: null,
    especialidades: null,
    experiencia_faixa: null,
    faixa_preco_desde: null,
  };

  const relacionados = await listarServicosRelacionadosDoProfissional(
    profissional.categoria_id,
    profissional.id
  );

  let eDono = false;
  let ehProfissional = false;
  if (user) {
    const perfilProprio = await obterPerfilProfissionalDoUtilizador();
    eDono = perfilProprio?.id === dados.id;
    ehProfissional = !!perfilProprio;
  }

  const localizacao = [dados.municipio, dados.provincia].filter(Boolean).join(', ');
  const caminho = `/profissional/${dados.slug}`;
  const especialidades = (dados.especialidades ?? []).filter(
    (item): item is string => typeof item === 'string' && item.trim().length > 0
  );

  return (
    <MainLayout>
      <main className="min-w-0 overflow-x-clip bg-cream py-7 dark:bg-navy-dark sm:py-10" aria-labelledby="profissional-nome">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <nav aria-label="Navegação" className="mb-6">
            <Link
              href="/profissionais"
              className="inline-flex min-h-[44px] items-center rounded-lg px-2 text-sm font-semibold text-neutral-700 transition-colors hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:text-cream-text dark:hover:text-orange-300"
            >
              <span aria-hidden="true" className="mr-2">←</span> Voltar a profissionais
            </Link>
          </nav>

          <Card variant="liquid" padding="none" className="overflow-hidden border border-white/70 shadow-xl shadow-slate-900/5 dark:border-white/10 dark:shadow-black/20">
            <div className="relative h-36 overflow-hidden bg-orange-50 dark:bg-neutral-900 sm:h-48 lg:h-56">
              <Image
                src={IMAGENS.profissionalCapaPadrao}
                alt=""
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 1152px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/55 via-slate-950/15 to-transparent" aria-hidden="true" />
              <div className="absolute bottom-4 left-5 sm:bottom-6 sm:left-8">
                {dados.categoria && <Badge variant="primary">{dados.categoria}</Badge>}
              </div>
            </div>

            <div className="p-5 sm:p-8">
              <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-end">
                <Avatar
                  src={dados.avatar_url}
                  alt={`Fotografia de perfil de ${dados.nome}`}
                  name={dados.nome}
                  width={112}
                  height={112}
                  priority
                  className="h-24 w-24 shrink-0 rounded-2xl border-4 border-white shadow-lg dark:border-neutral-900 sm:-mt-16 sm:h-28 sm:w-28"
                />
                <div className="min-w-0 flex-1">
                  <h1 id="profissional-nome" className="break-words text-3xl font-bold tracking-tight text-ink dark:text-cream sm:text-4xl">
                    {dados.nome}
                  </h1>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-neutral-600 dark:text-cream-text">
                    {localizacao ? (
                      <span className="inline-flex min-w-0 items-center gap-2">
                        <span aria-hidden="true">⌖</span><span className="break-words">{localizacao}</span>
                      </span>
                    ) : (
                      <span>Localização não informada</span>
                    )}
                    {dados.anos_experiencia != null && (
                      <span>{dados.anos_experiencia} {dados.anos_experiencia === 1 ? 'ano' : 'anos'} de experiência</span>
                    )}
                  </div>
                </div>
                <div className="rounded-2xl border border-card-border bg-white/75 px-4 py-3 dark:bg-white/5">
                  <Rating media={resumo.media} total={resumo.total} size="md" />
                </div>
              </div>

              <div className="mt-7 flex flex-col gap-3 border-t border-card-border pt-6 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="w-full sm:w-auto sm:min-w-[250px]">
                  <ProfissionalWhatsApp whatsapp={dados.whatsapp} />
                </div>
                <a
                  href="#servicos"
                  className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-card-border bg-white/80 px-5 py-3 text-center text-sm font-semibold text-ink shadow-sm transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:bg-white/5 dark:text-cream dark:hover:bg-white/10 sm:w-auto"
                >
                  Ver serviços
                </a>
                {user && !eDono && !ehProfissional && <EnviarMensagemButton profissionalId={dados.id} />}
              </div>

              {user && !eDono && ehProfissional && (
                <p role="status" className="mt-4 text-sm text-neutral-600 dark:text-cream-text">
                  {MENSAGEM_BLOQUEIO_PROFISSIONAL}
                </p>
              )}
              {!user && (
                <div className="mt-4 rounded-2xl border border-card-border bg-neutral-50/80 p-4 dark:bg-white/5 sm:flex sm:items-center sm:justify-between sm:gap-4">
                  <p className="text-sm text-neutral-700 dark:text-cream-text">
                    Crie uma conta gratuita para enviar mensagens através do NegóMapa.
                  </p>
                  <Button asChild className="mt-3 min-h-[44px] w-full sm:mt-0 sm:w-auto">
                    <Link href={`/registar?redirectTo=${encodeURIComponent(caminho)}`}>Criar conta</Link>
                  </Button>
                </div>
              )}
            </div>
          </Card>

          <div className="mt-7 grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.72fr)]">
            <div className="min-w-0 space-y-6">
              <Card variant="liquid" padding="lg" className="min-w-0 border border-white/70 shadow-md shadow-slate-900/5 dark:border-white/10 dark:shadow-black/20">
                <section aria-labelledby="sobre-titulo">
                  <h2 id="sobre-titulo" className="text-xl font-bold text-ink dark:text-cream">Sobre o profissional</h2>
                  <p className="mt-3 whitespace-pre-line break-words leading-relaxed text-neutral-700 dark:text-cream-text">
                    {dados.bio?.trim() || 'Este profissional ainda não adicionou uma descrição.'}
                  </p>
                </section>
                {especialidades.length > 0 && (
                  <section aria-labelledby="especialidades-titulo" className="mt-7 border-t border-card-border pt-6">
                    <h2 id="especialidades-titulo" className="text-lg font-semibold text-ink dark:text-cream">Especialidades</h2>
                    <ul className="mt-3 flex flex-wrap gap-2" aria-label="Especialidades do profissional">
                      {especialidades.map((especialidade, index) => (
                        <li key={`${especialidade}-${index}`}>
                          <Badge variant="neutral" className="max-w-full whitespace-normal break-words px-3 py-2 text-xs">{especialidade}</Badge>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                {(dados.disponibilidade_dias?.length || dados.disponibilidade_horarios) && (
                  <div className="mt-6 border-t border-card-border pt-5">
                    <Disponibilidade dias={dados.disponibilidade_dias} horarios={dados.disponibilidade_horarios} />
                  </div>
                )}
              </Card>

              <Card variant="liquid" padding="lg" className="border border-white/70 shadow-md shadow-slate-900/5 dark:border-white/10 dark:shadow-black/20">
                <section aria-labelledby="avaliacoes-titulo">
                  <h2 id="avaliacoes-titulo" className="text-xl font-bold text-ink dark:text-cream">Avaliações e classificação</h2>
                  <div className="mt-4 rounded-xl bg-neutral-50/80 p-4 dark:bg-white/5">
                    <Rating media={resumo.media} total={resumo.total} size="lg" />
                  </div>
                  <AvaliacoesProfissional avaliacoes={avaliacoes} resumo={resumo} />
                </section>
              </Card>

              <Card variant="liquid" padding="lg" className="border border-white/70 shadow-md shadow-slate-900/5 dark:border-white/10 dark:shadow-black/20">
                <PortfolioProfissional itens={dados.portfolio} />
              </Card>
            </div>

            <aside className="min-w-0 space-y-6" aria-label="Serviços e contacto do profissional">
              <Card variant="liquid" padding="lg" className="border border-white/70 shadow-md shadow-slate-900/5 dark:border-white/10 dark:shadow-black/20">
                <h2 className="text-lg font-bold text-ink dark:text-cream">Contactar</h2>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-cream-text">
                  Tem interesse nos serviços deste profissional? Entre em contacto directamente ou envie uma mensagem pela plataforma.
                </p>
                <a
                  href="#servicos"
                  className="mt-4 inline-flex min-h-[44px] items-center text-sm font-semibold text-orange-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:text-orange-300"
                >
                  Explorar serviços publicados
                </a>
              </Card>
            </aside>
          </div>

          <section id="servicos" className="mt-10 scroll-mt-24" aria-labelledby="servicos-titulo">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id="servicos-titulo" className="text-2xl font-bold text-ink dark:text-cream">Serviços publicados</h2>
                <p className="mt-1 text-sm text-neutral-600 dark:text-cream-text">Serviços aprovados e disponíveis deste profissional.</p>
              </div>
              <Badge variant="neutral">{servicos.length} {servicos.length === 1 ? 'serviço' : 'serviços'}</Badge>
            </div>

            {servicos.length > 0 ? (
              <div className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2">
                {servicos.map((servico) => (
                  <Link
                    key={servico.id}
                    href={`/servico/${servico.slug}`}
                    className="group block min-w-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-navy-dark"
                    aria-label={`Ver serviço ${servico.titulo}`}
                  >
                    <Card variant="liquid" padding="lg" hover className="h-full min-w-0 border border-white/70 shadow-sm dark:border-white/10">
                      {servico.categoria && <Badge variant="neutral">{servico.categoria.nome}</Badge>}
                      <h3 className="mt-3 break-words text-lg font-bold text-ink transition-colors group-hover:text-orange-700 dark:text-cream dark:group-hover:text-orange-300">
                        {servico.titulo}
                      </h3>
                      <p className="mt-3 break-words text-sm leading-relaxed text-neutral-600 dark:text-cream-text">
                        {servico.descricao?.trim() || 'Consulte os detalhes deste serviço.'}
                      </p>
                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-card-border pt-4">
                        <span className="break-words text-sm font-bold text-orange-700 dark:text-orange-300">
                          {precoServico(servico.preco, servico.preco_tipo)}
                        </span>
                        <span className="inline-flex min-h-[44px] items-center text-sm font-semibold text-ink dark:text-cream">
                          Ver serviço <span aria-hidden="true" className="ml-2">→</span>
                        </span>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Ainda não há serviços publicados"
                description="Quando este profissional tiver serviços aprovados, serão apresentados aqui."
              />
            )}
          </section>

          <section className="mt-12" aria-labelledby="relacionados-titulo">
            <div className="mb-5">
              <h2 id="relacionados-titulo" className="text-2xl font-bold text-ink dark:text-cream">Serviços relacionados</h2>
              <p className="mt-1 text-sm text-neutral-600 dark:text-cream-text">Outras opções aprovadas na mesma área de actuação.</p>
            </div>
            {relacionados.length > 0 ? (
              <div className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {relacionados.map((servico) => (
                  <Link key={servico.id} href={`/servico/${servico.slug}`} className="group block min-w-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500">
                    <Card variant="liquid" padding="md" hover className="h-full min-w-0 border border-white/70 shadow-sm dark:border-white/10">
                      <h3 className="break-words text-lg font-semibold text-ink group-hover:text-orange-700 dark:text-cream dark:group-hover:text-orange-300">{servico.titulo}</h3>
                      <p className="mt-3 break-words text-sm font-semibold text-orange-700 dark:text-orange-300">{precoServico(servico.preco, servico.preco_tipo)}</p>
                      <p className="mt-2 break-words text-sm text-neutral-600 dark:text-cream-text">
                        {[servico.municipio, servico.provincia].filter(Boolean).join(', ') || 'Localização não informada'}
                      </p>
                      <span className="mt-4 inline-flex min-h-[44px] items-center text-sm font-semibold text-ink dark:text-cream">Explorar serviço <span aria-hidden="true" className="ml-2">→</span></span>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Sem serviços relacionados"
                description="De momento não existem outros serviços aprovados nesta categoria."
              />
            )}
          </section>
        </div>
      </main>
    </MainLayout>
  );
}
