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
  let categoriaNome:string|null=null
  if(profissional?.categoria_id){const {data}=await supabase.from('categorias').select('nome').eq('id',profissional.categoria_id).maybeSingle();categoriaNome=data?.nome??null}
  const acessos=[
    ...(profissional?[{href:'/editar-perfil',label:'Editar perfil profissional'},{href:'/profissional/painel',label:'Painel profissional'}]:[]),
    ...(empresas.length?[{href:'/empresa/painel',label:'Painel empresarial'}]:[]),
    {href:'/pedidos',label:'Pedidos'},{href:'/candidaturas',label:'Candidaturas'},
    {href:'/mensagens',label:'Mensagens'},{href:'/preferencias-notificacoes',label:'Preferências de notificações'},
  ]
  return <MainLayout><main id="main-content" className="min-h-[60vh] bg-cream px-4 py-10 dark:bg-navy-dark sm:py-14">
    <div className="mx-auto max-w-4xl space-y-6">
      <Card variant="liquid" padding="lg">
        <CardHeader><CardTitle as="h1" className="text-2xl sm:text-3xl">O meu perfil</CardTitle><p className="text-sm text-neutral-600 dark:text-cream-text">Edite os seus dados pessoais. O email e o tipo de conta são protegidos.</p></CardHeader>
        <CardContent><PerfilPessoalForm email={pessoal.email} nome={pessoal.nome} telefone={pessoal.telefone} whatsapp={pessoal.whatsapp} avatarUrl={pessoal.avatar_url}/></CardContent>
      </Card>
      <Card variant="liquid" padding="lg">
        <CardHeader><CardTitle as="h2">Perfis associados</CardTitle><p className="text-sm text-neutral-600 dark:text-cream-text">Tipo de conta: <strong className="capitalize">{pessoal.account_type}</strong>. Esta escolha não pode ser alterada nesta fase.</p></CardHeader>
        <CardContent className="space-y-6">
          {profissional?<section className="border-t border-card-border pt-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar src={profissional.avatar_url} alt={profissional.nome} name={profissional.nome} width={64} height={64}/>
              <div className="min-w-0 flex-1"><h3 className="font-semibold text-ink dark:text-cream">{profissional.nome}</h3><span className="mt-2 inline-flex rounded-full border border-card-border px-3 py-1 text-sm">{profissional.estado?estados[profissional.estado]??profissional.estado:'Estado não disponível'}</span></div>
              <Link href="/editar-perfil" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-orange-500 px-5 py-3 text-sm font-bold text-orange-700 dark:text-orange-300">Editar perfil profissional</Link>
            </div>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><dt className="text-xs text-neutral-500">Categoria</dt><dd className="text-sm">{categoriaNome??'Não indicada'}</dd></div>
              <div><dt className="text-xs text-neutral-500">Localização</dt><dd className="text-sm">{[profissional.provincia,profissional.municipio].filter(Boolean).join(' · ')||'Não indicada'}</dd></div>
              <div><dt className="text-xs text-neutral-500">Telefone profissional</dt><dd className="text-sm">{profissional.telefone||'Não indicado'}</dd></div>
              <div><dt className="text-xs text-neutral-500">WhatsApp profissional</dt><dd className="text-sm">{profissional.whatsapp||'Não indicado'}</dd></div>
              <div><dt className="text-xs text-neutral-500">Data de avaliação</dt><dd className="text-sm">{dataLegivel(profissional.avaliado_em)??'Ainda não avaliado'}</dd></div>
            </dl>
            {profissional.estado==='rejeitado'&&profissional.motivo_rejeicao&&<p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"><strong>Motivo da rejeição:</strong> {profissional.motivo_rejeicao}</p>}
          </section>:<p className="border-t border-card-border pt-5 text-sm text-neutral-600 dark:text-cream-text">Ainda não existe um perfil profissional associado a esta conta.</p>}
          <section className="border-t border-card-border pt-5" aria-labelledby="empresas-associadas">
            <h3 id="empresas-associadas" className="font-semibold text-ink dark:text-cream">Empresas associadas</h3>
            <p className="mt-1 text-sm text-neutral-600 dark:text-cream-text">{empresas.length} no total · {empresas.filter(e=>e.is_approved).length} aprovadas</p>
            {empresas.length>0?<ul className="mt-3 divide-y divide-card-border rounded-xl border border-card-border">{empresas.map(e=><li key={e.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{e.name}</p><p className="text-xs text-neutral-500">{e.is_approved?'Aprovada':'Não aprovada'}</p></div><Link href={`/empresa/painel?empresa=${encodeURIComponent(e.id)}`} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-neutral-100 px-4 py-2 text-sm font-semibold dark:bg-neutral-800">Abrir painel</Link></li>)}</ul>:<p className="mt-3 text-sm text-neutral-600 dark:text-cream-text">Não existem empresas associadas a esta conta.</p>}
          </section>
        </CardContent>
      </Card>
      <Card variant="liquid" padding="lg"><CardHeader><CardTitle as="h2">Acessos da conta</CardTitle></CardHeader><CardContent><ul className="grid gap-3 sm:grid-cols-2">{acessos.map(a=><li key={a.href}><Link href={a.href} className="flex min-h-11 items-center rounded-xl border border-card-border bg-white/60 px-4 text-sm font-medium text-ink hover:border-orange-500 dark:bg-white/5 dark:text-cream">{a.label}</Link></li>)}</ul></CardContent></Card>
    </div>
  </main></MainLayout>
}
