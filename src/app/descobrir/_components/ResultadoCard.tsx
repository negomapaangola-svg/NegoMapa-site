import Image from 'next/image';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { IMAGENS } from '@/lib/imagens';
import type { ServicoDescobrir } from '@/lib/descobrir/buscar-servicos';

/** Cartão de resultado. Nesta fase só há serviços; a variação por tipo fica para a fase seguinte. */
export function ResultadoCard({ servico }: { servico: ServicoDescobrir }) {
  const precoTexto =
    servico.preco === null
      ? 'Sob consulta'
      : `${formatCurrency(servico.preco)}${servico.preco_tipo ? ` / ${servico.preco_tipo}` : ''}`;

  const localizacao = [servico.provincia, servico.municipio].filter(Boolean).join(', ') || 'Angola';

  const avaliacaoTexto = servico.avaliacao
    ? `${servico.avaliacao.media.toFixed(1).replace('.', ',')} · ${
        servico.avaliacao.total === 1 ? '1 avaliação' : `${servico.avaliacao.total} avaliações`
      }`
    : 'Sem avaliações';

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-card-border bg-white/85 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md focus-within:ring-2 focus-within:ring-orange-500 dark:bg-neutral-800/85">
      <div className="relative aspect-[4/3] w-full bg-neutral-100 dark:bg-neutral-700">
        <Image
          src={IMAGENS.servicoPadrao}
          alt=""
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 100vw"
          className="object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="inline-flex w-fit items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
          Serviço
        </span>

        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-ink dark:text-cream">
          {/* O link cobre o cartão inteiro; o botão visual é apenas indicativo. */}
          <Link
            href={`/servico/${servico.slug}`}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {servico.titulo}
          </Link>
        </h3>

        <p className="text-base font-bold text-orange-600 dark:text-orange-400">{precoTexto}</p>

        <p className="flex items-center gap-1.5 text-sm text-neutral-600 dark:text-cream-text/80">
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="min-w-0 truncate">{localizacao}</span>
        </p>

        <p className="text-sm text-neutral-700 dark:text-cream-text">{avaliacaoTexto}</p>

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
