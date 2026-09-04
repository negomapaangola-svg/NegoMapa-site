"use client"

import * as React from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

type Empresa = {
  id: string
  name: string
  sector?: string
  province?: string
  slug: string
  is_approved: boolean
}

export default function EmpresasPage() {
  const [empresas, setEmpresas] = React.useState<Empresa[]>([])
  const [setores, setSetores] = React.useState<Set<string>>(new Set())
  const [provincias, setProvincias] = React.useState<Set<string>>(new Set())
  const [setorFiltrado, setSetorFiltrado] = React.useState<string | null>(null)
  const [provinciaFiltrada, setProvinciaFiltrada] = React.useState<string | null>(null)
  const [carregando, setCarregando] = React.useState(true)

  React.useEffect(() => {
    async function carregarDados() {
      const { data, error } = await supabase
        .from("companies")
        .select("*, setor, province")
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
      return setorMatch && provinciaMatch
    },
  )

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p>Carregando empresas...</p>
      </div>
    )
  }

  if (empresasFiltradas.length === 0) {
    return (
      <div className="min-h-screen p-8 text-center">
        <p className="text-lg text-neutral-500">Nenhuma empresa cadastrada ainda.</p>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-100">
            Empresas Aprovadas
          </h1>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Filtrar por setor
              </label>
              <select
                value={setorFiltrado || ""}
                onChange={(e) => setSetorFiltrado(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
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
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Filtrar por província
              </label>
              <select
                value={provinciaFiltrada || ""}
                onChange={(e) => setProvinciaFiltrada(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {empresasFiltradas.map((empresa) => (
            <Link
              key={empresa.id}
              href={`/empresa/${empresa.slug}`}
              className="hover:text-primary-600 transition-colors"
            >
              <div
                className="bg-white rounded-lg p-5 shadow overflow-hidden border border-gray-200 dark:bg-neutral-800 dark:border-neutral-700"
              >
                <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                  {empresa.name}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                  {empresa.sector || ""}
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-600">
                  {empresa.province || ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}