import { Metadata } from "next"
import { MainLayout } from "@/components/layout/MainLayout"
import { getVagasPublicas, VagaPublic, VagasPublicasResult } from "@/lib/actions/vagas-public"
import { VagasContent } from "./_components/VagasContent"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: "Vagas de Emprego | NegóMapa",
  description: "Descubra vagas publicadas por empresas aprovadas em Angola.",
}

export default async function VagasPage() {
  const result: VagasPublicasResult = await getVagasPublicas()
  const vagas: VagaPublic[] = result.success ? result.data : []

  return (
    <MainLayout>
      <div className="p-6 md:p-8 bg-cream dark:bg-navy-dark">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-ink dark:text-cream">
              Vagas de Emprego
            </h1>
          </div>
          <VagasContent initialVagas={vagas} />
        </div>
      </div>
    </MainLayout>
  )
}