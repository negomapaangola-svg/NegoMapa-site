"use client"

import * as React from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { MainLayout } from "@/components/layout/MainLayout"
import { BotaoContactarEmpresa } from "@/components/empresas/BotaoContactarEmpresa"
import { verificarPodeContactarEmpresas } from "@/lib/actions/conversas"

type Empresa = {
  id: string
  name: string
  sector: string | null
  province: string | null
  slug: string
  description: string | null
}

function EmpresasContent() {
  const [empresas, setEmpresas] = React.useState<Empresa[]>([])
  const [setores, setSetores] = React.useState<string[]>([])
  const [provincias, setProvincias] = React.useState<string[]>([])
  const [setor, setSetor] = React.useState("")
  const [provincia, setProvincia] = React.useState("")
  const [nome, setNome] = React.useState("")
  const [idsContactaveis, setIdsContactaveis] = React.useState<Set<string>>(new Set())
  const [carregando, setCarregando] = React.useState(true)

  React.useEffect(() => {
    let activo = true
    async function carregar() {
      const { data, error } = await supabase
        .from("empresas_publicas")
        .select("id, name, sector, province, slug, description")
        .eq("is_approved", true)
        .order("name", { ascending: true })

      if (!activo) return
      if (error) {
        console.error("Erro ao carregar empresas públicas. Código:", error.code)
        setEmpresas([])
      } else {
        const lista = (data ?? []) as Empresa[]
        setEmpresas(lista)
        setSetores(Array.from(new Set(lista.map((item) => item.sector).filter((v): v is string => Boolean(v)))).sort())
        setProvincias(Array.from(new Set(lista.map((item) => item.province).filter((v): v is string => Boolean(v)))).sort())
      }
      setCarregando(false)
    }
    carregar()
    return () => { activo = false }
  }, [])

  React.useEffect(() => {
    const ids = empresas.map((empresa) => empresa.id)
    if (ids.length === 0) {
      setIdsContactaveis(new Set())
      return
    }
    let activo = true
    verificarPodeContactarEmpresas(ids)
      .then((resultado) => {
        if (activo) setIdsContactaveis(new Set(resultado.success ? resultado.ids : []))
      })
      .catch(() => {
        if (activo) setIdsContactaveis(new Set())
      })
    return () => { activo = false }
  }, [empresas])

  const filtradas = empresas.filter((empresa) =>
    (!setor || empresa.sector === setor) &&
    (!provincia || empresa.province === provincia) &&
    (!nome || empresa.name.toLocaleLowerCase().includes(nome.trim().toLocaleLowerCase()))
  )

  const limpar = () => {
    setSetor("")
    setProvincia("")
    setNome("")
  }

  if (carregando) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-cream p-6 dark:bg-navy-dark">
        <p className="text-sm text-neutral-600 dark:text-cream-text">A carregar empresas...</p>
      </div>
    )
  }

  return (
    <main className="min-h-[60vh] bg-cream px-4 py-8 dark:bg-navy-dark sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-7 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-ink dark:text-cream sm:text-4xl">Empresas</h1>
          <p className="text-sm text-neutral-600 dark:text-cream-text">Encontre empresas perto de si.</p>
        </header>

        <section aria-label="Filtros de empresas" className="mb-7 rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.4fr_auto] lg:items-end">
            <label className="block text-sm font-medium text-ink dark:text-cream">
              Província
              <select value={provincia} onChange={(event) => setProvincia(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-card-border bg-white px-3 text-sm dark:bg-neutral-900">
                <option value="">Todas as províncias</option>
                {provincias.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-ink dark:text-cream">
              Sector
              <select value={setor} onChange={(event) => setSetor(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-card-border bg-white px-3 text-sm dark:bg-neutral-900">
                <option value="">Todos os sectores</option>
                {setores.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-ink dark:text-cream">
              Nome
              <input value={nome} onChange={(event) => setNome(event.target.value)} placeholder="Pesquisar empresa" className="mt-1.5 min-h-11 w-full rounded-xl border border-card-border bg-white px-3 text-sm dark:bg-neutral-900" />
            </label>
            <Button type="button" variant="outline" size="md" onClick={limpar}>Limpar</Button>
          </div>
        </section>

        {filtradas.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtradas.map((empresa) => (
              <Card key={empresa.id} variant="liquid" padding="md" className="flex h-full flex-col border border-white/70 shadow-sm dark:border-white/10">
                <CardContent className="flex h-full flex-col">
                  <Link href={`/empresa/${empresa.slug}`} className="flex flex-1 items-start gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500">
                    <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-lg font-bold text-orange-700 dark:text-orange-300">
                      {empresa.name.trim().slice(0, 2).toLocaleUpperCase() || "EM"}
                    </span>
                    <span className="min-w-0">
                      <span className="block break-words text-base font-semibold text-ink dark:text-cream">{empresa.name}</span>
                      <span className="mt-1 block text-sm text-neutral-600 dark:text-cream-text">{empresa.sector || "Sector não indicado"}</span>
                      <span className="mt-1 block text-xs text-neutral-500 dark:text-cream-text/70">{empresa.province || "Província não indicada"}</span>
                      {empresa.description && <span className="mt-3 line-clamp-3 block text-sm leading-relaxed text-neutral-600 dark:text-cream-text">{empresa.description}</span>}
                    </span>
                  </Link>
                  <div className="mt-5 border-t border-card-border pt-4">
                    <BotaoContactarEmpresa empresaId={empresa.id} visivel={idsContactaveis.has(empresa.id)} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-card-border bg-white/70 px-5 py-12 text-center dark:bg-white/5">
            <p className="font-medium text-ink dark:text-cream">{empresas.length === 0 ? "Ainda não há empresas disponíveis." : "Nenhuma empresa encontrada com estes filtros."}</p>
            {(setor || provincia || nome) && <Button type="button" variant="outline" size="sm" className="mt-4" onClick={limpar}>Limpar filtros</Button>}
          </div>
        )}
      </div>
    </main>
  )
}

export default function EmpresasPage() {
  return (
    <MainLayout>
      <EmpresasContent />
    </MainLayout>
  )
}
