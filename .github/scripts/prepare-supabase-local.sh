#!/usr/bin/env bash
set -euo pipefail

ROOT="${GITHUB_WORKSPACE:-$(pwd)}"
WORKDIR="${RUNNER_TEMP:-/tmp}/negomapa-supabase-local"
MIGRATIONS="$WORKDIR/supabase/migrations"

mkdir -p "$WORKDIR"
cp -a "$ROOT/supabase" "$WORKDIR/"

# The checked-in historical filenames contain 8-digit versions and duplicates
# (for example three 20261003 files). Supabase CLI requires unique versions.
# Renumber ONLY this disposable copy, preserving the original lexical order.
mapfile -t files < <(find "$MIGRATIONS" -maxdepth 1 -type f -name '*.sql' -print | sort)
base_version=20000101000000
index=0

for file in "${files[@]}"; do
  original_name="${file##*/}"
  migration_name="${original_name#*_}"
  version="$(printf '%014d' "$((base_version + index))")"
  mv "$file" "$MIGRATIONS/${version}_${migration_name}"
  index=$((index + 1))
done

printf 'Prepared %s migration(s) in disposable workdir %s\n' "${#files[@]}" "$WORKDIR"
