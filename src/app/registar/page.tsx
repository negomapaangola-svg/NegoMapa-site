import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { MainLayout } from "@/components/layout/MainLayout"
import { getUser } from "@/lib/auth"
import { redirectSeguro } from "@/lib/redirect-seguro"
import { RegistarForm } from "./_components/RegistarForm"

export const metadata: Metadata = {
  title: "Criar conta | NegóMapa",
  description: "Crie a sua conta na NegóMapa para pedir orçamentos, enviar mensagens e candidatar-se a vagas.",
}

export default async function RegistarPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>
}) {
  const { redirectTo } = await searchParams
  const destino = redirectSeguro(redirectTo)

  // Quem já tem sessão não precisa de criar outra conta.
  const user = await getUser()
  if (user) {
    redirect(destino)
  }

  return (
    <MainLayout>
      <section className="py-12 lg:py-16 bg-cream dark:bg-navy-dark">
        <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8">
          <RegistarForm destino={destino} />
        </div>
      </section>
    </MainLayout>
  )
}
