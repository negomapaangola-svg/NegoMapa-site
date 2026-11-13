import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';
import type { RecomendacaoDescobrir } from '@/lib/descobrir/recomendacoes';

export function RecomendacoesCliente({ itens }: { itens: RecomendacaoDescobrir[] }) {
  return (
    <section className="mb-10" aria-labelledby="recomendado-titulo">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-600 dark:text-orange-400">
            Selecção para descobrir
          </p>
          <h2 id="recomendado-titulo" className="text-2xl font-bold text-ink dark:text-cream">
            Recomendado para si
          </h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-cream-text">
            Serviços e produtos relevantes com base nas categorias e localização disponíveis.
          </p>
        </div>
      </div>

      {itens.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Recomendações de serviços e produtos">
          {itens.map((item) => (
            <li key={`${item.tipo}-${item.id}`}>
              <Card
                variant="liquid"
                padding="md"
                className="flex h-full flex-col border-white/70 bg-white/75 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/70"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-800 dark:bg-orange-900/40 dark:text-orange-200">
                    {item.tipo === 'produto' ? 'Produto' : 'Serviço'}
                  </span>
                  {item.categoria && (
                    <span className="max-w-[55%] truncate text-xs text-neutral-500 dark:text-neutral-400">
                      {item.categoria}
                    </span>
                  )}
                </div>
                <h3 className="line-clamp-2 text-lg font-semibold text-ink dark:text-cream">
                  {item.titulo}
                </h3>
                <p className="mt-2 font-bold text-orange-600 dark:text-orange-400">
                  {item.preco === null || item.preco_tipo === 'sob_consulta'
                    ? 'Sob consulta'
                    : `${formatCurrency(item.preco)} Kz`}
                </p>
                <p className="mt-2 text-sm text-neutral-600 dark:text-cream-text">
                  {[item.municipio, item.provincia].filter(Boolean).join(', ') || 'Angola'}
                </p>
                {item.distancia_km !== null && (
                  <p className="mt-1 text-sm text-orange-700 dark:text-orange-300">
                    Cerca de {item.distancia_km} km
                  </p>
                )}
                {item.avaliacao && (
                  <p className="mt-1 text-sm text-neutral-600 dark:text-cream-text">
                    {item.avaliacao.media.toFixed(1).replace('.', ',')} · {item.avaliacao.total} {item.avaliacao.total === 1 ? 'avaliação' : 'avaliações'}
                  </p>
                )}
                <div className="mt-auto pt-5">
                  <Button
                    asChild
                    as={Link}
                    size="sm"
                    variant="outline"
                    fullWidth
                    {...({ href: item.tipo === 'produto' ? `/produto/${item.slug}` : `/servico/${item.slug}` } as { href: string })}
                  >
                    Ver detalhes
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <Card variant="liquid" padding="md" className="border-white/70 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/60">
          <p className="text-sm text-neutral-600 dark:text-cream-text">
            Ainda não existem serviços ou produtos disponíveis para recomendar nesta localização.
          </p>
        </Card>
      )}
    </section>
  );
}
