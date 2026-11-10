import { Rating } from '@/components/avaliacoes/Rating';
import { formatDate } from '@/lib/utils';
import type { AvaliacaoPublicaProfissional, MediaAvaliacoes } from '@/lib/actions/avaliacoes';

interface AvaliacoesProfissionalProps {
  avaliacoes: AvaliacaoPublicaProfissional[];
  resumo: MediaAvaliacoes;
}

/** Avaliações sem identidade ou contactos do cliente. Emails escritos no comentário são ocultados. */
export function AvaliacoesProfissional({ avaliacoes, resumo }: AvaliacoesProfissionalProps) {
  const comentarioSeguro = (comentario: string) =>
    comentario.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[contacto ocultado]');

  return (
    <section aria-labelledby="avaliacoes-lista-titulo" className="mt-5">
      <h3 id="avaliacoes-lista-titulo" className="sr-only">Comentários de clientes</h3>
      {resumo.total === 0 || avaliacoes.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-600 dark:text-cream-text">Ainda não há avaliações para este profissional.</p>
      ) : (
        <ul role="list" className="mt-5 space-y-4">
          {avaliacoes.map((avaliacao) => (
            <li key={avaliacao.id} className="min-w-0 rounded-xl border border-card-border bg-white/70 p-4 dark:bg-white/5 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-semibold text-ink dark:text-cream">Cliente</span>
                <time dateTime={avaliacao.created_at} className="text-xs text-neutral-500 dark:text-cream-text/70">
                  {formatDate(avaliacao.created_at)}
                </time>
              </div>
              <p className="mt-2 text-sm font-semibold text-ink dark:text-cream">
                <span aria-label={`Nota ${avaliacao.nota} de 5`}>{avaliacao.nota}/5</span>
              </p>
              {avaliacao.comentario && (
                <p className="mt-2 break-words whitespace-pre-line text-sm leading-relaxed text-neutral-700 dark:text-cream-text">
                  {comentarioSeguro(avaliacao.comentario)}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
