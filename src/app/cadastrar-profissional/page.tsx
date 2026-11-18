import type { Metadata } from "next"
import { MainLayout } from '@/components/layout/MainLayout'
import { isAdmin } from '@/lib/auth'
import { obterContextoUtilizador } from '@/lib/permissoes'
import { redirect } from 'next/navigation'
import { getActiveCategories } from "@/lib/actions/servicos"
import { CadastroProfissionalForm } from "./_components/CadastroProfissionalForm"

export const metadata: Metadata = {
  title: "Cadastro de Profissional",
  description: "Crie o seu perfil profissional no NegóMapa em seis etapas.",
}

export default async function CadastrarProfissionalPage() {
  if (await isAdmin()) redirect('/admin')
  const contexto = await obterContextoUtilizador()
  if (contexto.empresa) redirect('/empresa/painel')
  if (contexto.profissional) redirect('/profissional/painel')
  if (contexto.autenticado && contexto.accountType !== 'cliente') redirect('/')
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
