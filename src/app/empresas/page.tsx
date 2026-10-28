"use client"

import * as React from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"

type Empresa = {
  id: string
  name: string
  sector?: string
  province?: string
  slug: string
  is_approved: boolean
}

function EmpresasContent() {
  const [empresas, setEmpresas] = React.useState<Empresa[]>([])
  const [setores, setSetores] = React.useState<Set<string>>(new Set())
  const [provincias, setProvincias] = React.useState<Set<string>>(new Set())
  const [setorFiltrado, setSetorFiltrado] = React.useState<string | null>(null)
  const [provinciaFiltrada, setProvinciaFiltrada] = React.useState<string | null>(null)
  const [nomeBusca, setNomeBusca] = React.useState("")
  const [carregando, setCarregando] = React.useState(true)

  React.useEffect(() => {
    async function carregarDados() {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, slug, sector, province")
        .eq("is_approved", true)

      if (error) {
        console.error("Erro ao carregar empresas:", error)
      } else {
        setEmpresas(data || [])
        const setoresUnicos = new Set(data?.map((e: any) => e.sector).filter(Boolean) || [])
        const provinciasUnicas = new Set(data?.map((e: any) => e.province).filter(Boolean) || [])
        setSetores(setoresUnicos)
        setProvincias(provinciasUnicas)
      }
      setCarregando(false)
    }

    carregarDados()
  }, [])

  const empresasFiltradas = empresas.filter(
    (empresa) => {
      const setorMatch = !setorFiltrado || empresa.sector === setorFiltrado
      const provinciaMatch = !provinciaFiltrada || empresa.province === provinciaFiltrada
      const nomeMatch = !nomeBusca || empresa.name.toLowerCase().includes(nomeBusca.toLowerCase())
      return setorMatch && provinciaMatch && nomeMatch
    },
  )

  const temFiltrosAtivos = setorFiltrado || provinciaFiltrada || nomeBusca

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-cream dark:bg-navy-dark">
        <p className="text-ink dark:text-cream">Carregando empresas...</p>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 bg-cream dark:bg-navy-dark">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-ink dark:text-cream">
              Empresas Aprovadas
            </h1>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-ink dark:text-cream-text mb-1">
                  Filtrar por setor
                </label>
                <select
                  value={setorFiltrado || ""}
                  onChange={(e) => setSetorFiltrado(e.target.value || null)}
                  className="w-full px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
                >
                  <option value="">Todos os setores</option>
                  {Array.from(setores).sort().map((setor) => (
                    <option key={setor} value={setor}>
                      {setor}
                    </option>
                  ))}
                </select>
              </div>
              <div>
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
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nomeBusca}
                  onChange={(e) => setNomeBusca(e.target.value)}
                  placeholder="Buscar por nome..."
                  className="w-full px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
                />
                <Button variant="outline" size="sm" onClick={() => {
                  setNomeBusca("")
                  setSetorFiltrado(null)
                  setProvinciaFiltrada(null)
                }}>
                  Limpar filtros
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {empresasFiltradas.length > 0 ? (
              empresasFiltradas.map((empresa) => (
                <Link
                  key={empresa.id}
                  href={`/empresa/${empresa.slug}`}
                  className="block"
                >
                  <Card variant="default" padding="md" hover className="h-full border-card-border">
                    <CardContent className="space-y-2">
                      <h3 className="text-xl font-bold text-ink dark:text-cream">
                        {empresa.name}
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-cream-text">
                        {empresa.sector || ""}
                      </p>
                      <p className="text-sm text-neutral-500 dark:text-cream-text/70">
                        {empresa.province || ""}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              temFiltrosAtivos ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-lg text-neutral-500 dark:text-cream-text">
                    Nenhuma empresa encontrada com estes filtros.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      setNomeBusca("")
                      setSetorFiltrado(null)
                      setProvinciaFiltrada(null)
                    }}
                  >
                    Limpar filtros
                  </Button>
                </div>
              ) : empresas.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-lg text-neutral-500 dark:text-cream-text">
                    Nenhuma empresa cadastrada ainda.
                  </p>
                </div>
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-lg text-neutral-500 dark:text-cream-text">
                    Nenhuma empresa cadastrada ainda.
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
  )
}

export default function EmpresasPage() {
  return <EmpresasContent />
}