# Matriz de permissões por papel

Esta matriz define as capacidades de conta autenticada. As políticas RLS e as Server Actions são a fronteira de segurança; ocultar controlos na interface não substitui estas verificações.

| Capacidade | Admin | Cliente | Profissional | Empresa |
|---|---:|---:|---:|---:|
| Aceder à administração/moderação | Sim | Não | Não | Não |
| Criar perfil profissional/empresa a partir de cliente | Não | Sim, apenas uma conversão e sem perfil existente | Não | Não |
| Publicar serviços | Não | Não | Sim, após aprovação | Sim, conforme fluxo empresarial |
| Publicar produtos | Não | Não | Não | Sim, conforme aprovação |
| Publicar vagas | Não | Não | Não | Sim, após aprovação |
| Candidatar-se a vagas | Não | Sim | Não | Não |
| Criar pedidos de serviço | Não | Sim | Não | Não |
| Iniciar conversas como cliente | Não | Sim | Não | Não |
| Gerir candidaturas recebidas | Não | Não | Não | Sim, apenas nas suas vagas |
| Editar dados pessoais da própria conta | Apenas dados administrativos permitidos | Sim | Sim | Sim |

## Regras incluídas na migração

- O email de uma conta em admin_users fica reservado e não pode ser usado para criar outra identidade Auth.
- Um utilizador em admin_users não pode receber account_type de cliente, profissional ou empresa.
- Políticas RLS restritivas impedem INSERT administrativo em empresas, profissionais, serviços, produtos e vagas.
- A candidatura exige papel cliente activo e rejeita explicitamente administradores, profissionais e empresas.
- Pedidos de serviço e início de conversas como cliente exigem `profiles.account_type = 'cliente'` e conta activa. Registos empresariais/profissionais legados pendentes ou suspensos não mudam o papel; uma identidade empresarial/profissional efectivamente aprovada continua separada.
- Profissionais e empresas pendentes/suspensos não publicam nem gerem candidaturas/conversas; a publicação exige estado aprovado e conta activa.
- Administradores não podem operar registos empresariais/profissionais legados próprios; continuam a poder moderar registos de terceiros.
- O menu autenticado oculta perfil, candidaturas, pedidos e conversas para admin; as rotas e Server Actions repetem as verificações.

## Plano de validação

| Teste | Admin | Cliente | Profissional | Empresa |
|---|---|---|---|---|
| Inserir empresa/profissional/serviço/produto/vaga | Rejeitado | Rejeitado para papel incompatível | Só serviço próprio | Só conteúdo empresarial próprio |
| Inserir candidatura | Rejeitado | Permitido para vaga disponível | Rejeitado | Rejeitado |
| Criar pedido de serviço | Rejeitado | Permitido | Rejeitado | Rejeitado |
| Iniciar conversa como cliente | Rejeitado | Permitido para destino elegível | Rejeitado | Rejeitado |
| Aceder a acções administrativas | Permitido | Rejeitado | Rejeitado | Rejeitado |

## Reversão

Para reverter a fundação da Fase 6, executar `supabase/rollback/20261118060000_permissoes_papeis_conta_reversao.sql` (40 políticas, 2 triggers e 2 funções). Para reverter apenas a correcção de contacto do cliente, executar `supabase/rollback/20261118150000_corrigir_papel_cliente_contacto_persistencia_reversao.sql` (3 políticas de conversas/mensagens). Ambos os scripts não alteram linhas existentes. A migração base `20261118060000_permissoes_papeis_conta` está aplicada em produção; a correcção `20261118150000_corrigir_papel_cliente_contacto_persistencia` está versionada e pendente de testes funcionais antes de qualquer aplicação em produção.
