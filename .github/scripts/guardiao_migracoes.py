#!/usr/bin/env python3
"""Guardião de migrações (offline).

Sem credenciais, sem acesso ao Supabase e sem execução de SQL.
Uso: python3 -I .github/scripts/guardiao_migracoes.py

Falha se:
  1. existir ficheiro em supabase/migrations sem linha no registo;
  2. existir linha com ficheiro preenchido que aponte para ficheiro inexistente;
  3. existir estado divergente;
  4. o prefixo de um ficheiro diferir da versão do registo, excepto na lista
     explícita supabase/baseline/excecoes-prefixo.txt (e a lista não pode ter entradas obsoletas);
  5. existirem comandos proibidos em workflows, scripts ou package.json;
  6. o runner, com baseline falso e lista vazia, não produzir exactamente o baseline;
  7. algum workflow definir RUNNER_PENDENTES_PERMITIDAS, ou o job do guardião usar segredos;
  8. os testes do modo só baseline falharem (sem baseline, lista explícita D9, lista inválida).
"""
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / "supabase" / "baseline"
REG = BASE / "applied-migrations.txt"
EXC = BASE / "excecoes-prefixo.txt"
MIG = ROOT / "supabase" / "migrations"
ARQ = ROOT / "docs" / "arquivadas"
SCRIPTS = ROOT / ".github" / "scripts"
RUNNER = SCRIPTS / "prepare-supabase-local.sh"
WORKFLOWS = ROOT / ".github" / "workflows"
GUARDIAO_YML = WORKFLOWS / "guardiao-migracoes.yml"
PKG = ROOT / "package.json"

ESTADOS = {"equivalente", "sem ficheiro", "superada", "arquivada", "divergente", "pendente", "pre-registo"}
PROIBIDOS = re.compile(r"supabase\s+db\s+push|migration\s+up|migration\s+repair|db\s+reset|supabase\s+link|--db-url")
BASELINE_FINAL = "00000000000001_baseline_schema_only.sql"
D9 = [
    "20261103100000_bloquear_inicio_profissionais.sql",
    "20261114110000_admin_activity_private_series.sql",
]
PROMOVIDAS = [
    "20261029_restringir_colunas_publicas_profissionais.sql",
    "20261109120000_produtos_modelo.sql",
    "20261109120100_produtos_storage.sql",
]

erros = []


def erro(msg):
    erros.append(msg)


def ler_registo():
    rows = []
    for i, linha in enumerate(REG.read_text(encoding="utf-8").splitlines(), 1):
        if not linha.strip() or linha.startswith("#"):
            continue
        p = linha.split("|")
        if len(p) != 6:
            erro(f"registo linha {i}: esperadas 6 colunas, encontradas {len(p)}")
            continue
        versao, _nome, _sha, estado, ficheiro, _nota = p
        if estado not in ESTADOS:
            erro(f"registo linha {i}: estado inválido '{estado}'")
        rows.append({"linha": i, "versao": versao, "estado": estado, "ficheiro": ficheiro})
    return rows


def ler_excecoes():
    exc = {}
    if not EXC.exists():
        erro("excecoes-prefixo.txt em falta")
        return exc
    for i, linha in enumerate(EXC.read_text(encoding="utf-8").splitlines(), 1):
        if not linha.strip() or linha.startswith("#"):
            continue
        p = linha.split("|", 2)
        if len(p) != 3 or not p[2].strip():
            erro(f"excecoes linha {i}: formato ficheiro|versao|motivo obrigatório")
            continue
        exc[(p[0], p[1])] = p[2]
    return exc


def verificar_registo(rows, exc):
    ficheiros_mig = {p.name for p in MIG.glob("*.sql")}
    ficheiros_arq = {p.name for p in ARQ.glob("*.sql")} if ARQ.is_dir() else set()
    registados = {r["ficheiro"] for r in rows if r["ficheiro"] != "-"}

    # 1. Ficheiro sem linha no registo.
    for f in sorted(ficheiros_mig - registados):
        erro(f"1. supabase/migrations/{f} sem linha no registo")

    # 2. Linha com ficheiro inexistente.
    for r in rows:
        f = r["ficheiro"]
        if f == "-":
            continue
        if r["estado"] == "arquivada":
            if f not in ficheiros_arq:
                erro(f"2. linha {r['linha']}: arquivada aponta para {f}, inexistente em docs/arquivadas/")
        elif f not in ficheiros_mig:
            erro(f"2. linha {r['linha']}: ficheiro {f} inexistente em supabase/migrations/")

    # 3. Estado divergente.
    for r in rows:
        if r["estado"] == "divergente":
            erro(f"3. linha {r['linha']}: estado divergente ({r['ficheiro']})")

    # 4. Prefixo do ficheiro vs versão do registo, com lista explícita.
    usados = set()
    for r in rows:
        f = r["ficheiro"]
        if f == "-" or r["estado"] == "arquivada" or f not in ficheiros_mig:
            continue
        prefixo = f.split("_", 1)[0]
        if prefixo == r["versao"]:
            continue
        chave = (f, r["versao"])
        if chave in exc:
            usados.add(chave)
        else:
            erro(f"4. linha {r['linha']}: prefixo {prefixo} de {f} difere da versão {r['versao']} e não está em excecoes-prefixo.txt")
    for chave in exc:
        if chave not in usados:
            erro(f"4. entrada obsoleta em excecoes-prefixo.txt: {chave[0]}|{chave[1]}")


def verificar_comandos():
    alvos = sorted(WORKFLOWS.glob("*.yml")) if WORKFLOWS.is_dir() else []
    alvos += sorted(SCRIPTS.glob("*.sh")) if SCRIPTS.is_dir() else []
    if PKG.exists():
        alvos.append(PKG)
    for p in alvos:
        for i, linha in enumerate(p.read_text(encoding="utf-8").splitlines(), 1):
            s = linha.strip()
            if s.startswith("#"):
                continue
            if PROIBIDOS.search(s):
                erro(f"5. comando proibido em {p.relative_to(ROOT)} linha {i}: {s[:80]}")


def verificar_workflows():
    # 7. Nenhum workflow define a lista explícita; o job do guardião não usa segredos.
    if WORKFLOWS.is_dir():
        for p in WORKFLOWS.glob("*.yml"):
            if "RUNNER_PENDENTES_PERMITIDAS" in p.read_text(encoding="utf-8"):
                erro(f"7. {p.relative_to(ROOT)} define RUNNER_PENDENTES_PERMITIDAS (proibido no CI)")
    if GUARDIAO_YML.exists() and "secrets." in GUARDIAO_YML.read_text(encoding="utf-8"):
        erro("7. o job do guardião não pode usar segredos")


def correr_runner(pendentes=None, com_baseline=True):
    """Corre o runner real numa cópia temporária com baseline falso. Devolve (returncode, saida, nomes)."""
    tmp = Path(tempfile.mkdtemp(prefix="guardiao-"))
    try:
        ws = tmp / "ws"
        rt = tmp / "rt"
        rt.mkdir()
        shutil.copytree(ROOT / "supabase", ws / "supabase")
        for b in (ws / "supabase" / "baseline").glob("schema-only-*.sql"):
            b.unlink()
        if com_baseline:
            (ws / "supabase" / "baseline" / "schema-only-guardiao-falso.sql").write_text(
                "-- baseline falso de teste; não é schema real\nSELECT 1;\n", encoding="utf-8")
        env = {k: v for k, v in os.environ.items() if k != "RUNNER_PENDENTES_PERMITIDAS"}
        env["GITHUB_WORKSPACE"] = str(ws)
        env["RUNNER_TEMP"] = str(rt)
        if pendentes is not None:
            env["RUNNER_PENDENTES_PERMITIDAS"] = ",".join(pendentes)
        r = subprocess.run(["bash", str(RUNNER)], env=env, capture_output=True, text=True)
        copia = rt / "negomapa-supabase-local" / "supabase" / "migrations"
        nomes = sorted(p.name for p in copia.glob("*.sql")) if copia.is_dir() else []
        return r.returncode, r.stdout + r.stderr, nomes
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def verificar_runner_e_testes():
    # 6. Baseline falso e lista vazia: exactamente o baseline.
    rc, saida, nomes = correr_runner()
    if rc != 0:
        erro(f"6. runner falhou com baseline falso e lista vazia:\n{saida}")
    elif nomes != [BASELINE_FINAL]:
        erro(f"6. com lista vazia a cópia devia ter só o baseline; tem {nomes}")

    # 8a. Sem baseline: falha clara.
    rc, saida, _ = correr_runner(com_baseline=False)
    if rc == 0 or "Baseline ausente" not in saida:
        erro("8a. sem baseline o runner devia falhar com 'Baseline ausente'")

    # 8b. Lista explícita D9: entram só as autorizadas, por ordem.
    rc, saida, nomes = correr_runner(pendentes=D9)
    if rc != 0:
        erro(f"8b. lista explícita D9 falhou:\n{saida}")
    elif nomes != [BASELINE_FINAL] + D9:
        erro(f"8b. esperado baseline + D9 autorizadas por ordem; obtido {nomes}")

    # 8c. Lista com migração já aplicada: tem de falhar, nunca reaplicar.
    rc, saida, _ = correr_runner(pendentes=[PROMOVIDAS[0]])
    if rc == 0:
        erro("8c. lista com migração não pendente devia falhar")

    # 8d. Promovidas: reconhecidas pelo mapeamento, excluídas, não reaplicadas.
    rc, saida, nomes = correr_runner()
    for f in PROMOVIDAS:
        if f in nomes:
            erro(f"8d. promovida {f} presente na cópia por omissão")
    if "Ficheiro sem linha" in saida:
        erro("8d. mapeamento das promovidas não reconhecido pelo runner")


def main():
    rows = ler_registo()
    exc = ler_excecoes()
    verificar_registo(rows, exc)
    verificar_comandos()
    verificar_workflows()
    verificar_runner_e_testes()

    if erros:
        for e in erros:
            print(f"::error::{e}")
            print(e, file=sys.stderr)
        print(f"Guardião: FALHOU ({len(erros)} erro(s)).", file=sys.stderr)
        return 1
    print(f"Guardião: OK. {len(rows)} linhas no registo, {len(list(MIG.glob('*.sql')))} migrações, "
          f"{len(exc)} exceções de prefixo documentadas. Modo só baseline validado.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
