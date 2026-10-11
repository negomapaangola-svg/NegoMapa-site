import { Metadata } from "next"
import { MainLayout } from "@/components/layout/MainLayout"
import { VagasContent } from "./_components/VagasContent"

export const metadata: Metadata = {
  title: "Vagas de Emprego | NegóMapa",
  description: "Descubra vagas publicadas por empresas aprovadas em Angola.",
}

export default function VagasPage() {
  return (
    <MainLayout>
      <VagasContent />
    </MainLayout>
  )
}