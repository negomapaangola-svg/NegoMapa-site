import { ImageFields } from '@/components/images/ImageFields'
import type { Metadata } from 'next'
import { getContaSnapshot, guardarPerfilConta } from '@/lib/actions/conta'
import { createSupabaseServerClient } from '@/lib/supabase-server'
export const metadata: Metadata = { title: 'Perfil da conta | NegóMapa' }
function Field({label,name,value,type='text',required=false,readOnly=false}:{label:string;name:string;value?:string|null;type?:string;required?:boolean;readOnly?:boolean}) {
 return <label className="block space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-200"><span>{label}</span><input name={name} type={type} defaultValue={value??''} required={required} readOnly={readOnly} aria-readonly={readOnly} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white"/></label>
}
function Area({label,name,value,hint}:{label:string;name:string;value?:string|null;hint?:string}) {
 return <label className="block space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-200"><span>{label}</span><textarea name={name} defaultValue={value??''} rows={3} className="min-h-28 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white"/>{hint&&<span className="block text-xs font-normal text-slate-500">{hint}</span>}</label>
}
export default async function ContaPerfilPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
 const [data,params]=await Promise.all([getContaSnapshot(),searchParams]); if(!data)return null
 const supabase=await createSupabaseServerClient()
 const {data:categorias}=await supabase.from('categorias').select('id,nome').eq('ativo',true).order('nome')
 const p=data.professional ?? ({} as NonNullable<typeof data.professional>), c=data.company ?? ({} as NonNullable<typeof data.company>), pro=data.accountType==='profissional', emp=data.accountType==='empresa'
 const name=pro?p.nome:emp?c.name:data.profile.nome
 let avatar=pro?p.avatar_url:emp?c.logo_url:data.profile.avatar_url
 const imageBucket=pro?'profissionais-avatars':emp?'empresas-logos':'clientes-avatars'
 if(avatar){
  let imagePath=avatar
  if(avatar.startsWith('/api/imagens/')) imagePath=avatar.split('/').slice(4).map(decodeURIComponent).join('/')
  else if(avatar.startsWith('http')){
   try{
    const pathname=new URL(avatar).pathname, marker='/storage/v1/object/', index=pathname.indexOf(marker)
    if(index>=0){const parts=pathname.slice(index+marker.length).split('/');if(parts[0]==='public'||parts[0]==='sign')parts.shift();if(parts.shift()===imageBucket)imagePath=parts.map(decodeURIComponent).join('/')}
   }catch{imagePath=''}
  }
  const {data:signedAvatar}=await supabase.storage.from(imageBucket).createSignedUrl(imagePath,600)
  avatar=signedAvatar?.signedUrl??null
 }
 const kind=pro?'Profissional':emp?'Empresa':'Cliente'
 const status=pro?(p.estado??'Pendente'):emp?(c.is_approved?'Aprovada':c.estado??'Pendente'):(data.profile.is_active===false?'Inactiva':'Activa')
 const errorMessages:Record<string,string>={nome:'O nome deve ter entre 2 e 120 caracteres.',contacto:'Verifique os contactos.',avatar:'É obrigatória uma imagem válida no armazenamento NegóMapa.',portfolio:'O portfólio deve ser uma lista JSON válida.',guardar:'Não foi possível guardar. Verifique as permissões da conta.',detalhes:'Não foi possível guardar os campos complementares.','sem-perfil':'Não existe perfil associado a esta conta.','conta-inactiva':'Esta conta está inactiva e não pode alterar os dados.'}
 const error=typeof params.erro==='string'?errorMessages[params.erro]:null
 return <section className="space-y-6">
  <header><h1 className="text-2xl font-semibold tracking-tight">Perfil</h1><p className="mt-1 text-sm text-slate-500">Gira os seus dados privados num único lugar.</p></header>
  {error&&<p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
  {params.salvo&&<p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Alterações guardadas com sucesso.</p>}
  <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
   <div className="mx-auto flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-slate-100 bg-slate-100 text-3xl font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-800">{avatar?<img src={avatar} alt={`Imagem de ${name??kind}`} className="h-full w-full object-cover"/>:<span>{name?.[0]?.toUpperCase()??'N'}</span>}</div>
   <h2 className="mt-4 text-lg font-semibold">{name||'O seu perfil'}</h2><p className="mt-1 text-sm text-slate-500">{kind}</p>
   {(pro||emp)&&!avatar&&<p className="mt-2 text-sm font-medium text-red-700">Imagem obrigatória para profissional e empresa.</p>}
  </section>
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
   <section className="flex min-h-28 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><h2 className="text-sm font-medium text-slate-500">Tipo de conta</h2><p className="mt-3 text-xl font-semibold">{kind}</p></section>
   <section className="flex min-h-28 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><h2 className="text-sm font-medium text-slate-500">Estado da conta</h2><p className="mt-3 text-xl font-semibold">{status}</p></section>
  </div>
  <form action={guardarPerfilConta} className="space-y-5">
   <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><div><h2 className="text-lg font-semibold">Dados da conta</h2><p className="text-sm text-slate-500">O email é visível, mas não editável.</p></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Nome" name="nome" value={name} required/><Field label="Email" name="email_visivel" value={data.user.email} type="email" readOnly/><Field label="Telefone" name="telefone" value={pro?p.telefone:emp?c.phone:data.profile.telefone}/><Field label="Telefone / WhatsApp" name="whatsapp" value={pro?p.whatsapp:emp?c.whatsapp:data.profile.whatsapp}/></div></section>
   {pro&&<section id="localizacao-preferencias" className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><h2 className="font-semibold">Dados profissionais</h2><div className="grid gap-4 sm:grid-cols-2"><label className="block space-y-1.5 text-sm font-medium"><span>Categoria / área</span><select name="categoria_id" defaultValue={p.categoria_id??''} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"><option value="">Seleccione uma categoria</option>{(categorias??[]).map(x=><option key={x.id} value={x.id}>{x.nome}</option>)}</select></label><Field label="Serviços / especialidades" name="especialidades" value={Array.isArray(p.especialidades)?p.especialidades.join(', '):''}/><Field label="Província" name="provincia" value={p.provincia}/><Field label="Município" name="municipio" value={p.municipio}/><Field label="Bairro" name="bairro" value={p.bairro}/><Field label="Disponibilidade" name="disponibilidade" value={data.details.disponibilidade??p.disponibilidade}/></div><Area label="Formação académica / profissional" name="formacao" value={data.details.formacao}/><ImageFields bucket="profissionais-avatars" avatar={p.avatar_url??''} portfolioBucket="profissionais-portfolio" portfolio={Array.isArray(p.portfolio)?p.portfolio:[]} avatarName="avatar_url" portfolioName="portfolio" /><Area label="Apresentação" name="bio" value={p.bio}/></section>}
   {emp&&<section id="localizacao-preferencias" className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><h2 className="font-semibold">Dados da empresa</h2><div className="grid gap-4 sm:grid-cols-2"><Field label="Categoria / área" name="sector" value={c.sector} required/><Field label="Província" name="province" value={c.province} required/><Field label="Município" name="city" value={c.city}/><Field label="Bairro" name="bairro" value={c.bairro}/><Field label="Rua" name="rua" value={c.rua}/><Field label="Referência de localização" name="referencia_localizacao" value={c.referencia_localizacao}/><Field label="Tipo de empresa" name="tipo_empresa" value={data.details.tipo_empresa}/><Field label="Tamanho da empresa" name="tamanho_empresa" value={data.details.tamanho_empresa}/><Field label="Disponibilidade" name="disponibilidade" value={data.details.disponibilidade??c.horario_atendimento}/><Field label="Website" name="website" value={c.website}/></div><Area label="Produtos e/ou serviços" name="description" value={c.description}/><ImageFields bucket="empresas-logos" avatar={c.logo_url??''} portfolioBucket="empresas-portfolio" portfolio={Array.isArray(c.portfolio)?c.portfolio:[]} avatarName="logo_url" portfolioName="portfolio" /></section>}
   {!pro&&!emp&&<section id="localizacao-preferencias" className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><h2 className="font-semibold">Localização e preferências</h2><div className="grid gap-4 sm:grid-cols-2"><Field label="Província" name="provincia" value={data.profile.localizacao_provincia}/><Field label="Município" name="municipio" value={data.profile.localizacao_municipio}/><Field label="Bairro" name="bairro" value={data.profile.localizacao_bairro}/></div><ImageFields bucket="clientes-avatars" avatar={data.profile.avatar_url??''} avatarName="avatar_url"/><Area label="Preferências" name="preferencias" value={data.details.preferencias}/><Area label="Formação (opcional)" name="formacao" value={data.details.formacao}/></section>}
   <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-orange-700 px-5 text-sm font-semibold text-white hover:bg-orange-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500">Guardar alterações</button>
  </form>
  <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><div><h2 className="text-lg font-semibold">Configurações</h2><p className="text-sm text-slate-500">Preferências, segurança e apoio da conta.</p></div><div className="grid gap-3 sm:grid-cols-2">{[['Localização','/conta/configuracoes#localizacao'],['Mensagens','/conta/configuracoes#mensagens'],['Notificações','/conta/configuracoes#notificacoes'],['Segurança','/conta/configuracoes#seguranca'],['Apagar conta','/conta/configuracoes#apagar-conta'],['Contactar administrador','/conta/configuracoes#contactar-administrador']].map(([label,href])=><a key={href} href={href} className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-4 text-sm font-medium hover:border-orange-500 dark:border-slate-700">{label}</a>)}</div></section>
 </section>
}
