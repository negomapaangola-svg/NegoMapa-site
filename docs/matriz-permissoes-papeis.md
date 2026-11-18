# Matriz de permissões por papel

Esta matriz define as capacidades de conta autenticada. As políticas RLS e as Server Actions são a fronteira de segurança; ocultar controlos na interface não substitui estas verificações. O papel efectivo vem de `profiles.account_type`; registos de negócio legados não alteram o papel da identidade.

| Capacidade | Admin | Cliente | Profissional | Empresa |
|---|---:|---:|---:|---:|
| Aceder à administração/moderação | Sim | Não | Não | Não |
| Criar perfil profissional/empresa a partir de cliente | Não | Sim, apenas uma conversão e sem perfil existente | Não | Não |
| Publicar serviços | Não | Não | Sim, após aprovação | Conforme o fluxo empresarial |
| Publicar produtos | Não | Não | Não | Conforme aprovação |
| Publicar vagas | Não | Não | Não | Sim, após aprovação |
| Candidatar-se a vagas | Não | Sim | Não | Não |
| Criar pedidos de serviço | Não | Sim | Não | Não |
| Iniciar conversas como cliente | Não | Sim, para profissionais/empresas elegíveis | Não | Não |
| Responder em conversas próprias | Não | Sim | Sim, se aprovado | Sim, se aprovada |
| Gerir candidaturas recebidas | Não | Não | Não | Sim, apenas nas suas vagas |
| Editar dados pessoais da própria conta | Apenas dados administrativos permitidos | Sim | Sim | Sim |

## Regras de autorização

- O email de uma conta em `admin_users` fica reservado e não pode ser usado para criar outra identidade Auth.
- Um utilizador em `admin_users` não pode assumir `account_type` de cliente, profissional ou empresa.
- Políticas RLS restritivas impedem INSERT administrativo em empresas, profissionais, serviços, produtos e vagas.
- A candidatura exige papel cliente activo e rejeita explicitamente administradores, profissionais e empresas.
- Pedidos de serviço e início de conversas como cliente exigem `profiles.account_type = 'cliente'` e conta activa.
- Um cliente activo mantém capacidades de cliente mesmo que existam registos empresariais/profissionais legados associados à identidade; não pode contactar os próprios registos.
- Profissionais e empresas pendentes/suspensos não publicam nem gerem candidaturas/conversas; a publicação exige estado aprovado e conta activa.
- Os perfis públicos de empresa/profissional só incluem entidades aprovadas cujo proprietário tem conta activa e o papel correspondente. Registos de clientes, administradores e contas inactivas não são apresentados como prestadores contactáveis.
- Administradores não podem operar registos empresariais/profissionais legados próprios; continuam a poder moderar registos de terceiros.
- Os menus e botões de painel/publicação exigem o papel correspondente. O cliente não recebe navegação empresarial nem profissional.
- As Server Actions repetem as verificações e a RLS é a barreira final contra chamadas directas à API.

## Persistência do perfil do cliente

- `/conta/perfil` carrega os dados do próprio registo em `profiles` e `conta_detalhes`.
- A gravação actualiza apenas os campos pessoais/localização permitidos e faz upsert dos detalhes complementares.
- O trigger `trg_profiles_updated_at_b2` actualiza `updated_at`; o cliente não envia campos de gestão da conta.
- A coluna `profiles.updated_at` tem apenas privilégio de UPDATE por coluna para `authenticated`; `account_type`, `is_admin` e UPDATE ao nível da tabela continuam sem privilégio.

## Migrações da Fase 6

- `20261118060000_permissoes_papeis_conta`: fundação de papéis e permissões.
- `20261118190000_cliente_legado_contacto`: regras de contacto de clientes activos, sem depender da ausência de registos legados.
- `20261118200000_cliente_legado_preferencias`: preferências de cliente baseadas no papel efectivo.
- `20261118210000_perfis_proprios_via_rpc` e `20261118230000_guardar_rpcs_perfil_por_papel`: leitura dos próprios perfis e restrição por papel/estado.
- `20261118240000_permitir_updated_at_perfil_proprio`: privilégio de UPDATE apenas na coluna `updated_at`.
- `20261119000000_publicar_apenas_perfis_activos_do_papel`: vistas públicas e helpers de contacto limitados a proprietários activos do papel correcto.
- `20261118220000_restringir_select_perfis_negocio` continua versionada mas não aplicada em produção: a restrição dos SELECT directos depende de a versão de código com RPCs próprios estar publicada. Não aplicar antes dessa transição.

## Plano de validação

| Teste | Admin | Cliente | Profissional | Empresa |
|---|---|---|---|---|
| Inserir empresa/profissional/serviço/produto/vaga | Rejeitado | Rejeitado para papel incompatível | Só serviço próprio | Só conteúdo empresarial próprio |
| Inserir candidatura | Rejeitado | Permitido para vaga disponível | Rejeitado | Rejeitado |
| Criar pedido de serviço | Rejeitado | Permitido | Rejeitado | Rejeitado |
| Iniciar conversa como cliente | Rejeitado | Permitido para destino elegível | Rejeitado | Rejeitado |
| Aceder a acções administrativas | Permitido | Rejeitado | Rejeitado | Rejeitado |
| Ver painel empresarial/profissional | Apenas administração | Rejeitado | Apenas profissional | Apenas empresa |

## Estado dos testes

Os testes SQL de RLS executados em transacções revertidas confirmaram que um cliente activo com registo empresarial legado consegue criar conversas com profissionais e empresas TESTE elegíveis; profissional, empresa e administrador não conseguem iniciar conversas como cliente. A persistência de perfil e `conta_detalhes` foi simulada com uma identidade TESTE temporária e lida novamente após simulação de logout/login. Nenhuma linha TESTE permaneceu na base de dados.

Os testes de login real, formulário no browser, logout/login real, interface mobile/desktop e Preview do HEAD actual continuam pendentes. A produção não tem neste momento empresas/profissionais públicos elegíveis para um teste visual real; os fixtures TESTE foram criados apenas dentro de uma transacção e revertidos.

## Reversão

Os scripts correspondentes estão versionados em `supabase/rollback/`:

- `20261118060000_permissoes_papeis_conta_reversao.sql`
- `20261118190000_cliente_legado_contacto_reversao.sql`
- `20261118200000_cliente_legado_preferencias_reversao.sql`
- `20261118210000_perfis_proprios_via_rpc_reversao.sql`
- `20261118230000_guardar_rpcs_perfil_por_papel_reversao.sql`
- `20261118240000_permitir_updated_at_perfil_proprio_reversao.sql`
- `20261119000000_publicar_apenas_perfis_activos_do_papel_reversao.sql`

As migrações de correcção não alteram linhas existentes. A reversão de vistas públicas restaura as vistas anteriores e, por isso, também restaura a exposição de registos legados que a correcção passou a excluir.
