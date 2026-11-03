import { isHttpsUrl } from '@/lib/utils';
import type { PortfolioItem } from '@/lib/actions/profissionais-publicos';

interface PortfolioProfissionalProps {
  itens: PortfolioItem[] | null;
}

/** Trabalhos do portfólio (campo jsonb). Só links https são mostrados. */
export function PortfolioProfissional({ itens }: PortfolioProfissionalProps) {
  const validos = (itens ?? []).filter(
    (item) => item && typeof item.titulo === 'string' && item.titulo.trim().length > 0
  );

  return (
    <section aria-labelledby="portfolio-titulo" className="mt-12">
      <h2 id="portfolio-titulo" className="text-2xl font-semibold text-ink dark:text-cream">
        Portfólio
      </h2>

      {validos.length === 0 ? (
        <p className="mt-4 text-neutral-600 dark:text-cream-text">Ainda não há trabalhos no portfólio.</p>
      ) : (
        <ul role="list" className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {validos.map((item, indice) => (
            <li key={`${item.titulo}-${indice}`} className="rounded-xl border border-card-border p-5">
              <h3 className="font-semibold text-ink dark:text-cream">{item.titulo}</h3>
              {item.descricao && (
                <p className="mt-2 whitespace-pre-line text-sm text-neutral-700 dark:text-cream-text leading-relaxed">
                  {item.descricao}
                </p>
              )}
              {item.url_projeto && isHttpsUrl(item.url_projeto) && (
                <a
                  href={item.url_projeto}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm font-medium text-orange-500 hover:underline"
                >
                  Ver projeto
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
