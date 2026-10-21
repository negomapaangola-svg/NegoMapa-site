"use client"

import * as React from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase-browser"
import { Button } from "@/components/ui/Button"
import { MainLayout } from "@/components/layout/MainLayout"

type FormData = {
  name: string
  sector: string
  province: string
  phone: string
  email: string
  description?: string
  city?: string
  nif?: string
  estado_legalizacao?: string
  documento_legalizacao_url?: string
  horario_atendimento?: string
  bairro?: string
  rua?: string
  referencia_localizacao?: string
}

export default function CadastrarEmpresaPage() {
  const [formData, setFormData] = React.useState<FormData>({
    name: "",
    sector: "",
    province: "",
    phone: "",
    email: "",
    nif: "",
    estado_legalizacao: "",
    documento_legalizacao_url: "",
    horario_atendimento: "",
    bairro: "",
    rua: "",
    referencia_localizacao: "",
  })

  const [errors, setErrors] = React.useState<{ [key: string]: string }>({})
  const [status, setStatus] = React.useState<
    "idle" | "submitting" | "success"
  >("idle")
  const [redirect, setRedirect] = React.useState(false)
  const [user, setUser] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function fetchUser() {
      const supabase = createBrowserSupabaseClient()
      const { data } = await supabase.auth.getUser()
      setUser(data.user ?? null)
      setLoading(false)
    }
    fetchUser()
  }, [])

  if (!user) {
    return (
      <MainLayout>
        <div className="min-h-screen p-4 md:p-8 bg-cream dark:bg-navy-dark">
          <div className="max-w-md mx-auto space-y-6">
            <h1 className="text-2xl md:text-3xl font-bold text-ink dark:text-cream text-center">
              Cadastro de Empresa
            </h1>
            <p className="text-neutral-600 dark:text-cream-text">Por favor, faça login para cadastrar uma empresa.</p>
            <Button asChild>
              <a href="/login?redirectTo=/cadastrar-empresa" className="inline-flex items-center px-4 py-2 rounded-[4px] font-medium">
                Login
              </a>
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const validate = (): boolean => {
    const errors: { [key: string]: string } = {}

    if (!formData.name) errors.name = "Nome é obrigatório"
    if (!formData.sector) errors.sector = "Setor é obrigatório"
    if (!formData.province) errors.province = "Província é obrigatória"
    if (!formData.phone) errors.phone = "Phone é obrigatório"
    if (!formData.email) errors.email = "Email é obrigatório"

    setErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setStatus("submitting")

    const baseSlug = formData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")

    const supabase = createBrowserSupabaseClient()

    let slug = baseSlug
    let counter = 2
    while (true) {
      const { data: existing, error: findError } = await supabase
        .from("companies")
        .select("slug")
        .eq("slug", slug)
        .single()

      if (findError && findError.code === "PGRST116") {
        break
      }
      if (existing) {
        slug = `${baseSlug}-${counter}`
        counter++
        continue
      }
      break
    }

    const { data, error } = await supabase
      .from("companies")
      .insert({
        user_id: user.id,
        name: formData.name,
        slug,
        sector: formData.sector,
        province: formData.province,
        phone: formData.phone,
        email: formData.email,
        description: formData.description,
        city: formData.city ?? "",
        nif: formData.nif ?? null,
        estado_legalizacao: formData.estado_legalizacao ?? null,
        documento_legalizacao_url: formData.documento_legalizacao_url ?? null,
        horario_atendimento: formData.horario_atendimento ?? null,
        bairro: formData.bairro ?? null,
        rua: formData.rua ?? null,
        referencia_localizacao: formData.referencia_localizacao ?? null,
        is_approved: false,
      })
      .select()
      .single()

    if (error) {
      setStatus("idle")
      if (error.code === "23505" && error.message.includes("slug")) {
        alert("Já existe uma empresa com um nome muito semelhante. Ajusta o nome e tenta novamente.")
      } else {
        alert("Erro ao cadastrar: " + error.message)
      }
      return
    }

    setStatus("success")
    setFormData({
      name: "",
      sector: "",
      province: "",
      phone: "",
      email: "",
      nif: "",
      estado_legalizacao: "",
      documento_legalizacao_url: "",
      horario_atendimento: "",
      bairro: "",
      rua: "",
      referencia_localizacao: "",
    })

    setRedirect(true)
    setTimeout(() => {
      setRedirect(false)
      ;(window as any).location.href = '/'
    }, 3000)
  }

  return (
    <MainLayout>
      <div className="min-h-screen p-4 md:p-8 bg-cream dark:bg-navy-dark">
        <div className="max-w-md mx-auto space-y-6">
          <h1 className="text-2xl md:text-3xl font-bold text-ink dark:text-cream text-center">
            Cadastro de Empresa
          </h1>

          {redirect && (
            <div className="mb-4 text-center">
              <p className="text-green-600 dark:text-green-400">
                Cadastro enviado! Aguarde aprovação.
              </p>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-4 bg-white rounded-[4px] p-6 shadow dark:bg-neutral-800"
          >
          <div>
            <label className="block text-sm font-medium text-ink dark:text-cream mb-2">
              Nome da Empresa
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={e => handleChange(e)}
              className="w-full mt-1 px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
              required
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-ink dark:text-cream mb-2">
              Setor
            </label>
            <input
              type="text"
              name="sector"
              value={formData.sector}
              onChange={e => handleChange(e)}
              className="w-full mt-1 px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
              required
            />
            {errors.sector && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.sector}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-ink dark:text-cream mb-2">
              Província
            </label>
            <input
              type="text"
              name="province"
              value={formData.province}
              onChange={e => handleChange(e)}
              className="w-full mt-1 px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
              required
            />
            {errors.province && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.province}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-ink dark:text-cream mb-2">
              Contacto
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={e => handleChange(e)}
              className="w-full mt-1 px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
              required
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.phone}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-ink dark:text-cream mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={e => handleChange(e)}
              className="w-full mt-1 px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
              required
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-ink dark:text-cream mb-2">
              Cidade
            </label>
            <input
              type="text"
              name="city"
              value={formData.city ?? ""}
              onChange={e => handleChange(e)}
              className="w-full mt-1 px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
            />
          </div>

          {formData.description && (
            <div>
              <label className="block text-sm font-medium text-ink dark:text-cream mb-2">
                Descrição
              </label>
              <textarea
                name="description"
                value={formData.description ?? ""}
                onChange={e => handleChange(e)}
                className="w-full mt-1 px-3 py-2 border border-card-border rounded-[4px] shadow-sm resize-y focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
                rows={3}
              ></textarea>
            </div>
          )}

          {/* Dados legais */}
          <fieldset className="space-y-4 border border-card-border rounded-[4px] p-4 bg-white/50 dark:bg-neutral-800/50">
            <legend className="text-sm font-semibold text-ink dark:text-cream px-2">Dados legais</legend>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink dark:text-cream mb-2">
                  NIF
                </label>
                <input
                  type="text"
                  name="nif"
                  value={formData.nif ?? ""}
                  onChange={e => handleChange(e)}
                  className="w-full mt-1 px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
                  placeholder="Ex: 123456789"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink dark:text-cream mb-2">
                  Estado de legalização
                </label>
                <select
                  name="estado_legalizacao"
                  value={formData.estado_legalizacao ?? ""}
                  onChange={e => handleChange(e)}
                  className="w-full mt-1 px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
                >
                  <option value="">Selecionar...</option>
                  <option value="legalizada">Legalizada</option>
                  <option value="em_processo">Em processo</option>
                  <option value="pendente_documentacao">Pendente documentação</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink dark:text-cream mb-2">
                  URL do documento de legalização
                </label>
                <input
                  type="url"
                  name="documento_legalizacao_url"
                  value={formData.documento_legalizacao_url ?? ""}
                  onChange={e => handleChange(e)}
                  className="w-full mt-1 px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
                  placeholder="https://exemplo.com/documento.pdf"
                />
              </div>
            </div>
          </fieldset>

          {/* Horário */}
          <fieldset className="space-y-4 border border-card-border rounded-[4px] p-4 bg-white/50 dark:bg-neutral-800/50">
            <legend className="text-sm font-semibold text-ink dark:text-cream px-2">Horário de atendimento</legend>
            <div>
              <label className="block text-sm font-medium text-ink dark:text-cream mb-2">
                Horário de atendimento
              </label>
              <textarea
                name="horario_atendimento"
                value={formData.horario_atendimento ?? ""}
                onChange={e => handleChange(e)}
                className="w-full mt-1 px-3 py-2 border border-card-border rounded-[4px] shadow-sm resize-y focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
                rows={3}
                placeholder="Ex: Segunda a Sexta: 08h00–17h00; Sábado: 08h00–12h00"
              ></textarea>
            </div>
          </fieldset>

          {/* Localização detalhada */}
          <fieldset className="space-y-4 border border-card-border rounded-[4px] p-4 bg-white/50 dark:bg-neutral-800/50">
            <legend className="text-sm font-semibold text-ink dark:text-cream px-2">Localização detalhada</legend>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink dark:text-cream mb-2">
                  Rua
                </label>
                <input
                  type="text"
                  name="rua"
                  value={formData.rua ?? ""}
                  onChange={e => handleChange(e)}
                  className="w-full mt-1 px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
                  placeholder="Nome da rua / avenida"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink dark:text-cream mb-2">
                  Bairro
                </label>
                <input
                  type="text"
                  name="bairro"
                  value={formData.bairro ?? ""}
                  onChange={e => handleChange(e)}
                  className="w-full mt-1 px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
                  placeholder="Nome do bairro"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink dark:text-cream mb-2">
                  Referência de localização
                </label>
                <input
                  type="text"
                  name="referencia_localizacao"
                  value={formData.referencia_localizacao ?? ""}
                  onChange={e => handleChange(e)}
                  className="w-full mt-1 px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
                  placeholder="Próximo a / ponto de referência"
                />
              </div>
            </div>
          </fieldset>

          <Button
            type="submit"
            disabled={status === "submitting"}
            className="w-full"
          >
            {status === "submitting" ? "Aguardando..." : "Enviar Cadastro"}
          </Button>
        </form>
      </div>
    </div>
  </MainLayout>
  )
}