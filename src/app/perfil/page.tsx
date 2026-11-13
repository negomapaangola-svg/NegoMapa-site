import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { obterPerfilPessoal } from '@/lib/actions/perfil-pessoal'
import { MainLayout } from '@/components/layout/MainLayout'
import { Avatar } from '@/components/ui/Avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { PerfilPessoalForm } from '@/components/perfil/PerfilPessoalForm'
import { LocalizacaoPreferenciasForm } from '@/components/perfil/LocalizacaoPreferenciasForm'

export const metadata: Metadata = { title: 'O meu perfil | NegóMapa', description: 'Consulte e actualize os dados do seu perfil pessoal NegóMapa.' }
const estados: Record<string,string> = { pendente:'Pendente', aprovado:'Aprovado', rejeitado:'Rejeitado', suspenso:'Suspenso' }
function dataLegivel(valor:string|null) { if(!valor)return null; const d=new Date(valor); return Number.isNaN(d.getTime())?null:new Intl.DateTimeFormat('pt-PT',{dateStyle:'medium'}).format(d) }

export default async function PerfilPage() {
  const user=await getUser()
  if(!user) redirect('/login?redirectTo=/perfil')
  const supabase=await createSupabaseServerClient()
  const [pessoal,profissionalResult,empresasResult]=await Promise.all([
    obterPerfilPessoal(),
    supabase.rpc('get_my_profissional_profile'),
    supabase.from('companies').select('id,name,is_approved').eq('user_id',user.id).order('name',{ascending:true}),
  ])
  if(!pessoal.account_type) redirect('/escolher-tipo')
  const raw=Array.isArray(profissionalResult.data)?profissionalResult.data[0]:profissionalResult.data
  const profissional=raw?{
    nome:String(raw.nome??''),avatar_url:typeof raw.avatar_url==='string'?raw.avatar_url:null,
    estado:typeof raw.estado==='string'?raw.estado:null,
    motivo_rejeicao:typeof raw.motivo_rejeicao==='string'?raw.motivo_rejeicao:null,
    avaliado_em:typeof raw.avaliado_em==='string'?raw.avaliado_em:null,
    categoria_id:typeof raw.categoria_id==='string'?raw.categoria_id:null,
    provincia:typeof raw.provincia==='string'?raw.provincia:null,
    municipio:typeof raw.municipio==='string'?raw.municipio:null,
    telefone:typeof raw.telefone==='string'?raw.telefone:null,
    whatsapp:typeof raw.whatsapp==='string'?raw.whatsapp:null,
  }:null
  const empresas=empresasResult.data??[]
  const [categoriasCliente, preferenciasCliente] = pessoal.account_type === 'cliente'
    ? await Promise.all([
        supabase.from('categorias').select('id,nome').eq('ativo', true).order('nome'),
        supabase.from('preferencias_cliente').select('categoria_id').eq('user_id', user.id),
      ])
    : [{ data: [] }, { data: [] }]
  let categoriaNome:string|null=null
  if(profissional?.categoria_id){const {data}=await supabase.from('categorias').select('nome').eq('id',profissional.categoria_id).maybeSingle();categoriaNome=data?.nome??null}
  const corTipoConta = pessoal.account_type === 'profissional'
    ? 'border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-200'
    : pessoal.account_type === 'empresa'
      ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
      : 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200'
  const acessos=[
    ...(profissional?[{href:'/editar-perfil',label:'Editar perfil profissional'},{href:'/profissional/painel',label:'Painel profissional'}]:[]),
    ...(empresas.length?[{href:'/empresa/painel',label:'Painel empresarial'}]:[]),
    {href:'/pedidos',label:'Pedidos'},{href:'/candidaturas',label:'Candidaturas'},
    {href:'/mensagens',label:'Mensagens'},{href:'/configuracoes',label:'Configurações'},
  ]
  return <MainLayout><main id="main-content" className="min-h-[60vh] bg-cream px-4 py-10 dark:bg-navy-dark sm:py-14">
    <div className="mx-auto max-w-4xl space-y-5">
      <nav aria-label="Secções do perfil" className="flex flex-wrap gap-2 text-xs">
        <a href="#dados-pessoais" className="rounded-full border border-card-border px-3 py-2 font-medium text-ink transition-colors hover:border-orange-500 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800">Dados pessoais</a>
        {pessoal.account_type === 'cliente' && <a href="#localizacao-preferencias" className="rounded-full border border-card-border px-3 py-2 font-medium text-ink transition-colors hover:border-orange-500 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800">Localização e preferências</a>}
        <a href="#perfis-associados" className="rounded-full border border-card-border px-3 py-2 font-medium text-ink transition-colors hover:border-orange-500 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800">Perfis associados</a>
        <a href="#acessos-conta" className="rounded-full border border-card-border px-3 py-2 font-medium text-ink transition-colors hover:border-orange-500 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800">Acessos</a>
      </nav>
      <Card id="dados-pessoais" variant="liquid" padding="md">
        <CardHeader><CardTitle as="h1" className="text-2xl sm:text-3xl">O meu perfil</CardTitle><p className="text-sm text-neutral-600 dark:text-cream-text">Edite os seus dados pessoais. O email e o tipo de conta são protegidos.</p></CardHeader>
        <CardContent><PerfilPessoalForm email={pessoal.email} nome={pessoal.nome} telefone={pessoal.telefone} whatsapp={pessoal.whatsapp} avatarUrl={pessoal.avatar_url}/></CardContent>
      </Card>
      {pessoal.account_type === 'cliente' && <Card id="localizacao-preferencias" variant="liquid" padding="md">
        <CardHeader><CardTitle as="h2">Localização e preferências</CardTitle><p className="text-sm text-neutral-600 dark:text-cream-text">Defina a sua localização administrativa e as categorias de interesse.</p></CardHeader>
        <CardContent><LocalizacaoPreferenciasForm
          provinciaInicial={pessoal.localizacao_provincia}
          municipioInicial={pessoal.localizacao_municipio}
          bairroInicial={pessoal.localizacao_bairro}
          consentimento={pessoal.consentimento_localizacao}
          consentimentoActualizadoEm={pessoal.consentimento_actualizado_em}
          categorias={(categoriasCliente.data ?? []) as { id: string; nome: string }[]}
          preferenciasIniciais={(preferenciasCliente.data ?? []).map((item: { categoria_id: string }) => item.categoria_id)}
        /></CardContent>
      </Card>}
      <Card id="perfis-associados" variant="liquid" padding="md">
        <CardHeader><CardTitle as="h2">Perfis associados</CardTitle><p className="text-sm text-neutral-600 dark:text-cream-text">Tipo de conta: <strong className={"ml-1 inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold capitalize " + corTipoConta}>{pessoal.account_type}</strong>. Esta escolha não pode ser alterada nesta fase.</p></CardHeader>
        <CardContent className="space-y-6">
          {profissional?<section className="border-t border-card-border pt-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar src={profissional.avatar_url} alt={profissional.nome} name={profissional.nome} width={64} height={64}/>
              <div className="min-w-0 flex-1"><h3 className="font-semibold text-ink dark:text-cream">{profissional.nome}</h3><span className="mt-2 inline-flex rounded-full border border-card-border px-3 py-1 text-sm">{profissional.estado?estados[profissional.estado]??profissional.estado:'Estado não disponível'}</span></div>
              <Link href="/editar-perfil" className="inline-flex min-h-9 items-center justify-center rounded-lg border border-orange-500 px-3 py-1.5 text-sm font-semibold text-orange-700 dark:text-orange-300">Editar perfil profissional</Link>
            </div>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><dt className="text-xs text-neutral-500 dark:text-neutral-400">Categoria</dt><dd className="text-sm">{categoriaNome??'Não indicada'}</dd></div>
              <div><dt className="text-xs text-neutral-500 dark:text-neutral-400">Localização</dt><dd className="text-sm">{[profissional.provincia,profissional.municipio].filter(Boolean).join(' · ')||'Não indicada'}</dd></div>
              <div><dt className="text-xs text-neutral-500 dark:text-neutral-400">Telefone profissional</dt><dd className="text-sm">{profissional.telefone||'Não indicado'}</dd></div>
              <div><dt className="text-xs text-neutral-500 dark:text-neutral-400">WhatsApp profissional</dt><dd className="text-sm">{profissional.whatsapp||'Não indicado'}</dd></div>
              <div><dt className="text-xs text-neutral-500 dark:text-neutral-400">Data de avaliação</dt><dd className="text-sm">{dataLegivel(profissional.avaliado_em)??'Ainda não avaliado'}</dd></div>
            </dl>
            {profissional.estado==='rejeitado'&&profissional.motivo_rejeicao&&<p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"><strong>Motivo da rejeição:</strong> {profissional.motivo_rejeicao}</p>}
          </section>:<p className="border-t border-card-border pt-5 text-sm text-neutral-600 dark:text-cream-text">Ainda não existe um perfil profissional associado a esta conta.</p>}
          <section className="border-t border-card-border pt-5" aria-labelledby="empresas-associadas">
            <h3 id="empresas-associadas" className="font-semibold text-ink dark:text-cream">Empresas associadas</h3>
            <p className="mt-1 text-sm text-neutral-600 dark:text-cream-text">{empresas.length} no total · {empresas.filter(e=>e.is_approved).length} aprovadas</p>
            {empresas.length>0?<ul className="mt-3 divide-y divide-card-border rounded-xl border border-card-border">{empresas.map(e=><li key={e.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{e.name}</p><p className="text-xs text-neutral-500 dark:text-neutral-400">{e.is_approved?'Aprovada':'Não aprovada'}</p></div><Link href={`/empresa/painel?empresa=${encodeURIComponent(e.id)}`} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-neutral-100 px-4 py-2 text-sm font-semibold dark:bg-neutral-800">Abrir painel</Link></li>)}</ul>:<p className="mt-3 text-sm text-neutral-600 dark:text-cream-text">Não existem empresas associadas a esta conta.</p>}
          </section>
        </CardContent>
      </Card>
      {pessoal.account_type === 'cliente' && !profissional && empresas.length === 0 && <Card variant="liquid" padding="lg">
        <CardHeader><CardTitle as="h2">Expandir a minha conta</CardTitle><p className="text-sm text-neutral-600 dark:text-cream-text">Como cliente, pode escolher apenas uma opção. O seu pedido ficará pendente de aprovação.</p></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Link href="/cadastrar-profissional" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500">Tornar-me profissional</Link>
          <Link href="/cadastrar-empresa" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-orange-500 bg-white/60 px-5 py-3 text-sm font-semibold text-orange-800 transition-colors hover:bg-orange-50 dark:bg-white/5 dark:text-orange-300 dark:hover:bg-orange-950/30">Criar empresa</Link>
        </CardContent>
      </Card>}
      <Card id="acessos-conta" variant="liquid" padding="md"><CardHeader><CardTitle as="h2">Acessos da conta</CardTitle></CardHeader><CardContent><ul className="grid gap-3 sm:grid-cols-2">{acessos.map(a=><li key={a.href}><Link href={a.href} className="flex min-h-9 items-center rounded-lg border border-card-border bg-white/60 px-3 py-1.5 text-sm font-medium text-ink hover:border-orange-500 dark:bg-white/5 dark:text-cream">{a.label}</Link></li>)}</ul></CardContent></Card>
    </div>
  </main></MainLayout>
}
