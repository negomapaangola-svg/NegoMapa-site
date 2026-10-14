"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/Card"
import { MainLayout } from "@/components/layout/MainLayout"
import { Rating, RatingStarsOnly } from "@/components/avaliacoes/Rating"
import { ReviewForm } from "@/components/avaliacoes/ReviewForm"
import { getMediaAvaliacoes, getAvaliacoesPorAlvo } from "@/lib/actions/avaliacoes"
import { createBrowserSupabaseClient } from "@/lib/supabase-browser"

function EmpresaContent() {
  const { slug } = useParams<{ slug: string }>()
  const [empresa, setEmpresa] = React.useState<any>(null)
  const [carregando, setCarregando] = React.useState(true)
  const [media, setMedia] = React.useState({ media: 0, total: 0 })
  const [avaliacoes, setAvaliacoes] = React.useState<any[]>([])
  const [userId, setUserId] = React.useState<string | null>(null)
  const [avaliacoesCarregando, setAvaliacoesCarregando] = React.useState(true)

  React.useEffect(() => {
    async function carregarEmpresa() {
      if (!slug) {
        setCarregando(false)
        return
      }

      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("slug", slug)
        .eq("is_approved", true)
        .single()

      if (error) {
        console.error("Empresa não encontrada:", error)
        setEmpresa(null)
      } else {
        setEmpresa(data)
      }
      setCarregando(false)
    }

    carregarEmpresa()
  }, [slug])

  React.useEffect(() => {
    if (!empresa) return

    async function carregarAvaliacoes() {
      setAvaliacoesCarregando(true)
      try {
        const [mediaResult, avaliacoesResult] = await Promise.all([
          getMediaAvaliacoes({ tipo: 'empresa', id: empresa.id }),
          getAvaliacoesPorAlvo({ tipo: 'empresa', id: empresa.id }),
        ])
        setMedia(mediaResult)
        setAvaliacoes(avaliacoesResult)
      } catch (error) {
        console.error("Erro ao carregar avaliações:", error)
      } finally {
        setAvaliacoesCarregando(false)
      }
    }

    carregarAvaliacoes()
  }, [empresa])

  React.useEffect(() => {
    async function getUser() {
      const browserSupabase = createBrowserSupabaseClient()
      const { data: { session } } = await browserSupabase.auth.getSession()
      setUserId(session?.user?.id || null)
    }
    getUser()
  }, [])

  if (carregando) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center p-4 bg-cream dark:bg-navy-dark">
          <p className="text-ink dark:text-cream">Carregando empresa...</p>
        </div>
      </MainLayout>
    )
  }

  if (!empresa) {
    return (
      <MainLayout>
        <div className="min-h-screen p-8 text-center bg-cream dark:bg-navy-dark">
          <p className="text-lg text-red-600 dark:text-red-400">Empresa não encontrada</p>
        </div>
      </MainLayout>
    )
  }

  const whatsappNumber = (empresa.phone || "").replace(/\D/g, "")
  const hasPhone = !!empresa.phone
  const hasEmail = !!empresa.email
  const alvo = { tipo: 'empresa' as const, id: empresa.id }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto p-6 md:p-8 bg-cream dark:bg-navy-dark">
        <Card variant="default" padding="lg" className="border-card-border">
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-ink dark:text-cream">
              {empresa.name}
            </h1>
            <p className="text-neutral-500 dark:text-cream-text/70 mt-1">
              {empresa.province || ""}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <CardContent className="space-y-1">
              <p className="text-sm text-neutral-500 dark:text-cream-text/70">Setor</p>
              <p className="font-medium text-ink dark:text-cream">{empresa.sector || "Não informado"}</p>
            </CardContent>
            <CardContent className="space-y-1">
              <p className="text-sm text-neutral-500 dark:text-cream-text/70">Contacto</p>
              <p className="font-medium text-ink dark:text-cream">{empresa.phone || "Não informado"}</p>
            </CardContent>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <CardContent className="space-y-1">
              <p className="text-sm text-neutral-500 dark:text-cream-text/70">Email</p>
              <p className="font-medium text-ink dark:text-cream">{empresa.email || "Não informado"}</p>
            </CardContent>
            <CardContent className="space-y-1">
              <p className="text-sm text-neutral-500 dark:text-cream-text/70">Endereço</p>
              <p className="font-medium text-ink dark:text-cream">{empresa.address || "Não informado"}</p>
            </CardContent>
          </div>

          {empresa.description && (
            <div className="mb-8">
              <p className="text-sm text-neutral-500 dark:text-cream-text/70">Descrição</p>
              <p className="mt-2 text-ink dark:text-cream leading-relaxed">
                {empresa.description}
              </p>
            </div>
          )}

          <div className="mt-8 pt-8 border-t border-card-border">
            <div className="flex flex-wrap gap-3">

              {hasPhone && (
                <Link
                  href={`https://wa.me/244${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-[4px] hover:bg-green-700 transition-colors"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18 16v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h10a2 2 0 012 2v1m-3.678-1.636A16.039 16.039 0 016 12.353 16.083 16.083 0 0112.05 3s10.03 8.347 10.323 9.378a7.97 7.97 0 00-1.677 2.043 7.926 7.926 0 01-3.062.094A11.956 11.956 0 0018 16z"
                    />
                  </svg>
                  WhatsApp
                </Link>
              )}

              {hasPhone && (
                <a
                  href={`tel:${empresa.phone}`}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-[4px] hover:bg-blue-700 transition-colors"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a1 1 0 011-1h3a1 1 0 011 1v4a1 1 0 01-1 1h-3a1 1 0 01-1-1V5zM6 8v8h8v-8H6zm5 1v2H9v-2h5zm-5 4v2H4v-2h5zm5-8l-5 2H16l-5 2v-5zM11 16l-2-5h5l2 5h-5z"
                    />
                  </svg>
                  Telefone
                </a>
              )}

              {hasEmail && (
                <Link
                  href={`mailto:${empresa.email}`}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-[4px] hover:bg-red-700 transition-colors"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-3a1 1 0 01-1-1H4a1 1 0 01-1-1V5a2 2 0 012-2h3a1 1 0 011 1v4a2 2 0 002 2h7a2 2 0 002 2v4a2 2 0 01-2 2h-3a1 1 0 01-1-1h-9a1 1 0 01-1-1v-4z"
                    />
                  </svg>
                  Email
                </Link>
              )}

            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-card-border">
            <h2 className="text-lg font-semibold text-ink dark:text-cream mb-4">Avaliações</h2>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Rating media={media.media} total={media.total} size="lg" />
              </div>

              {avaliacoesCarregando ? (
                <p className="text-neutral-500 dark:text-cream-text/70 text-center py-8">Carregando avaliações...</p>
              ) : avaliacoes.length > 0 ? (
                <div className="space-y-4">
                  {avaliacoes.map((avaliacao) => (
                    <Card key={avaliacao.id} variant="outlined" padding="md" className="border-card-border">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-lg font-bold text-orange-500 dark:text-orange-400 flex-shrink-0">
                          {avaliacao.user?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-ink dark:text-cream truncate">
                              {avaliacao.user?.email?.split('@')[0] || 'Utilizador'}
                            </p>
                            <div className="flex items-center gap-2">
                              <RatingStarsOnly media={avaliacao.nota} size="sm" />
                              <time className="text-xs text-neutral-500 dark:text-neutral-400">
                                {new Date(avaliacao.created_at).toLocaleDateString('pt-AO', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })}
                              </time>
                            </div>
                          </div>
                          {avaliacao.comentario && (
                            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">
                              {avaliacao.comentario}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-500 dark:text-cream-text/70 text-center py-8">Sem avaliações</p>
              )}

              {userId && (
                <ReviewForm alvo={alvo} userId={userId} />
              )}
            </div>
          </div>

          <div className="mt-6 text-right">
            <Link
              href="/empresas"
              className="inline-flex items-center px-4 py-2 border border-card-border rounded-[4px] bg-white text-ink dark:text-cream hover:bg-cream dark:hover:bg-navy-dark transition-colors"
            >
              <svg
                className="-ml-1 mr-2 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Voltar para Empresas
            </Link>
          </div>
        </Card>
      </div>
    </MainLayout>
  )
}

export default function EmpresaPage() {
  return <EmpresaContent />
}