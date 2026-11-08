"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { createBrowserSupabaseClient } from "@/lib/supabase-browser"

type Props = {
  /** Destino interno já validado no servidor (redirectSeguro). */
  destino: string
}

const PALAVRA_PASSE_MINIMA = 8

const campo =
  "w-full px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"

export function RegistarForm({ destino }: Props) {
  const router = useRouter()
  const [email, setEmail] = React.useState("")
  const [palavraPasse, setPalavraPasse] = React.useState("")
  const [confirmacao, setConfirmacao] = React.useState("")
  const [erro, setErro] = React.useState<string | null>(null)
  const [a_submeter, setASubmeter] = React.useState(false)
  const [emailPendente, setEmailPendente] = React.useState<string | null>(null)

  const loginHref = `/login?redirectTo=${encodeURIComponent(destino)}`

  async function submeter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErro(null)

    const emailLimpo = email.trim().toLowerCase()
    if (palavraPasse.length < PALAVRA_PASSE_MINIMA) {
      setErro(`A palavra-passe deve ter pelo menos ${PALAVRA_PASSE_MINIMA} caracteres.`)
      return
    }
    if (palavraPasse !== confirmacao) {
      setErro("As palavras-passe não coincidem.")
      return
    }

    setASubmeter(true)
    const supabase = createBrowserSupabaseClient()
    const { data, error } = await supabase.auth.signUp({
      email: emailLimpo,
      password: palavraPasse,
      options: {
        // O destino segue no parâmetro next; o callback volta a validá-lo.
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(destino)}`,
      },
    })
    setASubmeter(false)

    if (error) {
      setErro("Não foi possível criar a conta. Tente novamente.")
      return
    }
    // Email já registado: o Supabase não devolve um utilizador novo.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      setErro("Já existe uma conta com este email. Entre na sua conta.")
      return
    }
    // Confirmação de email desativada: a sessão já existe.
    if (data.session) {
      router.replace(destino)
      router.refresh()
      return
    }
    // Confirmação de email ativa: pedir para verificar o email.
    setEmailPendente(emailLimpo)
  }

  if (emailPendente) {
    return (
      <div className="max-w-md w-full bg-white rounded-[4px] p-8 shadow dark:bg-neutral-800 border border-card-border space-y-4">
        <h1 className="text-2xl font-bold text-center text-ink dark:text-cream">Confirme o seu endereço de email</h1>
        <p className="text-neutral-600 dark:text-cream-text">
          Enviámos um link de confirmação para <strong>{emailPendente}</strong>.
        </p>
        <ol className="list-decimal pl-5 space-y-2 text-neutral-600 dark:text-cream-text">
          <li>Abra o email e clique no link de confirmação.</li>
          <li>Será levado de volta à NegóMapa, já com a sessão iniciada.</li>
        </ol>
        <p className="text-sm text-neutral-500 dark:text-cream-text/70">Não recebeu o email? Verifique a pasta de spam.</p>
      </div>
    )
  }

  return (
    <div className="max-w-md w-full bg-white rounded-[4px] p-8 shadow dark:bg-neutral-800 border border-card-border">
      <h1 className="text-2xl font-bold text-center mb-2 text-ink dark:text-cream">Criar conta</h1>
      <p className="text-center text-neutral-600 dark:text-cream-text mb-6">
        Uma conta de cliente, para pedir orçamentos, enviar mensagens e candidatar-se a vagas.
      </p>

      {erro && (
        <div role="alert" className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-[4px] text-sm">
          {erro}
        </div>
      )}

      <form onSubmit={submeter} className="space-y-4">
        <div>
          <label htmlFor="registar-email" className="block text-sm font-medium text-ink dark:text-cream mb-2">Email</label>
          <input
            id="registar-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={campo}
            required
            disabled={a_submeter}
          />
        </div>

        <div>
          <label htmlFor="registar-palavra-passe" className="block text-sm font-medium text-ink dark:text-cream mb-2">
            Palavra-passe <span className="text-neutral-500 dark:text-cream-text/70">(mínimo {PALAVRA_PASSE_MINIMA} caracteres)</span>
          </label>
          <input
            id="registar-palavra-passe"
            type="password"
            autoComplete="new-password"
            value={palavraPasse}
            onChange={(e) => setPalavraPasse(e.target.value)}
            className={campo}
            required
            minLength={PALAVRA_PASSE_MINIMA}
            disabled={a_submeter}
          />
        </div>

        <div>
          <label htmlFor="registar-confirmacao" className="block text-sm font-medium text-ink dark:text-cream mb-2">Confirmar palavra-passe</label>
          <input
            id="registar-confirmacao"
            type="password"
            autoComplete="new-password"
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
            className={campo}
            required
            disabled={a_submeter}
          />
        </div>

        <Button type="submit" className="w-full" disabled={a_submeter}>
          {a_submeter ? "A criar conta…" : "Criar conta"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-600 dark:text-cream-text">
        Já tem conta?{" "}
        <Link href={loginHref} className="font-medium text-orange-500 dark:text-orange-400 hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  )
}
