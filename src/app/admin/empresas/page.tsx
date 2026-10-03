"use client"

import * as React from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"

type Empresa = {
  id: string
  name: string
  sector?: string
  province?: string
  email?: string
  contact?: string
  is_approved: boolean
}

function useEmpresas(enabled: boolean) {
  const [empresas, setEmpresas] = React.useState<Empresa[]>([])
  const [carregando, setCarregando] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false

    async function carregar() {
      if (!enabled) {
        if (!cancelled) setCarregando(false)
        return
      }

      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("is_approved", false)

      if (!cancelled) {
        if (error) {
          console.error("Erro ao carregar empresas:", error)
        } else {
          setEmpresas(data || [])
        }
        setCarregando(false)
      }
    }

    carregar()

    return () => {
      cancelled = true
    }
  }, [enabled])

  const aprovar = async (id: string) => {
    const { error } = await supabase
      .from("companies")
      .update({ is_approved: true })
      .eq("id", id)

    if (!error) {
      setEmpresas(prev =>
        prev.map(e => (e.id === id ? { ...e, is_approved: true } : e)),
      )
    }
  }

  const rejeitar = async (id: string) => {
    const { error } = await supabase
      .from("companies")
      .delete()
      .eq("id", id)

    if (!error) {
      setEmpresas(prev => prev.filter(e => e.id !== id))
    }
  }

  return { empresas, aprovar, rejeitar, carregando }
}

export default function AdminEmpresasPage() {
  const [userEmail, setUserEmail] = React.useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = React.useState(true)
  const [authError, setAuthError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function checkEmail() {
      setCheckingAuth(true)
      setAuthError(null)
      try {
        const { data, error } = await supabase.auth.getUser()
        if (error) {
          setAuthError(error.message)
          setUserEmail(null)
        } else if (data.user?.email) {
          setUserEmail(data.user.email.trim().toLowerCase())
        } else {
          setUserEmail(null)
        }
      } catch (err) {
        setAuthError(err instanceof Error ? err.message : "Erro desconhecido")
        setUserEmail(null)
      } finally {
        setCheckingAuth(false)
      }
    }
    checkEmail()
  }, [])

  const isAuthorized = userEmail === "negomapaangola@gmail.com"
  const { empresas, aprovar, rejeitar, carregando } = useEmpresas(isAuthorized)

  const authScreen = (
    <div className="min-h-screen p-8 text-center bg-cream dark:bg-navy-dark">
      <p className="text-ink dark:text-cream">{authError || "A verificar autorização..."}</p>
      {(authError || !userEmail) && (
        <Button asChild variant="outline" className="mt-4">
          <Link href="/login">Fazer login</Link>
        </Button>
      )}
      {!isAuthorized && userEmail && !authError && (
        <Button asChild variant="ghost" className="mt-4">
          <Link href="/">Voltar ao início</Link>
        </Button>
      )}
    </div>
  )

  if (checkingAuth) {
    return <div className="min-h-screen p-8 text-center bg-cream dark:bg-navy-dark"><p className="text-ink dark:text-cream">A verificar autorização...</p></div>
  }

  if (authError || !userEmail || !isAuthorized) {
    return authScreen
  }

  if (carregando) {
    return (
      <div className="min-h-screen p-8 text-center bg-cream dark:bg-navy-dark">
        <p className="text-ink dark:text-cream">A carregar empresas pendentes...</p>
      </div>
    )
  }

  if (empresas.length === 0) {
    return (
      <div className="min-h-screen p-8 text-center bg-cream dark:bg-navy-dark">
        <p className="text-neutral-500 dark:text-cream-text">Nenhuma empresa pendente de aprovação.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-navy-dark">
      <header className="bg-navy dark:bg-navy-dark border-b border-card-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-cream">
              Administração de Empresas
            </h1>
            <Link
              href="/empresas"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-navy dark:text-cream border border-card-border rounded-[4px] hover:bg-cream dark:hover:bg-navy-dark hover:border-orange-500 dark:hover:border-orange-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-dark"
            >
              Ver empresas aprovadas
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-4">
          {empresas.map((empresa) => (
            <Card
              key={empresa.id}
              variant="default"
              padding="none"
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-6 gap-0">
                <div className="p-4 md:p-5 border-b md:border-b-0 md:border-r border-card-border bg-white/50 dark:bg-neutral-800/50">
                  <p className="text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider mb-1">Nome</p>
                  <p className="text-ink dark:text-cream font-medium">{empresa.name}</p>
                </div>
                <div className="p-4 md:p-5 border-b md:border-b-0 md:border-r border-card-border bg-white/50 dark:bg-neutral-800/50 hidden md:block">
                  <p className="text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider mb-1">Setor</p>
                  <p className="text-neutral-600 dark:text-cream-text/70">{empresa.sector || "-"}</p>
                </div>
                <div className="p-4 md:p-5 border-b md:border-b-0 md:border-r border-card-border bg-white/50 dark:bg-neutral-800/50 hidden md:block">
                  <p className="text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider mb-1">Província</p>
                  <p className="text-neutral-600 dark:text-cream-text/70">{empresa.province || "-"}</p>
                </div>
                <div className="p-4 md:p-5 border-b md:border-b-0 md:border-r border-card-border bg-white/50 dark:bg-neutral-800/50 hidden md:block">
                  <p className="text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider mb-1">Email</p>
                  <p className="text-neutral-600 dark:text-cream-text/70">{empresa.email || "-"}</p>
                </div>
                <div className="p-4 md:p-5 border-b md:border-b-0 md:border-r border-card-border bg-white/50 dark:bg-neutral-800/50 hidden md:block">
                  <p className="text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider mb-1">Contacto</p>
                  <p className="text-neutral-600 dark:text-cream-text/70">{empresa.contact || "-"}</p>
                </div>
                <div className="p-4 md:p-5 flex items-center justify-center md:justify-end">
                  {!empresa.is_approved ? (
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => aprovar(empresa.id)}
                        disabled={carregando}
                        className="w-full sm:w-auto"
                      >
                        Aprovar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => rejeitar(empresa.id)}
                        disabled={carregando}
                        className="w-full sm:w-auto"
                      >
                        Rejeitar
                      </Button>
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">Aprovada</span>
                  )}
                </div>
              </div>

              <div className="md:hidden p-4 border-t border-card-border bg-white/50 dark:bg-neutral-800/50 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider mb-1">Setor</p>
                  <p className="text-neutral-600 dark:text-cream-text/70">{empresa.sector || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider mb-1">Província</p>
                  <p className="text-neutral-600 dark:text-cream-text/70">{empresa.province || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider mb-1">Email</p>
                  <p className="text-neutral-600 dark:text-cream-text/70">{empresa.email || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider mb-1">Contacto</p>
                  <p className="text-neutral-600 dark:text-cream-text/70">{empresa.contact || "-"}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}