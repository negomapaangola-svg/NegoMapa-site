# Checklist de Validação Manual — Módulo de Serviços

> Migração: `20261003_create_servicos_module.sql`
> Aplicada manualmente no Supabase Dashboard.

---

## 1. Tabelas Criadas

| Tabela | Onde verificar no Supabase |
|--------|----------------------------|
| `profissionais` | **Table Editor** → `public` → `profissionais` |
| `categorias` | **Table Editor** → `public` → `categorias` |
| `servicos` | **Table Editor** → `public` → `servicos` |

**Teste manual:**  
Abrir cada tabela → confirmar que existem (sem erro 404).

---

## 2. Colunas, Tipos, Defaults e Constraints

### `profissionais`
| Coluna | Tipo | Not Null | Default | Check / Unique |
|--------|------|----------|---------|----------------|
| id | uuid | ✅ | `gen_random_uuid()` | PK |
| user_id | uuid | ✅ | — | FK → `auth.users(id)` |
| nome | text | ✅ | — | — |
| slug | text | ✅ | — | UNIQUE |
| telefone | text | ❌ | — | — |
| whatsapp | text | ❌ | — | — |
| bio | text | ❌ | — | — |
| provincia | text | ❌ | — | — |
| municipio | text | ❌ | — | — |
| estado | text | ✅ | `'pendente'` | CHECK IN ('pendente','aprovado','suspenso') |
| created_at | timestamptz | ✅ | `now()` | — |
| updated_at | timestamptz | ✅ | `now()` | — |

### `categorias`
| Coluna | Tipo | Not Null | Default | Check / Unique |
|--------|------|----------|---------|----------------|
| id | uuid | ✅ | `gen_random_uuid()` | PK |
| nome | text | ✅ | — | — |
| slug | text | ✅ | — | UNIQUE |
| ativo | boolean | ✅ | `true` | — |
| created_at | timestamptz | ✅ | `now()` | — |

### `servicos`
| Coluna | Tipo | Not Null | Default | Check / Unique |
|--------|------|----------|---------|----------------|
| id | uuid | ✅ | `gen_random_uuid()` | PK |
| profissional_id | uuid | ✅ | — | FK → `profissionais(id)` |
| categoria_id | uuid | ✅ | — | FK → `categorias(id)` |
| titulo | text | ✅ | — | — |
| slug | text | ✅ | — | UNIQUE |
| descricao | text | ❌ | — | — |
| preco | numeric | ❌ | — | — |
| preco_tipo | text | ❌ | — | — |
| whatsapp | text | ❌ | — | — |
| provincia | text | ❌ | — | — |
| municipio | text | ❌ | — | — |
| estado | text | ✅ | `'pendente'` | CHECK IN ('pendente','aprovado','rejeitado','suspenso') |
| created_at | timestamptz | ✅ | `now()` | — |
| updated_at | timestamptz | ✅ | `now()` | — |

**Onde verificar:**  
Table Editor → clicar na tabela → aba **Columns**.

---

## 3. Foreign Keys

| FK | Tabela origem | Coluna origem | Tabela destino | Coluna destino | On Delete |
|----|---------------|---------------|----------------|----------------|-----------|
| `profissionais_user_id_fkey` | `profissionais` | `user_id` | `auth.users` | `id` | CASCADE |
| `servicos_profissional_id_fkey` | `servicos` | `profissional_id` | `profissionais` | `id` | CASCADE |
| `servicos_categoria_id_fkey` | `servicos` | `categoria_id` | `categorias` | `id` | RESTRICT |

**Onde verificar:**  
Table Editor → tabela → aba **Foreign keys**  
Ou: **Database** → **Relationships** (visualizador gráfico).

---

## 4. Checks de Estado

**Onde verificar:**  
Table Editor → tabela → aba **Constraints** → procurar `CHECK` constraints.

- `profissionais_estado_check`: `estado IN ('pendente','aprovado','suspenso')`
- `servicos_estado_check`: `estado IN ('pendente','aprovado','rejeitado','suspenso')`

---

## 5. Índices

| Índice | Tabela | Coluna(s) |
|--------|--------|-----------|
| `idx_profissionais_slug` | profissionais | slug |
| `idx_profissionais_estado` | profissionais | estado |
| `idx_profissionais_provincia` | profissionais | provincia |
| `idx_profissionais_municipio` | profissionais | municipio |
| `idx_profissionais_user_id` | profissionais | user_id |
| `idx_categorias_slug` | categorias | slug |
| `idx_categorias_ativo` | categorias | ativo |
| `idx_servicos_slug` | servicos | slug |
| `idx_servicos_estado` | servicos | estado |
| `idx_servicos_categoria_id` | servicos | categoria_id |
| `idx_servicos_profissional_id` | servicos | profissional_id |
| `idx_servicos_provincia` | servicos | provincia |
| `idx_servicos_municipio` | servicos | municipio |

**Onde verificar:**  
Table Editor → tabela → aba **Indexes**  
Ou SQL Editor:
```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('profissionais','categorias','servicos')
ORDER BY tablename, indexname;
```

---

## 6. RLS Ativado

**Onde verificar:**  
Table Editor → tabela → badge **"RLS enabled"** (verde) no topo  
Ou SQL Editor:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profissionais','categorias','servicos');
```
Esperado: `rowsecurity = true` nas 3.

---

## 7. Políticas RLS (por operação)

**Onde verificar:**  
Table Editor → tabela → aba **Policies**  
Ou SQL Editor:
```sql
SELECT tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profissionais','categorias','servicos')
ORDER BY tablename, policyname;
```

### Esperado por tabela:

#### `categorias` (3 policies)
| Policy | Command | Roles | USING / WITH CHECK |
|--------|---------|-------|-------------------|
| `categorias_select_anon` | SELECT | anon | `ativo = true` |
| `categorias_select_auth` | SELECT | authenticated | `ativo = true` |
| `categorias_all_admin` | ALL | authenticated | `public.is_admin()` |

#### `profissionais` (6 policies)
| Policy | Command | Roles | USING / WITH CHECK |
|--------|---------|-------|-------------------|
| `profissionais_select_anon` | SELECT | anon | `estado = 'aprovado'` |
| `profissionais_select_auth` | SELECT | authenticated | `estado = 'aprovado' OR user_id = auth.uid()` |
| `profissionais_insert_auth` | INSERT | authenticated | `user_id = auth.uid()` |
| `profissionais_update_auth` | UPDATE | authenticated | `user_id = auth.uid()` |
| `profissionais_delete_auth` | DELETE | authenticated | `user_id = auth.uid()` |
| `profissionais_all_admin` | ALL | authenticated | `public.is_admin()` |

#### `servicos` (6 policies)
| Policy | Command | Roles | USING / WITH CHECK |
|--------|---------|-------|-------------------|
| `servicos_select_anon` | SELECT | anon | `estado = 'aprovado'` |
| `servicos_select_auth` | SELECT | authenticated | `estado = 'aprovado' OR profissional_id IN (SELECT id FROM profissionais WHERE user_id = auth.uid())` |
| `servicos_insert_auth` | INSERT | authenticated | `profissional_id IN (SELECT id FROM profissionais WHERE user_id = auth.uid())` |
| `servicos_update_auth` | UPDATE | authenticated | mesmo que insert |
| `servicos_delete_auth` | DELETE | authenticated | mesmo que insert |
| `servicos_all_admin` | ALL | authenticated | `public.is_admin()` |

---

## 8. Triggers `updated_at`

**Onde verificar:**  
Table Editor → tabela → aba **Triggers**  
Ou SQL Editor:
```sql
SELECT event_object_table, trigger_name, action_timing, event_manipulation
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('profissionais','servicos');
```

Esperado:
- `profissionais` → `trigger_profissionais_updated_at` → BEFORE UPDATE
- `servicos` → `trigger_servicos_updated_at` → BEFORE UPDATE

---

## 9. Função `is_admin()`

**Onde verificar:**  
**Database** → **Functions** → `public.is_admin`  
Ou SQL Editor:
```sql
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'is_admin' 
  AND pronamespace = 'public'::regnamespace;
```

Esperado: corpo da função faz `SELECT EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email LIKE '%@admin%')`.

---

## 10. Testes Manuais de Acesso (RLS)

> Use **SQL Editor** com diferentes roles via `SET ROLE` ou teste via aplicação.

### 10.1 Anónimo (não autenticado)
```sql
SET ROLE anon;

-- Deve retornar apenas categorias ativas
SELECT * FROM categorias;

-- Deve retornar apenas profissionais aprovados
SELECT * FROM profissionais;

-- Deve retornar apenas serviços aprovados
SELECT * FROM servicos;

-- INSERT/UPDATE/DELETE devem falhar (ERROR: permission denied)
INSERT INTO categorias (nome, slug) VALUES ('Teste', 'teste');
```

### 10.2 Utilizador autenticado (não admin)
```sql
-- No Supabase Dashboard: Authentication → Users → copiar um user_id
-- Depois no SQL Editor:
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub": "<USER_ID_AQUI>"}';

-- 1. Deve ver os seus próprios registos (qualquer estado)
SELECT * FROM profissionais WHERE user_id = auth.uid();

-- 2. Deve ver profissionais aprovados dos outros
SELECT * FROM profissionais WHERE estado = 'aprovado';

-- 3. Deve conseguir criar o seu próprio perfil
INSERT INTO profissionais (user_id, nome, slug, estado) 
VALUES (auth.uid(), 'Meu Perfil', 'meu-perfil', 'pendente');

-- 4. NÃO deve conseguir criar perfil para outro user_id
INSERT INTO profissionais (user_id, nome, slug, estado) 
VALUES ('<OUTRO_USER_ID>', 'Outro', 'outro', 'pendente');
-- → ERROR: violates row-level security policy

-- 5. Deve conseguir criar serviço associado ao seu perfil
WITH p AS (SELECT id FROM profissionais WHERE user_id = auth.uid() LIMIT 1)
INSERT INTO servicos (profissional_id, categoria_id, titulo, slug, estado)
SELECT id, (SELECT id FROM categorias LIMIT 1), 'Meu Serviço', 'meu-servico', 'pendente'
FROM p;

-- 6. NÃO deve conseguir atualizar/eliminar registos de outros
UPDATE profissionais SET nome = 'Hack' WHERE user_id = '<OUTRO_USER_ID>';
-- → ERROR
```

### 10.3 Admin (user com email contendo `@admin`)
```sql
-- Criar user admin no Auth → email: admin@admin.com
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub": "<ADMIN_USER_ID>", "email": "admin@admin.com"}';

-- Deve ter acesso total a tudo
SELECT * FROM categorias;           -- todas (incl. inativas)
SELECT * FROM profissionais;        -- todas (incl. pendentes/suspensos)
SELECT * FROM servicos;             -- todas (incl. rejeitados)

INSERT INTO categorias (nome, slug, ativo) VALUES ('Admin Cat', 'admin-cat', false);
UPDATE profissionais SET estado = 'suspenso' WHERE id = '<QUALQUER_ID>';
DELETE FROM servicos WHERE id = '<QUALQUER_ID>';
-- Tudo deve funcionar
```

---

## 11. Teste do Trigger `updated_at`

```sql
-- Como user autenticado dono do registo
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub": "<USER_ID>"}';

-- Criar profissional
INSERT INTO profissionais (user_id, nome, slug, estado) 
VALUES (auth.uid(), 'Trigger Test', 'trigger-test', 'pendente')
RETURNING id, created_at, updated_at;

-- Guardar o id retornado, depois:
UPDATE profissionais SET nome = 'Trigger Test Atualizado' WHERE id = '<ID_RETORNADO>'
RETURNING updated_at;

-- updated_at deve ser > created_at (diferença de milissegundos/segundos)
```

Repetir para `servicos`.

---

## 12. Resumo de Aprovação

| Item | ✅ / ❌ | Observações |
|------|--------|-------------|
| Tabelas criadas | | |
| Colunas corretas | | |
| Foreign keys | | |
| Checks de estado | | |
| Índices (13) | | |
| RLS ativado (3 tabelas) | | |
| Políticas (15 total) | | |
| `is_admin()` função | | |
| Triggers `updated_at` (2) | | |
| Testes anónimo | | |
| Testes autenticado | | |
| Testes admin | | |
| Trigger updated_at funciona | | |

---

**Data da validação:** ___________  
**Validado por:** ___________  
**Assinatura:** ___________