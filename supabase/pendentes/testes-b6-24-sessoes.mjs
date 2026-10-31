// TESTES B.6.24 — sessões reais (NÃO EXECUTADOS).
// Exige utilizadores de TESTE criados no Auth da branch de teste. Não usa o perfil real "Fred Tomás".
// Não fabrica claims: cada cliente faz login com email e palavra-passe.
//
// Variáveis: SUPABASE_URL, SUPABASE_ANON_KEY,
//   TEST_OWNER_EMAIL / TEST_OWNER_PASSWORD   (dono do perfil de teste, sem perfil profissional prévio)
//   TEST_OTHER_EMAIL / TEST_OTHER_PASSWORD   (outro utilizador autenticado)
//   TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD   (utilizador presente em admin_users)
//   TEST_CONFIRM_BRANCH=yes                  (confirmação explícita de que é branch de teste)
//
// Recusa correr se TEST_CONFIRM_BRANCH não for "yes" ou se o URL for o projeto de produção.

import { createClient } from '@supabase/supabase-js'

const PROD_REF = 'sjelyaewgcmmtnudcgem'
const url = process.env.SUPABASE_URL
const anonKey = process.env.SUPABASE_ANON_KEY

function exigir(cond, msg) {
  if (!cond) {
    console.error('ABORTADO:', msg)
    process.exit(1)
  }
}

exigir(process.env.TEST_CONFIRM_BRANCH === 'yes', 'definir TEST_CONFIRM_BRANCH=yes apenas numa branch de teste')
exigir(url && anonKey, 'SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórios')
exigir(!url.includes(PROD_REF), 'URL aponta para o projeto de produção; abortar')

const resultados = []
function check(nome, ok, detalhe = '') {
  resultados.push({ nome, ok })
  console.log(`${ok ? 'OK  ' : 'FALHA'} ${nome}${detalhe ? ' — ' + detalhe : ''}`)
}

async function clienteCom(email, password) {
  const c = createClient(url, anonKey, { auth: { persistSession: false } })
  if (!email) return c
  const { error } = await c.auth.signInWithPassword({ email, password })
  exigir(!error, `login falhou para ${email}: ${error?.message}`)
  return c
}

const anon = await clienteCom()
const owner = await clienteCom(process.env.TEST_OWNER_EMAIL, process.env.TEST_OWNER_PASSWORD)
const other = await clienteCom(process.env.TEST_OTHER_EMAIL, process.env.TEST_OTHER_PASSWORD)
const admin = await clienteCom(process.env.TEST_ADMIN_EMAIL, process.env.TEST_ADMIN_PASSWORD)

const { data: { user: ownerUser } } = await owner.auth.getUser()
exigir(ownerUser, 'dono sem utilizador')

// Preparação: o dono não pode já ter perfil (não tocar em dados existentes).
const { data: existente } = await owner.rpc('get_my_profissional_profile')
exigir(!existente || existente.length === 0, 'o dono de teste já tem perfil profissional; usar outro utilizador')

const marca = `teste-b6-24-${Date.now()}`
const motivo = 'Teste automatizado B.6.24: rejeição de verificação.'

const { data: criado, error: erroCriar } = await owner
  .from('profissionais')
  .insert({
    user_id: ownerUser.id,
    nome: `Teste ${marca}`,
    telefone: '900000000',
    whatsapp: '900000000',
    bio: 'Perfil de teste B.6.24',
    provincia: 'Luanda',
    municipio: 'Luanda',
    slug: marca,
  })
  .select('id, estado')
  .single()
exigir(!erroCriar, `inserção do perfil de teste falhou: ${erroCriar?.message}`)
check('dono cria perfil de teste; estado forçado a pendente', criado.estado === 'pendente')

const testeId = criado.id
const { error: erroRejeitar } = await admin.rpc('admin_avaliar_profissional', {
  p_id: testeId,
  p_estado: 'rejeitado',
  p_motivo: motivo,
})
check('admin rejeita o perfil de teste com motivo', !erroRejeitar, erroRejeitar?.message ?? '')

// 1. Dono lê o próprio motivo, sem avaliado_por
const { data: meu, error: erroMeu } = await owner.rpc('get_my_profissional_profile')
const linhaDono = meu?.[0]
check('dono recebe 1 linha em get_my_profissional_profile', !erroMeu && meu?.length === 1, erroMeu?.message ?? '')
check('dono lê motivo_rejeicao do próprio perfil', linhaDono?.motivo_rejeicao === motivo)
check('dono não recebe avaliado_por', linhaDono && !('avaliado_por' in linhaDono))

// 2. authenticated não tem SELECT direto em motivo_rejeicao
const { error: erroDirecto } = await owner.from('profissionais').select('motivo_rejeicao').eq('id', testeId)
check('SELECT direto de motivo_rejeicao é recusado (authenticated)', !!erroDirecto, erroDirecto?.code ?? 'sem erro')

// Outro utilizador autenticado não vê o perfil
const { data: outro, error: erroOutro } = await other.rpc('get_my_profissional_profile')
check('outro utilizador autenticado recebe 0 linhas', !erroOutro && (outro?.length ?? 0) === 0, erroOutro?.message ?? '')

// 3. anon e não-admin não chamam admin_listar_profissionais
const { error: erroAnon } = await anon.rpc('admin_listar_profissionais')
check('anon não chama admin_listar_profissionais', !!erroAnon, erroAnon?.code ?? 'sem erro')

const { error: erroNaoAdmin } = await owner.rpc('admin_listar_profissionais')
check('não-admin não chama admin_listar_profissionais', !!erroNaoAdmin, erroNaoAdmin?.message ?? 'sem erro')

// 4. Admin vê a lista com motivo_rejeicao e avaliado_em
const { data: lista, error: erroLista } = await admin.rpc('admin_listar_profissionais')
const linhaAdmin = lista?.find((r) => r.id === testeId)
check('admin recebe a lista', !erroLista && Array.isArray(lista), erroLista?.message ?? '')
check('admin vê motivo_rejeicao na lista', linhaAdmin?.motivo_rejeicao === motivo)
check('admin vê avaliado_em na lista', !!linhaAdmin?.avaliado_em)
check('lista não expõe avaliado_por', linhaAdmin && !('avaliado_por' in linhaAdmin))

// Limpeza: apagar só o perfil de teste criado nesta execução.
const { error: erroLimpeza } = await admin.from('profissionais').delete().eq('id', testeId)
check('limpeza: perfil de teste apagado', !erroLimpeza, erroLimpeza?.message ?? '')

const falhas = resultados.filter((r) => !r.ok).length
console.log(`\n${resultados.length - falhas}/${resultados.length} verificações passaram`)
process.exit(falhas ? 1 : 0)
