import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { MainLayout } from '@/components/layout/MainLayout'
import { Avatar } from '@/components/ui/Avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export const metadata: Metadata = { title: 'O meu perfil | NegóMapa', description: 'Consulte os dados do seu perfil e os acessos da sua conta NegóMapa.' }

const estados: Record<string, string> = { pendente: 'Pendente', aprovado: 'Aprovado', rejeitado: 'Rejeitado', suspenso: 'Suspenso' }

function dataLegivel(valor: string | null) {
  if (!valor) return null
  const data = new Date(valor)
  return Number.isNaN(data.getTime()) ? null : new Intl.DateTimeFormat('pt-PT', { dateStyle: 'medium' }).format(data)
}

export default async function PerfilPage() {
  const user = await getUser()
  if (!user) redirect('/login?redirectTo=/perfil')

  const supabase = await createSupabaseServerClient()
  const [profissionalResult, empresasResult] = await Promise.all([
    supabase.rpc('get_my_profissional_profile'),
    supabase.from('companies').select('id,name,is_approved').eq('user_id', user.id).order('name', { ascending: true }),
  ])
  const linhaProfissional = Array.isArray(profissionalResult.data) ? profissionalResult.data[0] : profissionalResult.data
  // A leitura do próprio perfil usa a função existente e autorizada; só são expostos campos de apresentação.
  const profissional = linhaProfissional ? {
    id: String(linhaProfissional.id ?? ''),
    nome: String(linhaProfissional.nome ?? ''),
    avatar_url: typeof linhaProfissional.avatar_url === 'string' ? linhaProfissional.avatar_url : null,
    estado: typeof linhaProfissional.estado === 'string' ? linhaProfissional.estado : null,
    motivo_rejeicao: typeof linhaProfissional.motivo_rejeicao === 'string' ? linhaProfissional.motivo_rejeicao : null,
    avaliado_em: typeof linhaProfissional.avaliado_em === 'string' ? linhaProfissional.avaliado_em : null,
    categoria_id: typeof linhaProfissional.categoria_id === 'string' ? linhaProfissional.categoria_id : null,
    provincia: typeof linhaProfissional.provincia === 'string' ? linhaProfissional.provincia : null,
    municipio: typeof linhaProfissional.municipio === 'string' ? linhaProfissional.municipio : null,
    telefone: typeof linhaProfissional.telefone === 'string' ? linhaProfissional.telefone : null,
    whatsapp: typeof linhaProfissional.whatsapp === 'string' ? linhaProfissional.whatsapp : null,
  } : null
  const empresas = empresasResult.data ?? []
  let categoriaNome: string | null = null
  if (profissional?.categoria_id) {
    const { data } = await supabase.from('categorias').select('nome').eq('id', profissional.categoria_id).maybeSingle()
    categoriaNome = data?.nome ?? null
  }
  const acessos = [
    ...(profissional ? [{ href: '/editar-perfil', label: 'Editar perfil profissional' }, { href: '/profissional/painel', label: 'Painel profissional' }] : []),
    ...(empresas.length ? [{ href: '/empresa/painel', label: 'Painel empresarial' }] : []),
    { href: '/pedidos', label: 'Pedidos' },
    { href: '/candidaturas', label: 'Candidaturas' },
    { href: '/mensagens', label: 'Mensagens' },
    { href: '/preferencias-notificacoes', label: 'Preferências de notificações' },
  ]
  const estado = profissional?.estado ?? null
  const avaliadoEm = dataLegivel(profissional?.avaliado_em ?? null)

  return <MainLayout>
    <section className="min-h-[60vh] bg-cream px-4 py-10 dark:bg-navy-dark sm:py-14">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card variant="liquid" padding="lg">
          <CardHeader>
            <CardTitle as="h1" className="text-2xl sm:text-3xl">O meu perfil</CardTitle>
            <p className="text-sm text-neutral-600 dark:text-cream-text">Dados da sua conta e dos perfis associados.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {profissional ? <div className="flex flex-col gap-4 border-b border-card-border pb-6 sm:flex-row sm:items-center">
              <Avatar src={profissional.avatar_url} alt={profissional.nome} name={profissional.nome} width={88} height={88} className="h-22 w-22 border border-card-border" />
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-semibold text-ink dark:text-cream">{profissional.nome}</h2>
                <p className="mt-1 break-all text-sm text-neutral-600 dark:text-cream-text">{user.email ?? 'Email não disponível'}</p>
                <span className="mt-3 inline-flex rounded-full border border-card-border px-3 py-1 text-sm font-medium">{estado ? estados[estado] ?? estado : 'Estado não disponível'}</span>
              </div>
              <Link href="/editar-perfil" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-orange-500 px-5 py-3 text-sm font-bold text-orange-700 hover:bg-orange-50 dark:text-orange-300 dark:hover:bg-orange-950/30">Editar perfil</Link>
            </div> : <div className="border-b border-card-border pb-6">
              <h2 className="font-semibold text-ink dark:text-cream">Conta autenticada</h2>
              <p className="mt-1 break-all text-sm text-neutral-600 dark:text-cream-text">{user.email ?? 'Email não disponível'}</p>
              <p className="mt-2 text-sm text-neutral-600 dark:text-cream-text">Ainda não existe um perfil profissional associado a esta conta.</p>
            </div>}

            {profissional && <section aria-labelledby="dados-profissionais">
              <h2 id="dados-profissionais" className="font-semibold text-ink dark:text-cream">Dados profissionais</h2>
              <dl className="mt-3 grid gap-4 sm:grid-cols-2">
                <div><dt className="text-xs text-neutral-500">Categoria</dt><dd className="mt-1 text-sm">{categoriaNome ?? 'Não indicada'}</dd></div>
                <div><dt className="text-xs text-neutral-500">Localização</dt><dd className="mt-1 text-sm">{[profissional.provincia, profissional.municipio].filter(Boolean).join(' · ') || 'Não indicada'}</dd></div>
                <div><dt className="text-xs text-neutral-500">Telefone</dt><dd className="mt-1 text-sm">{profissional.telefone || 'Não indicado'}</dd></div>
                <div><dt className="text-xs text-neutral-500">WhatsApp</dt><dd className="mt-1 text-sm">{profissional.whatsapp || 'Não indicado'}</dd></div>
                <div><dt className="text-xs text-neutral-500">Data de avaliação</dt><dd className="mt-1 text-sm">{avaliadoEm ?? 'Ainda não avaliado'}</dd></div>
              </dl>
              {estado === 'rejeitado' && profissional.motivo_rejeicao && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"><strong>Motivo da rejeição:</strong> {profissional.motivo_rejeicao}</div>}
            </section>}

            <section aria-labelledby="empresas-associadas">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div><h2 id="empresas-associadas" className="font-semibold text-ink dark:text-cream">Empresas associadas</h2><p className="mt-1 text-sm text-neutral-600 dark:text-cream-text">{empresas.length} no total · {empresas.filter((empresa) => empresa.is_approved).length} aprovadas</p></div>
                {empresas.length > 0 && <Link href="/empresa/painel" className="text-sm font-semibold text-orange-700 underline dark:text-orange-300">Painel empresarial</Link>}
              </div>
              {empresas.length ? <ul className="mt-3 divide-y divide-card-border rounded-xl border border-card-border">
                {empresas.map((empresa) => <li key={empresa.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div><p className="font-medium text-ink dark:text-cream">{empresa.name}</p><p className="mt-1 text-xs text-neutral-500">{empresa.is_approved ? 'Aprovada' : 'Não aprovada'}</p></div>
                  <Link href={`/empresa/painel?empresa=${encodeURIComponent(empresa.id)}`} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100">Abrir painel</Link>
                </li>)}
              </ul> : <p className="mt-3 text-sm text-neutral-600 dark:text-cream-text">Não existem empresas associadas a esta conta.</p>}
            </section>
          </CardContent>
        </Card>

        <Card variant="liquid" padding="lg">
          <CardHeader><CardTitle as="h2">Acessos da conta</CardTitle></CardHeader>
          <CardContent><ul className="grid gap-3 sm:grid-cols-2">{acessos.map((item) => <li key={item.href}><Link href={item.href} className="flex min-h-11 items-center rounded-xl border border-card-border bg-white/60 px-4 text-sm font-medium text-ink transition-colors hover:border-orange-500 dark:bg-white/5 dark:text-cream">{item.label}</Link></li>)}</ul></CardContent>
        </Card>
      </div>
    </section>
  </MainLayout>
}
