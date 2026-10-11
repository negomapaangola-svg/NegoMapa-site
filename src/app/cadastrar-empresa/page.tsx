"use client"

import * as React from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/Button"

type FormData = {
  name: string
  sector: string
  province: string
  phone: string
  email: string
  description?: string
  city?: string
}

export default function CadastrarEmpresaPage() {
  const [formData, setFormData] = React.useState<FormData>({
    name: "",
    sector: "",
    province: "",
    phone: "",
    email: "",
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
      const { data } = await supabase.auth.getUser()
      setUser(data.user ?? null)
      setLoading(false)
    }
    fetchUser()
  }, [])

  if (!user) {
    return (
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
    )
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
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

    const slug = formData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")

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
        is_approved: false,
      })
      .select()
      .single()

    if (error) {
      setStatus("idle")
      alert("Erro ao cadastrar: " + error.message)
      return
    }

    setStatus("success")
    setFormData({
      name: "",
      sector: "",
      province: "",
      phone: "",
      email: "",
    })

    setRedirect(true)
    setTimeout(() => {
      setRedirect(false)
      ;(window as any).location.href = '/'
    }, 3000)
  }

  return (
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
  )
}