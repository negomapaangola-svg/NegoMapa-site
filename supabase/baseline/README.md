# Baseline schema-only (stack local descartável)

Esta pasta prepara o baseline do schema de produção usado pelo runner Supabase local.

## Regras

- O baseline é **schema-only**: estrutura, políticas RLS, grants, funções, vistas, triggers e extensões. Não contém dados, utilizadores, sessões, conteúdo de Storage nem credenciais.
- É gerado a partir de produção **por uma pessoa autorizada**, com um papel de leitura dedicado e segundo o processo da [VALIDACAO.md](VALIDACAO.md).
- É usado **apenas no stack local descartável** (runner de CI).
- **Nunca deve ser aplicado em produção.** Nenhum comando desta pasta liga ao projecto remoto.
- **Nunca deve estar dentro de `supabase/migrations/`.** Lá, `supabase db push` poderia tentar aplicá-lo.
- O ficheiro SQL (`schema-only-<data>.sql`) **ainda não existe**. Será adicionado só depois de revisão e aprovação por duas pessoas, conforme a VALIDACAO.md.

## Ficheiros

| Ficheiro | Função |
|---|---|
| `README.md` | Este documento. |
| `VALIDACAO.md` | Checklist de ausência de dados e segredos, RLS, buckets, objectos fora de `public` e critério de aprovação. |
| `applied-migrations.txt` | Registo de equivalência entre as migrações aplicadas em produção, os ficheiros da `main` e o baseline. |
| `.gitignore` | Impede versionar dumps brutos e ficheiros de ambiente. |
| `schema-only-<data>.sql` | **Ainda não existe.** Será o baseline aprovado. |

## Registo `applied-migrations.txt`

Formato: `versao|nome_normalizado|sha256_normalizado|estado|ficheiro_main|nota`.

Normalização do SQL antes do SHA-256: remover comentários `/* ... */` e `-- ...`, colapsar espaços em branco, fazer trim. Os hashes foram calculados a partir do registo `supabase_migrations.schema_migrations` (leitura) e dos ficheiros da `main`, com a mesma regra.

Estados:

| Estado | Significado | Tratamento no runner |
|---|---|---|
| `equivalente` | O SQL aplicado é igual (ou igual em tokens) ao ficheiro da `main`. | Excluído da cópia: já está no baseline. |
| `pre-registo` | Ficheiro anterior ao registo de migrações, sem linha em `schema_migrations`. Efeito presente em produção, a confirmar no baseline. | Excluído da cópia, sujeito à confirmação de revisão. |
| `sem ficheiro` | Aplicada em produção sem ficheiro na `main`. Pode existir numa branch (indicado na nota). | Não tem ficheiro; tem de estar no baseline. |
| `superada` | Aplicada, mas substituída por migrações posteriores. | Não tem ficheiro; tem de estar no baseline. |
| `divergente` | O estado aplicado difere do ficheiro da `main`, ou há sobreposição com produção. | **Falha o runner** até haver decisão. |
| `pendente` | Ficheiro na `main` ainda não aplicado em produção. | Mantido na cópia, por ordem de versão. |

Os estados `pre-registo` e `pendente` não estavam no conjunto inicial. Foram acrescentados porque há ficheiros na `main` sem linha de registo, e a sua classificação tem de ficar explícita.

Duas linhas têm particularidades:
- `20261114130322` e `20261113214036` têm o mesmo SQL. Foram registadas duas vezes. Não se remove nada em produção; a duplicação fica como nota.
- `20261115071246` tem um texto placeholder em vez de SQL. A equivalência é pelo blob `d42557a0`, que é o ficheiro `20261114190000_eliminacao_segura_contas_admin.sql` da `main`.

## Como o runner usa este registo

`.github/scripts/prepare-supabase-local.sh`:

1. Falha se não existir exactamente um `schema-only-*.sql` em `supabase/baseline/`.
2. Falha se o baseline contiver instruções de dados (`COPY`, `INSERT INTO`, linhas de dados) ou padrões de segredo.
3. Valida o formato do registo e os estados.
4. Falha se um ficheiro de `supabase/migrations/` não tiver linha no registo.
5. Falha se houver qualquer linha `divergente`.
6. Exclui da cópia descartável os ficheiros `equivalente` e `pre-registo`.
7. Mantém os `pendente`, por ordem de versão, sem renumerar. Falha se houver versões duplicadas.
8. Instala o baseline na cópia com a versão `00000000000001`, que fica antes de qualquer migração existente.

O repositório nunca é alterado pelo script. Tudo acontece em `$RUNNER_TEMP`.

## Estado actual

- Não há baseline. O workflow `supabase-local.yml` está em `workflow_dispatch` e **não corre automaticamente**.
- Há decisões pendentes (divergências, sobreposições e migrações por decidir). Estão listadas em [docs/FASE-8-BASELINE-ESTADO.md](../../docs/FASE-8-BASELINE-ESTADO.md).
