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
| `VALIDACAO.md` | Checklist de ausência de dados e segredos, RLS, buckets, objectos fora de `public`, coerência com o registo e critério de aprovação. |
| `applied-migrations.txt` | Registo de equivalência entre migrações aplicadas, ficheiros da `main` e o baseline. |
| `.gitignore` | Impede versionar dumps brutos e ficheiros de ambiente. |
| `schema-only-<data>.sql` | **Ainda não existe.** Será o baseline aprovado. |

Ficheiros arquivados (não aplicar): [`docs/arquivadas/`](../../docs/arquivadas/).

## Registo `applied-migrations.txt`

Formato: `versao|nome_normalizado|sha256_normalizado|estado|ficheiro|nota`.

Normalização do SQL antes do SHA-256: remover comentários `/* ... */` e `-- ...`, colapsar espaços em branco, fazer trim (UTF-8). Os hashes foram calculados a partir do registo `supabase_migrations.schema_migrations` (leitura) e dos ficheiros, com esta mesma regra.

### Estados

| Estado | Significado | Tratamento no runner |
|---|---|---|
| `equivalente` | O SQL aplicado é igual (ou igual em tokens) ao ficheiro. Pode não haver ficheiro na `main` se o idêntico estiver só num branch (`ficheiro` = `-`, com a nota). | Excluído da cópia, se o ficheiro existir em `migrations/`. Coberto pelo baseline. |
| `pre-registo` | Ficheiro anterior ao registo de migrações, sem linha em `schema_migrations`. Efeito presente em produção. | Excluído da cópia. A revisão do baseline tem de confirmar cada objeto. |
| `sem ficheiro` | Aplicada em produção, sem ficheiro no repositório. | Não tem ficheiro. Tem de estar no baseline. |
| `superada` | Aplicada, substituída por migrações posteriores aplicadas. | Excluída se o ficheiro existir. Coberta pelo baseline. |
| `arquivada` | Ficheiro candidato **não aplicado**, decidido como não aplicar. Movido para `docs/arquivadas/`. | Excluída se o ficheiro existir em `migrations/`. Nunca aplicada. |
| `pendente` | Ficheiro na `main` ainda não aplicado em produção, a decidir ou a aplicar. | Mantido na cópia, por ordem de versão. |
| `divergente` | Estado não decidido. | **Falha o runner.** Não deve existir no registo quando o baseline for gerado. Estado atual: **zero**. |

Os estados `pre-registo`, `pendente` e `arquivada` não estavam no conjunto inicial. Foram acrescentados porque o registo tem de explicitar ficheiros sem linha em `schema_migrations`, pendentes e arquivados.

### Duplicações e placeholders

- `20261113214036` e `20261114130322` têm o mesmo SQL (`fe12ebca…`) e estão registados duas vezes (D6). Os dois apontam para o mesmo ficheiro, que é excluído uma só vez. Nada é removido do histórico Supabase.
- `20261115071246` tem um texto placeholder em vez de SQL (D7). A equivalência é pelo blob `d42557a0`, que é o ficheiro `20261114190000_eliminacao_segura_contas_admin.sql`.

## Como o runner usa este registo

`.github/scripts/prepare-supabase-local.sh`:

1. Falha se não existir exactamente um `schema-only-*.sql` em `supabase/baseline/`.
2. Falha se o baseline contiver instruções de dados (`COPY`, `INSERT INTO`, linhas de dados) ou padrões de segredo.
3. Valida o formato do registo e os estados.
4. Falha se restar qualquer linha `divergente`.
5. Falha se um registo `equivalente`, `pre-registo` ou `pendente` apontar para um ficheiro que não existe em `supabase/migrations/`.
6. Falha se um ficheiro de `supabase/migrations/` não tiver linha no registo.
7. Exclui da cópia descartável os ficheiros `equivalente`, `pre-registo`, `arquivada` e `superada`.
8. Mantém os `pendente`, por ordem de versão, sem renumerar. Falha se houver versões duplicadas, ou versões anteriores ao baseline.
9. Falha se duas pendentes tiverem o mesmo SQL, ou se uma pendente tiver o mesmo SQL de um ficheiro já excluído. Assim, o mesmo SQL nunca é aplicado duas vezes.
10. Instala o baseline na cópia com a versão `00000000000001`, que fica antes de qualquer migração existente.

O repositório nunca é alterado pelo script. Tudo acontece em `$RUNNER_TEMP`.

## Estado actual

- Não há baseline. O workflow `supabase-local.yml` está em `workflow_dispatch` e **não corre automaticamente**.
- Estados: zero `divergente`. Pendentes: 4, todos com decisão D9 em aberto.
- Decisões e lacunas: [docs/FASE-8-BASELINE-ESTADO.md](../../docs/FASE-8-BASELINE-ESTADO.md).

## Modo só baseline e guardião de migrações

- Por defeito o runner só usa o baseline. As migrações pendentes (D9) não entram na cópia descartável.
- As pendentes só entram por lista explícita, passada apenas em testes locais:
  `RUNNER_TEMP=/tmp/teste GITHUB_WORKSPACE="$PWD" RUNNER_PENDENTES_PERMITIDAS=<ficheiro1>,<ficheiro2> bash .github/scripts/prepare-supabase-local.sh`
- A lista explícita não pode ser definida em workflows. O guardião falha se aparecer.
- Cada pendente da lista tem de ser `pendente` no registo e existir em `supabase/migrations/`.
  Uma migração já aplicada ou equivalente nunca entra por esta via.
- O guardião (`.github/scripts/guardiao_migracoes.py`, job `guardiao-migracoes.yml`) é offline: sem credenciais, sem Supabase, sem SQL.
- `supabase/baseline/excecoes-prefixo.txt` lista as migrações cujo prefixo difere da versão registada.
  Não corrigir estes nomes sem autorização explícita: renomear faria o CLI tratá-las como novas.
- Nunca correr `supabase db push`, `supabase migration up`, `supabase migration repair`, `supabase db reset`, `supabase link` ou usar `--db-url` com produção.
