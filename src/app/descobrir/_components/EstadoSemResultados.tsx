import Link from 'next/link';
import { hrefDescobrir, type ParamsDescobrir } from '@/lib/descobrir/params';
import type { CategoriaDescobrir } from '@/lib/descobrir/buscar-servicos';

interface EstadoSemResultadosProps {
  params: ParamsDescobrir;
  categorias: CategoriaDescobrir[];
}

const botaoSugestao =
  'inline-flex min-h-[44px] items-center justify-center rounded-[4px] border border-card-border bg-white px-4 text-sm font-semibold text-ink hover:border-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:bg-neutral-700 dark:text-cream';

export function EstadoSemResultados({ params, categorias }: EstadoSemResultadosProps) {
  const pesquisa = params.q ? `“${params.q}”` : 'os critérios escolhidos';
  const local = params.provincia || 'Angola';
  const outrasCategorias = categorias.filter((c) => c.slug !== params.categoria).slice(0, 6);

  return (
    <div className="rounded-2xl border border-dashed border-card-border bg-white/70 p-6 text-center shadow-sm dark:bg-neutral-800/70 sm:p-10">
      <h2 className="text-xl font-semibold text-ink dark:text-cream">
        Não encontrámos resultados para {pesquisa} em {local}.
      </h2>
      <p className="mx-auto mt-2 max-w-md text-neutral-600 dark:text-cream-text">
        Tente outra pesquisa ou experimente uma das sugestões abaixo.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href={hrefDescobrir(params, {
            q: '', categoria: '', provincia: '', municipio: '', preco: '',
            avaliacao: '', estado_produto: '', entrega: '', pagina: 1,
          })}
          className={botaoSugestao}
        >
          Remover filtros
        </Link>

        {params.provincia && (
          <Link href={hrefDescobrir(params, { provincia: '', municipio: '', pagina: 1 })} className={botaoSugestao}>
            Ver resultados em todas as províncias
          </Link>
        )}
      </div>

      {outrasCategorias.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-ink dark:text-cream">Explorar outras categorias</h3>
          <ul className="mt-3 flex flex-wrap justify-center gap-2">
            {outrasCategorias.map((categoria) => (
              <li key={categoria.id}>
                <Link href={hrefDescobrir(params, { categoria: categoria.slug, pagina: 1 })} className={botaoSugestao}>
                  {categoria.nome}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
