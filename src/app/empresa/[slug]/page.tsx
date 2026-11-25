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
import type { PortfolioItem } from "@/lib/actions/profissionais-publicos"
import { AlvoDenuncia } from "@/lib/actions/denuncias"
import { createBrowserSupabaseClient } from "@/lib/supabase-browser"
import { BotaoContactarEmpresa } from "@/components/empresas/BotaoContactarEmpresa"
import { Rating } from "@/components/avaliacoes/Rating"
import { verificarPodeContactar } from "@/lib/actions/conversas"
import { AvaliacoesProfissional } from "@/app/profissional/[slug]/_components/AvaliacoesProfissional"
import { PortfolioProfissional } from "@/app/profissional/[slug]/_components/PortfolioProfissional"
import { ProfissionalWhatsApp } from "@/app/profissional/[slug]/_components/ProfissionalWhatsApp"

interface EmpresaPublica {
  id: string
  name: string
  sector?: string
  province?: string
  city?: string
  bairro?: string
  rua?: string
  referencia_localizacao?: string
  description?: string
  horario_atendimento?: string
  slug: string
  is_approved: boolean
  whatsapp?: string
  logo_url?: string
  portfolio: PortfolioItem[] | null
}

function EmpresaContent() {
  const { slug } = useParams<{ slug: string }>()
  const [empresa, setEmpresa] = React.useState<EmpresaPublica | null>(null)
  const [carregando, setCarregando] = React.useState(true)
  const [media, setMedia] = React.useState({ media: 0, total: 0 })
  const [avaliacoes, setAvaliacoes] = React.useState<Awaited<ReturnType<typeof getAvaliacoesPorAlvo>>>([])
  const [userId, setUserId] = React.useState<string | null>(null)
  const [contacto, setContacto] = React.useState<{ empresaId: string; pode: boolean } | null>(null)
  const [avaliacoesCarregando, setAvaliacoesCarregando] = React.useState(true)
  const [erroCarregamento, setErroCarregamento] = React.useState(false)
  const [aba, setAba] = React.useState("")
  const podeContactar = Boolean(empresa && userId && contacto?.empresaId === empresa.id && contacto.pode)

  React.useEffect(() => {
    let activo = true
    setCarregando(true)
    setEmpresa(null)
    setAba("")
    setMedia({ media: 0, total: 0 })
    setAvaliacoes([])
    setContacto(null)
    async function carregar() {
      try {
        const { data, error } = await supabase.from("empresas_publicas")
          .select("id, name, sector, province, city, bairro, rua, referencia_localizacao, description, horario_atendimento, slug, is_approved, whatsapp, logo_url, portfolio")
          .eq("slug", slug).eq("is_approved", true).maybeSingle()
        if (!activo) return
        setErroCarregamento(Boolean(error))
        setEmpresa(error ? null : data as EmpresaPublica | null)
      } catch {
        if (activo) setErroCarregamento(true)
      } finally {
        if (activo) setCarregando(false)
      }
    }
    if (slug) void carregar()
    else setCarregando(false)
    return () => { activo = false }
  }, [slug])

  React.useEffect(() => {
    if (!empresa) return
    let activo = true
    setAvaliacoesCarregando(true)
    Promise.all([
      getMediaAvaliacoes({ tipo: 'empresa', id: empresa.id }),
      getAvaliacoesPorAlvo({ tipo: 'empresa', id: empresa.id }),
    ]).then(([resumo, lista]) => {
      if (activo) { setMedia(resumo); setAvaliacoes(lista) }
    }).catch(() => {}).finally(() => { if (activo) setAvaliacoesCarregando(false) })
    return () => { activo = false }
  }, [empresa])

  React.useEffect(() => {
    let activo = true
    const client = createBrowserSupabaseClient()
    void client.auth.getSession().then(({ data: { session } }) => {
      if (activo) setUserId(session?.user?.id || null)
    })
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (activo) setUserId(session?.user?.id || null)
    })
    return () => { activo = false; subscription.unsubscribe() }
  }, [])

  React.useEffect(() => {
    if (!empresa || !userId) return
    let activo = true
    const empresaId = empresa.id
    verificarPodeContactar({ tipo: 'empresa', id: empresaId })
      .then((resultado) => { if (activo) setContacto({ empresaId, pode: resultado.pode }) })
      .catch(() => { if (activo) setContacto({ empresaId, pode: false }) })
    return () => { activo = false }
  }, [empresa, userId])

  if (carregando) return <MainLayout><div role="status" className="flex min-h-[50vh] items-center justify-center p-4">Carregando empresa...</div></MainLayout>
  if (!empresa) return <MainLayout><div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center"><p role={erroCarregamento ? "alert" : "status"}>{erroCarregamento ? "Não foi possível carregar este perfil." : "Empresa não encontrada"}</p>{erroCarregamento && <button type="button" onClick={() => window.location.reload()} className="min-h-11 rounded-xl bg-orange-600 px-5 text-white">Tentar novamente</button>}<Link href="/empresas" className="inline-flex min-h-11 items-center text-orange-600">Voltar às empresas</Link></div></MainLayout>

  const alvo = { tipo: 'empresa' as const, id: empresa.id }
  const alvoDenuncia: AlvoDenuncia = alvo
  const localizacao = [empresa.city, empresa.province].filter(Boolean).join(", ")
  const endereco = [empresa.rua, empresa.bairro, localizacao].filter(Boolean).join(", ")
  const itensPortfolio = (empresa.portfolio ?? []).filter((item) => item && (
    (typeof item.titulo === "string" && item.titulo.trim()) ||
    [item.imagem_url, item.image_url, item.foto_url, item.url_imagem, item.url_projeto].some((valor) => typeof valor === "string" && valor.startsWith("/api/imagens/")) ||
    (typeof item.url_projeto === "string" && isHttpsUrl(item.url_projeto))
  ))
  const logoSrc = typeof empresa.logo_url === "string" && (empresa.logo_url.startsWith("/api/imagens/") || isHttpsUrl(empresa.logo_url)) ? empresa.logo_url : null
  const abas = [
    ...(empresa.description?.trim() ? [{ id: "sobre", titulo: "Sobre" }] : []),
    ...(itensPortfolio.length ? [{ id: "portfolio", titulo: "Portfólio" }] : []),
    ...(media.total > 0 || userId ? [{ id: "avaliacoes", titulo: "Avaliações" }] : []),
  ]
  const selecionada = abas.some((item) => item.id === aba) ? aba : abas[0]?.id

  return <MainLayout>
    <div className="mx-auto min-w-0 max-w-4xl space-y-5 px-4 py-5 text-neutral-900 dark:text-cream sm:px-6 lg:px-8">
      <Link href="/empresas" className="inline-flex min-h-11 items-center text-sm text-neutral-600 hover:text-orange-600 dark:text-cream-text">← Voltar a empresas</Link>
      <Card variant="muted" padding="md">
        <CardContent className="flex min-w-0 items-start gap-3 sm:gap-5">
          {logoSrc ? <img src={logoSrc} alt={`Logótipo de ${empresa.name}`} className="h-16 w-16 shrink-0 rounded-2xl border border-card-border bg-white object-contain p-1 sm:h-20 sm:w-20" /> : <div aria-hidden="true" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-2xl text-neutral-600 dark:bg-neutral-800 dark:text-cream sm:h-20 sm:w-20">{empresa.name?.charAt(0)?.toUpperCase() || "E"}</div>}
          <div className="min-w-0 flex-1 space-y-2 break-words">
            <h1 className="text-xl font-bold tracking-tight sm:text-3xl">{empresa.name}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600 dark:text-cream-text">{empresa.sector && <Badge variant="neutral">{empresa.sector}</Badge>}{localizacao && <span>{localizacao}</span>}</div>
            <Rating media={media.media} total={media.total} size="md" />
          </div>
        </CardContent>
      </Card>
      {(podeContactar || empresa.whatsapp) && <section aria-label="Contacto principal" className="grid min-w-0 gap-3">
        <div className="w-full [&_button]:min-h-11 [&_button]:w-full [&_a]:min-h-11 [&_a]:w-full"><BotaoContactarEmpresa empresaId={empresa.id} visivel={podeContactar} className="w-full [&>button]:w-full" /></div>
        {empresa.whatsapp && <div className="w-full [&_a]:min-h-11 [&_a]:w-full [&_a]:justify-center [&_button]:w-full"><ProfissionalWhatsApp whatsapp={empresa.whatsapp} tipoEntidade="empresa" /></div>}
      </section>}
      {(endereco || empresa.horario_atendimento) && <section aria-label="Informações rápidas" className="grid min-w-0 gap-4 rounded-2xl border border-card-border p-4 sm:grid-cols-2">
        {endereco && <div className="min-w-0"><h2 className="text-sm font-semibold">Endereço</h2><p className="mt-1 break-words text-sm text-neutral-600 dark:text-cream-text">{endereco}</p></div>}
        {empresa.horario_atendimento && <div className="min-w-0"><h2 className="text-sm font-semibold">Horário de atendimento</h2><p className="mt-1 whitespace-pre-wrap break-words text-sm text-neutral-600 dark:text-cream-text">{empresa.horario_atendimento}</p></div>}
      </section>}
      {abas.length > 0 && <section className="min-w-0 space-y-4">
        <div role="tablist" aria-label="Conteúdos da empresa" className="flex flex-wrap gap-1 border-b border-card-border">
          {abas.map((item) => <button key={item.id} id={`empresa-aba-${item.id}`} type="button" role="tab" aria-selected={selecionada === item.id} aria-controls={`empresa-painel-${item.id}`} onClick={() => setAba(item.id)} onKeyDown={(event) => {
            if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return
            event.preventDefault()
            const indice = abas.findIndex((a) => a.id === item.id)
            const proxima = event.key === "Home" ? 0 : event.key === "End" ? abas.length - 1 : (indice + (event.key === "ArrowRight" ? 1 : -1) + abas.length) % abas.length
            setAba(abas[proxima].id)
            document.getElementById(`empresa-aba-${abas[proxima].id}`)?.focus()
          }} tabIndex={selecionada === item.id ? 0 : -1} className={`min-h-11 min-w-0 border-b-2 px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${selecionada === item.id ? "border-orange-500 text-orange-600 dark:text-orange-400" : "border-transparent text-neutral-600 dark:text-cream-text"}`}>{item.titulo}</button>)}
        </div>
        {abas.map((item) => <div key={item.id} id={`empresa-painel-${item.id}`} role="tabpanel" aria-labelledby={`empresa-aba-${item.id}`} hidden={selecionada !== item.id} tabIndex={0} className="min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500">
          {item.id === "sobre" && <Card variant="muted" padding="md"><CardContent className="space-y-3"><SectionHeader title="Sobre a empresa" /><p className="whitespace-pre-line break-words leading-relaxed text-neutral-700 dark:text-cream-text">{empresa.description}</p></CardContent></Card>}
          {item.id === "portfolio" && <div className="[&>section]:mt-0 [&_ul]:gap-3 min-[360px]:[&_ul]:grid-cols-2 [&_li]:min-w-0 [&_li]:break-words [&_li]:p-3"><PortfolioProfissional itens={itensPortfolio} /></div>}
          {item.id === "avaliacoes" && <div className="space-y-5">{avaliacoesCarregando ? <p role="status" className="py-4 text-center">Carregando avaliações...</p> : <AvaliacoesProfissional avaliacoes={avaliacoes} resumo={media} tipoEntidade="empresa" />}{userId && <ReviewForm alvo={alvo} userId={userId} />}</div>}
        </div>)}
      </section>}
      {(endereco || empresa.referencia_localizacao) && <section aria-labelledby="empresa-localizacao" className="space-y-2 rounded-2xl border border-card-border p-4"><h2 id="empresa-localizacao" className="text-lg font-semibold">Localização</h2>{endereco && <p className="break-words text-sm text-neutral-600 dark:text-cream-text">{endereco}</p>}{empresa.referencia_localizacao && <p className="break-words text-sm text-neutral-600 dark:text-cream-text">Referência: {empresa.referencia_localizacao}</p>}</section>}
      <section className="space-y-3 border-t border-card-border pt-4"><SectionHeader title="Segurança" />{userId ? <ReportForm alvo={alvoDenuncia} userId={userId} triggerLabel="Denunciar esta empresa" /> : <EmptyState title="Denúncia indisponível" description="Crie uma conta para denunciar informações desta empresa." />}</section>
    </div>
  </MainLayout>
}

export default function EmpresaPage() {
  return <EmpresaContent />
}
