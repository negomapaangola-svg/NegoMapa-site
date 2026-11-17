# Fase 2 — Auditoria do percurso de vagas e candidaturas

Data: 18-11-2026  
Branch: `feat/auditoria-vagas`  
Pull request: #39 (Draft)

## Âmbito

Auditoria das páginas, componentes, acções de servidor, esquema, vistas, políticas RLS, estados e notificações do percurso de vagas. A regra geral de aprovação automática não foi alterada.

## Comportamento esperado vs. observado

| Percurso | Esperado no MVP | Observado antes da Fase 2 | Resultado nesta fase |
|---|---|---|---|
| Criar vaga | Empresa autorizada cria vaga própria | Formulário e acção existentes; validam sessão, empresa proprietária e aprovação da empresa | Mantido; não foi alterada a regra de aprovação |
| Editar vaga | Empresa altera apenas vaga própria | Não existia percurso de edição no painel | Implementado com verificação de sessão, propriedade e vaga não encerrada |
| Publicar vaga | Vaga aprovada fica disponível ao público | Descoberta/detalhe usam vistas públicas e estado aprovado; triggers de aprovação existentes permanecem intactos | Mantido; nenhuma regra de aprovação foi alterada |
| Encerrar vaga | Empresa retira a própria vaga da descoberta e impede novas candidaturas | Não existia acção nem estado/campo de encerramento | Implementado com `encerrada_em`, sem reutilizar o estado de moderação |
| Listar vagas | Empresa consulta apenas as próprias vagas | `getUserVagas` filtra por empresa obtida através de `companies.user_id = auth.uid()` | Mantido e passou a mostrar vagas encerradas |
| Descobrir/pesquisar | Candidato consulta vagas públicas e filtra por texto, categoria e província | Pesquisa normalizada, filtros GET e paginação já existiam | Mantido; vistas continuam a expor apenas vagas elegíveis |
| Detalhe | Candidato consulta vaga publicada | Rota usa `vagas_publicas`, estado aprovado e empresa aprovada | Mantido; a política restritiva exclui vagas encerradas |
| Candidatar-se | Candidato autenticado e elegível envia candidatura | Formulário valida nome, contacto, mensagem e URL CV; a política bloqueia candidatura à própria vaga | Mantido; validação de elegibilidade passou também a verificar conta activa da empresa e encerramento |
| Duplicados | Uma candidatura por utilizador/vaga | Constraint UNIQUE `(vaga_id, user_id)`; acção trata erro `23505` | Mantido e verificado no esquema |
| Consultar candidaturas | Candidato vê as suas; empresa vê as recebidas nas suas vagas | RLS separa candidato por `user_id` e empresa por `empresa_dona_da_vaga(vaga_id)` | Políticas mantidas; acções continuam a filtrar pela empresa activa |
| Estados/notificações | Empresa acompanha e altera estados permitidos; partes recebem notificações | Acções existentes notificam empresa quando recebe candidatura e candidato quando o estado muda | Mantido; não foram introduzidos novos estados de aprovação |

## Evidência do Supabase

Consulta ao projecto `sjelyaewgcmmtnudcgem`:

- `public.vagas` e `public.candidaturas` têm RLS activado.
- A política `vagas_update_auth` limita UPDATE à empresa proprietária e confirma a propriedade no `WITH CHECK`.
- A política `candidaturas_select_candidato` limita SELECT a `user_id = auth.uid()`.
- A política `candidaturas_select_empresa` usa `empresa_dona_da_vaga(vaga_id)`.
- A política de INSERT de candidaturas exige utilizador próprio, estado inicial `enviada`, vaga disponível e não pertencente à própria empresa.
- A constraint `candidaturas_vaga_user_unica` existe.
- A política restritiva `active_account_required` mantém-se nas duas tabelas.
- A nova política restritiva `vagas_public_open_only` filtra vagas encerradas na role proprietária da vista pública.
- A função `vaga_disponivel_para_candidatura(uuid)` exige vaga aprovada, não encerrada, empresa aprovada e conta da empresa activa.

Antes da migração: 3 vagas (todas rejeitadas), 0 candidaturas e 0 vagas aprovadas.  
Depois da migração: 3 vagas, 0 candidaturas e 0 vagas encerradas. Não houve alteração de registos existentes.

## Migração e reversão

- Migração aditiva: `20261117231159_vagas_encerramento_seguro.sql`.
- Reversão: `supabase/rollback/20261117231159_vagas_encerramento_seguro_reversao.sql`.
- A simulação da migração correu dentro de uma transacção terminada com ROLLBACK; confirmou que as instruções e pós-condições executam sem persistir alterações.
- A migração foi depois aplicada e a coluna, política e função foram verificadas.
- A reversão aborta se existir qualquer vaga com `encerrada_em IS NOT NULL`; não foi executada.
- Nenhuma política RLS de candidaturas foi removida ou alargada. Nenhuma migração destrutiva foi executada.

## Testes e limites

| Teste | Resultado |
|---|---|
| Simulação SQL da migração | PASSOU; transacção revertida e esquema permaneceu inalterado |
| Aplicação da migração e verificação pós-condição | PASSOU |
| RLS activado em vagas/candidaturas | PASSOU por introspecção |
| Isolamento de UPDATE por empresa | PASSOU em transacção com identidade activa `authenticated`: tentativa de actualizar vagas não pertencentes à empresa afectou 0 linhas; transacção revertida |
| Políticas de isolamento candidato/empresa | Confirmadas por introspecção; não houve teste funcional com dois candidatos
| Restrição contra duplicados | PASSOU por introspecção da constraint UNIQUE; tentativa real não executada |
| Validação de candidatura a vaga encerrada/empresa inactiva | PASSOU por definição instalada da função; sem vaga aprovada para teste funcional |
| Pesquisa, filtros e detalhe | Revisão estática do código; sem sessão de navegador disponível |
| Erros de carregamento vs. listas vazias | Implementado com estados de erro distintos nas listagens pública e da empresa; lint/build/TypeScript executados no CI |
| Criação, edição, publicação, encerramento e candidatura com papéis distintos | NÃO EXECUTADO: o projecto tem 0 candidatos activos, 0 vagas aprovadas e 0 candidaturas. Não foram criadas contas nem dados de demonstração |
| Lint, build e TypeScript | PASSOU no GitHub Actions (run #123, commit `591e40d8`): lint, build e `tsc --noEmit` concluídos com sucesso. A página pública de vagas foi incluída na lista de lint para a validação do commit seguinte |
| Preview Vercel | BLOQUEADO pelo limite da equipa: `api-deployments-free-per-day`, mais de 100 deployments; API devolveu HTTP 402 e retry em 24 horas |

## Riscos restantes

1. Testes funcionais completos com duas empresas activas e um candidato activo exigem contas de teste autorizadas ou um ambiente isolado. Não foram criados utilizadores ou registos de demonstração em produção.
2. O preview Vercel correspondente ao commit não pôde ser criado devido ao limite de deployments. Não existe URL de preview válida para entregar nesta execução.
3. A política existente `vagas_delete_auth` permite ao proprietário eliminar uma vaga; a FK `candidaturas.vaga_id ON DELETE CASCADE` faria desaparecer as candidaturas associadas. A UI desta fase não oferece eliminação. A política não foi alterada por não fazer parte da lista de acções solicitadas.
4. `npm ci` reportou 20 vulnerabilidades no conjunto de dependências (6 moderadas, 13 altas e 1 crítica). Não foi executado `npm audit fix`, por estar fora do âmbito e poder introduzir alterações incompatíveis.
5. O estado de aprovação/moderação permanece sob as triggers e políticas existentes; a Fase 7 continua responsável por qualquer alteração à regra geral.

## Critérios de aceitação

- Fluxo de vaga e candidatura com papéis distintos: PARCIAL — políticas e limites de acesso confirmados; teste end-to-end bloqueado pela ausência de contas/dados elegíveis.
- Empresa não gere vaga alheia: PARCIAL — acções e RLS limitam por propriedade; teste funcional entre duas empresas não executado.
- Candidato não vê candidaturas de outros: PARCIAL — política RLS limita ao próprio utilizador; teste funcional com dois candidatos não executado.
- Erros e estados vazios claros: IMPLEMENTADO — as listagens pública e da empresa distinguem falhas de carregamento de listas vazias; páginas de candidaturas já apresentam erros explícitos.
- PR e preview entregues: PR #39 entregue em Draft; preview BLOQUEADO pelo limite Vercel.
