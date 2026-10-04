"use client"

import * as React from "react"
import { useState } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase-browser"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/Button"
import Link from "next/link"

function isValidRedirect(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/api/")
}

function LoginForm() {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawRedirectTo = searchParams.get("redirectTo")
  const redirectTo = rawRedirectTo && isValidRedirect(rawRedirectTo) ? rawRedirectTo : "/admin/servicos"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const cleanEmail = email.trim().toLowerCase()

    const supabase = createBrowserSupabaseClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    })

    if (error) {
      console.log("[login] signInWithPassword error:", error.message)
      setError(error.message)
      return
    }

    if (!data.session) {
      console.log("[login] no session returned")
      setError("Sessão não criada. Tente novamente.")
      return
    }

    console.log("[login] login successful, redirecting to:", redirectTo)
    router.push(redirectTo)
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
          />
        </div>

        <Button type="submit" className="w-full">
          Entrar
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