'use server'
import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { PROVINCIAS } from '@/components/home/constants'

type PerfilInput = { nome: string; telefone: string; whatsapp: string; avatar_url: string }
const emailValido = (v: string) => v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
function contactoValido(v: string) { return !v || (v.length <= 20 && /^\+?[0-9\s().-]{7,20}$/.test(v) && v.replace(/\D/g, '').length >= 7 && v.replace(/\D/g, '').length <= 15) }

async function sessao() {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user || !user.email || !emailValido(user.email)) throw new Error('Sessão inválida ou email da conta inválido.')
  return { supabase, user }
}

export async function obterPerfilPessoal() {
  const { supabase, user } = await sessao()
  const { data, error } = await supabase.from('profiles').select('id,nome,telefone,whatsapp,avatar_url,account_type,updated_at,localizacao_provincia,localizacao_municipio,localizacao_bairro,consentimento_localizacao,consentimento_actualizado_em').eq('id', user.id).maybeSingle()
  if (error) throw new Error('Não foi possível carregar o perfil pessoal.')
  return {
    email: user.email!, nome: data?.nome ?? '', telefone: data?.telefone ?? '',
    whatsapp: data?.whatsapp ?? '', avatar_url: data?.avatar_url ?? null,
    account_type: data?.account_type ?? null, updated_at: data?.updated_at ?? null,
    localizacao_provincia: data?.localizacao_provincia ?? '',
    localizacao_municipio: data?.localizacao_municipio ?? '',
    localizacao_bairro: data?.localizacao_bairro ?? '',
    consentimento_localizacao: data?.consentimento_localizacao ?? false,
    consentimento_actualizado_em: data?.consentimento_actualizado_em ?? null,
  }
}

export async function actualizarPerfilPessoal(input: PerfilInput) {
  try {
    const { supabase, user } = await sessao()
    const nome = typeof input?.nome === 'string' ? input.nome.trim() : ''
    const telefone = typeof input?.telefone === 'string' ? input.telefone.trim() : ''
    const whatsapp = typeof input?.whatsapp === 'string' ? input.whatsapp.trim() : ''
    const avatar = typeof input?.avatar_url === 'string' ? input.avatar_url.trim() : ''
    if (nome.length < 2 || nome.length > 80 || /[<>]/.test(nome)) return { ok: false, message: 'O nome deve ter entre 2 e 80 caracteres.' }
    if (!contactoValido(telefone) || !contactoValido(whatsapp)) return { ok: false, message: 'Telefone ou WhatsApp inválido. Use 7 a 15 dígitos.' }
    let avatar_url: string | null = null
    if (avatar) {
      let url: URL
      try { url = new URL(avatar) } catch { return { ok: false, message: 'O endereço do avatar não é válido.' } }
      const base = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (avatar.length > 2048 || !base || url.protocol !== 'https:' || url.origin !== new URL(base).origin || !url.pathname.startsWith('/storage/v1/object/public/')) return { ok: false, message: 'O avatar deve ser um ficheiro HTTPS do armazenamento da NegóMapa.' }
      avatar_url = url.toString()
    }
    const { data, error } = await supabase.from('profiles').update({ nome, telefone: telefone || null, whatsapp: whatsapp || null, avatar_url }).eq('id', user.id).select('id').maybeSingle()
    if (error || !data) return { ok: false, message: 'Não foi possível guardar o perfil. Verifique a sessão e tente novamente.' }
    revalidatePath('/perfil')
    return { ok: true, message: 'Perfil pessoal actualizado.' }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Erro ao actualizar o perfil.' }
  }
}


export async function obterLocalizacaoCliente(): Promise<{ provincia: string | null; municipio: string | null; bairro: string | null } | null> {
  try {
    const { supabase, user } = await sessao();
    const { data, error } = await supabase.from('profiles')
      .select('localizacao_provincia,localizacao_municipio,localizacao_bairro')
      .eq('id', user.id).maybeSingle();
    if (error || !data) return null;
    return { provincia: data.localizacao_provincia ?? null, municipio: data.localizacao_municipio ?? null, bairro: data.localizacao_bairro ?? null };
  } catch { return null; }
}

export async function actualizarLocalizacaoCliente(input: { provincia: unknown; municipio: unknown; bairro: unknown }) {
  try {
    const { supabase, user } = await sessao();
    const provincia = typeof input?.provincia === 'string' ? input.provincia.trim() : '';
    const municipio = typeof input?.municipio === 'string' ? input.municipio.trim() : '';
    const bairro = typeof input?.bairro === 'string' ? input.bairro.trim() : '';
    if ((provincia && !(PROVINCIAS as readonly string[]).includes(provincia)) || municipio.length > 100 || bairro.length > 100) {
      return { ok: false, message: 'A localização excede os valores permitidos.' };
    }
    const { data: perfil, error: perfilError } = await supabase.from('profiles').select('account_type').eq('id', user.id).maybeSingle();
    if (perfilError || perfil?.account_type !== 'cliente') return { ok: false, message: 'Esta opção está disponível apenas para contas de cliente.' };
    const { error } = await supabase.from('profiles').update({
      localizacao_provincia: provincia || null, localizacao_municipio: municipio || null, localizacao_bairro: bairro || null,
    }).eq('id', user.id);
    if (error) return { ok: false, message: 'Não foi possível guardar a localização.' };
    revalidatePath('/perfil'); revalidatePath('/servicos'); revalidatePath('/descobrir'); revalidatePath('/profissionais'); revalidatePath('/empresas');
    return { ok: true, message: 'Localização administrativa guardada.' };
  } catch (e) { return { ok: false, message: e instanceof Error ? e.message : 'Erro ao guardar a localização.' }; }
}

export async function removerLocalizacaoCliente() {
  try {
    const { supabase, user } = await sessao();
    const { data: perfil, error: perfilError } = await supabase.from('profiles').select('account_type').eq('id', user.id).maybeSingle();
    if (perfilError || perfil?.account_type !== 'cliente') return { ok: false, message: 'Esta opção está disponível apenas para contas de cliente.' };
    const { error } = await supabase.from('profiles').update({
      localizacao_provincia: null, localizacao_municipio: null, localizacao_bairro: null,
      consentimento_localizacao: false, consentimento_actualizado_em: new Date().toISOString(),
      latitude_aproximada: null, longitude_aproximada: null,
    }).eq('id', user.id);
    if (error) return { ok: false, message: 'Não foi possível remover a localização.' };
    revalidatePath('/perfil'); revalidatePath('/servicos'); revalidatePath('/descobrir'); revalidatePath('/profissionais'); revalidatePath('/empresas');
    return { ok: true, message: 'Localização e consentimento removidos.' };
  } catch (e) { return { ok: false, message: e instanceof Error ? e.message : 'Erro ao remover a localização.' }; }
}

export async function guardarPreferenciasCliente(categoriaIds: unknown) {
  try {
    const { supabase, user } = await sessao();
    const { data: perfil, error: perfilError } = await supabase.from('profiles').select('account_type').eq('id', user.id).maybeSingle();
    if (perfilError || perfil?.account_type !== 'cliente') return { ok: false, message: 'As preferências estão disponíveis apenas para contas de cliente.' };
    if (!Array.isArray(categoriaIds) || categoriaIds.length > 30 ||
      categoriaIds.some((id) => typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) {
      return { ok: false, message: 'A selecção de categorias é inválida.' };
    }
    const ids = [...new Set(categoriaIds as string[])];
    if (ids.length) {
      const { data: categorias, error: categoriasError } = await supabase.from('categorias').select('id').eq('ativo', true).in('id', ids);
      if (categoriasError || (categorias ?? []).length !== ids.length) return { ok: false, message: 'Uma ou mais categorias já não estão disponíveis.' };
      const { error: upsertError } = await supabase.from('preferencias_cliente').upsert(
        ids.map((categoria_id) => ({ user_id: user.id, categoria_id })),
        { onConflict: 'user_id,categoria_id', ignoreDuplicates: true },
      );
      if (upsertError) return { ok: false, message: 'Não foi possível guardar as preferências.' };
      const { error: deleteError } = await supabase.from('preferencias_cliente').delete()
        .eq('user_id', user.id).not('categoria_id', 'in', `(${ids.join(',')})`);
      if (deleteError) return { ok: false, message: 'As novas preferências foram guardadas, mas não foi possível remover as anteriores. Tente novamente.' };
    } else {
      const { error } = await supabase.from('preferencias_cliente').delete().eq('user_id', user.id);
      if (error) return { ok: false, message: 'Não foi possível limpar as preferências.' };
    }
    revalidatePath('/perfil'); revalidatePath('/descobrir');
    return { ok: true, message: 'Preferências de categorias guardadas.' };
  } catch (e) { return { ok: false, message: e instanceof Error ? e.message : 'Erro ao guardar as preferências.' }; }
}

export async function escolherTipoConta(tipo: unknown) {
  try {
    if (tipo !== 'cliente' && tipo !== 'profissional' && tipo !== 'empresa') {
      return { ok: false, message: 'Tipo de conta inválido.' }
    }

    // A sessão é sempre validada com o cliente autenticado. A chave privilegiada
    // só é lida e utilizada neste módulo server-only, nunca enviada ao browser.
    const { user } = await sessao()
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      return { ok: false, message: 'A escolha segura do tipo de conta não está configurada neste ambiente.' }
    }

    const admin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: perfil, error: leituraError } = await admin
      .from('profiles')
      .select('account_type')
      .eq('id', user.id)
      .maybeSingle()

    if (leituraError) {
      console.error('Erro ao verificar o tipo de conta. Código:', leituraError.code)
      return { ok: false, message: 'Não foi possível verificar a conta.' }
    }
    if (perfil?.account_type !== null && perfil?.account_type !== undefined) {
      return { ok: false, message: 'O tipo de conta já foi escolhido e não pode ser alterado nesta fase.' }
    }

    if (perfil) {
      // A condição account_type IS NULL torna a operação de escolha única:
      // pedidos concorrentes não conseguem substituir uma escolha já gravada.
      const { data, error: updateError } = await admin
        .from('profiles')
        .update({ account_type: tipo })
        .eq('id', user.id)
        .is('account_type', null)
        .select('id')
        .maybeSingle()

      if (updateError || !data) {
        return { ok: false, message: 'A escolha já foi efectuada ou não pôde ser guardada.' }
      }
    } else {
      // O perfil é criado apenas quando está ausente. Uma colisão concorrente
      // falha sem substituir o registo que outro pedido possa ter criado.
      const { error: insertError } = await admin
        .from('profiles')
        .insert({ id: user.id, account_type: tipo })

      if (insertError) {
        console.error('Erro ao criar perfil pessoal. Código:', insertError.code)
        return { ok: false, message: 'Não foi possível criar o perfil pessoal. Actualize a página e tente novamente.' }
      }
    }

    revalidatePath('/', 'layout')
    revalidatePath('/perfil')
    revalidatePath('/escolher-tipo')
    return { ok: true, message: 'Tipo de conta guardado.' }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Erro ao guardar a escolha.' }
  }
}
