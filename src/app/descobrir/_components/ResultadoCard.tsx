import Image from 'next/image';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { IMAGENS } from '@/lib/imagens';
import type { ServicoDescobrir } from '@/lib/descobrir/buscar-servicos';
import type { ProdutoDescobrir } from '@/lib/descobrir/buscar-produtos';

type ItemResultado = ServicoDescobrir | ProdutoDescobrir;

export function ResultadoCard({ item }: { item: ItemResultado }) {
  const ehProduto = 'estado_produto' in item;
  const precoTexto =
    item.preco === null || item.preco_tipo === 'sob_consulta'
      ? 'Sob consulta'
      : `${formatCurrency(item.preco ?? 0)} Kz`;

  const localizacao = [item.provincia, item.municipio].filter(Boolean).join(', ') || 'Angola';
  const href = ehProduto ? `/produto/${item.slug}` : `/servico/${item.slug}`;
  const imagem = (ehProduto && 'imagem' in item ? item.imagem : null) ?? IMAGENS.servicoPadrao;

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-card-border bg-white/85 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md focus-within:ring-2 focus-within:ring-orange-500 dark:bg-neutral-800/85">
      <div className="relative aspect-[4/3] w-full bg-neutral-100 dark:bg-neutral-700">
        <Image
          src={imagem}
          alt=""
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 100vw"
          loading="lazy"
          className="object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="inline-flex w-fit items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
          {ehProduto ? 'Produto' : 'Serviço'}
        </span>

        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-ink dark:text-cream">
          <Link
            href={href}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {item.titulo}
          </Link>
        </h3>

        <p className="text-base font-bold text-orange-600 dark:text-orange-400">{precoTexto}</p>

        {typeof item.distancia_km === 'number' && <p className="text-sm font-medium text-orange-700 dark:text-orange-300">≈ {item.distancia_km} km de distância</p>}

        <p className="flex items-center gap-1.5 text-sm text-neutral-600 dark:text-cream-text/80">
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="min-w-0 truncate">{localizacao}</span>
        </p>

        {ehProduto && (
          <p className="text-sm font-medium text-neutral-700 dark:text-cream-text">
            {item.estado_produto === 'novo' ? 'Novo' : 'Usado'}
          </p>
        )}

        {!ehProduto && (
          <p className="text-sm text-neutral-700 dark:text-cream-text">
            {item.avaliacao
              ? `${item.avaliacao.media.toFixed(1).replace('.', ',')} · ${item.avaliacao.total === 1 ? '1 avaliação' : `${item.avaliacao.total} avaliações`}`
              : 'Sem avaliações'}
          </p>
        )}

        <div className="mt-auto pt-2">
          <span
            aria-hidden="true"
            className="inline-flex min-h-[44px] items-center rounded-[4px] bg-orange-500 px-4 text-sm font-bold text-ink shadow-sm"
          >
            Ver detalhes
          </span>
        </div>
      </div>
    </article>
  );
}
