# Fase 8 — Estado do baseline e desbloqueio do #38

Documento curto de estado. Não autoriza nenhuma acção por si só.

## 1. Estado actual do #38

- PR #38 (`feat/eliminacao-conta`): Draft, `mergeable = false`, estado `dirty`.
- Base registada: `5fa72f2`. A `main` está em `f88fb6b`.
- Alteração real face à base: infraestrutura de validação (runner, `config.toml`, teste de invariantes, documento de auditoria). **Não contém código de eliminação de conta.**
- Runner falhado (run 44386957849): `ERROR: relation "public.companies" does not exist`, na migração `20261011_create_vagas_module.sql`. O runner aplica as migrações a uma base vazia, e a primeira referência a `companies` está antes da sua criação.
- Causa: não existe baseline. Os objectos anteriores ao registo de migrações não estão reproduzidos.

## 2. Lacunas do baseline

- Não existe `supabase/baseline/schema-only-*.sql`.
- Existem 11 ficheiros `pre-registo` na `main` (de 20261003 a 20261028) sem linha em `schema_migrations`. O seu efeito está em produção, mas tem de ser confirmado no baseline.
- Existem 8 migrações `sem ficheiro` aplicadas em produção (incluindo `criar_preferencias_notificacao` e as duas de segurança de `b2_02`). Duas delas são equivalentes a ficheiros que só existem em branches.
- Existem 2 migrações `divergentes`: o estado aplicado difere dos ficheiros da `main`.
- Existem 4 migrações `pendentes` por aplicar.
- O registo tem duas entradas duplicadas e uma com placeholder.

## 3. Decisões pendentes

Nenhuma destas decisões foi tomada. Cada uma bloqueia a geração ou a aprovação do baseline.

| # | Decisão | Origem | Recomendação |
|---|---|---|---|
| D1 | `servicos_empresas_profissionais_v2` (aplicada) vs `20261116230000_servicos_empresas_profissionais.sql` (main) | Divergência | Rever o estado final de políticas e triggers; promover ou substituir por ficheiro que reflicta o aplicado. |
| D2 | `secure_image_storage_and_safe_cleanup` (aplicada) vs `20261118090000_upload_imagens.sql` (main) | Divergência | Mesma abordagem. Os corpos de função diferem (7900 vs 8371 caracteres normalizados). |
| D3 | `20261101_seguranca_bi_admin.sql` (pendente, não registado) | Sobreposição | Cria `documentos_privados_select_admin`, que já existe em produção. Excluir ou reconciliar antes de aplicar. |
| D4 | `produtos_storage_select_publico` concede `SELECT` a `anon` no bucket `produtos` | Intenção | Confirmar se é intencional. A configuração do bucket (`public = false`) não é afectada. |
| D5 | Promoção de ficheiros de branches: `feat/produtos-modelo` (2 ficheiros) e `draft/profissionais-telefone-rpc` (1) | Sem ficheiro na main | Decidir em PR própria. Esta PR **não** os promove. |
| D6 | Registo duplicado: `20261113214036` e `20261114130322` (mesmo SQL) | Registo | Documentar como duplicado; não remover nada em produção. |
| D7 | Registo com placeholder: `20261115071246` | Registo | Equivalência pelo blob `d42557a0`. Confirmar com quem registou. |
| D8 | Confirmar as 11 migrações `pre-registo` no baseline | Baseline | Obrigatório antes de aprovar. |
| D9 | `20261103100000_bloquear_inicio_profissionais`, `20261114110000_admin_activity_private_series`, `20261118200000_fase9_anexos_conversas`, `20261118220000_restringir_select_perfis_negocio` | Pendentes | Decidir se são aplicadas. A última não deve ser aplicada sem autorização. |
| D10 | `is_account_active`: `SECURITY DEFINER`, executável por `anon`, risco de enumeração | Segurança | Reprojectar, não revogar: é exigida pelas políticas RLS. Fora do baseline. |
| D11 | Triggers de evento (como `rls_auto_enable`) | Verificação | Inspeccionar antes de aprovar. Ainda não foi feito. |
| D12 | `20261031111951_b622_p0_2_privacidade_aditiva` (sem ficheiro) vs D3 | Sobreposição | Resolver em conjunto com D3. |

## 4. Sequência segura para desbloquear o #38

Cada passo depende do anterior. Nenhum passo é executado sem autorização explícita.

1. **Decidir D1–D12** (ou marcar explicitamente as que ficam para depois).
2. **Rever e fazer merge desta PR** (`chore/baseline-estrutura-runner`), depois de aprovada. Os runners do #38 e desta PR tocam nos mesmos ficheiros; ver passo 4.
3. **Gerar o baseline** com papel de leitura, seguindo `supabase/baseline/VALIDACAO.md`. Revisão por duas pessoas. Entrada no repositório numa PR separada, só com `schema-only-<data>.sql`.
4. **Actualizar o #38 com a `main` por merge, nunca por rebase.** Conflitos previsíveis em `supabase-local.yml`, `prepare-supabase-local.sh` e documentação: a versão da `main` (corrigida) prevalece. Sem force push.
5. **Executar o runner manualmente no #38** (`workflow_dispatch`). Tem de passar: baseline, pendentes e `fase8_local_invariants.sql`.
6. **Só depois de o runner passar**, implementar a eliminação de conta. Reutilizar as funções que já existem em produção (`admin_deactivate_account`, `admin_update_account_deletion_auth_status`, `admin_list_account_deletion_candidates`). Qualquer alteração à base só com autorização explícita.
7. **Validar via CI** (lint dinâmico, build, TypeScript, runner). Nenhum teste autenticado em Preview ligado ao Supabase principal.
8. **Revisão final e decisão de merge pelo responsável.** O #38 continua em Draft até lá.

As migrações de eliminação de conta (`20261114190000` e `20261115080000`) já estão aplicadas em produção. O #38 não deve voltar a aplicá-las.

## 5. Limites desta PR

- Não gera nem adiciona o baseline.
- Não aplica migrações nem altera o Supabase remoto.
- Não promove ficheiros de outras branches.
- O workflow do runner só corre manualmente. Não há validação automática do runner nesta PR.
