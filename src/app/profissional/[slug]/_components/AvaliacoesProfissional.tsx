import { Rating } from '@/components/avaliacoes/Rating';
import { formatDate } from '@/lib/utils';
import type { AvaliacaoWithUser, MediaAvaliacoes } from '@/lib/actions/avaliacoes';

interface AvaliacoesProfissionalProps {
  avaliacoes: AvaliacaoWithUser[];
  resumo: MediaAvaliacoes;
}

/**
 * Avaliações recebidas pelo profissional. O nome do autor não é público (não existe campo de
 * nome na base de dados), por isso aparece apenas a indicação "Cliente".
 */
export function AvaliacoesProfissional({ avaliacoes, resumo }: AvaliacoesProfissionalProps) {
  return (
    <section aria-labelledby="avaliacoes-titulo" className="mt-12">
      <h2 id="avaliacoes-titulo" className="text-2xl font-semibold text-ink dark:text-cream">
        Avaliações
      </h2>

      {resumo.total === 0 || avaliacoes.length === 0 ? (
        <p className="mt-4 text-neutral-600 dark:text-cream-text">Ainda não há avaliações.</p>
      ) : (
        <>
          <div className="mt-4">
            <Rating media={resumo.media} total={resumo.total} size="md" />
          </div>
          <ul role="list" className="mt-6 space-y-4">
            {avaliacoes.map((avaliacao) => (
              <li key={avaliacao.id} className="rounded-xl border border-card-border p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-medium text-ink dark:text-cream">Cliente</span>
                  <time dateTime={avaliacao.created_at} className="text-neutral-500 dark:text-cream-text/70">
                    {formatDate(avaliacao.created_at)}
                  </time>
                </div>
                <p className="mt-2 text-sm font-semibold text-ink dark:text-cream">
                  <span aria-label={`Nota ${avaliacao.nota} de 5`}>{avaliacao.nota}/5</span>
                </p>
                {avaliacao.comentario && (
                  <p className="mt-2 whitespace-pre-line text-neutral-700 dark:text-cream-text leading-relaxed">
                    {avaliacao.comentario}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
