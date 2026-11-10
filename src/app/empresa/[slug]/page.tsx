"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { IMAGENS } from "@/lib/imagens"
import { supabase } from "@/lib/supabase"
import { isHttpsUrl } from "@/lib/utils"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { EmptyState } from "@/components/ui/EmptyState"
import { MainLayout } from "@/components/layout/MainLayout"
import { ReviewForm } from "@/components/avaliacoes/ReviewForm"
import { ReportForm } from "@/components/denuncias/ReportForm"
import { getMediaAvaliacoes, getAvaliacoesPorAlvo } from "@/lib/actions/avaliacoes"
import { AlvoDenuncia } from "@/lib/actions/denuncias"
import { createBrowserSupabaseClient } from "@/lib/supabase-browser"
import { ContactarEmpresaButton } from "./_components/ContactarEmpresaButton"
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
        <div className="flex min-h-screen items-center justify-center bg-white p-4 dark:bg-navy-dark">
          <p className="text-neutral-600 dark:text-cream-text">Carregando empresa...</p>
        </div>
      </MainLayout>
    )
  }

  if (!empresa) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-white p-8 text-center dark:bg-navy-dark">
          <p className="text-lg font-medium text-red-600 dark:text-red-400">Empresa não encontrada</p>
        </div>
      </MainLayout>
    )
  }

  const hasPhone = !!empresa.phone
  const hasEmail = !!empresa.email
  const alvo = { tipo: 'empresa' as const, id: empresa.id }
  const alvoDenuncia: AlvoDenuncia = { tipo: 'empresa', id: empresa.id }

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

  const temDadosLegalizacao = !!empresa.estado_legalizacao
  const temEnderecoDetalhado = empresa.rua || empresa.bairro || empresa.referencia_localizacao
  const localizacao = [empresa.city, empresa.province].filter(Boolean).join(', ')

  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl bg-white px-4 py-12 dark:bg-navy-dark sm:px-6 lg:px-8">
        <Image
          src={IMAGENS.empresaCapaPadrao}
          alt=""
          width={1672}
          height={941}
          sizes="(max-width: 768px) 100vw, 896px"
          className="mb-8 h-auto w-full rounded-[16px] object-cover"
        />
        <nav aria-label="Navegação" className="mb-8">
          <Link href="/empresas" className="text-sm font-medium text-neutral-600 hover:text-orange-600 dark:text-cream-text dark:hover:text-orange-400">
            ← Voltar a empresas
          </Link>
        </nav>

        <header className="flex flex-col gap-6 sm:flex-row sm:items-center">
          {isHttpsUrl(empresa.logo_url) ? (
            <img
              src={empresa.logo_url}
              alt={`Logótipo de ${empresa.name}`}
              className="h-24 w-24 rounded-2xl border border-neutral-100 bg-white object-contain p-2 dark:border-neutral-700 dark:bg-neutral-800"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-neutral-100 text-3xl font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-cream-text">
              {empresa.name?.charAt(0)?.toUpperCase() || 'E'}
            </div>
          )}

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-cream sm:text-4xl">
              {empresa.name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-neutral-600 dark:text-cream-text">
              {empresa.sector && <Badge variant="neutral">{empresa.sector}</Badge>}
              {localizacao && <span className="text-sm">{localizacao}</span>}
            </div>
          </div>
        </header>

        <div className="mt-8 max-w-md">
          <ProfissionalWhatsApp whatsapp={empresa.whatsapp} />
        </div>

        {empresa.description && (
          <section className="mt-14">
            <SectionHeader title="Sobre a empresa" />
            <p className="whitespace-pre-line text-neutral-700 dark:text-cream-text leading-relaxed">
              {empresa.description}
            </p>
          </section>
        )}

        <section className="mt-8">
          <ContactarEmpresaButton empresaId={empresa.id} />
        </section>

        <section className="mt-14">
          <SectionHeader title="Contactos e localização" />
          <Card variant="muted" padding="md">
            <CardContent className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-neutral-500 dark:text-cream-text/70">Telefone</p>
                <p className="mt-1 text-neutral-900 dark:text-cream">{empresa.phone || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-500 dark:text-cream-text/70">Email</p>
                <p className="mt-1 break-all text-neutral-900 dark:text-cream">{empresa.email || 'Não informado'}</p>
              </div>
              <div className="sm:col-span-2">
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
                    <p>{empresa.address || localizacao || 'Não informado'}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {empresa.horario_atendimento && (
          <section className="mt-14">
            <SectionHeader title="Horário de atendimento" />
            <p className="whitespace-pre-wrap text-neutral-700 dark:text-cream-text">
              {empresa.horario_atendimento}
            </p>
          </section>
        )}

        {temDadosLegalizacao && (
          <section className="mt-14">
            <SectionHeader title="Legalização" />
            <Badge variant="neutral">{traduzirEstadoLegalizacao(empresa.estado_legalizacao)}</Badge>
          </section>
        )}

        <section className="mt-14">
          <PortfolioProfissional itens={empresa.portfolio} />
        </section>

        <section className="mt-14">
          {avaliacoesCarregando ? (
            <p className="py-8 text-center text-neutral-500 dark:text-cream-text/70">Carregando avaliações...</p>
          ) : (
            <AvaliacoesProfissional avaliacoes={avaliacoes} resumo={media} />
          )}

          {userId && (
            <div className="mt-8">
              <ReviewForm alvo={alvo} userId={userId} />
            </div>
          )}
        </section>

        <section className="mt-14">
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
