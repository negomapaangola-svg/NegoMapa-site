"use client"

import * as React from "react"
import { useState } from "react"
import { signInWithPassword } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await signInWithPassword({ email, password })
      router.push("/admin/empresas")
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login")
    }
  }

  return (
    <div className="min-h-screen p-8 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg p-8 shadow dark:bg-neutral-800">
        <h2 className="text-2xl font-bold text-center mb-6 text-neutral-900 dark:text-neutral-100">
          Login de Admin
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md text-sm mb-6">
            {error}
          </div>
        }}

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {error ? "Tentar novamente" : "Entrar"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-neutral-600 dark:text-neutral-400 hover:underline"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  )
}