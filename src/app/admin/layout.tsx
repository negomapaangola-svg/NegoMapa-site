import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { isAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Barreira de servidor comum a todas as rotas de páginas /admin.
  if (!(await isAdmin())) notFound()
  return children
}
