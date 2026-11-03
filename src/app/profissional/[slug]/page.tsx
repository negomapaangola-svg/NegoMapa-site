import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import { getUser } from '@/lib/auth';
import {
  obterProfissionalPublicoPorSlug,
  listarServicosAprovadosDoProfissional,
} from '@/lib/actions/profissionais-publicos';
import { obterPerfilProfissionalDoUtilizador } from '@/lib/actions/profissional-painel';
import { EnviarMensagemButton } from './_components/EnviarMensagemButton';
import { MENSAGEM_BLOQUEIO_PROFISSIONAL } from '@/lib/mensagens-bloqueio';

type Params = Promise<{ slug: string }>;

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

export default async function ProfissionalPublicoPage({ params }: { params: Params }) {
  const { slug } = await params;
  const profissional = await obterProfissionalPublicoPorSlug(slug);
  if (!profissional) notFound();

  const [servicos, user] = await Promise.all([
    listarServicosAprovadosDoProfissional(profissional.id),
    getUser(),
  ]);

  // Não mostrar "Enviar mensagem" a quem é o próprio profissional, nem a outras contas de profissional.
  let eDono = false;
  let ehProfissional = false;
  if (user) {
    const perfilProprio = await obterPerfilProfissionalDoUtilizador();
    eDono = perfilProprio?.id === profissional.id;
    ehProfissional = !!perfilProprio;
  }

  const localizacao = [profissional.municipio, profissional.provincia].filter(Boolean).join(', ');
  const caminho = `/profissional/${profissional.slug}`;

  return (
    <MainLayout>
      <section className="py-16 lg:py-24 bg-cream dark:bg-navy-dark" aria-labelledby="profissional-nome">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <nav aria-label="Navegação" className="mb-6">
            <Link href="/profissionais" className="text-sm text-neutral-600 dark:text-cream-text hover:underline">
              ← Voltar a profissionais
            </Link>
          </nav>

          <header>
            <h1 id="profissional-nome" className="text-4xl sm:text-5xl font-bold tracking-tight text-ink dark:text-cream">
              {profissional.nome}
            </h1>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-neutral-600 dark:text-cream-text">
              {profissional.categoria && <span>{profissional.categoria}</span>}
              {localizacao && <span>{localizacao}</span>}
              {profissional.anos_experiencia != null && (
                <span>
                  {profissional.anos_experiencia} {profissional.anos_experiencia === 1 ? 'ano' : 'anos'} de experiência
                </span>
              )}
            </div>
          </header>

          <div className="mt-8">
            {user && !eDono && !ehProfissional && <EnviarMensagemButton profissionalId={profissional.id} />}
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
              {profissional.bio?.trim() || 'Este profissional ainda não adicionou uma descrição.'}
            </p>
          </section>

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
