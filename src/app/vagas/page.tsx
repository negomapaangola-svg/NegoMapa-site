import { Metadata } from "next"
import { MainLayout } from "@/components/layout/MainLayout"
import { getVagasPublicas, VagaPublic, VagasPublicasResult } from "@/lib/actions/vagas-public"
import { VagasContent } from "./_components/VagasContent"
import { FiltrosVagas } from "./_components/FiltrosVagas"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: "Vagas de Emprego | NegóMapa",
  description: "Descubra vagas publicadas por empresas aprovadas em Angola.",
}

const VAGAS_POR_PAGINA = 9

type SearchParams = Promise<{
  q?: string | string[]
  categoria?: string | string[]
  provincia?: string | string[]
  pagina?: string | string[]
}>

function valorParametro(valor: string | string[] | undefined): string {
  const bruto = Array.isArray(valor) ? valor[0] : valor
  return (bruto ?? "").trim().slice(0, 100)
}

/** Minúsculas e sem acentos, para comparar textos de pesquisa. */
function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
}

function listaUnica(valores: (string | null | undefined)[]): string[] {
  return [...new Set(valores.filter((v): v is string => !!v && v.trim().length > 0))].sort((a, b) =>
    a.localeCompare(b, "pt")
  )
}

function filtrarVagas(
  vagas: VagaPublic[],
  { q, categoria, provincia }: { q: string; categoria: string; provincia: string }
): VagaPublic[] {
  const termo = normalizar(q)

  return vagas.filter((vaga) => {
    if (categoria && vaga.categoria !== categoria) return false
    if (provincia && vaga.provincia !== provincia) return false
    if (termo) {
      const alvo = normalizar([vaga.titulo, vaga.company[0]?.name].filter(Boolean).join(" "))
      if (!alvo.includes(termo)) return false
    }
    return true
  })
}

export default async function VagasPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const filtros = {
    q: valorParametro(params.q),
    categoria: valorParametro(params.categoria),
    provincia: valorParametro(params.provincia),
  }

  // getVagasPublicas só devolve vagas com estado 'aprovado' de empresas aprovadas.
  const result: VagasPublicasResult = await getVagasPublicas()
  const vagas: VagaPublic[] = result.success ? result.data : []

  const filtradas = filtrarVagas(vagas, filtros)
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / VAGAS_POR_PAGINA))
  const paginaPedida = parseInt(valorParametro(params.pagina), 10)
  const paginaAtual = Number.isFinite(paginaPedida) ? Math.min(Math.max(1, paginaPedida), totalPaginas) : 1
  const inicio = (paginaAtual - 1) * VAGAS_POR_PAGINA
  const temFiltros = Boolean(filtros.q || filtros.categoria || filtros.provincia)

  return (
    <MainLayout>
      <div className="p-6 md:p-8 bg-cream dark:bg-navy-dark">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-ink dark:text-cream">
              Vagas de Emprego
            </h1>
          </div>

          {vagas.length > 0 && (
            <FiltrosVagas
              q={filtros.q}
              categoria={filtros.categoria}
              provincia={filtros.provincia}
              categorias={listaUnica(vagas.map((v: VagaPublic) => v.categoria))}
              provincias={listaUnica(vagas.map((v: VagaPublic) => v.provincia))}
            />
          )}

          <VagasContent
            vagasPagina={filtradas.slice(inicio, inicio + VAGAS_POR_PAGINA)}
            totalVagas={filtradas.length}
            paginaAtual={paginaAtual}
            totalPaginas={totalPaginas}
            parametros={{ ...filtros }}
            temFiltros={temFiltros}
          />
        </div>
      </div>
    </MainLayout>
  )
}
