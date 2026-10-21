"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"

export type VagaPublic = {
  id: string
  titulo: string
  slug: string
  descricao: string
  requisitos?: string | null
  categoria: string
  provincia: string
  municipio?: string | null
  tipo_contrato?: string | null
  salario?: string | null
  whatsapp?: string | null
  estado: string
  created_at: string
  company: {
    id: string
    name: string
    slug: string
    provincia?: string | null
  }[]
}

const VAGAS_PER_PAGE = 9

interface VagasContentProps {
  initialVagas: VagaPublic[]
}

export function VagasContent({ initialVagas }: VagasContentProps) {
  const [vagas, setVagas] = React.useState<VagaPublic[]>(initialVagas)
  const [categorias, setCategorias] = React.useState<Set<string>>(new Set())
  const [provincias, setProvincias] = React.useState<Set<string>>(new Set())
  const [categoriaFiltrada, setCategoriaFiltrada] = React.useState<string | null>(null)
  const [provinciaFiltrada, setProvinciaFiltrada] = React.useState<string | null>(null)
  const [nomeBusca, setNomeBusca] = React.useState("")
  const [paginaAtual, setPaginaAtual] = React.useState(1)

  React.useEffect(() => {
    setVagas(initialVagas)
    const categoriasUnicas = new Set(initialVagas?.map((v) => v.categoria).filter(Boolean) || [])
    const provinciasUnicas = new Set(initialVagas?.map((v) => v.provincia).filter(Boolean) || [])
    setCategorias(categoriasUnicas)
    setProvincias(provinciasUnicas)
  }, [initialVagas])

  const vagasFiltradas = vagas.filter((vaga) => {
    const categoriaMatch = !categoriaFiltrada || vaga.categoria === categoriaFiltrada
    const provinciaMatch = !provinciaFiltrada || vaga.provincia === provinciaFiltrada
    const nomeMatch = !nomeBusca || vaga.titulo.toLowerCase().includes(nomeBusca.toLowerCase())
    return categoriaMatch && provinciaMatch && nomeMatch
  })

  const totalPaginas = Math.ceil(vagasFiltradas.length / VAGAS_PER_PAGE)
  const vagasPagina = vagasFiltradas.slice(
    (paginaAtual - 1) * VAGAS_PER_PAGE,
    paginaAtual * VAGAS_PER_PAGE
  )

  const temFiltrosAtivos = categoriaFiltrada || provinciaFiltrada || nomeBusca

  if (vagas.length === 0) {
    return (
      <div className="col-span-full text-center py-12">
        <p className="text-lg text-neutral-500 dark:text-cream-text">
          Ainda não há vagas disponíveis.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-0">
          <div className="min-w-0">
            <label className="block text-sm font-medium text-ink dark:text-cream-text mb-1">
              Filtrar por categoria
            </label>
            <select
            value={categoriaFiltrada || ""}
            onChange={(e) => setCategoriaFiltrada(e.target.value || null)}
            className="w-full px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
          >
            <option value="">Todas as categorias</option>
            {Array.from(categorias).sort().map((categoria) => (
              <option key={categoria} value={categoria}>
                {categoria}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0">
          <label className="block text-sm font-medium text-ink dark:text-cream-text mb-1">
            Filtrar por província
          </label>
          <select
            value={provinciaFiltrada || ""}
            onChange={(e) => setProvinciaFiltrada(e.target.value || null)}
            className="w-full px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
          >
            <option value="">Todas as províncias</option>
            {Array.from(provincias).sort().map((provincia) => (
              <option key={provincia} value={provincia}>
                {provincia}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0">
          <label className="block text-sm font-medium text-ink dark:text-cream-text mb-1">
            Buscar por título
          </label>
          <div className="flex items-center gap-2 min-w-0">
            <input
              type="text"
              value={nomeBusca}
              onChange={(e) => setNomeBusca(e.target.value)}
              placeholder="Buscar por título..."
              className="w-full px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
            />
            <Button variant="outline" size="sm" onClick={() => {
              setNomeBusca("")
              setCategoriaFiltrada(null)
              setProvinciaFiltrada(null)
              setPaginaAtual(1)
            }}>
              Limpar filtros
            </Button>
          </div>
        </div>
      </div>

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
        ) : (
          temFiltrosAtivos ? (
            <div className="col-span-full text-center py-12">
              <p className="text-lg text-neutral-500 dark:text-cream-text">
                Nenhuma vaga encontrada com os filtros seleccionados.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setNomeBusca("")
                  setCategoriaFiltrada(null)
                  setProvinciaFiltrada(null)
                  setPaginaAtual(1)
                }}
              >
                Limpar filtros
              </Button>
            </div>
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-lg text-neutral-500 dark:text-cream-text">
                Nenhuma vaga encontrada.
              </p>
            </div>
          )
        )}
      </div>

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
            disabled={paginaAtual === 1}
          >
            Anterior
          </Button>
          <span className="px-4 text-sm text-ink dark:text-cream">
            Página {paginaAtual} de {totalPaginas}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
            disabled={paginaAtual === totalPaginas}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  )
}