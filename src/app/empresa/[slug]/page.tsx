"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

export default function EmpresaPage() {
  const { slug } = useParams<{ slug: string }>()
  const [empresa, setEmpresa] = React.useState<any>(null)
  const [carregando, setCarregando] = React.useState(true)

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

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p>Carregando empresa...</p>
      </div>
    )
  }

  if (!empresa) {
    return (
      <div className="min-h-screen p-8 text-center">
        <p className="text-lg text-red-600">Empresa não encontrada</p>
      </div>
    )
  }

  const whatsappNumber = empresa.contact.replace(/\D/g, "")

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-8 bg-neutral-50 dark:bg-neutral-900">
      <div className="bg-white rounded-lg p-8 shadow overflow-hidden border border-gray-200 dark:bg-neutral-800 dark:border-neutral-700">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-100">
            {empresa.name}
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            {empresa.province || ""}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Setor</p>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{empresa.sector || "Não informado"}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Contacto</p>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{empresa.contact || "Não informado"}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Email</p>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">
              {empresa.email || "Não informado"}
            </p>
          </div>
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Endereço</p>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">
              {empresa.address || "Não informado"}
            </p>
          </div>
        </div>

        {empresa.description && (
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Descrição</p>
            <p className="mt-2 text-neutral-900 dark:text-neutral-100 leading-relaxed">
              {empresa.description}
            </p>
          </div>
        )}

        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-neutral-700">
          <div className="flex gap-4">
            const whatsappNumber = empresa.contact.replace(/\D/g, "")

            <Link
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
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

            <a
              href={`tel:${empresa.contact}`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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

            <Link
              href={`mailto:${empresa.email}`}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
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
          </div>
        </div>

        <div className="mt-6 text-right">
          <Link
            href="/empresas"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-neutral-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-600 transition-colors"
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
      </div>
    </div>
  )
}