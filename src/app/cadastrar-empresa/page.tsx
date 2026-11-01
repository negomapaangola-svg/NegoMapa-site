"use client"

import * as React from "react"
import Link from "next/link"
import { createBrowserSupabaseClient } from "@/lib/supabase-browser"
import { Button } from "@/components/ui/Button"
import { MainLayout } from "@/components/layout/MainLayout"
import { MultiStepForm } from "@/components/forms/multi-step/MultiStepForm"
import { buildEtapas, dadosVazios, type CategoriaOpcao, type DadosEmpresa } from "./_components/etapas"

// Limites e tipos dos ficheiros (alinhados com src/lib/actions/upload.ts)
const LOGOTIPO = {
  nome: "O logótipo",
  tipos: ["image/png", "image/jpeg", "image/webp"],
  maxBytes: 2 * 1024 * 1024,
}
const COMPROVATIVO = {
  nome: "O comprovativo",
  tipos: ["application/pdf", "image/png", "image/jpeg"],
  maxBytes: 10 * 1024 * 1024,
}

function validarFicheiro(file: File, regra: typeof LOGOTIPO): string | null {
  if (!regra.tipos.includes(file.type)) {
    return `${regra.nome} tem um tipo de ficheiro não permitido.`
  }
  if (file.size > regra.maxBytes) {
    return `${regra.nome} excede ${regra.maxBytes / (1024 * 1024)} MB.`
  }
  return null
}

function extensaoDe(file: File): string {
  const partes = file.name.split(".")
  return partes.length > 1 ? partes.pop()!.toLowerCase().replace(/[^a-z0-9]/g, "") : "bin"
}

export default function CadastrarEmpresaPage() {
  const [loading, setLoading] = React.useState(true)
  const [user, setUser] = React.useState<any>(null)
  const [existingCompany, setExistingCompany] = React.useState<any>(null)
  const [categorias, setCategorias] = React.useState<CategoriaOpcao[]>([])
  const [submitting, setSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [submitted, setSubmitted] = React.useState(false)

  // Criação de conta (visitante anónimo): mantida como antes, antes da etapa 1
  const [account, setAccount] = React.useState({ email: "", password: "", confirm: "" })
  const [accountError, setAccountError] = React.useState<string | null>(null)
  const [accountStatus, setAccountStatus] = React.useState<"idle" | "submitting">("idle")
  const [pendingEmail, setPendingEmail] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function fetchUser() {
      const supabase = createBrowserSupabaseClient()
      const { data } = await supabase.auth.getUser()
      const current = data.user ?? null
      setUser(current)
      if (current) {
        // Evita duplicados: se já existe empresa para este utilizador, não mostra o formulário
        const { data: empresa } = await supabase
          .from("companies")
          .select("id, name, slug, is_approved")
          .eq("user_id", current.id)
          .maybeSingle()
        setExistingCompany(empresa ?? null)

        // Categorias para a etapa 3 (se falhar, a etapa mostra uma mensagem)
        const { data: cats } = await supabase
          .from("categorias")
          .select("id, nome")
          .eq("ativo", true)
          .order("nome")
        setCategorias((cats as CategoriaOpcao[]) ?? [])
      }
      setLoading(false)
    }
    fetchUser()
  }, [])

  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setAccount(prev => ({ ...prev, [name]: value }))
  }

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAccountError(null)

    if (account.password.length < 8) {
      setAccountError("A palavra-passe deve ter pelo menos 8 caracteres.")
      return
    }
    if (account.password !== account.confirm) {
      setAccountError("As palavras-passe não coincidem.")
      return
    }

    setAccountStatus("submitting")
    const email = account.email.trim().toLowerCase()
    const supabase = createBrowserSupabaseClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password: account.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/cadastrar-empresa`,
      },
    })
    setAccountStatus("idle")

    if (error) {
      setAccountError(error.message)
      return
    }
    // Email já registado: o Supabase não devolve utilizador novo
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      setAccountError("Já existe uma conta com este email. Entre na sua conta.")
      return
    }
    // Confirmação de email desactivada: a sessão já existe e segue para o formulário
    if (data.session) {
      setUser(data.session.user)
      return
    }
    // Confirmação de email activa: mostrar "Verifique o seu email"
    setPendingEmail(email)
  }

  const gerarSlugUnico = async (nome: string, supabase: ReturnType<typeof createBrowserSupabaseClient>) => {
    const baseSlug = nome
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")

    let slug = baseSlug
    let counter = 2
    while (true) {
      const { data: existing, error: findError } = await supabase
        .from("companies")
        .select("slug")
        .eq("slug", slug)
        .single()

      if (findError && findError.code === "PGRST116") break
      if (existing) {
        slug = `${baseSlug}-${counter}`
        counter++
        continue
      }
      break
    }
    return slug
  }

  // Envio final (etapa 6). Os dados ficam no formulário se algo falhar.
  const handleSubmit = async (d: DadosEmpresa) => {
    setSubmitError(null)

    if (d.logotipo) {
      const erro = validarFicheiro(d.logotipo, LOGOTIPO)
      if (erro) return setSubmitError(erro)
    }
    if (d.legalizada === "sim" && d.comprovativo) {
      const erro = validarFicheiro(d.comprovativo, COMPROVATIVO)
      if (erro) return setSubmitError(erro)
    }

    setSubmitting(true)
    const supabase = createBrowserSupabaseClient()

    try {
      const slug = await gerarSlugUnico(d.nome, supabase)

      let logoPath: string | null = null
      if (d.logotipo) {
        const path = `${user.id}/logotipo-${Date.now()}.${extensaoDe(d.logotipo)}`
        const { error: upErr } = await supabase.storage
          .from("empresas-logos")
          .upload(path, d.logotipo, { contentType: d.logotipo.type, upsert: false })
        if (upErr) {
          setSubmitError(`Não foi possível enviar o logótipo: ${upErr.message}. Os seus dados foram mantidos.`)
          return
        }
        logoPath = path
      }

      const legalizada = d.legalizada === "sim"
      let docPath: string | null = null
      if (legalizada && d.comprovativo) {
        const path = `${user.id}/legalizacao-${Date.now()}.${extensaoDe(d.comprovativo)}`
        const { error: upErr } = await supabase.storage
          .from("documentos-privados")
          .upload(path, d.comprovativo, { contentType: d.comprovativo.type, upsert: false })
        if (upErr) {
          setSubmitError(`Não foi possível enviar o comprovativo: ${upErr.message}. Os seus dados foram mantidos.`)
          return
        }
        docPath = path
      }

      const { error } = await supabase
        .from("companies")
        .insert({
          user_id: user.id,
          name: d.nome,
          slug,
          sector: d.setor,
          province: d.provincia,
          city: d.municipio,
          bairro: d.bairro || null,
          description: d.descricao || null,
          phone: d.telefone,
          whatsapp: d.mesmoNumeroWhatsapp ? d.telefone : d.whatsapp,
          email: d.email,
          website: d.website || null,
          logo_url: logoPath,
          nif: legalizada ? d.nif : null,
          estado_legalizacao: legalizada ? "legalizada" : null,
          documento_legalizacao_path: docPath,
          is_approved: false,
        })
        .select("id")

      if (error) {
        if (error.code === "23505" && error.message.includes("slug")) {
          setSubmitError("Já existe uma empresa com um nome muito semelhante. Ajuste o nome e tente novamente.")
        } else {
          setSubmitError("Não foi possível registar a empresa. Os seus dados foram mantidos; tente novamente. (" + error.message + ")")
        }
        return
      }

      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen p-8 bg-cream dark:bg-navy-dark">
          <p className="text-center text-neutral-600 dark:text-cream-text">A carregar...</p>
        </div>
      </MainLayout>
    )
  }

  // Visitante anónimo: confirmação de email enviada
  if (!user && pendingEmail) {
    return (
      <MainLayout>
        <div className="min-h-screen p-4 md:p-8 bg-cream dark:bg-navy-dark">
          <div className="max-w-md mx-auto space-y-4 bg-white rounded-[4px] p-6 shadow dark:bg-neutral-800">
            <h1 className="text-2xl font-bold text-ink dark:text-cream text-center">Verifique o seu email</h1>
            <p className="text-neutral-600 dark:text-cream-text">
              Enviámos um link de confirmação para <strong>{pendingEmail}</strong>.
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-neutral-600 dark:text-cream-text">
              <li>Abra o email e clique no link de confirmação.</li>
              <li>Será levado de volta a este cadastro, já com a sessão iniciada.</li>
              <li>
                Se já confirmou e a sessão não abrir, entre em{" "}
                <a href="/login" className="text-orange-500 dark:text-orange-400 hover:underline">Entrar</a>.
              </li>
            </ol>
            <p className="text-sm text-neutral-500 dark:text-cream-text/70">Não recebeu o email? Verifique a pasta de spam.</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Visitante anónimo: criação de conta
  if (!user) {
    return (
      <MainLayout>
        <div className="min-h-screen p-4 md:p-8 bg-cream dark:bg-navy-dark">
          <div className="max-w-md mx-auto space-y-6">
            <h1 className="text-2xl md:text-3xl font-bold text-ink dark:text-cream text-center">
              Cadastro de Empresa
            </h1>
            <p className="text-neutral-600 dark:text-cream-text text-center">
              Crie a sua conta para registar a sua empresa.
            </p>

            <form onSubmit={handleAccountSubmit} className="space-y-4 bg-white rounded-[4px] p-6 shadow dark:bg-neutral-800">
              <div>
                <label className="block text-sm font-medium text-ink dark:text-cream mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={account.email}
                  onChange={handleAccountChange}
                  className="w-full px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink dark:text-cream mb-2">Senha</label>
                <input
                  type="password"
                  name="password"
                  value={account.password}
                  onChange={handleAccountChange}
                  minLength={8}
                  className="w-full px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink dark:text-cream mb-2">Confirmar palavra-passe</label>
                <input
                  type="password"
                  name="confirm"
                  value={account.confirm}
                  onChange={handleAccountChange}
                  minLength={8}
                  className="w-full px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
                  required
                />
              </div>
              {accountError && (
                <p className="text-sm text-red-600 dark:text-red-400">{accountError}</p>
              )}
              <Button type="submit" className="w-full" disabled={accountStatus === "submitting"}>
                {accountStatus === "submitting" ? "A criar conta..." : "Criar conta"}
              </Button>
            </form>

            <p className="text-center text-sm text-neutral-600 dark:text-cream-text">
              Já tem conta?{" "}
              <a href="/login" className="font-medium text-orange-500 dark:text-orange-400 hover:underline">Entrar</a>
            </p>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Já existe empresa para esta conta: não mostra formulário (evita duplicados)
  if (existingCompany) {
    return (
      <MainLayout>
        <div className="min-h-screen p-4 md:p-8 bg-cream dark:bg-navy-dark">
          <div className="max-w-md mx-auto space-y-4 bg-white rounded-[4px] p-6 shadow dark:bg-neutral-800">
            <h1 className="text-2xl font-bold text-ink dark:text-cream text-center">Empresa já registada</h1>
            <p className="text-neutral-600 dark:text-cream-text">
              A empresa <strong>{existingCompany.name}</strong> já está registada na sua conta.
            </p>
            {existingCompany.is_approved ? (
              <p className="text-neutral-600 dark:text-cream-text">
                Está aprovada.{" "}
                <a href={`/empresa/${existingCompany.slug}`} className="text-orange-500 dark:text-orange-400 hover:underline">Ver página da empresa</a>
              </p>
            ) : (
              <p className="text-neutral-600 dark:text-cream-text">Aguarda aprovação pela equipa NegóMapa.</p>
            )}
          </div>
        </div>
      </MainLayout>
    )
  }

  // Envio concluído: aguarda aprovação
  if (submitted) {
    return (
      <MainLayout>
        <div className="min-h-screen p-4 md:p-8 bg-cream dark:bg-navy-dark">
          <div className="max-w-md mx-auto space-y-4 bg-white rounded-[4px] p-6 shadow dark:bg-neutral-800">
            <h1 className="text-2xl font-bold text-ink dark:text-cream text-center">Cadastro enviado</h1>
            <p className="text-neutral-600 dark:text-cream-text">
              A sua empresa fica pendente até a equipa NegóMapa a aprovar. Só será publicada depois da aprovação.
            </p>
            <p className="text-center">
              <Link href="/" className="font-medium text-orange-500 dark:text-orange-400 hover:underline">Voltar ao início</Link>
            </p>
          </div>
        </div>
      </MainLayout>
    )
  }

  const etapas = buildEtapas(categorias)

  return (
    <MainLayout>
      <div className="min-h-screen p-4 md:p-8 bg-cream dark:bg-navy-dark">
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="text-2xl md:text-3xl font-bold text-ink dark:text-cream text-center">
            Cadastro de Empresa
          </h1>

          {submitError && (
            <div role="alert" className="p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-[4px] text-sm">
              {submitError}
            </div>
          )}

          <MultiStepForm<DadosEmpresa>
            steps={etapas}
            initialData={{ ...dadosVazios, email: user.email ?? "" }}
            onSubmit={handleSubmit}
            submitLabel="Enviar para aprovação"
            submitting={submitting}
          />
        </div>
      </div>
    </MainLayout>
  )
}
