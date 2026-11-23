#!/usr/bin/env bash
# Prepara uma cópia DESCARTÁVEL de supabase/ para o stack local.
#
# - Não acede a produção, não usa credenciais e não faz `supabase link`.
# - Não renumera migrações: as versões do repositório são usadas tal como estão.
# - O baseline schema-only (supabase/baseline/schema-only-*.sql) passa a ser a
#   primeira migração da cópia. As migrações já reflectidas nele, ou que não
#   devem ser aplicadas, são removidas da cópia segundo
#   supabase/baseline/applied-migrations.txt.
# - Falha explicitamente se o baseline não existir, se o registo for inválido,
#   se restar algum estado `divergente`, ou se houver SQL duplicado a aplicar.
# - Só escreve em $RUNNER_TEMP; o repositório não é alterado.
set -euo pipefail

fail() {
  echo "::error::$*" >&2
  echo "$*" >&2
  exit 1
}

ROOT="${GITHUB_WORKSPACE:-$(pwd)}"
WORKDIR="${RUNNER_TEMP:-/tmp}/negomapa-supabase-local"
BASELINE_DIR="$ROOT/supabase/baseline"
REGISTRY="$BASELINE_DIR/applied-migrations.txt"
REPO_MIG="$ROOT/supabase/migrations"
# Menor que qualquer versão existente, em ordem lexical e numérica.
BASELINE_VERSION="00000000000001"

# 1. O baseline tem de existir, ser único e não estar vazio.
shopt -s nullglob
baselines=("$BASELINE_DIR"/schema-only-*.sql)
shopt -u nullglob
if (( ${#baselines[@]} != 1 )); then
  fail "Baseline ausente ou ambíguo em supabase/baseline/: esperado 1 ficheiro schema-only-*.sql, encontrados ${#baselines[@]}. Ver supabase/baseline/README.md."
fi
baseline="${baselines[0]}"
[[ -s "$baseline" ]] || fail "O baseline $baseline está vazio."
[[ -f "$REGISTRY" ]] || fail "supabase/baseline/applied-migrations.txt não existe."

# 2. Guardas estáticas: nenhum dado nem segredo no baseline.
if grep -nE '^(COPY |INSERT INTO |\\\.$)' "$baseline"; then
  fail "O baseline contém instruções de dados (COPY/INSERT ou linhas de dados). Rejeitado."
fi
if grep -nE 'eyJ[A-Za-z0-9_-]{10,}|sb_secret_|sb_publishable_|postgres(ql)?://|password' "$baseline"; then
  fail "O baseline contém padrões de segredo ou credencial. Rejeitado; rever antes de qualquer uso."
fi

# 3. Validar o registo: formato, estados e ausência de divergentes.
awk -F'|' '
  /^#/ || NF == 0 { next }
  NF != 6 { printf "linha %d mal formada (esperadas 6 colunas)\n", NR; bad = 1; next }
  $4 !~ /^(equivalente|sem ficheiro|superada|arquivada|divergente|pendente|pre-registo)$/ {
    printf "linha %d com estado inválido: %s\n", NR, $4; bad = 1
  }
  END { exit bad }
' "$REGISTRY" || fail "applied-migrations.txt inválido."

if awk -F'|' '!/^#/ && NF > 0 && $4 == "divergente"' "$REGISTRY" | grep -q .; then
  fail "Ainda existem linhas 'divergente' em applied-migrations.txt. Decidir e atualizar o registo antes de correr o runner."
fi

# Mapa ficheiro -> estado. Estados que exigem ficheiro na main: equivalente,
# pre-registo, pendente. Arquivada e superada não precisam de estar em migrations.
declare -A estado_de=()
while IFS='|' read -r versao _nome _sha estado ficheiro _nota; do
  [[ -z "$versao" || "$versao" == \#* ]] && continue
  [[ "$ficheiro" == "-" ]] && continue
  if [[ -n "${estado_de[$ficheiro]:-}" && "${estado_de[$ficheiro]}" != "$estado" ]]; then
    fail "O ficheiro $ficheiro tem estados contraditórios no registo."
  fi
  estado_de["$ficheiro"]="$estado"
  case "$estado" in
    equivalente|pre-registo|pendente)
      [[ -f "$REPO_MIG/$ficheiro" ]] || fail "Registo '$estado' sem ficheiro em supabase/migrations/: $ficheiro"
      ;;
  esac
done < "$REGISTRY"

# 4. Preparar a cópia descartável.
rm -rf "$WORKDIR"
mkdir -p "$WORKDIR"
cp -a "$ROOT/supabase" "$WORKDIR/"
MIG="$WORKDIR/supabase/migrations"

excluidas=0
excluidas_hashes=()
pendentes=()
pendentes_hashes=()
shopt -s nullglob
for file in "$REPO_MIG"/*.sql; do
  name="${file##*/}"
  estado="${estado_de[$name]:-}"
  if [[ -z "$estado" ]]; then
    fail "Ficheiro sem linha em applied-migrations.txt (decisão em falta): $name"
  fi
  case "$estado" in
    equivalente|pre-registo|arquivada|superada)
      excluidas_hashes+=("$(sha256sum "$file" | cut -d' ' -f1)")
      rm -f "$MIG/$name"
      excluidas=$((excluidas + 1))
      ;;
    pendente)
      pendentes+=("$name")
      pendentes_hashes+=("$(sha256sum "$file" | cut -d' ' -f1)")
      ;;
    divergente)
      fail "Migração divergente sem decisão (não pode correr): $name"
      ;;
    *)
      fail "Estado inesperado para $name: $estado"
      ;;
  esac
done
shopt -u nullglob

# 5. Validar as pendentes: versões únicas, posteriores ao baseline e sem SQL duplicado.
for name in "${pendentes[@]}"; do
  version="${name%%_*}"
  if [[ ! "$version" > "$BASELINE_VERSION" ]]; then
    fail "Migração pendente com versão anterior ou igual ao baseline: $name"
  fi
done
duplicadas="$(printf '%s\n' "${pendentes[@]}" | sed 's/_.*//' | sort | uniq -d)"
[[ -z "$duplicadas" ]] || fail "Versões duplicadas entre migrações pendentes: $duplicadas"

dup_pend="$(printf '%s\n' "${pendentes_hashes[@]}" | sort | uniq -d)"
[[ -z "$dup_pend" ]] || fail "Duas migrações pendentes têm o mesmo SQL; não aplicar duas vezes."

for h in "${pendentes_hashes[@]}"; do
  for e in "${excluidas_hashes[@]}"; do
    [[ "$h" != "$e" ]] || fail "Uma migração pendente tem o mesmo SQL de uma migração já reflectida no baseline; não aplicar duas vezes."
  done
done

# 6. Instalar o baseline como primeira migração da cópia.
cp "$baseline" "$MIG/${BASELINE_VERSION}_baseline_schema_only.sql"

printf 'Baseline: %s\n' "${baseline##*/}"
printf 'Migrações excluídas (equivalente, pre-registo, arquivada, superada): %s\n' "$excluidas"
printf 'Migrações pendentes mantidas, por ordem: %s\n' "${#pendentes[@]}"
for name in "${pendentes[@]}"; do printf '  - %s\n' "$name"; done
printf 'Cópia descartável preparada em %s\n' "$WORKDIR"
