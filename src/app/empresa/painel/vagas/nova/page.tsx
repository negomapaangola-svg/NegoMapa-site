"use client"

import * as React from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase-browser"
import { createVaga } from "@/lib/actions/vagas"
import { Button } from "@/components/ui/Button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card"
import { MainLayout } from "@/components/layout/MainLayout"

type FormData = {
  titulo: string
  descricao: string
  requisitos: string
  categoria: string
  provincia: string
  municipio: string
  tipo_contrato: string
  salario: string
  whatsapp: string
}

const initialFormData: FormData = {
  titulo: "",
  descricao: "",
  requisitos: "",
  categoria: "",
  provincia: "",
  municipio: "",
  tipo_contrato: "",
  salario: "",
  whatsapp: "",
}

const categorias = [
  "Administrativo",
  "Comercial",
  "Financeiro",
  "TI",
  "Marketing",
  "Recursos Humanos",
  "Operacional",
  "Outros",
]

const provincias = [
  "Luanda",
  "Bengo",
  "Benguela",
  "Bié",
  "Cabinda",
  "Cuando Cubango",
  "Cuanza Norte",
  "Cuanza Sul",
  "Cunene",
  "Huambo",
  "Huíla",
  "Luanda Norte",
  "Luanda Sul",
  "Malanje",
  "Moxico",
  "Namibe",
  "Uíge",
  "Zaire",
]

const tiposContrato = [
  "Tempo Inteiro",
  "Meio Período",
  "Contrato",
  "Estágio",
  "Temporário",
  "Freelance",
]

export default function NovaVagaPage() {
  const [formData, setFormData] = React.useState<FormData>(initialFormData)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [status, setStatus] = React.useState<"idle" | "submitting" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = React.useState<string>("")
  const [company, setCompany] = React.useState<{
    id: string
    name: string
    is_approved: boolean
  } | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [user, setUser] = React.useState<any>(null)

  React.useEffect(() => {
    async function fetchData() {
      const supabase = createBrowserSupabaseClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      setUser(authUser)

      if (!authUser) {
        setLoading(false)
        return
      }

      const { data: companyData } = await supabase
        .from("companies")
        .select("id, name, is_approved")
        .eq("user_id", authUser.id)
        .single()

      setCompany(companyData)
      setLoading(false)
    }
    fetchData()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.titulo.trim()) newErrors.titulo = "Título é obrigatório"
    if (!formData.descricao.trim()) newErrors.descricao = "Descrição é obrigatória"
    if (!formData.categoria.trim()) newErrors.categoria = "Categoria é obrigatória"
    if (!formData.provincia.trim()) newErrors.provincia = "Província é obrigatória"
    if (!formData.whatsapp.trim()) newErrors.whatsapp = "WhatsApp é obrigatório"

    const cleanWhatsApp = formData.whatsapp.replace(/[\s+\-()]/g, "")
    const angolaPhoneRegex = /^(?:\+?244|0)?[92]\d{8}$/
    if (formData.whatsapp.trim() && !angolaPhoneRegex.test(cleanWhatsApp)) {
      newErrors.whatsapp = "WhatsApp deve ser um número válido de Angola (ex: +244 9XX XXX XXX)"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setStatus("submitting")
    setErrorMessage("")

    const result = await createVaga(formData)

    if (!result.success) {
      setStatus("error")
      if (result.fieldErrors) {
        setErrors(result.fieldErrors)
      }
      setErrorMessage(result.error || "Erro ao criar vaga. Tente novamente.")
      return
    }

    setStatus("success")
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center p-4 bg-cream dark:bg-navy-dark">
          <p className="text-ink dark:text-cream">A carregar...</p>
        </div>
      </MainLayout>
    )
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="min-h-screen p-4 md:p-8 bg-cream dark:bg-navy-dark">
          <div className="max-w-2xl mx-auto space-y-6 text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-ink dark:text-cream">
              Nova Vaga
            </h1>
            <p className="text-neutral-600 dark:text-cream-text">
              Por favor, faça login para publicar uma vaga.
            </p>
            <Button asChild>
              <a href="/login?redirectTo=/empresa/painel/vagas/nova" className="inline-flex items-center px-4 py-2 rounded-[4px] font-medium">
                Login
              </a>
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!company) {
    return (
      <MainLayout>
        <div className="min-h-screen p-4 md:p-8 bg-cream dark:bg-navy-dark">
          <div className="max-w-2xl mx-auto space-y-6 text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-ink dark:text-cream">
              Nova Vaga
            </h1>
            <div className="bg-white rounded-[4px] p-6 shadow dark:bg-neutral-800">
              <p className="text-neutral-600 dark:text-cream-text mb-4">
                Não tem nenhuma empresa cadastrada.
              </p>
              <p className="text-neutral-600 dark:text-cream-text mb-6">
                Para publicar vagas, primeiro precisa de cadastrar a sua empresa.
              </p>
              <Button asChild>
                <a href="/cadastrar-empresa" className="inline-flex items-center px-4 py-2 rounded-[4px] font-medium">
                  Cadastrar Empresa
                </a>
              </Button>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!company.is_approved) {
    return (
      <MainLayout>
        <div className="min-h-screen p-4 md:p-8 bg-cream dark:bg-navy-dark">
          <div className="max-w-2xl mx-auto space-y-6 text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-ink dark:text-cream">
              Nova Vaga
            </h1>
            <div className="bg-white rounded-[4px] p-6 shadow dark:bg-neutral-800 border-l-4 border-orange-500">
              <div className="flex items-center justify-center gap-2 mb-4">
                <svg className="h-6 w-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-xl font-semibold text-orange-700 dark:text-orange-300">Empresa não aprovada</span>
              </div>
              <p className="text-neutral-600 dark:text-cream-text mb-4">
                A sua empresa <strong>{company.name}</strong> ainda não foi aprovada.
              </p>
              <p className="text-neutral-600 dark:text-cream-text">
                Não é possível publicar vagas enquanto a empresa não for aprovada pela equipa do NegóMapa.
              </p>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-8 bg-cream dark:bg-navy-dark">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-ink dark:text-cream">
              Nova Vaga
            </h1>
            <p className="mt-2 text-neutral-600 dark:text-cream-text">
              Preencha os dados abaixo para publicar uma nova vaga na empresa <strong>{company.name}</strong>.
            </p>
          </div>

          {status === "success" && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-[4px] text-green-700 dark:text-green-400">
              Vaga criada com sucesso! Estado: <strong>pendente</strong> (aguarda aprovação).
              <br />
              <a href="/empresa/painel/vagas" className="mt-2 inline-block text-orange-500 hover:underline">
                Ver as minhas vagas
              </a>
            </div>
          )}

          {status === "error" && errorMessage && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-[4px] text-red-700 dark:text-red-400">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card variant="default" padding="lg">
              <CardHeader>
                <CardTitle>Informações da Vaga</CardTitle>
                <CardDescription>
                  Campos marcados com * são obrigatórios.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label htmlFor="titulo" className="block text-sm font-medium text-ink dark:text-cream mb-2">
                    Título da Vaga *
                  </label>
                  <input
                    type="text"
                    id="titulo"
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleChange}
                    className={`w-full mt-1 px-3 py-2 border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream ${errors.titulo ? "border-red-500" : "border-card-border"}`}
                    placeholder="Ex: Assistente Administrativo"
                    required
                  />
                  {errors.titulo && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.titulo}</p>}
                </div>

                <div>
                  <label htmlFor="descricao" className="block text-sm font-medium text-ink dark:text-cream mb-2">
                    Descrição *
                  </label>
                  <textarea
                    id="descricao"
                    name="descricao"
                    value={formData.descricao}
                    onChange={handleChange}
                    rows={4}
                    className={`w-full mt-1 px-3 py-2 border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream ${errors.descricao ? "border-red-500" : "border-card-border"}`}
                    placeholder="Descreva as principais actividades, responsabilidades e o que a função envolve..."
                    required
                  />
                  {errors.descricao && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.descricao}</p>}
                </div>

                <div>
                  <label htmlFor="requisitos" className="block text-sm font-medium text-ink dark:text-cream mb-2">
                    Requisitos
                  </label>
                  <textarea
                    id="requisitos"
                    name="requisitos"
                    value={formData.requisitos}
                    onChange={handleChange}
                    rows={4}
                    className="w-full mt-1 px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
                    placeholder="Liste os requisitos necessários (formação, experiência, competências, etc.)"
                  />
                </div>

                <div>
                  <label htmlFor="categoria" className="block text-sm font-medium text-ink dark:text-cream mb-2">
                    Categoria *
                  </label>
                  <select
                    id="categoria"
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleChange}
                    className={`w-full mt-1 px-3 py-2 border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream ${errors.categoria ? "border-red-500" : "border-card-border"}`}
                    required
                  >
                    <option value="">Selecione uma categoria</option>
                    {categorias.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {errors.categoria && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.categoria}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="provincia" className="block text-sm font-medium text-ink dark:text-cream mb-2">
                      Província *
                    </label>
                    <select
                      id="provincia"
                      name="provincia"
                      value={formData.provincia}
                      onChange={handleChange}
                      className={`w-full mt-1 px-3 py-2 border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream ${errors.provincia ? "border-red-500" : "border-card-border"}`}
                      required
                    >
                      <option value="">Selecione a província</option>
                      {provincias.map(prov => (
                        <option key={prov} value={prov}>{prov}</option>
                      ))}
                    </select>
                    {errors.provincia && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.provincia}</p>}
                  </div>

                  <div>
                    <label htmlFor="municipio" className="block text-sm font-medium text-ink dark:text-cream mb-2">
                      Município
                    </label>
                    <input
                      type="text"
                      id="municipio"
                      name="municipio"
                      value={formData.municipio}
                      onChange={handleChange}
                      className="w-full mt-1 px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
                      placeholder="Ex: Luanda, Viana, Cacuaco..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="tipo_contrato" className="block text-sm font-medium text-ink dark:text-cream mb-2">
                      Tipo de Contrato
                    </label>
                    <select
                      id="tipo_contrato"
                      name="tipo_contrato"
                      value={formData.tipo_contrato}
                      onChange={handleChange}
                      className="w-full mt-1 px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
                    >
                      <option value="">Selecione o tipo</option>
                      {tiposContrato.map(tipo => (
                        <option key={tipo} value={tipo}>{tipo}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="salario" className="block text-sm font-medium text-ink dark:text-cream mb-2">
                      Salário
                    </label>
                    <input
                      type="text"
                      id="salario"
                      name="salario"
                      value={formData.salario}
                      onChange={handleChange}
                      className="w-full mt-1 px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
                      placeholder="Ex: 150.000 - 200.000 AOA / A combinar"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="whatsapp" className="block text-sm font-medium text-ink dark:text-cream mb-2">
                    WhatsApp para Candidatura *
                  </label>
                  <input
                    type="tel"
                    id="whatsapp"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleChange}
                    className={`w-full mt-1 px-3 py-2 border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream ${errors.whatsapp ? "border-red-500" : "border-card-border"}`}
                    placeholder="+244 9XX XXX XXX"
                    required
                  />
                  {errors.whatsapp && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.whatsapp}</p>}
                  <p className="mt-1 text-xs text-neutral-500 dark:text-cream-text/70">
                    Formato aceite: +244 9XX XXX XXX ou 9XX XXX XXX
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.history.back()}
                disabled={status === "submitting"}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={status === "submitting"}
              >
                {status === "submitting" ? "A publicar..." : "Publicar Vaga"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  )
}