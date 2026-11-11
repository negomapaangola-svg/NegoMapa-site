"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { isHttpsUrl } from "@/lib/utils"
import { Badge } from "@/components/ui/Badge"
import { Card, CardContent } from "@/components/ui/Card"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { EmptyState } from "@/components/ui/EmptyState"
import { MainLayout } from "@/components/layout/MainLayout"
import { ReviewForm } from "@/components/avaliacoes/ReviewForm"
import { ReportForm } from "@/components/denuncias/ReportForm"
import { getMediaAvaliacoes, getAvaliacoesPorAlvo } from "@/lib/actions/avaliacoes"
import { AlvoDenuncia } from "@/lib/actions/denuncias"
import { createBrowserSupabaseClient } from "@/lib/supabase-browser"
import { AvaliacoesProfissional } from "@/app/profissional/[slug]/_components/AvaliacoesProfissional"
import { PortfolioProfissional } from "@/app/profissional/[slug]/_components/PortfolioProfissional"
import { ProfissionalWhatsApp } from "@/app/profissional/[slug]/_components/ProfissionalWhatsApp"

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

      // Leitura a partir da vista pública: a tabela companies já não é legível pelo anon
      // em email, phone e estado_legalizacao (migração 20261110), o que causava "não encontrada".
      const { data, error } = await supabase
        .from("empresas_publicas")
        .select("id, name, sector, province, city, bairro, rua, referencia_localizacao, description, horario_atendimento, slug, is_approved, whatsapp, logo_url, portfolio")
        .eq("slug", slug)
        .eq("is_approved", true)
        .maybeSingle()

      if (error) {
        console.error("Erro ao carregar empresa. Código:", error.code)
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
        <div className="flex min-h-[50vh] items-center justify-center bg-white p-4 dark:bg-navy-dark">
          <p className="text-neutral-600 dark:text-cream-text">Carregando empresa...</p>
        </div>
      </MainLayout>
    )
  }

  if (!empresa) {
    return (
      <MainLayout>
        <div className="min-h-[50vh] bg-white p-8 text-center dark:bg-navy-dark">
          <p className="text-lg font-medium text-red-600 dark:text-red-400">Empresa não encontrada</p>
        </div>
      </MainLayout>
    )
  }

  const alvo = { tipo: 'empresa' as const, id: empresa.id }
  const alvoDenuncia: AlvoDenuncia = { tipo: 'empresa', id: empresa.id }

  const temEnderecoDetalhado = empresa.rua || empresa.bairro || empresa.referencia_localizacao
  const localizacao = [empresa.city, empresa.province].filter(Boolean).join(", ")
  const temPortfolio = Array.isArray(empresa.portfolio) && empresa.portfolio.length > 0

  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl space-y-6 bg-white px-4 py-8 dark:bg-navy-dark sm:px-6 lg:px-8">
        <Link
          href="/empresas"
          className="inline-flex min-h-[44px] items-center text-sm font-medium text-neutral-600 hover:text-orange-600 dark:text-cream-text dark:hover:text-orange-400"
        >
          ← Voltar a empresas
        </Link>

        <Card variant="muted" padding="md">
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {isHttpsUrl(empresa.logo_url) ? (
              <img
                src={empresa.logo_url}
                alt={`Logótipo de ${empresa.name}`}
                className="h-20 w-20 shrink-0 rounded-2xl border border-neutral-100 bg-white object-contain p-2 dark:border-neutral-700 dark:bg-neutral-800"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-2xl font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-cream-text">
                {empresa.name?.charAt(0)?.toUpperCase() || "E"}
              </div>
            )}

            <div className="min-w-0 space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-cream sm:text-3xl">
                {empresa.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600 dark:text-cream-text">
                {empresa.sector && <Badge variant="neutral">{empresa.sector}</Badge>}
                {localizacao && <span>{localizacao}</span>}
              </div>
            </div>
          </CardContent>
        </Card>

        {empresa.description && (
          <Card variant="muted" padding="md">
            <CardContent className="space-y-3">
              <SectionHeader title="Sobre a empresa" />
              <p className="whitespace-pre-line leading-relaxed text-neutral-700 dark:text-cream-text">
                {empresa.description}
              </p>
            </CardContent>
          </Card>
        )}

        <Card variant="muted" padding="md">
          <CardContent className="space-y-5">
            <SectionHeader title="Informações" />

            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-cream-text/70">Endereço</p>
              <div className="mt-1 space-y-1 text-neutral-900 dark:text-cream">
                {temEnderecoDetalhado ? (
                  <>
                    {empresa.rua && <p>{empresa.rua}</p>}
                    {empresa.bairro && <p>Bairro: {empresa.bairro}</p>}
                    {empresa.referencia_localizacao && <p>Ref.: {empresa.referencia_localizacao}</p>}
                    {localizacao && <p>{localizacao}</p>}
                  </>
                ) : (
                  <p>{empresa.address || localizacao || "Não informado"}</p>
                )}
              </div>
            </div>

            {empresa.horario_atendimento && (
              <div>
                <p className="text-sm font-medium text-neutral-500 dark:text-cream-text/70">Horário de atendimento</p>
                <p className="mt-1 whitespace-pre-wrap text-neutral-900 dark:text-cream">{empresa.horario_atendimento}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {empresa.whatsapp && (
          <div className="max-w-md">
            <ProfissionalWhatsApp whatsapp={empresa.whatsapp} />
          </div>
        )}

        {temPortfolio && (
          <section>
            <PortfolioProfissional itens={empresa.portfolio} />
          </section>
        )}

        <section className="space-y-6">
          {avaliacoesCarregando ? (
            <p className="py-8 text-center text-neutral-500 dark:text-cream-text/70">Carregando avaliações...</p>
          ) : (
            <AvaliacoesProfissional avaliacoes={avaliacoes} resumo={media} />
          )}

          {userId && <ReviewForm alvo={alvo} userId={userId} />}
        </section>

        <section className="space-y-4">
          <SectionHeader title="Segurança" />
          {userId ? (
            <ReportForm alvo={alvoDenuncia} userId={userId} triggerLabel="Denunciar esta empresa" />
          ) : (
            <EmptyState
              title="Denúncia indisponível"
              description="Crie uma conta para denunciar informações desta empresa."
            />
          )}
        </section>
      </div>
    </MainLayout>
  )
}

export default function EmpresaPage() {
  return <EmpresaContent />
}
