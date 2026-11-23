"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { createBrowserSupabaseClient } from "@/lib/supabase-browser"

export default function RedefinirSenhaPage() {
  const router = useRouter()
  const [senha, setSenha] = React.useState("")
  const [confirmarSenha, setConfirmarSenha] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (senha.length < 8) {
      setError('A nova senha deve ter pelo menos 8 caracteres.')
      return
    }

    if (senha !== confirmarSenha) {
      setError('As senhas não coincidem.')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createBrowserSupabaseClient()
      const { error } = await supabase.auth.updateUser({ password: senha })

      if (error) {
        setError('Não foi possível guardar a nova senha. Tente novamente.')
        return
      }

      router.push('/login?mensagem=senha-atualizada')
    } catch {
      setError('Não foi possível guardar a nova senha. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-cream dark:bg-navy-dark flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-[4px] p-8 shadow dark:bg-neutral-800 border border-card-border">
        <h1 className="text-2xl font-bold text-center mb-2 text-ink dark:text-cream">
          Redefinir senha
        </h1>
        <p className="text-center text-neutral-600 dark:text-cream-text mb-6">
          Crie uma nova senha para a sua conta NegóMapa.
        </p>

        <div className="mb-6 p-4 bg-orange-50 dark:bg-neutral-700 border border-orange-200 dark:border-neutral-600 rounded-[4px]">
          <h2 className="text-sm font-semibold text-ink dark:text-cream mb-2">
            Como funciona a recuperação de senha
          </h2>
          <ol className="list-decimal list-inside space-y-1 text-sm text-neutral-600 dark:text-cream-text">
            <li>Introduza o e-mail da sua conta NegóMapa.</li>
            <li>Vai receber um e-mail de recuperação de senha.</li>
            <li>O e-mail pode aparecer como enviado pelo Supabase.</li>
            <li>Abra o e-mail e clique no botão ou link “Redefinir senha”.</li>
            <li>Será levado para esta página para criar uma nova senha.</li>
            <li>Crie uma senha com pelo menos 8 caracteres.</li>
            <li>Depois de guardar, volte à página de login e entre com a nova senha.</li>
          </ol>
          <p className="mt-3 text-sm text-neutral-600 dark:text-cream-text">
            Se não encontrar o e-mail, verifique a pasta Spam ou Promoções.
          </p>
        </div>

        {error ? (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-[4px] text-sm">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink dark:text-cream mb-2">
              Nova senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
              required
              minLength={8}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink dark:text-cream mb-2">
              Confirmar nova senha
            </label>
            <input
              type="password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              className="w-full px-3 py-2 border border-card-border rounded-[4px] shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-cream"
              required
              minLength={8}
              disabled={isLoading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'A guardar...' : 'Guardar nova senha'}
          </Button>
        </form>
      </div>
    </div>
  )
}