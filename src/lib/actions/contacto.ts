'use server'

import { createClient } from '@supabase/supabase-js'

export type ContactoResult = {
  success: boolean
  error?: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Cliente sem sessão: a política de INSERT de contact_submissions é apenas para o papel anon.
// Com a sessão de um utilizador autenticado, o insert seria recusado pela RLS.
function clienteAnonimo() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error('Variáveis do Supabase em falta')
  }
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}

export async function enviarContacto(formData: FormData): Promise<ContactoResult> {
  // Campo de isco (honeypot): preenchido só por robôs. Responde como sucesso sem gravar.
  if (String(formData.get('website') ?? '').trim() !== '') {
    return { success: true }
  }

  const nome = String(formData.get('nome') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const telefone = String(formData.get('telefone') ?? '').trim()
  const mensagem = String(formData.get('mensagem') ?? '').trim()

  if (nome.length < 2 || nome.length > 120) {
    return { success: false, error: 'Indique o seu nome (entre 2 e 120 caracteres).' }
  }
  if (email.length > 254 || !EMAIL_REGEX.test(email)) {
    return { success: false, error: 'Indique um correio eletrónico válido.' }
  }
  if (telefone.length > 30) {
    return { success: false, error: 'O número de telefone é demasiado longo.' }
  }
  if (mensagem.length < 10 || mensagem.length > 2000) {
    return { success: false, error: 'A mensagem deve ter entre 10 e 2000 caracteres.' }
  }

  const supabase = clienteAnonimo()
  // Sem .select(): o papel anon não tem política de SELECT nesta tabela.
  const { error } = await supabase.from('contact_submissions').insert({
    name: nome,
    email,
    phone: telefone || null,
    message: mensagem,
  })

  if (error) {
    console.error('Erro ao gravar contacto. Código:', error.code)
    return { success: false, error: 'Não foi possível enviar a mensagem. Tente novamente mais tarde.' }
  }

  return { success: true }
}
