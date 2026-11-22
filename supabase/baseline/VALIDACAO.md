# Validação do baseline schema-only

Checklist para gerar, rever e aprovar `schema-only-<data>.sql`. Nada disto é executado por esta PR; é o critério que o baseline tem de cumprir antes de entrar no repositório.

## 0. Preparação (pessoa que gera)

- [ ] Papel de leitura dedicado, sem `SUPERUSER`, sem `BYPASSRLS`, sem `service_role`.
- [ ] Sem `SELECT` em tabelas de dados. Um `pg_dump --schema-only` não precisa de ler linhas.
- [ ] Validade curta do papel e limite de ligações; revogado logo após a extracção.
- [ ] URL e palavra-passe fora do repositório, de ficheiros partilhados e do histórico de comandos.
- [ ] Comando `pg_dump --schema-only --no-owner` com `--schema=public --schema=negomapa_private --schema=private`. Sem `--data-only`, `--inserts` ou `--column-inserts`.
- [ ] Filtros: excluir `auth`, `storage`, `realtime`, `vault`, `cron`, `extensions` e schemas da plataforma. Extrair `storage.objects` e os triggers de `auth.users` por consulta ao catálogo.
- [ ] Remover `OWNER`, `\restrict`, linhas de ligação e comentários de ambiente.

## 1. Ausência de dados

- [ ] Nenhum `COPY`, `INSERT INTO`, `UPDATE` de dados ou `setval`.
- [ ] Nenhuma linha de dados (linha `\.` ausente).
- [ ] Só são permitidos `CREATE`, `ALTER`, `GRANT`, `REVOKE`, `COMMENT`, `SET`, `CREATE POLICY`, `CREATE EXTENSION`.
- [ ] Verificação dinâmica no stack local: contagem de linhas igual a zero em todas as tabelas de `public`, em `auth.users` e em `storage.objects`.

## 2. Ausência de segredos

- [ ] Scanner de segredos (gitleaks ou trufflehog) sem achados sobre o ficheiro.
- [ ] Sem JWT (`eyJ…`), chaves `sb_secret_` / `sb_publishable_`, `encrypted_password`, `postgres://`.
- [ ] Sem endereços IP, hosts de produção ou emails em corpos de funções e comentários.
- [ ] Sem nomes de projecto remoto nem referências a `service_role`.

## 3. RLS

- [ ] RLS activa em todas as tabelas de `public` (o runner verifica isto).
- [ ] RLS activa em `storage.objects`.
- [ ] Número de políticas em `public` coincide com produção (164 no último levantamento). Diferenças só são aceites se explicadas por migrações pendentes.
- [ ] Nenhuma política `anon` ou `PUBLIC` de escrita em buckets de imagens.
- [ ] Políticas de `storage.objects` extraídas só do estado de produção; sem políticas de `auth`.

## 4. Buckets

- [ ] Os 12 buckets do `config.toml` estão privados: `clientes-avatars`, `company-files`, `documentos-privados`, `empresas`, `empresas-logos`, `empresas-portfolio`, `produtos`, `profissionais`, `profissionais-avatars`, `profissionais-portfolio`, `servicos`, `vagas`.
- [ ] `produtos` continua privado na configuração (`public = false`).
- [ ] Nota: a política `produtos_storage_select_publico` concede `SELECT` a `anon` no bucket `produtos`. Isto é uma política, não a flag `public` do bucket. Tem de ser decidida antes de aprovar (ver docs/FASE-8-BASELINE-ESTADO.md).
- [ ] O baseline não cria conteúdo de Storage nem objectos.

## 5. Objectos fora de `public`

- [ ] `auth.users`: só o trigger `trg_auth_users_create_profile_b2` e o trigger `block_admin_email_reuse`. Sem alterações à tabela `auth.users` em si.
- [ ] `negomapa_private`: vistas `v_*` com os grants de `anon` e `authenticated` do estado de produção; funções `block_admin_account_type`, `block_admin_email_reuse`, `guard_account_managed_fields`, `is_account_active`.
- [ ] `private`: `imagem_publica_aprovada`, `pode_apagar_imagem`.
- [ ] Extensões: `pgcrypto`, `uuid-ossp`. Não incluir `supabase_vault` nem `pg_stat_statements`.
- [ ] Triggers de evento (como `rls_auto_enable`) inspeccionados e classificados como plataforma ou incluídos. Ainda por fazer.
- [ ] `is_account_active` (SECURITY DEFINER, executável por `anon`) reproduzido tal como está em produção. Não corrigido implicitamente.

## 6. Coerência com o registo

- [ ] Todas as linhas `equivalente` e `pre-registo` estão cobertas pelo baseline.
- [ ] Todas as linhas `sem ficheiro` e `superada` estão cobertas pelo baseline.
- [ ] Nenhuma linha `divergente` ou `pendente` está coberta sem decisão explícita.
- [ ] A ordem das migrações pendentes, depois do baseline, não quebra dependências.

## 7. Reprodutibilidade

- [ ] Dois dumps consecutivos, com o mesmo estado de produção, produzem o mesmo SHA-256.
- [ ] SHA-256 do ficheiro revisto é registado no PR, para que a versão aprovada seja a versão aplicada.

## 8. Critério de aprovação por duas pessoas

O baseline só entra no repositório com aprovação de **duas pessoas diferentes**:

- [ ] **Revisão DBA:** compara objecto a objecto com o catálogo de produção (tabelas, colunas, políticas, grants, funções, vistas, triggers, extensões).
- [ ] **Revisão de segurança:** confirma ausência de dados e segredos, grants mínimos, RLS e buckets privados.
- [ ] As duas revisões ficam registadas no PR, com nome, data e hash SHA-256 do ficheiro revisto.
- [ ] Quem gerou o dump não é uma das duas pessoas que aprovam.
- [ ] Qualquer alteração ao ficheiro depois da aprovação invalida a aprovação e obriga a nova revisão.

## 9. Critério técnico para desbloquear o #38

- [ ] O runner (`supabase-local.yml`, manual) passa com o baseline.
- [ ] `fase8_local_invariants.sql` passa.
- [ ] As migrações pendentes aplicam sem erro sobre o baseline.
- [ ] O catálogo local coincide com produção, excepto as pendentes esperadas.
- [ ] Todas as decisões de `docs/FASE-8-BASELINE-ESTADO.md` estão fechadas.
