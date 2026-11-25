"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/Button"
import Link from "next/link"
import { loginAction } from "@/lib/actions/login"
import { redirectSeguro } from "@/lib/redirect-seguro"
import { createBrowserSupabaseClient } from "@/lib/supabase-browser"

function GoogleIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29c0-1.56.38-3.04 1.06-4.34L2.36 5.9A11.97 11.97 0 0 0 1.29 12c0 2.09.54 4.06 1.48 5.78l3.98-3.09c-.31-.89-.48-1.85-.48-2.85z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.29 15.24 0 12 0 7.31 0 3.26 2.69 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  )
}

function EyeIcon({ aberto }: { aberto: boolean }) {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {aberto ? (
        <>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-8-10-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19" />
          <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" />
          <path d="m2 2 20 20" />
        </>
      )}
    </svg>
  )
}

function LoginForm() {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [mostrarSenha, setMostrarSenha] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false)
  const searchParams = useSearchParams()
  const rawRedirectTo = searchParams.get("redirectTo")
  const redirectTo = redirectSeguro(rawRedirectTo)
  const criarContaHref = rawRedirectTo
    ? `/registar?redirectTo=${encodeURIComponent(redirectTo)}`
    : "/registar"

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

  const handleGoogleLogin = async () => {
    setError(null)
    setIsGoogleLoading(true)

    try {
      const supabase = createBrowserSupabaseClient()
      const callbackUrl = new URL('/auth/callback', window.location.origin)
      callbackUrl.searchParams.set('next', redirectTo)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString(),
        },
      })

      if (error) {
        setError('Não foi possível iniciar sessão com o Google. Tente novamente.')
        setIsGoogleLoading(false)
      }
    } catch {
      setError('Não foi possível iniciar sessão com o Google. Tente novamente.')
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl bg-white rounded-[4px] p-6 sm:p-10 shadow dark:bg-neutral-800 border border-card-border">
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2 text-ink dark:text-cream">
        Entrar
      </h2>
      <p className="text-center text-neutral-600 dark:text-cream-text mb-6">
        Bem-vindo de volta ao NegóMapa.
      </p>

      {searchParams.get("erro") === "conta-desactivada" && !error && (
        <div role="alert" className="mb-4 rounded-[4px] bg-amber-100 p-3 text-sm text-amber-900 dark:bg-amber-900 dark:text-amber-100">
          A sua conta está desativada. Pode reativá-la na sua área de conta.
        </div>
      )}

      {searchParams.get("erro") === "confirmacao" && !error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-[4px] text-sm">
          Não foi possível confirmar o seu email. Tente novamente ou crie a conta de novo.
        </div>
      )}

      {searchParams.get("mensagem") === "senha-atualizada" && !error && (
        <div className="mb-4 rounded-[4px] bg-green-100 p-3 text-sm text-green-800 dark:bg-green-900 dark:text-green-200">
          A sua senha foi atualizada com sucesso. Entre com a nova senha.
        </div>
      )}

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
          <div className="relative">
            <input
              type={mostrarSenha ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 pr-11 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setMostrarSenha((valor) => !valor)}
              aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
              aria-pressed={mostrarSenha}
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-[4px] text-neutral-500 transition-colors hover:text-orange-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:text-cream-text dark:hover:text-orange-400"
              disabled={isLoading}
            >
              <EyeIcon aberto={mostrarSenha} />
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'A entrar...' : 'Entrar'}
        </Button>
      </form>

      <div className="mt-3 text-center">
        <Link
          href="/recuperar-senha"
          className="text-sm font-medium text-orange-500 dark:text-orange-400 hover:underline"
        >
          Esqueceu a senha?
        </Link>
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-card-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-neutral-500 dark:bg-neutral-800 dark:text-cream-text">
            ou
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isGoogleLoading || isLoading}
        className="w-full min-h-11 inline-flex items-center justify-center gap-3 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-heading font-bold text-neutral-800 shadow-sm transition-all duration-200 hover:bg-neutral-50 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed dark:bg-white dark:text-neutral-800 dark:border-neutral-300 dark:hover:bg-neutral-100"
      >
        <GoogleIcon />
        {isGoogleLoading ? 'A abrir o Google...' : 'Continuar com Google'}
      </button>

      <div className="mt-6 text-center space-y-3">
        <p className="text-sm text-neutral-600 dark:text-cream-text">
          Ainda não tem conta?{" "}
          <Link href={criarContaHref} className="font-medium text-orange-500 dark:text-orange-400 hover:underline">
            Criar conta
          </Link>
        </p>
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
    <div className="min-h-screen p-4 sm:p-8 bg-cream dark:bg-navy-dark flex items-center justify-center">
      <React.Suspense fallback={<div className="w-full max-w-2xl bg-white rounded-[4px] p-6 sm:p-10 shadow dark:bg-neutral-800 border border-card-border animate-pulse"><div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mx-auto mb-6"></div><div className="space-y-4"><div className="h-10 bg-neutral-200 dark:bg-neutral-700 rounded"></div><div className="h-10 bg-neutral-200 dark:bg-neutral-700 rounded"></div><div className="h-12 bg-neutral-200 dark:bg-neutral-700 rounded"></div></div></div>}>
        <LoginForm />
      </React.Suspense>
    </div>
  )
}