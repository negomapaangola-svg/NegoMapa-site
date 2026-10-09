"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/Button"
import Link from "next/link"
import { loginAction } from "@/lib/actions/login"

function isValidRedirect(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/api/")
}

function LoginForm() {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const searchParams = useSearchParams()
  const rawRedirectTo = searchParams.get("redirectTo")
  const redirectTo = rawRedirectTo && isValidRedirect(rawRedirectTo) ? rawRedirectTo : "/admin/servicos"

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const cleanEmail = email.trim().toLowerCase()

    const formData = new FormData()
    formData.append('email', cleanEmail)
    formData.append('password', password)
    formData.append('redirectTo', redirectTo)

    const result = await loginAction(formData)
    setIsLoading(false)

    if (result?.error) {
      setError(result.error)
    }
  }

  return (
    <div className="max-w-md w-full bg-white rounded-[4px] p-8 shadow dark:bg-neutral-800 border border-card-border">
      <h2 className="text-2xl font-bold text-center mb-6 text-ink dark:text-cream">
        Entrar no NegóMapa
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-[4px] text-sm">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
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

        <div>
          <label className="block text-sm font-medium text-ink dark:text-cream mb-2">
            Senha
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
            required
            disabled={isLoading}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'A entrar...' : 'Entrar'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/"
          className="text-neutral-600 dark:text-cream-text hover:text-orange-500 hover:underline"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen p-8 bg-cream dark:bg-navy-dark flex items-center justify-center">
      <React.Suspense fallback={<div className="max-w-md w-full bg-white rounded-[4px] p-8 shadow dark:bg-neutral-800 border border-card-border animate-pulse"><div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mx-auto mb-6"></div><div className="space-y-4"><div className="h-10 bg-neutral-200 dark:bg-neutral-700 rounded"></div><div className="h-10 bg-neutral-200 dark:bg-neutral-700 rounded"></div><div className="h-12 bg-neutral-200 dark:bg-neutral-700 rounded"></div></div></div>}>
        <LoginForm />
      </React.Suspense>
    </div>
  )
}