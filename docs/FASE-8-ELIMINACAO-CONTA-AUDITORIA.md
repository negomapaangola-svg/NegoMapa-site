# Fase 8 — auditoria de dados, retenção e plano de eliminação autónoma

Estado: **auditoria de schema actualizada; implementação e validação funcional ainda não iniciadas**. Esta revisão foi feita por leitura do código, catálogo PostgreSQL, políticas RLS/Storage e migrações. Não foram alterados dados, buckets, políticas ou migrações na base de produção. Não foram criadas contas TESTE.

## 1. Evidência e limites da observação

- Repositório: `negomapaangola-svg/NegoMapa-site`, branch `feat/eliminacao-conta`.
- PR: #38, aberto e em Draft.
- Supabase consultado em modo de leitura: projecto `sjelyaewgcmmtnudcgem`, PostgreSQL 17.6.1.
- 24 tabelas no schema `public`; RLS activa nas 24 tabelas consultadas.
- 12 buckets Storage observados; todos com `public = false`.
- As políticas actualmente observadas em `storage.objects` dão ownership por prefixo UID a cinco buckets de imagens e a `documentos-privados`; o bucket `produtos` usa o ID da empresa no primeiro segmento do path.
- Não foi encontrada política de ownership por utilizador para `company-files`, `empresas`, `profissionais`, `servicos` e `vagas`. Não inferir propriedade pelo nome do ficheiro ou por URL.
- O código actual em `src/lib/actions/conta.ts` apenas insere um pedido em `admin_messages`, depois de o utilizador escrever ELIMINAR. Não confirma a senha, não apaga Auth, SQL ou Storage.
- A função `admin_deactivate_account` é administrativa e desactiva estado; não é um fluxo de auto-eliminação.
- As migrações administrativas existentes `20261114190000` e `20261115080000` não constituem a implementação de auto-eliminação.
- A migração histórica `20261009_create_storage_buckets.sql` declara expressamente que as suas políticas e buckets não reflectem o estado actual de produção; não deve ser reutilizada para inferir propriedade nem reaplicada.

Esta auditoria descreve metadados e estruturas, não consulta conteúdo pessoal de utilizadores. As regras de retenção abaixo são propostas de tratamento, não parecer jurídico.

## 2. Percurso de cada categoria de dados

| Tabela / fonte | Dados e percurso | Referências de terceiros / dependências | Tratamento proposto |
|---|---|---|---|
| `auth.users` | Email, telefone, credenciais geridas por Auth, metadados e sessões; identidade central de autenticação | Referenciada por perfis, candidaturas, mensagens, pedidos, denúncias, avaliações e comunicações | Revogar sessões e bloquear operações no início; eliminar Auth apenas no fim, depois de SQL e Storage concluídos. Sem hard delete de Auth enquanto existirem FKs não tratadas. |
| `profiles` | Nome, telefone, WhatsApp, avatar, localização, coordenadas aproximadas e consentimento | PK `id` ligada a Auth; `preferencias_cliente` depende do perfil | Apagar PII e perfil na fase SQL final; preservar apenas identificador aleatório da operação na auditoria. Não manter motivo livre com PII. |
| `conta_detalhes` | Formação, preferências, disponibilidade e dados de empresa | `user_id` ligado a Auth | Eliminar imediatamente após confirmação; não é histórico partilhado. |
| `preferencias_cliente`, `preferencias_notificacao` | Preferências de categorias, canais e notificações | Referências ao utilizador/perfil e categorias globais | Eliminar preferências do titular; nunca apagar categorias. |
| `notificacoes` | Título, corpo, canal, referência e estado de leitura | `user_id` do titular; referência pode apontar para conteúdo de terceiros | Eliminar notificações recebidas pelo titular. Rever notificações emitidas a terceiros que incluam PII do titular; limpar apenas os campos pessoais necessários. |
| `profissionais` | Nome, contactos, bio, localização, BI, número de BI, avatar, portfólio, disponibilidade, categoria | Serviços, pedidos, conversas, avaliações e denúncias apontam para o profissional; categoria é referência global | Retirar perfil público e apagar campos pessoais/conteúdo próprio. Se pedidos ou litígios dependerem do ID, preservar registo mínimo anonimizado até decisão de retenção. Não apagar categoria. |
| `companies` | Nome, email, contactos, NIF, localização, website, descrição, logótipo, documentos e dados de legalização | Serviços, produtos, vagas, conversas, avaliações e denúncias apontam para empresa | Despublicar já; apagar perfil comercial e imagens próprias elegíveis. NIF, documentos fiscais/legais e transacções dependem de prazo legal por aprovar; não eliminar até decisão. |
| `servicos` | Título, descrição, preço, WhatsApp, localização e imagens/links próprios | Pedidos de serviço têm FK RESTRICT; avaliações/denúncias podem referenciar o serviço; empresa tem FK RESTRICT; categoria tem RESTRICT | Despublicar imediatamente. Apagar dados publicitários próprios apenas quando não houver pedido, disputa ou obrigação de retenção; senão anonimizar/desvincular com regra explícita. |
| `produtos`, `produto_imagens` | Anúncios, preço, descrição, imagens, URLs e metadados | Produto aponta para empresa e categoria; imagens fazem CASCADE pelo produto | Despublicar imediatamente; remover imagens/ficheiros próprios após confirmar path e ausência de retenção; manter categoria. Dados de transacção/garantia, se existirem noutros sistemas, exigem prazo aprovado. |
| `vagas` | Anúncio, requisitos, contactos e localização | Candidaturas referenciam vaga com CASCADE | Despublicar imediatamente. Não apagar vaga se isso apagar candidaturas de candidatos; preservar registo mínimo ou anonimizar a entidade empregadora após política de recrutamento aprovada. |
| `candidaturas` | Nome do candidato, mensagem, CV, contacto, estado e data | Candidato é titular em `user_id`; empresa e outros candidatos são terceiros via vaga | Se a conta eliminada é candidata: remover CV/contactos/nome e anonimizar o candidato, salvo prazo legal/contencioso aprovado. Se a conta eliminada é empresa: preservar candidaturas e dados dos candidatos; anonimizar apenas referências à empresa quando permitido. |
| `pedidos_servico` | Cliente, profissional, serviço, descrição, contacto, orçamento e data pretendida | Cliente é terceiro do profissional; FKs para profissional e serviço usam RESTRICT | Preservar o pedido do outro participante. Remover contacto e identificadores directos do titular; manter apenas dados mínimos necessários durante prazo aprovado. Não eliminar automaticamente pedido nem serviço referenciado. |
| `conversas` | Relação entre cliente, profissional e empresa | Conversa é partilhada por vários participantes; mensagens dependem dela por CASCADE | Preservar conversa para participantes restantes. Anonimizar a participação do titular; não apagar a conversa por inteiro. |
| `mensagens` | Texto, remetente, timestamps e leitura | Conversa partilhada e remetentes distintos | Preservar mensagens de terceiros. Para mensagens do titular, anonimizar remetente e remover PII directa do conteúdo apenas com regra de retenção/necessidade; mensagens não devem desaparecer por CASCADE ao apagar uma conversa. |
| `avaliacoes` | Autor, nota, comentário e alvo (profissional, empresa, serviço ou vaga) | Autor e entidade avaliada podem ser pessoas/empresas diferentes; FKs de alvo usam CASCADE | Se o titular é autor: remover autoria identificável e dados pessoais do comentário, preservando nota/conteúdo não identificável apenas se legítimo. Se o titular é avaliado: não apagar avaliação de terceiro; preservar registo ou desassociar alvo com política aprovada. |
| `denuncias` | Denunciante, motivo, detalhes, alvo, estado e resolução | Denunciante, denunciado e moderador são partes diferentes | Preservar evidência de terceiros e de moderação; pseudonimizar denunciante/titular. Conteúdo, anexos e prazo dependem de obrigação de investigação/defesa e decisão jurídica. |
| `admin_messages` | Remetente, destinatário, assunto, corpo e encadeamento | Conversa com administração pode conter dados do titular e de terceiros; `parent_id` usa SET NULL | Preservar a cadeia necessária para suporte/defesa; anonimizar remetente e remover PII não necessária. Prazo de retenção por decidir. Não apagar mensagens de terceiros. |
| `admin_account_deletion_audit`, `admin_users`, `admin_acessos_bi` | Auditoria administrativa e acesso a documentos de identificação | Dados administrativos e trilhos de acesso | Não eliminar por auto-serviço. A auditoria actual contém IDs e motivo; não a reutilizar para auto-eliminação sem revisão de minimização. Contas administrativas ficam fora do fluxo. |
| `contact_submissions` | Nome, email, telefone e mensagem de formulários de contacto | Não há FK de propriedade para Auth; não se pode associar com segurança por email | Não apagar por heurística. Política própria de retenção e processo de pedido separado. |
| `categorias`, `modelos_mensagem` | Dados de referência e templates globais | Partilhados por toda a plataforma | Nunca apagar na eliminação individual. |

## 3. Foreign keys observadas e impacto

As regras efectivas observadas no catálogo PostgreSQL incluem:

- **CASCADE:** `companies → produtos`, `companies → vagas`, `companies/profissionais → conversas`, `conversas → mensagens`, `profissionais → servicos`, alvos de `avaliacoes` e `denuncias`, `vagas → candidaturas`, `produtos → produto_imagens`, `profiles → preferencias_cliente`.
- **RESTRICT:** `pedidos_servico → profissionais`, `pedidos_servico → servicos`, `servicos → companies`, `servicos → categorias`.
- **NO ACTION:** `produtos → categorias`.
- **SET NULL:** `profissionais → categorias`, `admin_messages.parent_id → admin_messages.id`.

A regra CASCADE é apenas comportamento de integridade referencial e não autorização para apagar histórico de terceiros. O fluxo deve tratar explicitamente as relações antes de eliminar os registos-pai. Não alterar as FKs para CASCADE nem executar DELETE em cadeia.

## 4. Storage — buckets, ownership e percurso

Todos os 12 buckets observados são privados:

| Bucket | Ownership demonstrado pelas políticas actuais | Dados / decisão |
|---|---|---|
| `clientes-avatars` | Primeiro segmento do path = UID autenticado | Avatar próprio; elegível para remoção depois de confirmar path exacto. |
| `empresas-logos` | Primeiro segmento do path = UID autenticado | Logótipo próprio; elegível depois de despublicar e confirmar propriedade. |
| `profissionais-avatars` | Primeiro segmento do path = UID autenticado | Avatar próprio; elegível depois de despublicar e confirmar propriedade. |
| `profissionais-portfolio` | Primeiro segmento do path = UID autenticado | Portfólio próprio; verificar conteúdo de terceiros antes de remover. |
| `empresas-portfolio` | Primeiro segmento do path = UID autenticado | Portfólio próprio; verificar conteúdo de terceiros antes de remover. |
| `documentos-privados` | Primeiro segmento do path = UID autenticado; existe política de leitura administrativa específica | Inclui BI e documentos pessoais/legais. Não apagar documentos sujeitos a retenção ainda não definida. |
| `produtos` | Primeiro segmento do path = ID da empresa, com propriedade validada por `companies.user_id = auth.uid()` | Imagens de produto; confirmar relação produto/empresa e retenção antes da remoção. |
| `company-files` | Não foi encontrada política de ownership por utilizador na consulta actual | Bloquear remoção automática até mapear uploads, paths e referências de DB. |
| `empresas` | Não foi encontrada política de ownership por utilizador na consulta actual | Bloquear remoção automática até mapear uploads, paths e referências de DB. |
| `profissionais` | Não foi encontrada política de ownership por utilizador na consulta actual | Bloquear remoção automática até mapear uploads, paths e referências de DB. |
| `servicos` | Não foi encontrada política de ownership por utilizador na consulta actual | Bloquear remoção automática até mapear uploads, paths e referências de DB. |
| `vagas` | Não foi encontrada política de ownership por utilizador na consulta actual | Bloquear remoção automática até mapear uploads, paths e referências de DB. |

A política antiga em `20261009_create_storage_buckets.sql` descreve buckets públicos e políticas que não correspondem à produção. Não usar esse ficheiro como fonte de verdade. A eliminação Storage futura deve gerar um manifesto exacto `(bucket_id, name, owner_id, referência de DB)`, validar cada objecto contra o titular/entidade própria e remover apenas esses paths. Nunca usar `remove('')`, limpeza recursiva de bucket, prefixo aproximado ou URL pública como prova de propriedade. Os buckets permanecem privados.

**Discrepância adicional confirmada no código de upload:** `src/lib/actions/upload.ts` gera paths no formato `<auth.uid()>/<folder>/<UUID>.<extensão>` e declara `empresas-logos`, `profissionais-avatars`, `servicos-imagens`, `vagas-capas` e `documentos-privados`; também declara os primeiros quatro como públicos (excepto documentos). Na lista real de buckets de produção consultada, `servicos-imagens` e `vagas-capas` não existem; existem `servicos` e `vagas` (privados). Além disso, `empresas-logos` e `profissionais-avatars` também estão privados em produção, apesar de `isPublic: true` no helper. O helper não inclui `produtos`, cujo path usa ID da empresa. Isto demonstra que o código de upload e o estado real do Storage divergiram. Antes de remover qualquer ficheiro, é obrigatório reconciliar o bucket real, os chamadores, o path e a referência da linha de negócio; não corrigir esta divergência tornando buckets públicos.

## 5. Separação de tratamento

### A. Elegível para eliminação imediata após confirmação/reautenticação

- Sessões e refresh tokens do titular; bloquear novas operações e revogar sessões.
- `conta_detalhes`, `preferencias_cliente`, `preferencias_notificacao` e notificações próprias.
- Campos de perfil e dados de contacto directos, avatar e dados privados de perfil.
- Perfil público de profissional/empresa e conteúdo próprio que não tenha dependências, obrigações de retenção ou conteúdo de terceiros.
- Ficheiros nos buckets com ownership inequivocamente comprovado pelo UID/path e sem referência de retenção.
- CV, anexos e imagens exclusivamente próprios, apenas após confirmar titularidade e ausência de prazo/contencioso aplicável.

A remoção pública/despublicação deve ocorrer no início do processo; a eliminação física ocorre depois do inventário e dos controlos de integridade.

### B. Anonimizar, preservando a relação e o histórico de terceiros

- Participante em `conversas` e autor em `mensagens`.
- Autor em `avaliacoes`, mantendo apenas nota/comentário não identificável se permitido.
- Autor/denunciante em `denuncias`, sem apagar evidência de terceiros ou moderação.
- Candidato em `candidaturas`, quando a retenção e defesa de terceiros o justifiquem.
- Participante/autor em `pedidos_servico` e `admin_messages`.
- Referências a uma empresa/profissional eliminados em registos históricos de terceiros, sem remover candidaturas, pedidos ou mensagens dos restantes participantes.

A anonimização deve remover identificadores directos e indirectos, conteúdo pessoal em texto livre e caminhos de ficheiros. Substituir um nome por hash determinístico não é anonimização; no máximo é pseudonimização.

### C. Dependente de prazo legal/operacional ainda por decidir

Não executar eliminação física nem fixar prazos até decisão documentada, idealmente validada por assessoria jurídica em Angola:

- NIF, documentos de legalização, facturação, registos contabilísticos/fiscais e comprovativos de empresa.
- BI, número de BI e imagens de identificação profissional.
- Candidaturas, CV, decisões de recrutamento e histórico laboral.
- Pedidos de serviço, orçamentos, pagamentos/garantias e disputas.
- Conversas e mensagens necessárias para prova contratual, suporte ou defesa.
- Avaliações contestadas, denúncias, moderação, fraude e litígios.
- Comunicações administrativas e trilhos de auditoria.
- Backups, logs e cópias de segurança: definir janela de expiração e impedir recuperação para uso corrente após eliminação.

Até haver política aprovada, o comportamento seguro é despublicar, bloquear acesso do titular e colocar os dados sujeitos a retenção numa lista de pendências controlada, com acesso mínimo — não apagar nem conservar indefinidamente sem prazo.

## 6. Plano de implementação

1. Criar endpoint/Server Action autenticado; obter o alvo exclusivamente de `auth.getUser()`, nunca de ID enviado pelo cliente.
2. Exigir reautenticação recente (senha confirmada server-side ou fluxo OTP adequado), confirmação inequívoca e idempotency key. Não guardar senha nem motivo livre.
3. Recusar contas presentes em `admin_users`; exigir que o titular tenha sessão válida e que a reautenticação seja recente.
4. Criar registo de operação com UUID aleatório, estado, timestamps, contagens e etapa; sem email, telefone, nome, motivo livre ou account_id em auditoria de retenção longa.
5. Marcar a operação como `pending`, bloquear novas escritas/publicações e revogar sessões; despublicar conteúdos elegíveis.
6. Construir um plano de execução explícito por conta (cliente/profissional/empresa), com dependências e manifesto de Storage; se existir dependência sem regra aprovada, interromper sem apagar.
7. Em transacção SQL, remover preferências/dados privados elegíveis e anonimizar apenas campos acordados, preservando linhas e relações de terceiros. Não executar chamadas Storage dentro da transacção SQL.
8. Remover objectos Storage pelo manifesto validado, com retry idempotente e registo de resultado por bucket/path sem persistir URL sensível em auditoria.
9. Só após confirmação de SQL e Storage, usar Admin API server-side para eliminar Auth; nunca expor service-role no browser.
10. Revogar cookies/sessões locais e terminar a sessão no cliente; mostrar estados `a processar`, `concluído` ou `falhou — contactar suporte`.
11. Se qualquer etapa externa falhar, manter estado pendente e permitir retry seguro; não restaurar automaticamente dados apagados nem declarar sucesso parcial.

## 7. Migração versionada e reversibilidade

A migração futura deve ser **aditiva** e não aplicar qualquer eliminação de utilizadores:

- Criar tabela privada de pedidos/estado de eliminação e tabela de itens/manifesto de Storage com RLS activa, sem acesso directo de `anon` ou `authenticated`.
- Criar funções de leitura/actualização apenas no schema privado, com `search_path = ''`, permissões EXECUTE mínimas e validação de `auth.uid()`; privilegiar `SECURITY INVOKER`. Se alguma etapa exigir `SECURITY DEFINER`, documentar necessidade, restringir EXECUTE, validar identidade dentro da função e executar advisors.
- Não alterar buckets, não tornar Storage público, não enfraquecer políticas RLS existentes e não mudar FKs para CASCADE.
- Índices por estado e timestamps; sem índices ou logs contendo PII desnecessária.
- Rollback estrutural: revogar EXECUTE, desactivar endpoint/feature flag e remover apenas funções/tabelas novas vazias. Nunca prometer que rollback da migração recupera Auth, ficheiros ou linhas apagadas.
- Recuperação antes da eliminação Auth: retomar a operação idempotente ou cancelar mediante revisão administrativa. Depois de Auth/Storage eliminados, recuperação apenas por backup/restauro controlado, com aprovação e registo; backups têm prazo de retenção próprio.
- Criar o ficheiro pelo Supabase CLI `supabase migration new <nome>` no ambiente de desenvolvimento, validar com `supabase migration list` e testar em DB local/branch isolada antes de considerar produção.

## 8. Testes necessários (apenas dados sintéticos, prefixo TESTE)

A matriz de teste deve cobrir cliente, profissional e empresa, cada um com registos e objectos Storage próprios e pelo menos um segundo utilizador TESTE como contraparte:

1. Reautenticação válida, senha errada, sessão expirada e confirmação ausente.
2. Conta administrativa recusada; utilizador não autenticado recusado.
3. Repetição da mesma solicitação/idempotency key sem duplicar operação.
4. Conta imediatamente impedida de publicar, escrever ou aceder após início.
5. Campos pessoais e preferências próprias eliminados.
6. Serviços/produtos/vagas despublicados sem apagar candidaturas/pedidos de terceiros.
7. Mensagens e conversas partilhadas preservadas; remetente anonimizado sem alterar os outros participantes.
8. Avaliações e denúncias de terceiros preservadas.
9. Ficheiros só removidos quando UID/company ownership e referência DB coincidem; objecto sem prova de ownership permanece.
10. Falha simulada Storage, falha Auth e retry idempotente; sem falso estado de sucesso.
11. RLS activa em todas as tabelas novas e antigas; nenhum acesso anon/auth directo à fila/manifesto.
12. Todos os buckets continuam privados.
13. Migração aplica numa base limpa e numa cópia de schema; rollback estrutural não restaura nem elimina dados existentes.
14. Build, TypeScript, ESLint nos ficheiros alterados e testes automatizados passam no commit final.

Nenhuma destas operações destrutivas deve ser testada na base de produção.

## 9. Bloqueios que continuam abertos

- Aprovação de prazos legais/operacionais de retenção para documentos, candidaturas, pedidos, mensagens, denúncias, avaliações e auditoria.
- Mapeamento de uploads e paths nos cinco buckets sem política de ownership por UID; os paths precisam de confirmação a partir de código e referências DB.
- Ambiente de execução: a criação de sandbox Vercel foi rejeitada pela API com HTTP 400; o checkout directo falhou por resolução DNS de `github.com`. A alternativa proposta é desenvolver por commits na branch via GitHub Contents API e executar CI no GitHub Actions; para testes de integração Supabase, adicionar job com Supabase CLI e stack local isolada. Não foi executado ainda.
- Não foi criado projecto/branch de desenvolvimento Supabase; qualquer branch remota pode implicar custo e exige confirmação do mecanismo de custos antes de criar.
- A migração de auto-eliminação e os testes ainda não existem.

**Conclusão:** inventário de schema, FKs, buckets e políticas observado actualizado; a política de retenção está separada em eliminação, anonimização e pendência legal. Não considerar a Fase 8 concluída nem pronta para revisão final até implementação, migração, CI e testes de integração sintéticos estarem aprovados.


## 10. Reconciliação de Storage e callers — verificação em 2026-11-18

### 10.1 Chamadores e configuração encontrados na branch

| Local | Referência/caller | Bucket | Path ou comportamento |
|---|---|---|---|
| `src/lib/actions/upload.ts` | helper `uploadFile` | `empresas-logos`, `profissionais-avatars`, `servicos-imagens`, `vagas-capas`, `documentos-privados` | Gera `<auth.uid>/<folder>/<uuid>.<ext>`; para quatro buckets de imagem chama `getPublicUrl`; para documentos devolve apenas o path. |
| `src/components/ui/FileUpload.tsx` | consumidor de `uploadFile` | `empresas-logos`, `profissionais-avatars`, `servicos-imagens`, `documentos-privados` | Declara os três primeiros como públicos; `vagas-capas` nem sequer está no tipo/config deste componente. O preview só usa URL quando `isPublic`; paths privados não são apresentados. |
| `src/app/cadastrar-servico/_components/ProfileForm.tsx` | uso encontrado de `FileUpload` | `profissionais-avatars` | Usa `folder="avatars"`; `handleAvatarUpload` grava apenas `result.url!` em `avatar_url`, não aceita `result.path`. Ao tornar o bucket privado, este handler e o modelo de dados têm de ser alterados em conjunto. |
| `src/app/cadastrar-empresa/page.tsx` | upload directo pelo cliente Supabase | `empresas-logos`, `documentos-privados` | Logótipo: `<uid>/logotipo-<timestamp>.<ext>`; comprovativo: `<uid>/legalizacao-<timestamp>.<ext>`. |
| `src/lib/actions/conversao-conta.ts` | persistência dos campos | — | Guarda `logoPath` em `companies.logo_url` e `documentoPath` em `companies.documento_legalizacao_path`. |
| `src/lib/actions/empresas.ts` | leitura administrativa | `empresas-logos`, `documentos-privados` | Usa `createSignedUrl` no servidor para abrir logótipo e comprovativo. |
| `src/app/empresa/[slug]/page.tsx` | página pública de empresa | — | Só apresenta `logo_url` quando `isHttpsUrl` é verdadeiro; um path Storage relativo não é convertido em URL assinada nesta página. |
| `src/app/profissional/[slug]/page.tsx` | página pública de profissional | — | Passa `avatar_url` directamente para `Avatar`/`AppImage`; não assina o path. |
| `src/components/ui/Avatar.tsx`, `CompanyLogo.tsx`, `AppImage.tsx` | renderização | — | `AppImage` passa a string directamente a `next/image`; não resolve paths privados. |
| `src/app/cadastrar-profissional/_components/etapas.tsx` | campo de foto do cadastro | — | A foto escolhida fica apenas no formulário; o texto da interface diz que ainda não é enviada. |

O helper inclui `servicos-imagens` e `vagas-capas`, mas o inventário de produção contém `servicos` e `vagas`. Não foi encontrado um formulário de criação de serviço/vaga que efectue upload para esses dois nomes. A pesquisa de código do GitHub não devolveu resultados indexados para os nomes; por isso, a tabela acima enumera os chamadores explícitos verificados e não afirma que a pesquisa indexada constitua uma varredura textual integral de todos os ficheiros.

### 10.2 Paths encontrados na base de dados — amostras anonimizadas

A consulta de produção foi apenas de leitura e ocultou o UID e os identificadores dos ficheiros:

- `companies.logo_url`: 3 valores não nulos. Dois têm formato `<uid>/logotipo-<timestamp>.jpg`; um tem formato legado `/api/imagens/empresas-logos/<id>/avatar/<id>.webp`.
- `profissionais.avatar_url`: 1 valor não nulo, formato legado `/api/imagens/profissionais-avatars/<id>/avatars/<id>.jpg`.
- `companies.documento_legalizacao_path`, `companies.documento_legalizacao_url`, `companies.documents_url`, `profiles.avatar_url` e `candidaturas.cv_url`: sem valores não nulos no resultado consultado.
- Objectos reais observados: 3 em `empresas-logos`, 1 em `profissionais-avatars`, 1 em `documentos-privados`. Os objectos observados começam por UID, mas a referência DB com rota `/api/imagens/...` não foi demonstrada como correspondência exacta ao objecto.
- Não existe no tree desta branch qualquer route handler `src/app/api/imagens/.../route.ts`; os dois formatos `/api/imagens/...` não têm endpoint correspondente nesta versão do código.

### 10.3 Apresentação proposta para buckets privados

1. Guardar sempre `bucket + object_path` em colunas dedicadas (não URL pública e não rota antiga). Normalizar valores antigos só depois de mapear cada um para um objecto real.
2. Para comprovativos, BI, CVs e documentos: não renderizar em páginas públicas; disponibilizar apenas a utilizadores autorizados, através de uma Server Action/Route Handler que valida sessão, papel, ownership e finalidade e gera URL assinada de curta duração.
3. Para logótipos/avatares usados em páginas públicas: manter o bucket privado e emitir URL assinada curta apenas depois de confirmar no servidor que a empresa/profissional está aprovado e publicado. Não devolver a service-role key ao browser. Se a URL expirar, a página volta a pedi-la ao endpoint autorizado.
4. Para previews de uploads ainda não enviados, usar apenas object URL local criada no browser e revogá-la quando deixar de ser usada; depois do upload, trocar por URL assinada.
5. `AppImage` deve receber uma URL assinada pronta ou um fallback; não deve tentar transformar um path Storage em URL pública.

### 10.4 Plano de reconciliação sem tocar em produção

- Fase A: manter os 12 buckets de produção privados; não criar aliases nem buckets novos.
- Fase B: corrigir o contrato de código para usar nomes reais (`servicos`, `vagas`) apenas após localizar todos os callers e confirmar políticas de ownership; remover os nomes antigos do helper.
- Fase C: centralizar uploads e paths em helper único, guardar bucket/path separados e migrar referências antigas por correspondência exacta com `storage.objects`. Paths sem correspondência ficam marcados para revisão manual e nunca entram no manifesto de eliminação.
- Fase D: criar endpoint servidor de URL assinada para imagens públicas publicadas e endpoint privado autenticado para documentos; não adicionar policy `anon SELECT`.
- Fase E: testar no Supabase local e Preview com dados TESTE, sem executar limpeza nesta etapa. Só depois apresentar migração para eventual aprovação de produção.

### 10.5 Runner Supabase local — preparado, validação pendente

- Adicionado `supabase/config.toml` com os 12 buckets observados configurados como privados, Auth local habilitado e confirmação de email desactivada apenas no stack local.
- Adicionado `.github/workflows/supabase-local.yml`, com Supabase CLI 3.2.0, stack Docker efémera no runner GitHub, sem `supabase link`, sem credenciais remotas e sem comandos de produção.
- Adicionado `supabase/tests/fase8_local_invariants.sql` para verificar aplicação das migrações, RLS em tabelas públicas, existência de Auth/Storage, conjunto exacto dos buckets e ausência de leitura anónima nos buckets de imagem privados.
- O job não cria utilizadores nem ficheiros. A etapa de testes funcionais com dados TESTE fica reservada à fase final.
- A migração histórica `20261009_create_storage_buckets.sql` contém SQL executável que cria `empresas-logos`, `profissionais-avatars` e `servicos-imagens` como públicos e adiciona policies de leitura sem restrição de papel, apesar do comentário de topo dizer “NÃO APLICAR”. O teste local foi desenhado para detectar esta divergência; não se deve editar essa migração histórica.
- O workflow ainda precisa de executar para comprovar se toda a cadeia de migrações inicia. Não foi executado rollback; a reversibilidade será revista estaticamente e, se necessário, validada numa execução isolada que não faça rollback de dados.

### 10.6 Estado desta etapa

Nenhuma conta, ficheiro ou dado foi criado ou eliminado. Nenhuma migração foi aplicada em produção. Nenhum bucket ou policy de produção foi alterado. A implementação de eliminação autónoma continua suspensa até o runner local passar e a divergência histórica de Storage estar resolvida por migração forward-only.


### 10.7 Histórico de migrações e impedimento do runner

- Primeira execução real do runner, Actions #44384295962, passou a validação de `config.toml` e iniciou a stack, mas falhou ao aplicar migrações: `duplicate key value violates unique constraint "schema_migrations_pkey"`, versão `20261003`.
- A árvore da branch contém vários prefixos duplicados: `20261003` (3 ficheiros), `20261011` (2), `20261012` (2), `20261027` (2), `20261028` (2), `20261101` (5), `20261110` (2) e `20261112` (3).
- A listagem read-only do histórico de migrações de produção devolveu versões únicas de 14 dígitos, começando em `20261027201608`; não contém uma versão `20261003`. O histórico remoto e os nomes/versões dos ficheiros locais não são directamente equivalentes.
- Não executar `db pull` ou `db push` para “corrigir” isto: `db pull` pode registar a migração no histórico remoto e `db push` pode alterar produção. Nenhum dos dois foi executado.
- Foi adicionado `.github/scripts/prepare-supabase-local.sh`: copia apenas a pasta `supabase/` para `$RUNNER_TEMP/negomapa-supabase-local` e renumera os ficheiros nessa cópia descartável, em ordem lexical, com versões únicas de 14 dígitos. Os ficheiros versionados na branch e o histórico de produção não são renomeados.
- O workflow executa a stack a partir dessa cópia temporária, sem `supabase link`, tokens ou credenciais remotas. A nova execução ainda está pendente/em curso; não declarar as migrações validadas até terminar.
- A configuração Auth local foi actualizada de `enable_signup` para `enabled`, para evitar a opção obsoleta indicada pelo CLI 3.2.0.

Não foi executado rollback nem qualquer comando que altere o Supabase de produção.


### 10.8 Caller concreto do avatar e efeito da privacidade

A inspecção do formulário confirmou que `src/app/cadastrar-servico/_components/ProfileForm.tsx` é o único import de `FileUpload` encontrado nos formulários/páginas inspeccionados. O componente envia para `profissionais-avatars/<uid>/avatars/<uuid>.<ext>`, mas o callback `handleAvatarUpload` guarda exclusivamente `result.url!`. O contrato privado deve passar a guardar `bucket + path`, com URL assinada obtida no servidor apenas para renderização. O `FileUpload` também só cria preview local quando `isPublic=true`; o preview deve passar a usar object URL local independentemente da privacidade do bucket.

Não foram encontrados usos concretos de `servicos-imagens` ou `vagas-capas` nos formulários de criação de serviços/vagas inspeccionados. `vagas-capas` não está sequer no tipo `AllowedBucket` de `FileUpload`; `servicos-imagens` está no tipo, mas sem consumidor de página identificado. Não criar esses buckets como solução de compatibilidade.


### 10.9 Segunda execução do runner — baseline ausente

- Actions #44384933082 executou o script de renumeração temporária e passou novamente `supabase config validate`.
- O CLI aplicou as primeiras seis migrações na cópia temporária com versões únicas de 14 dígitos; depois falhou em `20261011_create_vagas_module.sql` com `relation "public.companies" does not exist`.
- A branch contém migrações que alteram `companies`, mas não contém uma migração de criação dessa tabela nem um baseline completo do schema de produção. A produção tem `companies` e 24 tabelas públicas; o histórico remoto lista migrações posteriores, não a origem do baseline.
- Não é seguro fabricar uma tabela `companies` mínima só para fazer o teste avançar: migrações posteriores dependem de colunas, constraints, funções e políticas do schema real. Também não é seguro usar `db pull` ou `db push` contra produção para corrigir o estado.
- Resultado: o runner está configurado e prova que a cadeia versionada actual não é reproduzível numa base vazia. A validação de RLS/Auth/Storage ainda não foi alcançada; os passos foram ignorados depois da falha de arranque. Não declarar a migração nem o ambiente validados.
- Para desbloquear: obter e versionar um baseline de schema aprovado (sem dados) que corresponda ao schema de produção, ou criar uma suite isolada que teste apenas a migração da Fase 8 contra fixtures explicitamente documentadas e completas. Até existir esse baseline, a implementação de eliminação autónoma permanece suspensa.


### 10.10 Comparação com o histórico de migrações remoto (consulta read-only)

- O histórico remoto consultado através da API de migrações do Supabase começa em `20261027201608` (`protect_profiles_is_admin`) e inclui 61 versões até `20261118193717`.
- O repositório contém migrações antigas de 2026-10-03 a 2026-10-21 que não aparecem no histórico remoto actual, e as versões/nomeações posteriores também não correspondem exactamente às versões remotas (o CLI local vê os nomes de ficheiro como versões).
- A tabela `public.companies` já existe em produção, mas não há no conjunto de migrações versionadas da branch uma migração inicial que a crie. A primeira cadeia local falha quando `20261011_create_vagas_module.sql` tenta criar uma FK para `public.companies`.
- A renumeração em cópia temporária resolve apenas duplicados/versões com formato antigo; não cria o baseline ausente e não deve ser confundida com reconciliação do histórico remoto.
- Não se deve marcar migrações antigas como aplicadas, inventar uma tabela mínima, ou copiar dados de produção para a suite. A solução correcta é obter um dump **apenas de schema**, revisto e aprovado, e versioná-lo como baseline sem dados, ou reconstruir uma baseline a partir de migrations autoritativas antes de retomar a suite.
- Até esse baseline existir, não há evidência local de migrações completas, RLS, Auth e Storage. O workflow mantém falha explícita para impedir falso positivo.
