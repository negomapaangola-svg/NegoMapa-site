"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { IMAGENS } from "@/lib/imagens"
import { supabase } from "@/lib/supabase"
import { isHttpsUrl } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/Card"
import { MainLayout } from "@/components/layout/MainLayout"
import { ReviewForm } from "@/components/avaliacoes/ReviewForm"
import { ReportForm } from "@/components/denuncias/ReportForm"
import { getMediaAvaliacoes, getAvaliacoesPorAlvo } from "@/lib/actions/avaliacoes"
import { AlvoDenuncia } from "@/lib/actions/denuncias"
import { createBrowserSupabaseClient } from "@/lib/supabase-browser"
// Padrão partilhado com o perfil do profissional (avaliações e portfólio).
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

      const { data, error } = await supabase
        .from("companies")
        .select("id, name, sector, province, city, bairro, rua, referencia_localizacao, description, email, phone, horario_atendimento, estado_legalizacao, slug, is_approved")
        .eq("slug", slug)
        .eq("is_approved", true)
        .single()

      if (error) {
        console.error("Empresa não encontrada:", error)
        setEmpresa(null)
      } else {
        // whatsapp, logo_url e portfolio vêm da vista pública. Se a vista ainda não tiver estas colunas,
        // a página continua a funcionar sem elas, em vez de mostrar "Empresa não encontrada".
        const { data: extras, error: erroExtras } = await supabase
          .from("empresas_publicas")
          .select("whatsapp, logo_url, portfolio")
          .eq("slug", slug)
          .maybeSingle()

        if (erroExtras) console.error("Dados públicos adicionais indisponíveis:", erroExtras.code)

        setEmpresa({
          ...data,
          whatsapp: extras?.whatsapp ?? null,
          logo_url: extras?.logo_url ?? null,
          portfolio: extras?.portfolio ?? null,
        })
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

  const hasPhone = !!empresa.phone
  const hasEmail = !!empresa.email
  const alvo = { tipo: 'empresa' as const, id: empresa.id }
  const alvoDenuncia: AlvoDenuncia = { tipo: 'empresa', id: empresa.id }

  // Helper para traduzir estado de legalização
  const traduzirEstadoLegalizacao = (estado: string): string => {
    switch (estado) {
      case 'legalizada':
        return 'Legalizada'
      case 'em_processo':
        return 'Em processo'
      case 'pendente_documentacao':
        return 'Documentação pendente'
      default:
        return estado
    }
  }

  // Verifica se há dados de legalização para exibir
  const temDadosLegalizacao = !!empresa.estado_legalizacao

  // Verifica se há endereço detalhado
  const temEnderecoDetalhado = empresa.rua || empresa.bairro || empresa.referencia_localizacao

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto p-6 md:p-8 bg-cream dark:bg-navy-dark">
        <Card variant="default" padding="lg" className="border-card-border">
          <Image
            src={IMAGENS.empresaCapaPadrao}
            alt=""
            width={1672}
            height={941}
            sizes="(max-width: 768px) 100vw, 768px"
            className="mb-6 h-auto w-full rounded-[16px] object-cover"
          />
          <div className="mb-6">
            {isHttpsUrl(empresa.logo_url) ? (
              <img
                src={empresa.logo_url}
                alt={`Logótipo de ${empresa.name}`}
                className="mb-4 h-20 w-20 rounded-md object-contain"
              />
            ) : (
              <Image
                src={IMAGENS.logoSite}
                alt="NegóMapa"
                width={560}
                height={120}
                className="mb-4 h-16 w-auto object-contain"
              />
            )}
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
              <div className="font-medium text-ink dark:text-cream space-y-1">
                {temEnderecoDetalhado ? (
                  <>
                    {empresa.rua && <p>{empresa.rua}</p>}
                    {empresa.bairro && <p>Bairro: {empresa.bairro}</p>}
                    {empresa.referencia_localizacao && <p>Ref.: {empresa.referencia_localizacao}</p>}
                    {empresa.city && <p>{empresa.city}</p>}
                    {empresa.province && <p>{empresa.province}</p>}
                  </>
                ) : (
                  <p>{empresa.address || empresa.city || empresa.province || "Não informado"}</p>
                )}
              </div>
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

          {/* Secção Legalização */}
          {temDadosLegalizacao && (
            <div className="mb-8 pt-8 border-t border-card-border">
              <h2 className="text-lg font-semibold text-ink dark:text-cream mb-4">Legalização</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CardContent className="space-y-1">
                  <p className="text-sm text-neutral-500 dark:text-cream-text/70">Estado de legalização</p>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 text-sm font-medium">
                      {traduzirEstadoLegalizacao(empresa.estado_legalizacao)}
                    </span>
                  </div>
                </CardContent>
              </div>
            </div>
          )}

          {/* Secção Horário de atendimento */}
          {empresa.horario_atendimento && (
            <div className="mb-8 pt-8 border-t border-card-border">
              <h2 className="text-lg font-semibold text-ink dark:text-cream mb-4">Horário de atendimento</h2>
              <div className="prose prose-neutral dark:prose-invert max-w-none whitespace-pre-wrap text-neutral-700 dark:text-cream-text">
                {empresa.horario_atendimento}
              </div>
            </div>
          )}

          {/* Contacto principal: WhatsApp quando existir; senão, telefone ou email. */}
          <div className="mt-8 pt-8 border-t border-card-border">
            <div className="flex flex-wrap gap-3">

              <ProfissionalWhatsApp whatsapp={empresa.whatsapp} />

              {!empresa.whatsapp && hasPhone && (
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

              {!empresa.whatsapp && hasEmail && (
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

              {!empresa.whatsapp && !hasPhone && !hasEmail && (
                <p className="text-neutral-500 dark:text-cream-text/70">Sem contactos publicados.</p>
              )}

            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-card-border">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink dark:text-cream">Segurança</h2>
              {userId && <ReportForm alvo={alvoDenuncia} userId={userId} triggerLabel="Denunciar esta empresa" />}
            </div>
          </div>

          {/* Portfólio: lido da vista pública; sem trabalhos, mostra o estado vazio. */}
          <div className="mt-8 pt-8 border-t border-card-border">
            <PortfolioProfissional itens={empresa.portfolio} />
          </div>

          <div className="mt-8 pt-8 border-t border-card-border">
            {avaliacoesCarregando ? (
              <p className="text-neutral-500 dark:text-cream-text/70 text-center py-8">Carregando avaliações...</p>
            ) : (
              <AvaliacoesProfissional avaliacoes={avaliacoes} resumo={media} />
            )}

            {userId && (
              <div className="mt-8">
                <ReviewForm alvo={alvo} userId={userId} />
              </div>
            )}
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
