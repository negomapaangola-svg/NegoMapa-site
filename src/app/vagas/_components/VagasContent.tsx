import Link from "next/link"
import { Card, CardContent } from "@/components/ui/Card"
import type { VagaPublic } from "@/lib/actions/vagas-public"

export type { VagaPublic }

interface VagasContentProps {
  vagasPagina: VagaPublic[]
  totalVagas: number
  paginaAtual: number
  totalPaginas: number
  /** Parâmetros de busca atuais (q, categoria, provincia), para manter os filtros na paginação. */
  parametros: Record<string, string>
  temFiltros: boolean
}

const botaoPaginacao =
  "inline-flex items-center justify-center rounded-[4px] border-2 border-orange-500 px-3 py-1.5 text-sm font-bold text-orange-500 hover:bg-orange-50 dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-900/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"

function hrefComPagina(parametros: Record<string, string>, pagina: number): string {
  const params = new URLSearchParams()
  for (const [chave, valor] of Object.entries(parametros)) {
    if (valor) params.set(chave, valor)
  }
  if (pagina > 1) params.set("pagina", String(pagina))
  const query = params.toString()
  return query ? `/vagas?${query}` : "/vagas"
}

/** Lista de vagas por URL: cartões, estados vazios e paginação. Sem estado no cliente. */
export function VagasContent({
  vagasPagina,
  totalVagas,
  paginaAtual,
  totalPaginas,
  parametros,
  temFiltros,
}: VagasContentProps) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-neutral-600 dark:text-cream-text" role="status" aria-live="polite">
        {totalVagas === 1 ? "1 vaga" : `${totalVagas} vagas`}
      </p>

      {/* Grid de vagas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vagasPagina.length > 0 ? (
          vagasPagina.map((vaga) => (
            <Link
              key={vaga.id}
              href={`/vaga/${vaga.slug}`}
              className="block"
            >
              <Card variant="default" padding="md" hover className="h-full border-card-border">
                <CardContent className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-bold text-ink dark:text-cream flex-1 min-w-0 truncate">
                      {vaga.titulo}
                    </h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-medium whitespace-nowrap">
                      {vaga.categoria}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600 dark:text-cream-text/80">
                    <span className="flex items-center gap-1">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {vaga.provincia}
                      {vaga.municipio && `, ${vaga.municipio}`}
                    </span>
                    {vaga.tipo_contrato && (
                      <span className="flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {vaga.tipo_contrato}
                      </span>
                    )}
                    {vaga.salario && vaga.salario !== "A combinar" && (
                      <span className="flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599 1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {vaga.salario}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-500 dark:text-cream-text/70 line-clamp-2">
                    {vaga.company[0]?.name}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : temFiltros ? (
          <div className="col-span-full text-center py-12" role="status">
            <h2 className="text-xl font-semibold text-ink dark:text-cream">Nenhuma vaga encontrada</h2>
            <p className="mt-2 text-neutral-600 dark:text-cream-text">
              Tente outro título, categoria ou província.
            </p>
            <Link
              href="/vagas"
              className="mt-4 inline-block text-sm font-medium text-orange-500 dark:text-orange-400 hover:underline"
            >
              Limpar filtros
            </Link>
          </div>
        ) : (
          <div className="col-span-full text-center py-12" role="status">
            <h2 className="text-xl font-semibold text-ink dark:text-cream">Ainda não há vagas disponíveis</h2>
            <p className="mt-2 text-neutral-600 dark:text-cream-text">Volte mais tarde para ver novas oportunidades.</p>
          </div>
        )}
      </div>

      {/* Paginação */}
      {totalPaginas > 1 && (
        <nav aria-label="Paginação de vagas" className="flex items-center justify-center gap-2">
          {paginaAtual > 1 ? (
            <Link
              href={hrefComPagina(parametros, paginaAtual - 1)}
              className={botaoPaginacao}
            >
              Anterior
            </Link>
          ) : (
            <span aria-disabled="true" className={`${botaoPaginacao} opacity-50 pointer-events-none`}>
              Anterior
            </span>
          )}
          <span className="px-4 text-sm text-ink dark:text-cream">
            Página {paginaAtual} de {totalPaginas}
          </span>
          {paginaAtual < totalPaginas ? (
            <Link
              href={hrefComPagina(parametros, paginaAtual + 1)}
              className={botaoPaginacao}
            >
              Próxima
            </Link>
          ) : (
            <span aria-disabled="true" className={`${botaoPaginacao} opacity-50 pointer-events-none`}>
              Próxima
            </span>
          )}
        </nav>
      )}
    </div>
  )
}
