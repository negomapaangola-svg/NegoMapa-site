"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { createBrowserSupabaseClient } from "@/lib/supabase-browser"

export default function RecuperarSenhaPage() {
  const [email, setEmail] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [sucesso, setSucesso] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const supabase = createBrowserSupabaseClient()
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent('/redefinir-senha')}`

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo,
      })

      if (error) {
        setError('Não foi possível enviar o link de recuperação. Tente novamente.')
      } else {
        setSucesso(true)
      }
    } catch {
      setError('Não foi possível enviar o link de recuperação. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-cream dark:bg-navy-dark flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-[4px] p-8 shadow dark:bg-neutral-800 border border-card-border">
        <h1 className="text-2xl font-bold text-center mb-2 text-ink dark:text-cream">
          Recuperar senha
        </h1>
        <p className="text-center text-neutral-600 dark:text-cream-text mb-6">
          Introduza o e-mail da sua conta para receber um link de recuperação.
        </p>

        {sucesso ? (
          <div className="mb-4 rounded-[4px] bg-green-100 p-3 text-sm text-green-800 dark:bg-green-900 dark:text-green-200">
            Se este e-mail estiver associado a uma conta NegóMapa, enviámos um link para recuperar a senha.
          </div>
        ) : null}

        {error ? (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-[4px] text-sm">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink dark:text-cream mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
              required
              disabled={isLoading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'A enviar...' : 'Enviar link de recuperação'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-neutral-600 dark:text-cream-text hover:text-orange-500 hover:underline"
          >
            Voltar ao início de sessão
          </Link>
        </div>
      </div>
    </div>
  )
}