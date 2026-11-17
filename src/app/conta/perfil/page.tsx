import type { Metadata } from 'next'
import { getContaSnapshot, guardarPerfilConta } from '@/lib/actions/conta'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const metadata: Metadata = { title: 'Perfil da conta | NegóMapa' }

function Field({ label, name, value, type = 'text', required = false, readOnly = false }: { label: string; name: string; value?: string | null; type?: string; required?: boolean; readOnly?: boolean }) {
  return <label className="block space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
    <span>{label}</span>
    <input name={name} type={type} defaultValue={value ?? ''} required={required} readOnly={readOnly} aria-readonly={readOnly} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-orange-950" />
  </label>
}

function Area({ label, name, value, hint }: { label: string; name: string; value?: string | null; hint?: string }) {
  return <label className="block space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
    <span>{label}</span>
    <textarea name={name} defaultValue={value ?? ''} rows={3} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-orange-950" />
    {hint && <span className="block text-xs font-normal text-slate-500">{hint}</span>}
  </label>
}

export default async function ContaPerfilPage() {
  const data = await getContaSnapshot()
  if (!data) return null
  const supabase = await createSupabaseServerClient()
  const { data: categorias } = await supabase.from('categorias').select('id,nome').eq('ativo', true).order('nome')
  const professional = data.professional ?? {}
  const company = data.company ?? {}
  const isProfessional = data.accountType === 'profissional'
  const isCompany = data.accountType === 'empresa'
  const image = isProfessional ? professional.avatar_url : isCompany ? company.logo_url : data.profile.avatar_url
  const errorMessages: Record<string, string> = {
    nome: 'O nome deve ter entre 2 e 120 caracteres.',
    contacto: 'Verifique o telefone e o WhatsApp.',
    avatar: 'Profissionais e empresas precisam de uma imagem alojada no armazenamento público da NegóMapa.',
    portfolio: 'O portfólio deve ser uma lista JSON válida.',
    guardar: 'Não foi possível guardar. A conta pode estar aprovada ou sem permissão para editar estes campos.',
    detalhes: 'Não foi possível guardar os campos complementares.',
    'sem-perfil': 'Ainda não existe um perfil deste tipo associado à sua conta.',
  }
  return <section className="space-y-5">
    <header><h1 className="text-2xl font-semibold tracking-tight">Perfil</h1><p className="mt-1 text-sm text-slate-500">Actualize os dados associados ao seu tipo de conta.</p></header>
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-xl font-semibold text-slate-500 dark:bg-slate-800">{image ? <img src={image} alt="" className="h-full w-full object-cover" /> : (data.profile.nome?.[0] ?? 'N')}</div>
        <div><p className="font-semibold">{data.profile.nome || professional.nome || company.name || 'O seu perfil'}</p><p className="text-sm text-slate-500">{data.accountType === 'profissional' ? 'Profissional' : isCompany ? 'Empresa' : 'Cliente'}</p></div>
      </div>
    </div>
    <form action={guardarPerfilConta} className="space-y-5">
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div><h2 className="font-semibold">Dados de contacto</h2><p className="text-sm text-slate-500">O email é apresentado apenas para consulta e não pode ser alterado aqui.</p></div>
        <Field label="Nome" name="nome" value={isProfessional ? professional.nome : isCompany ? company.name : data.profile.nome} required />
        <Field label="Email" name="email_visivel" value={data.user.email} type="email" readOnly />
        <Field label="Telefone" name="telefone" value={isProfessional ? professional.telefone : isCompany ? company.phone : data.profile.telefone} />
        <Field label="WhatsApp" name="whatsapp" value={isProfessional ? professional.whatsapp : isCompany ? company.whatsapp : data.profile.whatsapp} />
      </section>

      {isProfessional && <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2">
        <div className="sm:col-span-2"><h2 className="font-semibold">Perfil profissional</h2><p className="text-sm text-slate-500">Os dados públicos continuam sujeitos às regras de aprovação.</p></div>
        <label className="block space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-200"><span>Categoria / área</span><select name="categoria_id" defaultValue={professional.categoria_id ?? ''} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"><option value="">Seleccione uma categoria</option>{(categorias ?? []).map((item: any) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>
        <Field label="Especialidades / serviços" name="especialidades" value={Array.isArray(professional.especialidades) ? professional.especialidades.join(', ') : ''} />
        <Field label="Província" name="provincia" value={professional.provincia} />
        <Field label="Município" name="municipio" value={professional.municipio} />
        <div className="sm:col-span-2"><Area label="Apresentação" name="bio" value={professional.bio} /></div>
        <div className="sm:col-span-2"><Area label="Formação" name="formacao" value={data.details.formacao} /></div>
        <Field label="Disponibilidade" name="disponibilidade" value={data.details.disponibilidade ?? professional.disponibilidade} />
        <div className="sm:col-span-2"><Area label="Portfólio (lista JSON de URLs)" name="portfolio" value={JSON.stringify(professional.portfolio ?? [], null, 2)} hint='Exemplo: ["https://.../trabalho-1.jpg"]' /></div>
        <div className="sm:col-span-2"><Field label="Avatar (URL do armazenamento NegóMapa)" name="avatar_url" value={professional.avatar_url} required /></div>
      </section>}

      {isCompany && <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2">
        <div className="sm:col-span-2"><h2 className="font-semibold">Perfil da empresa</h2><p className="text-sm text-slate-500">A edição de empresas aprovadas pode exigir validação administrativa.</p></div>
        <Field label="Categoria / área" name="sector" value={company.sector} required />
        <Field label="Província" name="province" value={company.province} required />
        <Field label="Município" name="city" value={company.city} />
        <Field label="Tipo de empresa" name="tipo_empresa" value={data.details.tipo_empresa} />
        <Field label="Tamanho da empresa" name="tamanho_empresa" value={data.details.tamanho_empresa} />
        <Field label="Disponibilidade / horário" name="disponibilidade" value={data.details.disponibilidade ?? company.horario_atendimento} />
        <div className="sm:col-span-2"><Area label="Produtos e serviços / apresentação" name="description" value={company.description} /></div>
        <div className="sm:col-span-2"><Area label="Formação (opcional)" name="formacao" value={data.details.formacao} /></div>
        <div className="sm:col-span-2"><Area label="Portfólio (lista JSON de URLs)" name="portfolio" value={JSON.stringify(company.portfolio ?? [], null, 2)} /></div>
        <div className="sm:col-span-2"><Field label="Logótipo (URL do armazenamento NegóMapa)" name="logo_url" value={company.logo_url} required /></div>
      </section>}

      {!isProfessional && !isCompany && <section id="localizacao-preferencias" className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2">
        <div className="sm:col-span-2"><h2 className="font-semibold">Preferências do cliente</h2><p className="text-sm text-slate-500">Use estes campos para personalizar a experiência e a localização.</p></div>
        <Field label="Província" name="provincia" value={data.profile.localizacao_provincia} />
        <Field label="Município" name="municipio" value={data.profile.localizacao_municipio} />
        <Field label="Bairro" name="bairro" value={data.profile.localizacao_bairro} />
        <div className="sm:col-span-2"><Area label="Preferências" name="preferencias" value={data.details.preferencias} /></div>
        <div className="sm:col-span-2"><Area label="Formação (opcional)" name="formacao" value={data.details.formacao} /></div>
      </section>}

      <div className="flex flex-wrap items-center gap-3"><button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-orange-700 px-5 text-sm font-semibold text-white hover:bg-orange-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2">Guardar alterações</button><p className="text-xs text-slate-500">Email e tipo de conta não são editáveis.</p></div>
    </form>
  </section>
}
