import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getUser, isAdmin } from '@/lib/auth'
import { obterContextoUtilizador } from '@/lib/permissoes'

export default async function EmpresaPainelLayout({ children }: { children: ReactNode }) {
  const user = await getUser()
  if (!user) redirect('/login?redirectTo=/empresa/painel')
  if (await isAdmin()) redirect('/admin')
  const contexto = await obterContextoUtilizador()
  if (!contexto.empresa) redirect('/conta')
  return children
}
