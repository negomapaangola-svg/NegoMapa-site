# Fase 2 — Auditoria do percurso de vagas e candidaturas

Data: 18-11-2026  
Branch: `feat/auditoria-vagas`  
Pull request: #39 (Draft)

## Âmbito

Auditoria das páginas, componentes, acções de servidor, esquema, vistas, políticas RLS, estados e notificações do percurso de vagas. A regra geral de aprovação automática da Fase 7 não foi alterada.

## Comportamento esperado vs. observado

| Percurso | Esperado no MVP | Observado antes da Fase 2 | Resultado nesta fase |
|---|---|---|---|
| Criar vaga | Empresa autorizada cria vaga própria | Formulário e acção existentes; validam sessão, empresa proprietária e aprovação da empresa | Mantido; criação autenticada confirmada em teste SQL |
| Editar vaga | Empresa altera apenas vaga própria | Não existia percurso de edição no painel | Implementado; edição própria passou e edição de vaga alheia afectou 0 linhas |
| Publicar vaga | Vaga aprovada fica disponível ao público | Triggers e vistas públicas existentes | Criação autenticada com estado pedido `pendente` foi transformada pelo trigger existente em `aprovado`; nenhuma regra de aprovação foi alterada |
| Encerrar vaga | Empresa retira a própria vaga da descoberta e impede novas candidaturas | Não existia acção nem estado/campo de encerramento | Implementado com `encerrada_em`; proprietário consegue encerrar a própria vaga; candidato e outra empresa não conseguem |
| Listar vagas | Empresa consulta apenas as próprias vagas | `getUserVagas` filtra por empresa obtida através de `companies.user_id = auth.uid()` | Mantido e passou a mostrar vagas encerradas |
| Descobrir/pesquisar | Candidato consulta vagas públicas e filtra por texto, categoria e província | Pesquisa normalizada, filtros GET e paginação já existiam | Vista pública confirmou vaga aberta e excluiu vaga encerrada e empresa inactiva |
| Detalhe | Candidato consulta vaga publicada | Rota usa `vagas_publicas`, estado aprovado e empresa aprovada | Revisão estática; sem sessão de navegador para teste de clique |
| Candidatar-se | Candidato autenticado e elegível envia candidatura | Formulário valida nome, contacto, mensagem e URL CV | INSERT autenticado em vaga aprovada passou; vagas encerradas e empresa inactiva recusadas |
| Duplicados | Uma candidatura por utilizador/vaga | Constraint UNIQUE `(vaga_id, user_id)`; acção trata erro `23505` | Tentativa duplicada recusada com SQLSTATE `23505` |
| Consultar candidaturas | Candidato vê as suas; empresa vê as recebidas nas suas vagas | RLS separa candidato por `user_id` e empresa por `empresa_dona_da_vaga(vaga_id)` | Testes cruzados com dois candidatos e duas empresas passaram |
| Estados/notificações | Empresa acompanha e altera estados permitidos; partes recebem notificações | Acções existentes notificam empresa quando recebe candidatura e candidato quando o estado muda | Mantido; alteração directa de estado pelo candidato recusada |

## Evidência do Supabase

Projecto: `sjelyaewgcmmtnudcgem`.

- `public.vagas` e `public.candidaturas` têm RLS activado.
- `vagas_update_auth` limita UPDATE à empresa proprietária e confirma a propriedade no `WITH CHECK`.
- `candidaturas_select_candidato` limita SELECT a `user_id = auth.uid()`.
- `candidaturas_select_empresa` usa `empresa_dona_da_vaga(vaga_id)`.
- INSERT de candidaturas exige utilizador próprio, estado inicial `enviada`, vaga disponível e não pertencente à própria empresa.
- A constraint `candidaturas_vaga_user_unica` existe.
- `active_account_required` mantém-se nas tabelas relevantes.
- `vagas_public_open_only` filtra vagas encerradas na role proprietária da vista pública.
- `vaga_disponivel_para_candidatura(uuid)` exige vaga aprovada, não encerrada, empresa aprovada e conta da empresa activa.

Antes da migração: 3 vagas rejeitadas, 0 candidaturas e 0 vagas aprovadas.  
Depois da migração: 3 vagas, 0 candidaturas e 0 vagas encerradas. Nenhum registo existente foi alterado.

## Testes funcionais SQL com papéis distintos

Foi criada uma fixture sintética numa única transacção SQL e terminada com `ROLLBACK`. Não ficaram contas, empresas, vagas ou candidaturas de demonstração persistidas na base de dados de produção. Os endereços usam o domínio reservado `.invalid`; não foram usados contactos reais.

### IDs usados na fixture (efémeros; transacção revertida)

**Identidades**
- Empresa A: `10000000-0000-4000-8000-000000000001`
- Empresa B: `10000000-0000-4000-8000-000000000002`
- Profissional A: `10000000-0000-4000-8000-000000000003`
- Profissional B: `10000000-0000-4000-8000-000000000004`
- Empresa inactiva: `10000000-0000-4000-8000-000000000005`

**Empresas**
- TESTE Empresa Alfa: `20000000-0000-4000-8000-000000000001`
- TESTE Empresa Beta: `20000000-0000-4000-8000-000000000002`
- TESTE Empresa Inactiva: `20000000-0000-4000-8000-000000000003`

**Vagas**
- TESTE — Assistente Alfa: `30000000-0000-4000-8000-000000000001`
- TESTE — Vaga Encerrada: `30000000-0000-4000-8000-000000000002`
- TESTE — Vaga Empresa Beta: `30000000-0000-4000-8000-000000000003`
- TESTE — Vaga Empresa Inactiva: `30000000-0000-4000-8000-000000000004`
- TESTE — Criada por Empresa A via INSERT autenticado: `30000000-0000-4000-8000-000000000005`

**Candidaturas**
- Profissional A → vaga Alfa: `40000000-0000-4000-8000-000000000001`
- Profissional B → vaga Beta: `40000000-0000-4000-8000-000000000002`
- Foi também executado um INSERT válido de Profissional A para a vaga criada pela Empresa A; o registo foi revertido com a transacção.

### Resultados

Todos os 23 controlos da transacção passaram:

| Teste | Resultado | Evidência |
|---|---|---|
| Empresa A edita vaga própria | PASS | UPDATE afectou 1 linha |
| Empresa A edita vaga B | PASS | UPDATE afectou 0 linhas |
| Empresa A elimina vaga B | PASS | DELETE afectou 0 linhas |
| Empresa A encerra vaga B | PASS | UPDATE afectou 0 linhas |
| Empresa A encerra vaga própria | PASS | UPDATE afectou 1 linha |
| Empresa A tenta alterar estado de aprovação | PASS | Trigger recusou: `P0001`, apenas administradores podem alterar estado |
| Empresa A cria vaga | PASS | INSERT autenticado aceite; trigger existente definiu `estado=aprovado` |
| Empresa A consulta candidatura própria | PASS | 1 linha visível |
| Empresa A não consulta candidatura da vaga B | PASS | 0 linhas visíveis |
| Profissional A consulta candidatura própria | PASS | 1 linha visível |
| Profissional A não consulta candidatura B | PASS | 0 linhas visíveis |
| Profissional B não consulta candidatura A | PASS | 0 linhas visíveis |
| Profissional A candidata-se a vaga aberta | PASS | INSERT aceite |
| Candidatura duplicada | PASS | Recusada por UNIQUE, SQLSTATE `23505` |
| Candidatura a vaga encerrada | PASS | RLS recusou, SQLSTATE `42501` |
| Candidatura a empresa inactiva | PASS | RLS recusou, SQLSTATE `42501` |
| Candidato tenta inserir candidatura já aceite | PASS | RLS recusou, SQLSTATE `42501` |
| Candidato tenta alterar estado da candidatura | PASS | UPDATE afectou 0 linhas |
| Candidato tenta encerrar vaga | PASS | UPDATE afectou 0 linhas |
| Descoberta inclui vaga aberta | PASS | 1 linha visível |
| Descoberta exclui vaga encerrada | PASS | 0 linhas visíveis |
| Descoberta exclui empresa inactiva | PASS | 0 linhas visíveis |
| Setup da fixture sintética | PASS | 5 identidades, 3 empresas, 4 vagas iniciais, 1 vaga criada via API/RLS e 2 candidaturas iniciais |

Depois do `ROLLBACK`, consulta de confirmação devolveu 0 utilizadores, 0 empresas, 0 vagas e 0 candidaturas com os identificadores/prefixos de teste. Nenhum dado de produção foi apagado.

### Limite do teste funcional no preview

- Preview Vercel READY e associado ao commit indicado na secção de entrega.
- O ambiente desta sessão não disponibiliza um navegador interactivo autenticado para clicar nos formulários, iniciar sessão e capturar screenshots.
- A tentativa de abrir a URL pelo leitor web devolveu erro interno de acesso; não foi possível fazer teste visual/end-to-end do formulário, notificações, mensagens de loading ou estados vazios.
- Os controlos acima são testes SQL/RLS com identidades autenticadas simuladas na transacção, não devem ser confundidos com teste de interface no browser.
- Mensagens e estados vazios foram revistos estaticamente no código e validados por lint/build/TypeScript, mas não por screenshots ou interacção real.

## Eliminação de vagas — decisão recomendada

**Decisão implementada: opção A — o proprietário não pode eliminar vagas; o encerramento (`encerrada_em`) é o mecanismo normal de retirada.**

Evidência real das chaves estrangeiras:
- `candidaturas.vaga_id → vagas.id ON DELETE RESTRICT`
- `avaliacoes.vaga_id → vagas.id ON DELETE RESTRICT`
- `denuncias.vaga_id → vagas.id ON DELETE RESTRICT`

A tabela `notificacoes` mantém `referencia_id` polimórfica, sem FK genérica. A migração acrescenta um trigger que valida referências para `vaga_aprovada` e `vaga_rejeitada`, e impede apagar uma vaga enquanto existirem notificações desses tipos. A verificação pós-migração encontrou zero referências inválidas. A única tabela encontrada com nome de auditoria é `admin_account_deletion_audit`; não foi encontrada tabela de auditoria específica das alterações de vagas.

**Correcção aplicada:** removida a política permissiva `vagas_delete_auth` e criada a política RLS restritiva `vagas_no_owner_delete`, que impede o proprietário de apagar a própria vaga através da API. As três FKs de histórico passaram de `CASCADE` para `RESTRICT`; assim, mesmo operações privilegiadas não apagam candidaturas, avaliações ou denúncias ao tentar eliminar uma vaga com histórico. O encerramento pelo proprietário continua permitido.

## Migração e reversão

- Migração aditiva inicial: `20261117231159_vagas_encerramento_seguro.sql`.
- Migração aplicada em produção: `20261118134305_proibir_eliminacao_vagas_preservar_historico` (`supabase/migrations/20261118134305_proibir_eliminacao_vagas_preservar_historico.sql`).
- Reversão versionada: `supabase/rollback/20261118134305_proibir_eliminacao_vagas_preservar_historico_reversao.sql`. A reversão restaura deliberadamente a política antiga e os `CASCADE`; não foi executada.
- Reversão: `supabase/rollback/20261117231159_vagas_encerramento_seguro_reversao.sql`.
- Simulação SQL com ROLLBACK e aplicação posterior verificada.
- A reversão aborta se existirem vagas com `encerrada_em IS NOT NULL`; não foi executada.
- Nenhuma migração destrutiva foi executada.

## CI, preview e vulnerabilidades

- GitHub Actions run #127: lint dos ficheiros alterados, `npm run build` e `npx tsc --noEmit` passaram em Node 24.
- A Vercel aceitou novo deployment após o limite diário ter sido restabelecido; deployment READY associado ao commit documentado abaixo.
- `npm ci` identificou 20 vulnerabilidades no conjunto de dependências: 6 moderadas, 13 altas e 1 crítica. Não foi executado `npm audit fix`, por estar fora do âmbito.
- Build Vercel reportou aviso de ESLint 9.39.5 deprecated, aviso de configuração npm `cache-dir` desconhecida e install script pendente de aprovação para `unrs-resolver@1.12.2`. Não foram alteradas dependências.

## Riscos e pendências

1. Os dados sintéticos foram transaccionais e revertidos; não existem contas persistentes com credenciais para login no preview.
2. O teste end-to-end de browser, formulários, notificações, estados de loading e mensagens não pôde ser executado nesta sessão.
3. Correcção de eliminação aplicada: proprietário bloqueado por RLS; FKs de candidaturas, avaliações e denúncias em `RESTRICT`; notificações de vaga validadas e protegidas.
4. A regra de aprovação automática permanece inalterada. O trigger existente define `aprovado` na inserção de vagas; alterações posteriores de estado são recusadas para não-administradores.
5. As vulnerabilidades npm acima permanecem pendentes de tratamento numa fase autorizada.

## Critérios de aceitação — estado

- Fluxo com papéis distintos: PARCIAL — 23 testes SQL/RLS passaram; teste de browser ainda pendente.
- Empresa não gere vaga alheia: CUMPRIDO ao nível de RLS (editar, encerrar e eliminar vaga B recusados).
- Proprietário não elimina a própria vaga via API: CUMPRIDO (DELETE directo como `authenticated` devolveu zero linhas).
- Encerramento pelo proprietário: CUMPRIDO.
- Histórico de candidaturas, avaliações e denúncias: CUMPRIDO (FK `RESTRICT`, teste de eliminação privilegiada recusado e quatro registos confirmados).
- Notificações de vaga: CUMPRIDO (referência inexistente recusada por `23503`; notificação válida preservada; zero referências inválidas após rollback).
- Candidato não vê candidaturas de outros: CUMPRIDO ao nível de RLS (testes A↔B passaram).
- Empresa não vê candidaturas de vagas alheias: CUMPRIDO ao nível de RLS.
- Candidatura duplicada, vaga encerrada e empresa inactiva: CUMPRIDO ao nível de RLS/constraint.
- Erros e estados vazios: PARCIAL — revisão estática; falta validação interactiva no browser.
- PR e preview: PR #39 aberto em Draft; preview READY e associado ao commit indicado na entrega.
- Fase 2 pronta para revisão final: SIM, com as limitações e a decisão de eliminação explicitamente assinaladas; não equivale a aprovação para merge.


## Adenda — decisão de eliminação implementada e revalidação

Data: 18-11-2026

### Alteração aplicada em produção

- Removida a política permissiva \`vagas_delete_auth\`.
- Criada a política RLS **restritiva** \`vagas_no_owner_delete\` para \`authenticated\`, com predicado que exclui o proprietário da operação DELETE. A regra prevalece sobre políticas permissivas.
- Alteradas as FKs \`candidaturas_vaga_id_fkey\`, \`avaliacoes_vaga_id_fkey\` e \`denuncias_vaga_id_fkey\` para \`ON DELETE RESTRICT\`.
- Criado trigger de validação das referências de notificações dos tipos \`vaga_aprovada\` e \`vaga_rejeitada\`; referências nulas ou inexistentes são recusadas com SQLSTATE \`23503\`.
- Criado trigger que bloqueia a eliminação de uma vaga que ainda tenha notificações históricas desses tipos.
- Não foi adicionada qualquer acção de eliminação à interface; o componente de acções da vaga oferece edição e encerramento, não eliminação.
- O encerramento normal por \`encerrada_em\` e a regra automática de aprovação da Fase 7 foram mantidos.

### Testes repetidos — 23 controlos SQL/RLS

Os 23 controlos anteriores foram repetidos com cinco identidades sintéticas, três empresas e cinco vagas. Os controlos cobriram edição/encerramento, isolamento entre empresas e candidatos, candidatura válida, duplicados, vaga encerrada, empresa inactiva, estado de aprovação, descoberta pública e protecção das candidaturas. **23/23 PASS**. O INSERT de candidatura a vaga aberta foi aceite e a candidatura ficou visível ao próprio candidato; os testes de vaga encerrada e empresa inactiva foram recusados por RLS.

### Testes adicionais — 5 controlos

| Teste | Resultado | Evidência |
|---|---|---|
| Proprietário não elimina a própria vaga pela API | PASS | DELETE sob role \`authenticated\` devolveu 0 linhas |
| Encerramento continua permitido ao proprietário | PASS | UPDATE de \`encerrada_em\` afectou 1 linha |
| Tentativa privilegiada de apagar vaga com histórico | PASS | FK \`RESTRICT\` recusou DELETE |
| Candidaturas, avaliações, denúncias e notificação válidas preservadas | PASS | Os quatro registos permaneceram após a tentativa de DELETE |
| Notificação com referência de vaga inexistente | PASS | Trigger recusou INSERT com SQLSTATE \`23503\` |

### Limpeza e integridade

- Todos os dados de teste foram criados dentro de uma única transacção e revertidos com \`ROLLBACK\`.
- Consulta posterior confirmou zero registos TESTE nas tabelas \`auth.users\`, \`companies\`, \`vagas\`, \`candidaturas\`, \`avaliacoes\`, \`denuncias\` e \`notificacoes\`.
- As FKs das três tabelas de histórico estão em \`RESTRICT\`.
- RLS permanece activo; a migração não alterou a configuração RLS das tabelas.
- A verificação de notificações existentes encontrou zero referências inválidas para tipos de notificação de vaga.
- A migração consta no histórico Supabase como versão \`20261118134305\`. A reversão não foi executada.
