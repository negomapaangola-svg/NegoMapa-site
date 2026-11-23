# Gate — Integração Supabase/GitHub

## Risco

Os ficheiros de migração promovidos pelo PR #44 têm prefixos que não coincidem com as versões registadas no Supabase:

- `20261029_restringir_colunas_publicas_profissionais.sql` vs `20261030045209`
- `20261109120000_produtos_modelo.sql` vs `20261109205227`
- `20261109120100_produtos_storage.sql` vs `20261109205233`

Se uma integração GitHub do Supabase estiver activa com aplicação de migrações no merge, ou se alguém executar `supabase db push`, estes ficheiros podem ser tratados como pendentes e reaplicados em produção.

## Bloqueio

Os merges #43, #44 e #45 estão bloqueados até o responsável confirmar, no dashboard, que não existe integração activa capaz de aplicar migrações automaticamente.

## Confirmações obrigatórias

1. **Supabase > Project Settings > Integrations > GitHub**
   - Confirmar se está ligado.
   - Se ligado, registar repositório, branch de produção e opção de aplicação de migrações no merge.

2. **Supabase > Branching**
   - Confirmar se está activo.
   - Confirmar se a branch `main` está ligada ao GitHub.
   - Confirmar se “aplicar migrações ao fazer merge” está desligado.

3. **GitHub > Settings > GitHub Apps**
   - Confirmar se a app Supabase está instalada.
   - Registrar scope e permissões.

4. **Vercel > `nego-mapa-site` e `nego-mapa`**
   - Confirmar que o build command não executa Supabase CLI ou SQL.
   - Confirmar que não há deploy hooks que executem SQL.

## Critério de desbloqueio

O gate passa apenas se:

- A integração Supabase/GitHub estiver desligada; ou
- Estiver ligada, mas com aplicação de migrações no merge desligada; e
- A Vercel não executar comandos Supabase/SQL.

## Critério de aborto

O gate falha se:

- A integração estiver activa com aplicação no merge.
- A Vercel executar Supabase CLI/SQL.
- Houver qualquer evidência de aplicação automática de migrações.
- O registo remoto mudar sem autorização.

## Responsável

A confirmação deve ser feita pelo responsável do projecto no dashboard. Nenhum merge avança sem essa confirmação registada.