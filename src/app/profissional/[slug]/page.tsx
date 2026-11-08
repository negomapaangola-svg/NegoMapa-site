import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { IMAGENS } from '@/lib/imagens';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency, isHttpsUrl } from '@/lib/utils';
import { getUser } from '@/lib/auth';
import {
  obterProfissionalPublicoPorSlug,
  obterProfissionalContactoPorId,
  listarServicosAprovadosDoProfissional,
  type DisponibilidadeHorarios,
  type ProfissionalContactoPublico,
} from '@/lib/actions/profissionais-publicos';
import { obterPerfilProfissionalDoUtilizador } from '@/lib/actions/profissional-painel';
import { getAvaliacoesPorAlvo, getMediaAvaliacoes } from '@/lib/actions/avaliacoes';
import { EnviarMensagemButton } from './_components/EnviarMensagemButton';
import { ProfissionalWhatsApp } from './_components/ProfissionalWhatsApp';
import { AvaliacoesProfissional } from './_components/AvaliacoesProfissional';
import { PortfolioProfissional } from './_components/PortfolioProfissional';
import { MENSAGEM_BLOQUEIO_PROFISSIONAL } from '@/lib/mensagens-bloqueio';

type Params = Promise<{ slug: string }>;

const DIAS: Record<string, string> = {
  seg: 'Seg',
  ter: 'Ter',
  qua: 'Qua',
  qui: 'Qui',
  sex: 'Sex',
  sab: 'Sáb',
  dom: 'Dom',
};

const HORARIOS: Record<string, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
};

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const profissional = await obterProfissionalPublicoPorSlug(slug);
  if (!profissional) return { title: 'Profissional não encontrado | NegóMapa' };

  return {
    title: `${profissional.nome} | NegóMapa`,
    description: profissional.categoria
      ? `${profissional.nome}, ${profissional.categoria} em Angola.`
      : `Perfil de ${profissional.nome} na NegóMapa.`,
  };
}

function DisponibilidadeBadge({
  dias,
  horarios,
}: {
  dias: string[] | null;
  horarios: DisponibilidadeHorarios | null;
}) {
  const diasTexto = (dias ?? []).map((dia) => DIAS[dia] ?? dia).join(', ');
  const horariosTexto = horarios
    ? Object.entries(horarios)
        .filter(([, ativo]) => ativo === true)
        .map(([chave]) => HORARIOS[chave] ?? chave)
        .join(', ')
    : '';

  const texto = [diasTexto, horariosTexto].filter(Boolean).join(' · ');
  if (!texto) return null;

  return <Badge variant="neutral">Disponível: {texto}</Badge>;
}

function Avatar({ nome, avatarUrl }: { nome: string; avatarUrl: string | null }) {
  const mostrarImagem = isHttpsUrl(avatarUrl);

  return (
    <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-neutral-100 text-3xl font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-cream-text">
      {mostrarImagem && avatarUrl ? (
        <img src={avatarUrl} alt={nome} className="h-full w-full object-cover" />
      ) : (
        nome.charAt(0).toUpperCase()
      )}
    </div>
  );
}

export default async function ProfissionalPublicoPage({ params }: { params: Params }) {
  const { slug } = await params;
  const profissional = await obterProfissionalPublicoPorSlug(slug);
  if (!profissional) notFound();

  const [contacto, servicos, avaliacoes, resumo, user] = await Promise.all([
    obterProfissionalContactoPorId(profissional.id),
    listarServicosAprovadosDoProfissional(profissional.id),
    getAvaliacoesPorAlvo({ tipo: 'profissional', id: profissional.id }),
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

  let eDono = false;
  let ehProfissional = false;
  if (user) {
    const perfilProprio = await obterPerfilProfissionalDoUtilizador();
    eDono = perfilProprio?.id === dados.id;
    ehProfissional = !!perfilProprio;
  }

  const localizacao = [dados.municipio, dados.provincia].filter(Boolean).join(', ');
  const caminho = `/profissional/${dados.slug}`;

  return (
    <MainLayout>
      <section className="bg-white py-12 lg:py-16 dark:bg-navy-dark" aria-labelledby="profissional-nome">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <nav aria-label="Navegação" className="mb-8">
            <Link href="/profissionais" className="text-sm font-medium text-neutral-600 hover:text-orange-600 dark:text-cream-text dark:hover:text-orange-400">
              ← Voltar a profissionais
            </Link>
          </nav>

          <Image
            src={IMAGENS.profissionalCapaPadrao}
            alt=""
            width={1600}
            height={900}
            sizes="(max-width: 896px) 100vw, 896px"
            className="mb-10 h-auto w-full rounded-[24px] object-cover"
          />

          <header className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <Avatar nome={dados.nome} avatarUrl={dados.avatar_url} />
            <div>
              <h1 id="profissional-nome" className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-cream sm:text-4xl">
                {dados.nome}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-neutral-600 dark:text-cream-text">
                {dados.categoria && <Badge variant="neutral">{dados.categoria}</Badge>}
                {localizacao && <span className="text-sm">{localizacao}</span>}
                {dados.anos_experiencia != null && (
                  <span className="text-sm">
                    {dados.anos_experiencia} {dados.anos_experiencia === 1 ? 'ano' : 'anos'} de experiência
                  </span>
                )}
              </div>
              <div className="mt-4">
                <DisponibilidadeBadge
                  dias={dados.disponibilidade_dias}
                  horarios={dados.disponibilidade_horarios}
                />
              </div>
            </div>
          </header>

          <div className="mt-8 max-w-md">
            <ProfissionalWhatsApp whatsapp={dados.whatsapp} />
          </div>

          {user && !eDono && !ehProfissional && (
            <div className="mt-4">
              <EnviarMensagemButton profissionalId={dados.id} />
            </div>
          )}

          {user && !eDono && ehProfissional && (
            <p role="status" className="mt-4 text-sm text-neutral-600 dark:text-cream-text">
              {MENSAGEM_BLOQUEIO_PROFISSIONAL}
            </p>
          )}

          {!user && (
            <div className="mt-6 rounded-2xl bg-neutral-50 p-6 dark:bg-neutral-800">
              <p className="text-sm text-neutral-600 dark:text-cream-text">
                Crie uma conta gratuita para enviar mensagens a este profissional.
              </p>
              <div className="mt-4">
                <Button asChild>
                  <Link href={`/registar?redirectTo=${encodeURIComponent(caminho)}`}>Criar conta</Link>
                </Button>
              </div>
            </div>
          )}

          <section aria-labelledby="sobre-titulo" className="mt-14">
            <SectionHeader title="Sobre" />
            <p className="whitespace-pre-line text-neutral-700 dark:text-cream-text leading-relaxed">
              {dados.bio?.trim() || 'Este profissional ainda não adicionou uma descrição.'}
            </p>
          </section>

          <section className="mt-14">
            <PortfolioProfissional itens={dados.portfolio} />
          </section>

          <section className="mt-14">
            <AvaliacoesProfissional avaliacoes={avaliacoes} resumo={resumo} />
          </section>

          <section aria-labelledby="servicos-titulo" className="mt-14">
            <SectionHeader
              id="servicos-titulo"
              title="Serviços"
              description="Serviços publicados por este profissional."
            />

            {servicos.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {servicos.map((servico) => (
                  <Link key={servico.id} href={`/servico/${servico.slug}`} className="block h-full">
                    <Card variant="default" padding="md" hover className="h-full">
                      <CardHeader>
                        <CardTitle className="line-clamp-2">{servico.titulo}</CardTitle>
                        {servico.categoria && (
                          <CardDescription>{servico.categoria.nome}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="mt-auto">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-cream">
                          {servico.preco != null
                            ? `${formatCurrency(servico.preco)}${servico.preco_tipo ? ` ${servico.preco_tipo}` : ''}`
                            : 'Preço sob consulta'}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Ainda não há serviços"
                description="Os serviços aprovados deste profissional aparecerão aqui."
              />
            )}
          </section>
        </div>
      </section>
    </MainLayout>
  );
}
