import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUserCompany } from '@/lib/actions/vagas'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { NovaVagaForm } from './NovaVagaForm'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Publicar vaga | Painel da Empresa | NegóMapa', description: 'Publique uma nova oportunidade de emprego.' }

export default async function NovaVagaPage({ searchParams }: { searchParams: Promise<{ empresa?: string }> }) {
  const { empresa } = await searchParams
  const company = await getUserCompany(empresa)
  if (!company) redirect('/login?redirectTo=/empresa/painel/vagas/nova')
  if (!company.is_approved) return <MainLayout><section className="min-h-[60vh] bg-cream px-4 py-12 dark:bg-navy-dark"><div className="mx-auto max-w-2xl"><Card variant="liquid" padding="lg"><CardHeader><CardTitle>Publicação indisponível</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-neutral-700 dark:text-cream-text">A empresa precisa de aprovação antes de publicar vagas.</p><Link href="/empresa/painel" className="inline-flex min-h-11 items-center rounded-full bg-orange-600 px-4 font-semibold text-white">Voltar ao painel</Link></CardContent></Card></div></section></MainLayout>
  return <NovaVagaForm companyId={company.id} />
}
