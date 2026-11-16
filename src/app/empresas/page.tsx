"use client"

import * as React from "react"
import { MainLayout } from "@/components/layout/MainLayout"
import { BotaoContactarEmpresa } from "@/components/empresas/BotaoContactarEmpresa"
import { verificarPodeContactarEmpresas } from "@/lib/actions/conversas"
import { obterLocalizacaoCliente } from "@/lib/actions/perfil-pessoal"
import { ordenarPorDistanciaEAdministrativa, type LocalizacaoAdministrativa } from "@/lib/localizacao/ordenar-resultados"
import { obterDistanciasAproximadas } from "@/lib/actions/proximidade"
import { PageHeader, SearchBar, FilterChips, SettingsSheet, ResultsHeader, CompanyCard, LoadingSkeleton, ErrorState } from "@/components/ui/CatalogComponents"
import { EmptyState } from "@/components/ui/EmptyState"

type Empresa = {
  id: string; name: string; sector: string | null; province: string | null;
  city: string | null; bairro: string | null; slug: string; description: string | null;
  distancia_km?: number | null
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
  const [erro, setErro] = React.useState(false)
  const [localizacao, setLocalizacao] = React.useState<LocalizacaoAdministrativa>(null)
  const [distancias, setDistancias] = React.useState<Record<string, number>>({})

  React.useEffect(() => {
    let activo = true
    async function carregar() {
      try {
        const { data, error } = await (await import("@/lib/supabase")).supabase
          .from("empresas_publicas").select("id, name, sector, province, city, bairro, slug, description")
          .eq("is_approved", true).order("name", { ascending: true })
        const local = await obterLocalizacaoCliente()
        if (!activo) return
        setLocalizacao(local)
        if (error) throw error
        const lista = (data ?? []) as Empresa[]
        setEmpresas(lista)
        const distanciasCalculadas = await obterDistanciasAproximadas('empresa', lista.map((item) => item.id))
        if (activo) setDistancias(distanciasCalculadas)
        setSetores(Array.from(new Set(lista.map((item) => item.sector).filter((v): v is string => Boolean(v)))).sort())
        setProvincias(Array.from(new Set(lista.map((item) => item.province).filter((v): v is string => Boolean(v)))).sort())
      } catch {
        if (activo) setErro(true)
      } finally { if (activo) setCarregando(false) }
    }
    carregar()
    return () => { activo = false }
  }, [])

  React.useEffect(() => {
    const ids = empresas.map((empresa) => empresa.id)
    if (ids.length === 0) { setIdsContactaveis(new Set()); return }
    let activo = true
    verificarPodeContactarEmpresas(ids).then((resultado) => {
      if (activo) setIdsContactaveis(new Set(resultado.success ? resultado.ids : []))
    }).catch(() => { if (activo) setIdsContactaveis(new Set()) })
    return () => { activo = false }
  }, [empresas])

  const filtradas = ordenarPorDistanciaEAdministrativa(empresas.filter((empresa) =>
    (!setor || empresa.sector === setor) && (!provincia || empresa.province === provincia) &&
    (!nome || empresa.name.toLocaleLowerCase().includes(nome.trim().toLocaleLowerCase()))
  ).map((empresa) => ({ ...empresa, municipio: empresa.city, distancia_km: distancias[empresa.id] ?? null })), localizacao)

  const limpar = () => { setSetor(""); setProvincia(""); setNome("") }

  return (
    <main className="min-h-[60vh] bg-cream px-4 py-8 dark:bg-navy-dark sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader title="Empresas" description="Encontre empresas perto de si." />
        <SearchBar action="/empresas" defaultValue={nome} placeholder="Pesquisar empresa" onSearch={setNome} />
        <FilterChips value={setor} onChange={setSetor} items={[{label:"Todas",value:""}, ...setores.map((s)=>({label:s,value:s}))]} />
        <SettingsSheet title="Filtros e definições">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-ink dark:text-cream">Província
              <select value={provincia} onChange={(e)=>setProvincia(e.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-card-border bg-white px-3 text-sm dark:bg-neutral-900">
                <option value="">Todas as províncias</option>{provincias.map((item)=><option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <div className="flex items-end"><button type="button" onClick={limpar} className="min-h-11 rounded-xl border border-card-border px-4 text-sm font-semibold">Limpar filtros</button></div>
          </div>
        </SettingsSheet>
        {carregando ? <LoadingSkeleton count={6} /> : erro ? <ErrorState onRetry={()=>window.location.reload()} /> : (
          <>
            <ResultsHeader count={filtradas.length} label="empresas" />
            {filtradas.length ? <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtradas.map((empresa)=> <CompanyCard key={empresa.id} company={{
                name:empresa.name, category:empresa.sector, location:[empresa.bairro,empresa.city,empresa.province].filter(Boolean).join(", "),
                href:`/empresa/${empresa.slug}`
              }} contactAction={<BotaoContactarEmpresa empresaId={empresa.id} visivel={idsContactaveis.has(empresa.id)} />} />)}
            </div> : <EmptyState title={empresas.length ? "Nenhuma empresa encontrada com estes filtros." : "Ainda não há empresas disponíveis."} description="Altere os filtros ou volte a tentar mais tarde." action={(setor||provincia||nome) ? <button type="button" onClick={limpar} className="text-sm font-semibold text-orange-600 underline">Limpar filtros</button> : undefined} />}
          </>
        )}
      </div>
    </main>
  )
}

export default function EmpresasPage() { return <MainLayout><EmpresasContent /></MainLayout> }
