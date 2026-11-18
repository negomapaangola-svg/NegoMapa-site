import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getUser, isAdmin } from '@/lib/auth'

export default async function ProfissionalPainelLayout({ children }: { children: ReactNode }) {
  const user = await getUser()
  if (!user) redirect('/login?redirectTo=/profissional/painel')
  if (await isAdmin()) redirect('/admin')
  return children
}
