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

function CampoSenha({
  id,
  label,
  valor,
  aoAlterar,
  mostrar,
  alternarVisibilidade,
  desativado,
}: {
  id: string
  label: React.ReactNode
  valor: string
  aoAlterar: (valor: string) => void
  mostrar: boolean
  alternarVisibilidade: () => void
  desativado: boolean
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink dark:text-cream mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={mostrar ? "text" : "password"}
          autoComplete="new-password"
          value={valor}
          onChange={(evento) => aoAlterar(evento.target.value)}
          className={`${campo} pr-11`}
          required
          minLength={PALAVRA_PASSE_MINIMA}
          disabled={desativado}
        />
        <button
          type="button"
          onClick={alternarVisibilidade}
          aria-label={mostrar ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={mostrar}
          className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-[4px] text-neutral-500 transition-colors hover:text-orange-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:text-cream-text dark:hover:text-orange-400"
          disabled={desativado}
        >
          <EyeIcon aberto={mostrar} />
        </button>
      </div>
    </div>
  )
}

export function RegistarForm({ destino }: Props) {
  const router = useRouter()
  const [email, setEmail] = React.useState("")
  const [palavraPasse, setPalavraPasse] = React.useState("")
  const [confirmacao, setConfirmacao] = React.useState("")
  const [mostrarPalavraPasse, setMostrarPalavraPasse] = React.useState(false)
  const [mostrarConfirmacao, setMostrarConfirmacao] = React.useState(false)
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
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/escolher-tipo')}`,
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
      router.replace('/escolher-tipo')
      router.refresh()
      return
    }
    // Confirmação de email ativa: pedir para verificar o email.
    setEmailPendente(emailLimpo)
  }

  if (emailPendente) {
    return (
      <div className="w-full max-w-2xl bg-white rounded-[4px] p-6 sm:p-10 shadow dark:bg-neutral-800 border border-card-border space-y-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-ink dark:text-cream">Confirme o seu endereço de email</h1>
        <p className="text-neutral-600 dark:text-cream-text">
          Enviámos um link de confirmação para <strong>{emailPendente}</strong>.
        </p>
        <ol className="list-decimal pl-5 space-y-2 text-neutral-600 dark:text-cream-text">
          <li>Abra o email e clique no link de confirmação.</li>
          <li>Será levado de volta à NegóMapa para escolher o tipo de conta.</li>
        </ol>
        <p className="text-sm text-neutral-500 dark:text-cream-text/70">Não recebeu o email? Verifique a pasta de spam.</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl bg-white rounded-[4px] p-6 sm:p-10 shadow dark:bg-neutral-800 border border-card-border">
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2 text-ink dark:text-cream">Criar conta</h1>
      <p className="text-center text-neutral-600 dark:text-cream-text mb-6">
        Crie a sua conta e escolha se pretende usar a NegóMapa como cliente, profissional ou empresa.
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

        <CampoSenha
          id="registar-palavra-passe"
          label={
            <>
              Palavra-passe <span className="text-neutral-500 dark:text-cream-text/70">(mínimo {PALAVRA_PASSE_MINIMA} caracteres)</span>
            </>
          }
          valor={palavraPasse}
          aoAlterar={setPalavraPasse}
          mostrar={mostrarPalavraPasse}
          alternarVisibilidade={() => setMostrarPalavraPasse((valor) => !valor)}
          desativado={a_submeter}
        />

        <CampoSenha
          id="registar-confirmacao"
          label="Confirmar palavra-passe"
          valor={confirmacao}
          aoAlterar={setConfirmacao}
          mostrar={mostrarConfirmacao}
          alternarVisibilidade={() => setMostrarConfirmacao((valor) => !valor)}
          desativado={a_submeter}
        />

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