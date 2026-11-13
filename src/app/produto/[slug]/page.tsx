import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { formatCurrency } from '@/lib/utils';
import { IMAGENS } from '@/lib/imagens';

interface ProdutoRaw {
  id: string;
  categoria_id: string;
  slug: string;
  titulo: string;
  descricao: string | null;
  preco: number | null;
  preco_tipo: string;
  estado_produto: string;
  entrega: string;
  provincia: string;
  municipio: string | null;
}

async function obterProduto(slug: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('produtos_publicos')
    .select('id, categoria_id, slug, titulo, descricao, preco, preco_tipo, estado_produto, entrega, provincia, municipio')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error('Erro ao buscar produto público. Código:', error.code);
    return null;
  }

  const produto = data as ProdutoRaw;
  const [{ data: categoria }, { data: imagens }] = await Promise.all([
    supabase.from('categorias').select('id,nome,slug').eq('id', produto.categoria_id).maybeSingle(),
    supabase.from('produto_imagens').select('url,ordem').eq('produto_id', produto.id).order('ordem'),
  ]);
  const urls: string[] = [];
  for (const imagem of imagens ?? []) {
    const { data: assinada } = await supabase.storage.from('produtos').createSignedUrl(imagem.url, 60 * 60);
    if (assinada?.signedUrl) urls.push(assinada.signedUrl);
  }
  return { ...produto, categoria, imagens: urls };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const produto = await obterProduto(slug);
  return {
    title: produto?.titulo ?? 'Produto não encontrado',
    description: produto?.descricao ?? 'Produto disponível no NegóMapa.',
  };
}

const rotulosEntrega: Record<string, string> = {
  gratuita: 'Entrega gratuita',
  paga: 'Entrega paga',
  a_combinar: 'Entrega a combinar',
};

export default async function ProdutoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const produto = await obterProduto(slug);
  if (!produto) notFound();

  const localizacao = [produto.provincia, produto.municipio].filter(Boolean).join(', ') || 'Angola';
  const precoTexto = produto.preco_tipo === 'sob_consulta' ? 'Sob consulta' : `${formatCurrency(produto.preco ?? 0)} Kz`;

  return (
    <MainLayout>
      <section className="bg-cream py-10 dark:bg-navy-dark lg:py-16" aria-labelledby="produto-titulo">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Link href="/descobrir?tipo=produtos" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-orange-500 dark:text-cream-text/70 dark:hover:text-orange-300">
            ← Voltar aos produtos
          </Link>
          <Card variant="liquid" padding="lg" className="mt-6 border-card-border">
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-3">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-700">
                  <Image src={produto.imagens[0] ?? IMAGENS.servicoPadrao} alt={produto.titulo} width={1200} height={900} priority sizes="(max-width: 768px) 100vw, 50vw" className="h-full w-full object-cover" />
                </div>
                {produto.imagens.length > 1 && (
                  <div className="grid grid-cols-3 gap-3">
                    {produto.imagens.slice(1, 6).map((url, indice) => (
                      <div key={url} className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-700">
                        <Image src={url} alt={`${produto.titulo} — imagem ${indice + 2}`} width={400} height={400} loading="lazy" sizes="(max-width: 768px) 33vw, 150px" className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                {produto.categoria && <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">{produto.categoria.nome}</span>}
                <h1 id="produto-titulo" className="mt-3 text-3xl font-bold text-ink dark:text-cream">{produto.titulo}</h1>
                <p className="mt-3 text-2xl font-bold text-orange-600 dark:text-orange-400">{precoTexto}</p>
                <dl className="mt-6 space-y-3 text-sm">
                  <div><dt className="font-semibold text-ink dark:text-cream">Localização</dt><dd className="text-neutral-600 dark:text-cream-text">{localizacao}</dd></div>
                  <div><dt className="font-semibold text-ink dark:text-cream">Estado</dt><dd className="text-neutral-600 dark:text-cream-text">{produto.estado_produto === 'novo' ? 'Novo' : 'Usado'}</dd></div>
                  <div><dt className="font-semibold text-ink dark:text-cream">Entrega</dt><dd className="text-neutral-600 dark:text-cream-text">{rotulosEntrega[produto.entrega] ?? 'A combinar'}</dd></div>
                </dl>
                {produto.descricao && <div className="mt-6"><h2 className="text-lg font-semibold text-ink dark:text-cream">Descrição</h2><p className="mt-2 whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">{produto.descricao}</p></div>}
                <p className="mt-8 rounded-xl border border-card-border bg-white/70 p-4 text-sm text-neutral-600 dark:bg-neutral-800/70 dark:text-cream-text">
                  Os contactos privados do anunciante não são disponibilizados nesta ficha pública.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
}
