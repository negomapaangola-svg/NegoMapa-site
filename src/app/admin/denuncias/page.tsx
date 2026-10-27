import * as React from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { isAdmin } from '@/lib/auth'
import { getDenunciasAdmin, FiltrosDenuncias, DenunciaWithDetails } from '@/lib/actions/denuncias'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatDate } from '@/lib/utils'
import { FiltroSelect } from './_components/FiltroSelect'
import { DenunciaActions } from './_components/DenunciaActions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Moderação de Denúncias | NegóMapa Admin',
  description: 'Painel de moderação para gerir denúncias de utilizadores',
}

const MOTIVOS_LABELS: Record<string, string> = {
  conteudo_inadequado: 'Conteúdo inadequado',
  fraude: 'Fraude',
  informacao_falsa: 'Informação falsa',
  spam: 'Spam',
  comportamento_abusivo: 'Comportamento abusivo',
  outro: 'Outro',
}

const ESTADO_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  analisada: 'Analisada',
  resolvida: 'Resolvida',
  arquivada: 'Arquivada',
}

const ESTADO_CORES: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  analisada: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  resolvida: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  arquivada: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300',
}

async function getAlvoInfo(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, denuncia: DenunciaWithDetails): Promise<{ titulo: string; tipo: string; slug?: string } | null> {
  if (denuncia.profissional_id) {
    const { data } = await supabase
      .from('profissionais')
      .select('nome, slug')
      .eq('id', denuncia.profissional_id)
      .single()
    return data ? { titulo: data.nome, tipo: 'Profissional', slug: data.slug } : { titulo: 'Profissional não encontrado', tipo: 'Profissional' }
  }
  if (denuncia.company_id) {
    const { data } = await supabase
      .from('companies')
      .select('name, slug')
      .eq('id', denuncia.company_id)
      .single()
    return data ? { titulo: data.name, tipo: 'Empresa', slug: data.slug } : { titulo: 'Empresa não encontrada', tipo: 'Empresa' }
  }
  if (denuncia.servico_id) {
    const { data } = await supabase
      .from('servicos')
      .select('titulo, slug')
      .eq('id', denuncia.servico_id)
      .single()
    return data ? { titulo: data.titulo, tipo: 'Serviço', slug: data.slug } : { titulo: 'Serviço não encontrado', tipo: 'Serviço' }
  }
  if (denuncia.vaga_id) {
    const { data } = await supabase
      .from('vagas')
      .select('titulo, slug')
      .eq('id', denuncia.vaga_id)
      .single()
    return data ? { titulo: data.titulo, tipo: 'Vaga', slug: data.slug } : { titulo: 'Vaga não encontrada', tipo: 'Vaga' }
  }
  return null
}

export default async function AdminDenunciasPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; tipo_alvo?: string }>
}) {
  const adminCheck = await isAdmin()
  if (!adminCheck) {
    notFound()
  }

  const { estado, tipo_alvo } = await searchParams

  const filtros: FiltrosDenuncias = {}
  if (estado && ['pendente', 'analisada', 'resolvida', 'arquivada'].includes(estado)) {
    filtros.estado = estado as FiltrosDenuncias['estado']
  }
  if (tipo_alvo && ['profissional', 'empresa', 'servico', 'vaga'].includes(tipo_alvo)) {
    filtros.tipo_alvo = tipo_alvo as FiltrosDenuncias['tipo_alvo']
  }

  const denuncias = await getDenunciasAdmin(filtros)

  const supabase = await createSupabaseServerClient()

  const denunciasComAlvo = await Promise.all(
    denuncias.map(async (d) => {
      const alvoInfo = await getAlvoInfo(supabase, d)
      return { ...d, alvoInfo }
    })
  )

  return (
    <MainLayout>
      <div className="p-6 md:p-8 bg-cream dark:bg-navy-dark">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-ink dark:text-cream">Moderação de Denúncias</h1>
            <p className="text-neutral-500 dark:text-cream-text/70 mt-1">
              Gerir e resolver denúncias reportadas por utilizadores
            </p>
          </div>

          <Card variant="default" padding="md" className="mb-6 border-card-border">
            <div className="flex flex-wrap items-center gap-4">
              <React.Suspense fallback={null}>
                <FiltroSelect
                  id="filtro-estado"
                  label="Estado:"
                  param="estado"
                  value={filtros.estado || ''}
                  options={[
                    { value: '', label: 'Todos' },
                    { value: 'pendente', label: 'Pendente' },
                    { value: 'analisada', label: 'Analisada' },
                    { value: 'resolvida', label: 'Resolvida' },
                    { value: 'arquivada', label: 'Arquivada' },
                  ]}
                />
                <FiltroSelect
                  id="filtro-tipo"
                  label="Tipo de alvo:"
                  param="tipo_alvo"
                  value={filtros.tipo_alvo || ''}
                  options={[
                    { value: '', label: 'Todos' },
                    { value: 'profissional', label: 'Profissional' },
                    { value: 'empresa', label: 'Empresa' },
                    { value: 'servico', label: 'Serviço' },
                    { value: 'vaga', label: 'Vaga' },
                  ]}
                />
              </React.Suspense>

              <div className="ml-auto text-sm text-neutral-500 dark:text-neutral-400">
                {denuncias.length} denúncia{denuncias.length !== 1 ? 's' : ''} encontrada{denuncias.length !== 1 ? 's' : ''}
              </div>
            </div>
          </Card>

          {denunciasComAlvo.length === 0 ? (
            <Card variant="default" padding="lg" className="border-card-border text-center">
              <p className="text-neutral-500 dark:text-cream-text/70">Nenhuma denúncia encontrada com os filtros selecionados.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {denunciasComAlvo.map((denuncia) => (
                <Card key={denuncia.id} variant="outlined" padding="md" className="border-card-border">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ESTADO_CORES[denuncia.estado] || ESTADO_CORES.pendente}`}>
                          {ESTADO_LABELS[denuncia.estado] || denuncia.estado}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 text-xs font-medium">
                          {denuncia.alvoInfo?.tipo || 'Desconhecido'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
                        {denuncia.alvoInfo && (
                          <>
                            <strong className="text-ink dark:text-cream">{denuncia.alvoInfo.titulo}</strong>
                            {denuncia.alvoInfo.slug && (
                              <a
                                href={`/${denuncia.alvoInfo.tipo.toLowerCase() === 'empresa' ? 'empresa' : denuncia.alvoInfo.tipo.toLowerCase()}/${denuncia.alvoInfo.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-orange-500 dark:text-orange-400 hover:underline"
                              >
                                Ver pública
                              </a>
                            )}
                          </>
                        )}
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          Motivo: <span className="font-normal text-neutral-600 dark:text-neutral-400">{MOTIVOS_LABELS[denuncia.motivo] || denuncia.motivo}</span>
                        </p>
                        {denuncia.detalhes && (
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Detalhes: <span className="font-normal">{denuncia.detalhes}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
                        <span>Denunciante: {denuncia.user?.email || 'Desconhecido'}</span>
                        <span>Criada em: {formatDate(denuncia.created_at)}</span>
                        {denuncia.resolvida_em && (
                          <>
                            <span>Resolvida em: {formatDate(denuncia.resolvida_em)}</span>
                            <span>Por: {denuncia.resolvida_por || '—'}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 md:w-auto">
                      <DenunciaActions denunciaId={denuncia.id} estado={denuncia.estado} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}