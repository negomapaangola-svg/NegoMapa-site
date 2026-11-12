import type { Metadata } from "next"
import { MainLayout } from "@/components/layout/MainLayout"
import { getActiveCategories } from "@/lib/actions/servicos"
import { CadastroProfissionalForm } from "./_components/CadastroProfissionalForm"

export const metadata: Metadata = {
  title: "Cadastro de Profissional",
  description: "Crie o seu perfil profissional no NegóMapa em seis etapas.",
}

export default async function CadastrarProfissionalPage() {
  // Carrega categorias activas; a gravação é feita pela Server Action no envio.
  const categorias = await getActiveCategories()

  return (
    <MainLayout className="py-8 px-4">
      <div className="mx-auto w-full max-w-2xl">
        <CadastroProfissionalForm categorias={categorias} />
      </div>
    </MainLayout>
  )
}
