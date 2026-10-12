import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { getUserCompany, getUserVagas, type VagaListItem } from "@/lib/actions/vagas"
import { MainLayout } from "@/components/layout/MainLayout"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { formatDate } from "@/lib/utils"

export const metadata: Metadata = {
  title: "As Minhas Vagas | Painel da Empresa | NegóMapa",
  description: "Gerencie as vagas da sua empresa no NegóMapa.",
}

async function getCompany() {
  const company = await getUserCompany()
  if (!company) return null
  return company
}

async function getVagas(): Promise<VagaListItem[]> {
  return await getUserVagas()
}

function getEstadoBadge(estado: string) {
  const variants: Record<string, { bg: string; text: string; label: string }> = {
    pendente: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-300", label: "Pendente" },
    aprovado: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300", label: "Aprovado" },
    rejeitado: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300", label: "Rejeitado" },
  }
  return variants[estado] || variants.pendente
}

export default async function EmpresaVagasPage() {
  const company = await getCompany()

  if (!company) {
    notFound()
  }

  const vagas = await getVagas()

  return (
    <MainLayout>
      <div className="p-4 md:p-8 bg-cream dark:bg-navy-dark">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-ink dark:text-cream">
                As Minhas Vagas
              </h1>
              <p className="mt-1 text-neutral-600 dark:text-cream-text">
                Empresa: <span className="font-medium text-ink dark:text-cream">{company.name}</span>
              </p>
            </div>
            <Link href="/empresa/painel/vagas/nova">
              <Button size="lg">
                Publicar nova vaga
              </Button>
            </Link>
          </div>

          {!company.is_approved && (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-[4px]">
              <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="font-medium">
                  A sua empresa ainda não foi aprovada. Não é possível publicar vagas.
                </span>
              </div>
            </div>
          )}

          {vagas.length === 0 ? (
            <Card variant="liquid" padding="lg" className="text-center py-12">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                <svg className="h-8 w-8 text-neutral-400 dark:text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-ink dark:text-cream mb-2">
                Ainda não publicou nenhuma vaga
              </h2>
              <p className="text-neutral-600 dark:text-cream-text mb-6 max-w-md mx-auto">
                Comece a atrair candidatos publicando a sua primeira vaga de emprego.
              </p>
              <Link href="/empresa/painel/vagas/nova">
                <Button variant="primary" size="lg">
                  Publicar primeira vaga
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {vagas.map((vaga) => {
                const estadoInfo = getEstadoBadge(vaga.estado)
                return (
                  <Card key={vaga.id} variant="default" padding="none" className="overflow-hidden border-card-border">
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-2 mb-2">
                            <CardTitle as="h3" className="text-lg font-bold text-ink dark:text-cream truncate">
                              {vaga.titulo}
                            </CardTitle>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoInfo.bg} ${estadoInfo.text}`}>
                              {estadoInfo.label}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600 dark:text-cream-text/80">
                            <span className="flex items-center gap-1">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              {vaga.categoria}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {vaga.provincia}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {formatDate(vaga.created_at)}
                            </span>
                          </div>
                        </div>
                        {vaga.estado === "aprovado" && (
                          <Link
                            href={`/vaga/${vaga.slug}`}
                            className="flex-shrink-0"
                          >
                            <Button variant="outline" size="sm">
                              Ver detalhe
                            </Button>
                          </Link>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}