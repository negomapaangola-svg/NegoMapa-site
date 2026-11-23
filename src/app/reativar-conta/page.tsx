import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getUser } from '@/lib/auth'
import { reativarContaAposLogin, sairSemReativar } from '@/lib/actions/reativar-conta'
import { redirectSeguro } from '@/lib/redirect-seguro'

export const metadata: Metadata = { title: 'Reativar conta | NegóMapa' }

export default async function ReativarContaPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  const userId = user.id
  const supabase = await createSupabaseServerClient()
  const { data: profile } = await supabase.from('profiles').select('account_status').eq('id', userId).maybeSingle()
  const status = profile?.account_status ?? 'active'
  const redirectTo = redirectSeguro(typeof params.redirectTo === 'string' ? params.redirectTo : null)

  if (status !== 'deactivated') {
    redirect(redirectTo)
  }

  return (
    <div className="min-h-screen p-8 bg-cream dark:bg-navy-dark flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-[4px] p-8 shadow dark:bg-neutral-800 border border-card-border">
        <h1 className="text-2xl font-bold text-center mb-2 text-ink dark:text-cream">Reativar conta</h1>
        <p className="text-center text-neutral-600 dark:text-cream-text mb-6">A sua conta está desativada. Pode reativá-la agora ou sair sem reativar.</p>

        {params.erro && (
          <div role="alert" className="mb-4 rounded-[4px] bg-red-100 p-3 text-sm text-red-800 dark:bg-red-900 dark:text-red-200">Não foi possível reativar a conta. Tente novamente.</div>
        )}

        <form action={reativarContaAposLogin} className="space-y-4">
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <button type="submit" className="w-full min-h-11 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800">Reativar a minha conta</button>
        </form>

        <form action={sairSemReativar} className="mt-3">
          <button type="submit" className="w-full min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">Sair sem reativar</button>
        </form>
      </div>
    </div>
  )
}