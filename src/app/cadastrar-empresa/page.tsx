"use client"

import * as React from "react"
import { supabase } from "@/lib/supabase"

type FormData = {
  name: string
  sector: string
  province: string
  contact: string
  email: string
  description?: string
  address?: string
}

export default function CadastrarEmpresaPage() {
  const [formData, setFormData] = React.useState<FormData>({
    name: "",
    sector: "",
    province: "",
    contact: "",
    email: "",
  })

  const [errors, setErrors] = React.useState<{ [key: string]: string }>({})
  const [status, setStatus] = React.useState<
    "idle" | "submitting" | "success"
  >("idle")
  const [redirect, setRedirect] = React.useState(false)

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
    if (!formData.contact) errors.contact = "Contacto é obrigatório"
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
        name: formData.name,
        slug,
        sector: formData.sector,
        province: formData.province,
        contact: formData.contact,
        email: formData.email,
        description: formData.description,
        address: formData.address,
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
      contact: "",
      email: "",
    })

    setRedirect(true)
    setTimeout(() => {
      setRedirect(false)
      ;(window as any).router?.push?.("/") || window.navigate?.("/")
    }, 3000)
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-neutral-100 text-center">
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
          className="space-y-4 bg-white rounded-lg p-6 shadow dark:bg-neutral-800"
        >
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Nome da Empresa
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={e => handleChange(e)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
              required
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Setor
            </label>
            <input
              type="text"
              name="sector"
              value={formData.sector}
              onChange={e => handleChange(e)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
              required
            />
            {errors.sector && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.sector}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Província
            </label>
            <input
              type="text"
              name="province"
              value={formData.province}
              onChange={e => handleChange(e)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
              required
            />
            {errors.province && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.province}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Contacto
            </label>
            <input
              type="text"
              name="contact"
              value={formData.contact}
              onChange={e => handleChange(e)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
              required
            />
            {errors.contact && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.contact}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={e => handleChange(e)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
              required
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.email}
              </p>
            )}
          </div>

          {formData.description && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Descrição
              </label>
              <textarea
                name="description"
                value={formData.description ?? ""}
                onChange={e => handleChange(e)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
                rows={3}
              ></textarea>
            </div>
          )}

          {formData.address && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Endereço
              </label>
              <textarea
                name="address"
                value={formData.address ?? ""}
                onChange={e => handleChange(e)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
                rows={3}
              ></textarea>
            </div>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full py-2 px-4 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {status === "submitting" ? "Aguardando..." : "Enviar Cadastro"}
          </button>
        </form>
      </div>
    </div>
  )
}