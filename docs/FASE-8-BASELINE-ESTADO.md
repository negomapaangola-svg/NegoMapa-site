# Fase 8 — Estado do baseline, decisões e desbloqueio do #38

Documento de estado. Regista decisões aprovadas. Não autoriza, por si só, nenhuma geração de baseline, migração ou alteração ao Supabase remoto.

## 1. Estado actual

- **PR #43** (`chore/baseline-estrutura-runner`): Draft. Estrutura do baseline, registo, runner corrigido e este documento.
- **PR #38** (`feat/eliminacao-conta`): Draft, `dirty`, base `5fa72f2`. Não contém código de eliminação de conta. Contém infraestrutura de validação, que a #43 substitui pela versão corrigida.
- **Runner falhado** (run 44386957849): `relation "public.companies" does not exist`, em `20261011_create_vagas_module.sql`. Causa: o runner aplicava as migrações a uma base vazia, sem baseline. Esta causa é tratada pelo baseline, não pelo renumbering.
- **Baseline:** não existe `schema-only-*.sql`. Não foi gerado.
- **Registo:** 85 linhas, zero `divergente`. Ver `supabase/baseline/applied-migrations.txt`.

## 2. Decisões

Decisões aprovadas. Aplicam-se ao registo e ao runner desta PR.

| # | Decisão | Estado |
|---|---|---|
| **D1** | `servicos_empresas_profissionais_v2` (aplicada): o ficheiro `20261116230000` é uma variante não aplicada, superada pela cadeia `20261118045818` e `20261118133532`. O ficheiro tem delimitadores `$` inválidos e não deve correr sobre o baseline. | **Excluir e arquivar.** `20261116214034` → `superada`. `20261116230000` → `arquivada` em `docs/arquivadas/`. |
| **D2** | `secure_image_storage_and_safe_cleanup` (aplicada): o ficheiro `20261118090000` é uma variante não aplicada, superada por `20261117231337` e `20261118044133`. Contém delimitador `$` inválido e DML de dados de utilizadores. | **Excluir e arquivar.** `20261117231210` → `superada`. `20261118090000` → `arquivada` em `docs/arquivadas/`. |
| **D3** | `20261101_seguranca_bi_admin.sql`: proposta marcada "NÃO APLICAR". Os objetos já existem em produção, via `b622_p0_2`. | **Arquivar.** → `arquivada` em `docs/arquivadas/`. |
| **D4** | `produtos_storage_select_publico`: leitura para `anon` e `authenticated`, no bucket `produtos`, apenas quando o objeto é imagem de produto aprovado de empresa aprovada. | **Manter, como exceção documentada.** Sem migração. Ver §3. |
| **D5** | Promoção dos ficheiros de `feat/produtos-modelo` e `draft/profissionais-telefone-rpc`, idênticos ao SQL aplicado. | **Equivalente no registo.** Promoção à `main` em PR própria, a seguir. |
| **D6** | `20261113214036` e `20261114130322` com o mesmo SQL. | **Manter e documentar.** O runner exclui o ficheiro uma só vez. |
| **D7** | `20261115071246` com placeholder. Equivalência pelo blob `d42557a0`. | **Manter e documentar.** |
| **D8** | 11 ficheiros `pre-registo` (20261003 a 20261028). | **Excluir do runner.** A revisão do baseline confirma cada objeto. |
| **D9a** | `20261103100000_bloquear_inicio_profissionais`: não aplicada. | **Pendente.** Decisão de produto antes de aplicar. |
| **D9b** | `20261114110000_admin_activity_private_series`: não aplicada. | **Pendente.** Rever o corpo da função antes de aplicar. |
| **D9c** | `20261118200000_fase9_anexos_conversas`: não aplicada. | **Pendente.** Só com a Fase 9 agendada. |
| **D9d** | `20261118220000_restringir_select_perfis_negocio`: não aplicada. | **Pendente. Não aplicar sem autorização.** Ver §3. |
| **D10** | `is_account_active`: SECURITY DEFINER, executável por `anon`, possível oráculo de UUID. | **Correção futura.** Não é alterada no baseline. Ver §3. |
| **D11** | Event triggers da plataforma (`pgrst_*`, `issue_*`, `rls_auto_enable`, `issue_graphql_placeholder`). | **Excluir do baseline.** São da plataforma e existem no stack local. |
| **D12** | `b622_p0_2` (sem ficheiro) cria a mesma política de D3. | **Incluir no baseline** como `sem ficheiro`. |

## 3. Excepções e riscos separados

### Excepção D4 (`produtos_storage_select_publico`)

A política dá leitura anónima no bucket `produtos` apenas a imagens de produtos aprovados de empresas aprovadas. O bucket continua `public = false`. Esta política é o único caminho anónimo. Está **mantida por decisão**, e a intenção de catálogo público deve ser confirmada e documentada pelo responsável do produto. Qualquer restrição futura é uma migração própria, com autorização.

### Risco separado: `SELECT` de tabela para `anon` em `servicos`

- Em produção, `anon` tem `SELECT` ao nível da **tabela** em `public.servicos`. Os `REVOKE` por coluna não têm efeito, porque o privilégio de tabela prevalece.
- Consequência: `anon` consegue ler `company_id`, `avaliado_por`, `avaliado_em` e `motivo_rejeicao` nas linhas que a RLS permite (serviços aprovados).
- **Estado actual:** nenhum dado exposto. Há 4 serviços aprovados, nenhum com `avaliado_por` ou `motivo_rejeicao`.
- **Origem:** não identificada nas migrações registadas. Verificar antes de corrigir.
- **Correção:** migração futura, com autorização. Revogar `SELECT` de tabela a `anon` e conceder apenas colunas públicas, no mesmo padrão de `companies`.

Este risco **não** é uma decisão do baseline. Não deve ser incluído na #43 nem resolvido pela #43.

### Correção futura de `is_account_active`

- A função é SECURITY DEFINER e executável por `anon`. As políticas RLS que a usam são avaliadas com o privilégio de quem consulta, por isso não se pode simplesmente revogar `anon`: as políticas de `anon` deixariam de funcionar.
- Correção futura: redesenhar a verificação de conta activa, sem expor uma função de consulta a `anon`. Migração própria, com testes de RLS.
- **Não** é corrigida no baseline nem nesta PR.

### D9d (`restringir_select_perfis_negocio`)

Revogaria `SELECT` de tabela a `authenticated` em `companies` e `profissionais`. Produção ainda o tem. É a correção natural do mesmo padrão do risco de `servicos`, mas pode partir a aplicação. Só se aplica com autorização e testes de regressão da app.

## 4. Sequência segura para desbloquear o #38

Cada passo depende do anterior. Nada é executado sem autorização explícita.

1. **Rever e fazer merge da PR #43**, depois de aprovada.
2. **Decidir D9a–D9d** (aplicar, arquivar ou manter pendente). Sem decisão, as quatro ficam no runner como pendentes.
3. **Gerar o baseline** com papel de leitura, seguindo `supabase/baseline/VALIDACAO.md`. Revisão por duas pessoas. Entrada no repositório numa PR separada, só com `schema-only-<data>.sql`.
4. **Promover os ficheiros de D5** em PR própria, de um branch novo a partir da `main`. Não fazer merge dos branches.
5. **Actualizar o #38 com a `main` por merge, nunca por rebase.** Conflitos previsíveis em `supabase-local.yml`, `prepare-supabase-local.sh` e documentação: a versão da `main` prevalece. Sem force push.
6. **Executar o runner manualmente no #38** (`workflow_dispatch`). Tem de passar: baseline, pendentes e `fase8_local_invariants.sql`.
7. **Só depois de o runner passar**, implementar a eliminação de conta, reutilizando as funções existentes em produção (`admin_deactivate_account`, `admin_update_account_deletion_auth_status`, `admin_list_account_deletion_candidates`). Qualquer alteração à base só com autorização explícita.
8. **Validar via CI** (lint dinâmico, build, TypeScript e runner). Nenhum teste autenticado em Preview ligado ao Supabase principal.
9. **Revisão final e decisão de merge pelo responsável.** O #38 continua em Draft até lá.

Em paralelo, e fora deste desbloqueio: decidir a correção de `servicos` para `anon` e a correção de `is_account_active`, cada uma em migração própria.

As migrações de eliminação de conta (`20261114190000` e `20261115080000`) já estão aplicadas em produção. O #38 não deve voltar a aplicá-las.

## 5. Limites

- Não gera nem adiciona o baseline.
- Não aplica migrações nem altera o Supabase remoto.
- Não promove ficheiros de outras branches.
- O workflow do runner só corre manualmente.
- Não resolve os riscos de §3.
