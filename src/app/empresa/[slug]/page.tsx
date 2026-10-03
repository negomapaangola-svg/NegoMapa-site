"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/Card"
import { MainLayout } from "@/components/layout/MainLayout"

function EmpresaContent() {
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
        .eq("is_approved", true)
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

  const whatsappNumber = (empresa.phone || "").replace(/\D/g, "")
  const hasPhone = !!empresa.phone
  const hasEmail = !!empresa.email

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto p-6 md:p-8 bg-cream dark:bg-navy-dark">
        <Card variant="default" padding="lg" className="border-card-border">
          <div className="mb-6">
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
              <p className="font-medium text-ink dark:text-cream">{empresa.address || "Não informado"}</p>
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

          <div className="mt-8 pt-8 border-t border-card-border">
            <div className="flex flex-wrap gap-3">

              {hasPhone && (
                <Link
                  href={`https://wa.me/244${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-[4px] hover:bg-green-700 transition-colors"
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
              )}

              {hasPhone && (
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

              {hasEmail && (
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

            </div>
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