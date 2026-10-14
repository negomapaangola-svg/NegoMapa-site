import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatDate, truncate } from "@/lib/utils";
import { getUser } from "@/lib/auth";
import { getMediaAvaliacoes, getAvaliacoesPorAlvo, AlvoAvaliacao } from "@/lib/actions/avaliacoes";
import { Rating, RatingStarsOnly } from "@/components/avaliacoes/Rating";
import { ReviewForm } from "@/components/avaliacoes/ReviewForm";

interface Vaga {
  id: string;
  titulo: string;
  slug: string;
  descricao: string;
  requisitos: string | null;
  categoria: string;
  provincia: string;
  municipio: string | null;
  tipo_contrato: string | null;
  salario: string | null;
  whatsapp: string | null;
  estado: string;
  created_at: string;
  company: {
    id: string;
    name: string;
    slug: string;
    provincia: string | null;
  }[];
}

async function getVaga(slug: string): Promise<Vaga | null> {
  const supabase = await createSupabaseServerClient();

  // Primeiro, buscar IDs das empresas aprovadas
  const { data: approvedCompanies, error: companiesError } = await supabase
    .from("companies")
    .select("id")
    .eq("is_approved", true);

  if (companiesError) {
    console.error("Erro ao buscar empresas aprovadas:", companiesError);
    return null;
  }

  const approvedIds = (approvedCompanies ?? []).map((company) => company.id);

  console.log("Empresas aprovadas (detalhe):", approvedIds);

  if (approvedIds.length === 0) {
    return null;
  }

  // Buscar a vaga por slug, estado aprovado e company_id nas empresas aprovadas
  const { data, error } = await supabase
    .from("vagas")
    .select(
      `
      id,
      titulo,
      slug,
      descricao,
      requisitos,
      categoria,
      provincia,
      municipio,
      tipo_contrato,
      salario,
      whatsapp,
      estado,
      created_at,
      company:companies!company_id (
        id,
        name,
        slug,
        provincia
      )
    `
    )
    .eq("slug", slug)
    .eq("estado", "aprovado")
    .in("company_id", approvedIds)
    .single();

  console.log("Vaga detalhe:", data, "Erro:", error);

  if (error || !data) {
    return null;
  }

  return data as Vaga;
}

function cleanWhatsAppNumber(whatsapp: string): string {
  return whatsapp.replace(/[\s+\-()]/g, "");
}

function formatWhatsAppLink(whatsapp: string, titulo: string): string {
  const cleanNumber = cleanWhatsAppNumber(whatsapp);
  const encodedText = encodeURIComponent(
    `Olá, tenho interesse na vaga ${titulo}`
  );
  return `https://wa.me/${cleanNumber}?text=${encodedText}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const vaga = await getVaga(slug);

  if (!vaga) {
    return {
      title: "Vaga não encontrada | NegóMapa",
      description: "A vaga solicitada não existe ou não está disponível.",
    };
  }

  return {
    title: `${vaga.titulo} | NegóMapa`,
    description: truncate(vaga.descricao, 150),
    openGraph: {
      title: `${vaga.titulo} | NegóMapa`,
      description: truncate(vaga.descricao, 150),
      type: "website",
    },
  };
}

export default async function VagaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const vaga = await getVaga(slug);

  if (!vaga) {
    notFound();
  }

  const [user, media, avaliacoes] = await Promise.all([
    getUser(),
    getMediaAvaliacoes({ tipo: 'vaga', id: vaga.id }),
    getAvaliacoesPorAlvo({ tipo: 'vaga', id: vaga.id }),
  ]);

  const company = vaga.company[0];
  const publishedDate = formatDate(vaga.created_at);

  const alvo: AlvoAvaliacao = { tipo: 'vaga', id: vaga.id };

  return (
    <MainLayout>
      <div className="p-6 md:p-8 bg-cream dark:bg-navy-dark">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/vagas"
            className="inline-flex items-center gap-2 text-sm text-neutral-600 dark:text-cream-text/80 hover:text-orange-500 dark:hover:text-orange-400 mb-6 transition-colors"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Voltar às vagas
          </Link>

          <Card variant="liquid" padding="lg" className="space-y-8">
            <CardHeader className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-sm font-medium">
                  {vaga.categoria}
                </span>
                {vaga.tipo_contrato && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 text-sm font-medium">
                    {vaga.tipo_contrato}
                  </span>
                )}
              </div>

              <CardTitle as="h1" className="text-3xl md:text-4xl">
                {vaga.titulo}
              </CardTitle>

              {company && (
                <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600 dark:text-cream-text/80">
                  <Link
                    href={`/empresa/${company.slug}`}
                    className="flex items-center gap-1 hover:text-orange-500 dark:hover:text-orange-400 transition-colors font-medium"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    {company.name}
                  </Link>
                  <span className="flex items-center gap-1">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {vaga.provincia}
                    {vaga.municipio && `, ${vaga.municipio}`}
                    {company.provincia && ` • ${company.provincia}`}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Publicada em {publishedDate}
                  </span>
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-6">
              {vaga.salario && vaga.salario !== "A combinar" && (
                <div className="flex items-center gap-2 px-4 py-3 bg-accent-50 dark:bg-accent-900/20 rounded-[4px] border border-accent-100 dark:border-accent-900/30">
                  <svg
                    className="h-5 w-5 text-orange-500 dark:text-orange-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-semibold text-ink dark:text-cream">
                    Salário: {vaga.salario}
                  </span>
                </div>
              )}

              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <h2 className="text-xl font-bold text-ink dark:text-cream mb-3">
                  Descrição da Vaga
                </h2>
                <div className="whitespace-pre-wrap text-neutral-700 dark:text-cream-text leading-relaxed">
                  {vaga.descricao}
                </div>
              </div>

              {vaga.requisitos && vaga.requisitos.trim() && (
                <div className="prose prose-neutral dark:prose-invert max-w-none border-t border-card-border dark:border-neutral-800 pt-6">
                  <h2 className="text-xl font-bold text-ink dark:text-cream mb-3">
                    Requisitos
                  </h2>
                  <div className="whitespace-pre-wrap text-neutral-700 dark:text-cream-text leading-relaxed">
                    {vaga.requisitos}
                  </div>
                </div>
              )}

              <div className="border-t border-card-border dark:border-neutral-800 pt-6">
                <h2 className="text-xl font-bold text-ink dark:text-cream mb-4">
                  Candidatar-se
                </h2>
                {vaga.whatsapp && vaga.whatsapp.trim() ? (
                  <Link href={formatWhatsAppLink(vaga.whatsapp, vaga.titulo)} target="_blank" rel="noopener noreferrer">
                    <Button variant="liquid" size="lg" fullWidth className="w-full max-w-xs">
                      <svg
                        className="h-5 w-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.454.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.42 5.42h-.01a3.9 3.9 0 01-3.9-3.9V8.43a3.9 3.9 0 013.9-3.9h5.16a3.9 3.9 0 013.9 3.9v11.18c0 2.151-1.748 3.9-3.9 3.9h-5.16a3.9 3.9 0 01-3.9-3.9v-.22z" />
                      </svg>
                      Candidatar-se via WhatsApp
                    </Button>
                  </Link>
                ) : (
                  <p className="text-neutral-600 dark:text-cream-text/80">
                    Esta vaga não possui contacto WhatsApp para candidatura.
                  </p>
                )}
              </div>

              <div className="pt-6 border-t border-card-border dark:border-neutral-800">
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
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}