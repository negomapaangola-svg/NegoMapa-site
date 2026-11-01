import { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { isAdmin } from '@/lib/auth'
import { getEmpresaAdminDetalhe, EmpresaAdminDetalhe } from '@/lib/actions/empresas'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card } from '@/components/ui/Card'
import { EmpresaAdminActions } from '../_components/EmpresaAdminActions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Detalhe da empresa | NegóMapa Admin',
  description: 'Dados do cadastro de uma empresa para análise',
  robots: { index: false, follow: false },
}

type Props = { params: Promise<{ id: string }> }

const FAIXAS_NAO_GUARDADAS = 'Não guardado: o cadastro ainda não grava categorias nem faixa de preço.'

function formatarData(iso: string) {
  return new Date(iso).toLocaleString('pt-AO', {
    timeZone: 'Africa/Luanda',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function valor(v: string | null | undefined) {
  return v && v.trim() !== '' ? v : '—'
}

function Campo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-heading font-semibold text-navy dark:text-cream uppercase tracking-wider mb-1">{rotulo}</p>
      <div className="text-ink dark:text-cream">{children}</div>
    </div>
  )
}

function Seccao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <Card variant="default" padding="lg" className="border-card-border">
      <h2 className="text-lg font-bold text-ink dark:text-cream mb-5">{titulo}</h2>
      {children}
    </Card>
  )
}

function estadoDe(empresa: EmpresaAdminDetalhe) {
  return empresa.is_approved
    ? { rotulo: 'Aprovada', classe: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' }
    : { rotulo: 'Pendente', classe: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' }
}

async function DetalheEmpresaContent({ id }: { id: string }) {
  const resultado = await getEmpresaAdminDetalhe(id)

  if (!resultado.success) {
    if (resultado.naoEncontrada) notFound()
    return (
      <MainLayout>
        <div className="min-h-screen bg-cream dark:bg-navy-dark">
          <main className="max-w-4xl mx-auto px-6 py-8">
            <Card variant="default" padding="lg" className="border-card-border text-center">
              <p className="text-neutral-600 dark:text-cream-text/70">{resultado.error}</p>
            </Card>
          </main>
        </div>
      </MainLayout>
    )
  }

  const { data: empresa, logoUrl, logoErro, comprovativoUrl, comprovativoErro } = resultado
  const estado = estadoDe(empresa)
  const legalizada = empresa.estado_legalizacao === 'legalizada'

  return (
    <MainLayout>
      <div className="min-h-screen bg-cream dark:bg-navy-dark">
        <header className="bg-navy dark:bg-navy-dark border-b border-card-border">
          <div className="max-w-4xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Link href="/admin/empresas" className="text-sm text-cream/80 hover:text-cream underline-offset-2 hover:underline">
                ← Voltar à lista de empresas
              </Link>
              <h1 className="mt-1 text-2xl md:text-3xl font-heading font-bold text-cream">{empresa.name}</h1>
            </div>
            <span className={`inline-flex self-start items-center px-3 py-1 rounded-full text-sm font-medium ${estado.classe}`}>
              {estado.rotulo}
            </span>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
          <Card variant="default" padding="lg" className="border-card-border">
            <h2 className="text-lg font-bold text-ink dark:text-cream mb-1">Estado e ações</h2>
            <p className="text-sm text-neutral-600 dark:text-cream-text/70 mb-5">
              Enviado em {formatarData(empresa.created_at)}. Conta que criou o cadastro: <span className="font-mono text-xs break-all">{valor(empresa.user_id)}</span>
            </p>
            <EmpresaAdminActions
              empresaId={empresa.id}
              isApproved={empresa.is_approved}
              redirectAfterReject="/admin/empresas"
            />
            <p className="mt-4 text-xs text-neutral-500 dark:text-cream-text/60">
              Suspensa e pendente são guardadas do mesmo modo (is_approved = falso). Uma empresa rejeitada é apagada e deixa de aparecer nesta página.
            </p>
          </Card>

          <Seccao titulo="Dados da empresa">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Campo rotulo="Nome">{valor(empresa.name)}</Campo>
              <Campo rotulo="Setor">{valor(empresa.sector)}</Campo>
              <Campo rotulo="Província">{valor(empresa.province)}</Campo>
              <Campo rotulo="Município">{valor(empresa.city)}</Campo>
              <Campo rotulo="Zona / bairro">{valor(empresa.bairro)}</Campo>
              <Campo rotulo="Slug">{valor(empresa.slug)}</Campo>
              <div className="sm:col-span-2">
                <Campo rotulo="Descrição">
                  <p className="whitespace-pre-line">{valor(empresa.description)}</p>
                </Campo>
              </div>
            </div>
          </Seccao>

          <Seccao titulo="Serviços e logótipo">
            <div className="space-y-5">
              <Campo rotulo="Categorias selecionadas">
                <p className="text-neutral-600 dark:text-cream-text/70">{FAIXAS_NAO_GUARDADAS}</p>
              </Campo>
              <Campo rotulo="Faixa de preço “desde”">
                <p className="text-neutral-600 dark:text-cream-text/70">{FAIXAS_NAO_GUARDADAS}</p>
              </Campo>
              <Campo rotulo="Logótipo">
                {logoUrl ? (
                  <div className="flex flex-col gap-2 items-start">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logoUrl} alt={`Logótipo de ${empresa.name}`} className="h-24 w-24 object-contain rounded-[4px] border border-card-border bg-white" />
                    <a href={logoUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-orange-600 dark:text-orange-400 underline underline-offset-2">
                      Abrir logótipo
                    </a>
                  </div>
                ) : logoErro ? (
                  <p className="text-sm text-red-600 dark:text-red-400">{logoErro}</p>
                ) : (
                  <p className="text-neutral-600 dark:text-cream-text/70">Sem logótipo enviado.</p>
                )}
              </Campo>
            </div>
          </Seccao>

          <Seccao titulo="Contactos">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Campo rotulo="Telefone">{valor(empresa.phone)}</Campo>
              <Campo rotulo="WhatsApp">{valor(empresa.whatsapp)}</Campo>
              <Campo rotulo="Email">{valor(empresa.email)}</Campo>
              <Campo rotulo="Website">
                {empresa.website ? (
                  <a href={empresa.website} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 break-all">
                    {empresa.website}
                  </a>
                ) : (
                  '—'
                )}
              </Campo>
            </div>
          </Seccao>

          <Seccao titulo="Legalização">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Campo rotulo="Estado">{legalizada ? 'Legalizada' : 'Não informada como legalizada'}</Campo>
              <Campo rotulo="NIF">{valor(empresa.nif)}</Campo>
              <div className="sm:col-span-2">
                <Campo rotulo="Comprovativo">
                  {comprovativoUrl ? (
                    <a href={comprovativoUrl} target="_blank" rel="noopener noreferrer" className="text-orange-600 dark:text-orange-400 underline underline-offset-2">
                      Abrir comprovativo (link temporário)
                    </a>
                  ) : comprovativoErro ? (
                    <p className="text-sm text-red-600 dark:text-red-400">{comprovativoErro}</p>
                  ) : (
                    <p className="text-neutral-600 dark:text-cream-text/70">Sem comprovativo carregado.</p>
                  )}
                </Campo>
              </div>
            </div>
          </Seccao>
        </main>
      </div>
    </MainLayout>
  )
}

export default async function AdminEmpresaDetalhePage({ params }: Props) {
  const adminCheck = await isAdmin()
  if (!adminCheck) {
    notFound()
  }

  const { id } = await params
  return <DetalheEmpresaContent id={id} />
}
