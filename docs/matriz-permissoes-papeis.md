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
- Pedidos de serviço e início de conversas como cliente exigem cliente activo sem perfil empresarial/profissional associado.
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

Remover as funções block_admin_email_reuse e block_admin_account_type, os respectivos triggers e as seis políticas adicionadas. A migração não elimina linhas existentes. Ainda não foi aplicada à base de dados de produção.
