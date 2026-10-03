"use client"

import * as React from "react"
import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const cleanEmail = email.trim().toLowerCase()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    })

    if (error) {
      setError(error.message)
      return
    }

    if (!data.session) {
      setError("Sessão não criada. Tente novamente.")
      return
    }

    router.push("/admin/empresas")
  }

  return (
    <div className="min-h-screen p-8 bg-cream dark:bg-navy-dark flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-[4px] p-8 shadow dark:bg-neutral-800 border border-card-border">
        <h2 className="text-2xl font-bold text-center mb-6 text-ink dark:text-cream">
          Login de Admin
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
    </div>
  )
}