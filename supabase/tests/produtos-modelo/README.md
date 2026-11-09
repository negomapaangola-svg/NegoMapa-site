# Testes do modelo de produtos (Fase 2)

Testes das migrações `20261109120000_produtos_modelo.sql` e `20261109120100_produtos_storage.sql`,
executados num PostgreSQL local (não tocam na base de dados do projeto).

- `00-stubs-supabase.sql`: imita o mínimo do Supabase (roles `anon`/`authenticated`, `auth.uid()`,
  `storage.objects`, `companies`, `is_admin()`) e os privilégios amplos por defeito que a migração tem de revogar.
- `01-testes-permissoes.sql`: cenários por papel (anónimo, empresas, administrador) com passa/falha.

Execução (com PostgreSQL 16 local e uma base `nm_test`):

    psql -d nm_test -v ON_ERROR_STOP=1 -f 00-stubs-supabase.sql
    psql -d nm_test -v ON_ERROR_STOP=1 -f ../../migrations/20261109120000_produtos_modelo.sql
    psql -d nm_test -v ON_ERROR_STOP=1 -f ../../migrations/20261109120100_produtos_storage.sql
    psql -d nm_test -v ON_ERROR_STOP=1 -f 01-testes-permissoes.sql

Cada verificação imprime `PASSA` ou falha a execução. Limitação: os stubs não são o Supabase real;
a validação final tem de ser feita num branch Supabase antes de qualquer aplicação em produção.
