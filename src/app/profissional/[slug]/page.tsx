import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { IMAGENS } from '@/lib/imagens';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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

function DisponibilidadeLinha({
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

  return (
    <p className="mt-4 text-sm text-neutral-600 dark:text-cream-text">
      <span className="font-medium text-ink dark:text-cream">Disponibilidade:</span> {texto}
    </p>
  );
}

function Avatar({ nome, avatarUrl }: { nome: string; avatarUrl: string | null }) {
  const mostrarImagem = isHttpsUrl(avatarUrl);

  return (
    <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10 text-2xl font-semibold text-neutral-600 dark:text-cream">
      {mostrarImagem && avatarUrl ? (
        <img src={avatarUrl} alt={nome} className="h-full w-full object-cover" />
      ) : (
        <Image src={IMAGENS.avatarPadrao} alt="" width={400} height={400} sizes="80px" className="h-full w-full object-cover" />
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

  // Dados completos da vista pública (só aprovados). Se falhar, mostra-se o perfil básico.
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

  // Não mostrar "Enviar mensagem" a quem é o próprio profissional, nem a outras contas de profissional.
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
      <section className="py-16 lg:py-24 bg-cream dark:bg-navy-dark" aria-labelledby="profissional-nome">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <nav aria-label="Navegação" className="mb-6">
            <Link href="/profissionais" className="text-sm text-neutral-600 dark:text-cream-text hover:underline">
              ← Voltar a profissionais
            </Link>
          </nav>

          <Image
            src={IMAGENS.profissionalCapaPadrao}
            alt=""
            width={1600}
            height={900}
            sizes="(max-width: 896px) 100vw, 896px"
            className="mb-8 h-auto w-full rounded-[16px] object-cover"
          />

          <header className="flex items-center gap-6">
            <Avatar nome={dados.nome} avatarUrl={dados.avatar_url} />
            <div>
              <h1 id="profissional-nome" className="text-4xl sm:text-5xl font-bold tracking-tight text-ink dark:text-cream">
                {dados.nome}
              </h1>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-neutral-600 dark:text-cream-text">
                {dados.categoria && <span>{dados.categoria}</span>}
                {localizacao && <span>{localizacao}</span>}
                {dados.anos_experiencia != null && (
                  <span>
                    {dados.anos_experiencia} {dados.anos_experiencia === 1 ? 'ano' : 'anos'} de experiência
                  </span>
                )}
              </div>
            </div>
          </header>

          <DisponibilidadeLinha dias={dados.disponibilidade_dias} horarios={dados.disponibilidade_horarios} />

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <ProfissionalWhatsApp whatsapp={dados.whatsapp} />

            {user && !eDono && !ehProfissional && <EnviarMensagemButton profissionalId={dados.id} />}
            {user && !eDono && ehProfissional && (
              <p role="status" className="text-neutral-600 dark:text-cream-text">
                {MENSAGEM_BLOQUEIO_PROFISSIONAL}
              </p>
            )}
            {!user && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <p className="text-neutral-600 dark:text-cream-text">
                  Crie uma conta gratuita para enviar mensagens a este profissional.
                </p>
                <Button size="lg" asChild>
                  <Link href={`/registar?redirectTo=${encodeURIComponent(caminho)}`}>Criar conta</Link>
                </Button>
              </div>
            )}
          </div>

          <section aria-labelledby="sobre-titulo" className="mt-12">
            <h2 id="sobre-titulo" className="text-2xl font-semibold text-ink dark:text-cream">Sobre</h2>
            <p className="mt-4 whitespace-pre-line text-neutral-700 dark:text-cream-text leading-relaxed">
              {dados.bio?.trim() || 'Este profissional ainda não adicionou uma descrição.'}
            </p>
          </section>

          <PortfolioProfissional itens={dados.portfolio} />

          <AvaliacoesProfissional avaliacoes={avaliacoes} resumo={resumo} />

          <section aria-labelledby="servicos-titulo" className="mt-12">
            <h2 id="servicos-titulo" className="text-2xl font-semibold text-ink dark:text-cream">Serviços</h2>

            {servicos.length > 0 ? (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6" role="list" aria-label="Serviços do profissional">
                {servicos.map((servico) => (
                  <div key={servico.id} role="listitem">
                    <Link href={`/servico/${servico.slug}`} className="block h-full">
                      <Card variant="liquid" padding="md" hover className="h-full flex flex-col border-card-border">
                        <CardHeader>
                          <CardTitle className="text-lg line-clamp-2">{servico.titulo}</CardTitle>
                          {servico.categoria && (
                            <CardDescription className="text-sm">{servico.categoria.nome}</CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="mt-auto">
                          <p className="text-sm font-medium text-ink dark:text-cream">
                            {servico.preco != null
                              ? `${formatCurrency(servico.preco)}${servico.preco_tipo ? ` ${servico.preco_tipo}` : ''}`
                              : 'Preço sob consulta'}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-neutral-600 dark:text-cream-text">Não há serviços aprovados de momento.</p>
            )}
          </section>
        </div>
      </section>
    </MainLayout>
  );
}
