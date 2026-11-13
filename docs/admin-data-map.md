# Mapa de dados e auditoria de segurança administrativa

> Auditoria de leitura realizada em 13-11-2026 no projecto Supabase `sjelyaewgcmmtnudcgem`, branch `feat/admin-painel-completo` baseada em `db925b4437ee907c6d3b1935d638345b6e1bd9c3`.
>
> Este documento descreve o esquema observado no momento da consulta. Não executa nem autoriza eliminações. A introspecção de catálogos pode ocultar detalhes de objectos internos dos esquemas `auth` e `storage`; as relações assinaladas como não verificadas exigem confirmação antes de qualquer futura operação destrutiva.

## 1. Inventário de tabelas públicas

| Tabela / vista | Colunas de ligação relevantes | Relação observada | RLS / políticas observadas | Risco de órfãos e acção futura |
|---|---|---|---|---|
| `profiles` | `id`, `avatar_url`, `account_type`, `is_admin` | `id` representa o utilizador Auth; FK não apareceu na introspecção pública | RLS: SELECT/UPDATE do próprio perfil; sem política administrativa genérica | Referência Auth sem FK visível; validar Auth e Storage separadamente |
| `admin_users` | `user_id` | PK e FK com CASCADE observada; alvo Auth não exposto pela introspecção | SELECT próprio | Fonte canónica de privilégios; não confiar em `profiles.is_admin` |
| `admin_acessos_bi` | `admin_user_id`, `profissional_id` | Sem FKs observadas | SELECT admin | Duas referências sem FK; futura limpeza deverá validar ambas |
| `profissionais` | `user_id`, `categoria_id`, `avaliado_por`, `avatar_url`, `portfolio`, `bi_foto_path` | `categoria_id` → categorias SET NULL; user/admin ids sem FK visível | RLS: admin ALL; dono INSERT/UPDATE/DELETE; SELECT anon/auth | Perfil ligado a Auth sem FK visível; ficheiros em Storage; categoria pode ficar NULL |
| `companies` | `user_id`, `decidido_por`, `logo_url`, `documents_url`, `documento_legalizacao_url`, `documento_legalizacao_path` | `user_id` sem FK visível; `decidido_por` sem FK confirmada na introspecção actual | RLS: admin SELECT/UPDATE/DELETE; dono INSERT/SELECT/UPDATE; anon apenas aprovadas | Empresa ligada a Auth sem FK visível; Storage e campos URL/path; validar antes de qualquer limpeza |
| `servicos` | `profissional_id`, `categoria_id`, `avaliado_por` | profissional CASCADE; categoria RESTRICT; avaliador sem FK | RLS: admin ALL; dono INSERT/UPDATE/DELETE; SELECT público/autenticado | Pedidos podem bloquear eliminação; categoria RESTRICT |
| `produtos` | `company_id`, `categoria_id`, `criado_por`, `avaliado_por` | empresa CASCADE; categoria NO ACTION; user/admin ids sem FK | RLS: admin ALL; dono INSERT/SELECT/UPDATE/DELETE; SELECT público condicionado | Imagens em `produto_imagens` e Storage; categoria pode bloquear operações |
| `produto_imagens` | `produto_id`, `url` | produto CASCADE | RLS: admin ALL; dono CRUD; SELECT público | Registo e objecto Storage são recursos distintos; verificar ambos |
| `vagas` | `company_id`, `avaliado_por` | empresa CASCADE; avaliador sem FK | RLS: admin ALL; dono CRUD; SELECT público/autenticado | Candidaturas dependem da vaga; FK CASCADE |
| `candidaturas` | `vaga_id`, `user_id`, `cv_url` | vaga CASCADE; user_id sem FK visível | RLS: candidato próprio, empresa dona, admin SELECT/UPDATE; sem DELETE autenticado | Referência Auth sem FK; CV é URL externa ou objecto não confirmado |
| `pedidos_servico` | `cliente_id`, `profissional_id`, `servico_id` | profissional RESTRICT; serviço RESTRICT; cliente sem FK visível | RLS: cliente/profissional/admin SELECT; cliente/profissional UPDATE; INSERT cliente | RESTRICT impede apagar profissional/serviço enquanto existirem pedidos |
| `conversas` | `cliente_id`, `profissional_id`, `empresa_id` | profissional CASCADE; empresa CASCADE; cliente Auth sem FK visível na consulta actual | RLS: participantes SELECT/INSERT; política admin foi removida | Conversas ligam utilizadores e perfis; mensagens dependem delas |
| `mensagens` | `conversa_id`, `remetente_id` | conversa CASCADE; remetente Auth sem FK visível na consulta actual | RLS: participantes SELECT/INSERT; destinatário pode marcar leitura; admin read foi removido | Remetente Auth não tem FK visível; não abrir conversas privadas aos administradores |
| `avaliacoes` | `user_id`, `profissional_id`, `company_id`, `servico_id`, `vaga_id` | profissional/empresa/serviço/vaga CASCADE; user_id sem FK visível | RLS: admin ALL; dono CRUD limitado; SELECT público de aprovadas | User Auth sem FK visível; avaliações dependem dos alvos |
| `denuncias` | `user_id`, `profissional_id`, `company_id`, `servico_id`, `vaga_id`, `resolvida_por` | profissional/empresa/serviço/vaga CASCADE; user/admin ids sem FK visível | RLS: autor INSERT/SELECT; admin SELECT/UPDATE/DELETE | Referências de autor/resolvedor sem FK; preservar trilho de auditoria |
| `notificacoes` | `user_id`, `referencia_id` | Sem FKs observadas | RLS: SELECT próprias e UPDATE de leitura própria | `referencia_id` é polimórfico e sem FK; user_id sem FK |
| `preferencias_cliente` | `user_id`, `categoria_id` | profiles CASCADE; categorias CASCADE | RLS: próprio CRUD | Apaga com profile/categoria via FK; validar se perfil tiver ligação Auth |
| `preferencias_notificacao` | `user_id` | Sem FK observada | RLS: próprio SELECT/INSERT/UPDATE | Pode ficar órfã após remoção Auth sem FK |
| `contact_submissions` | sem user_id; nome/email/telefone/mensagem | Sem ligação Auth | RLS: INSERT anon | Submissões de contacto não estão associadas a uma conta |
| `modelos_mensagem` | sem ligação directa a utilizador | Sem FKs observadas | RLS: SELECT admin | Dados de configuração; não eliminar como parte de conta |
| `categorias` | `id` | Referenciada por várias tabelas | RLS: admin ALL; SELECT anon/auth | RESTRICT/NO ACTION em serviços/produtos; não eliminar em limpeza de utilizador |

## 2. Relações por chave estrangeira observadas

| Origem.coluna | Destino.coluna | ON DELETE |
|---|---|---|
| avaliacoes.company_id | companies.id | CASCADE |
| avaliacoes.profissional_id | profissionais.id | CASCADE |
| avaliacoes.servico_id | servicos.id | CASCADE |
| avaliacoes.vaga_id | vagas.id | CASCADE |
| candidaturas.vaga_id | vagas.id | CASCADE |
| conversas.empresa_id | companies.id | CASCADE |
| conversas.profissional_id | profissionais.id | CASCADE |
| denuncias.company_id | companies.id | CASCADE |
| denuncias.profissional_id | profissionais.id | CASCADE |
| denuncias.servico_id | servicos.id | CASCADE |
| denuncias.vaga_id | vagas.id | CASCADE |
| mensagens.conversa_id | conversas.id | CASCADE |
| pedidos_servico.profissional_id | profissionais.id | RESTRICT |
| pedidos_servico.servico_id | servicos.id | RESTRICT |
| preferencias_cliente.categoria_id | categorias.id | CASCADE |
| preferencias_cliente.user_id | profiles.id | CASCADE |
| produto_imagens.produto_id | produtos.id | CASCADE |
| produtos.categoria_id | categorias.id | NO ACTION |
| produtos.company_id | companies.id | CASCADE |
| profissionais.categoria_id | categorias.id | SET NULL |
| servicos.categoria_id | categorias.id | RESTRICT |
| servicos.profissional_id | profissionais.id | CASCADE |
| vagas.company_id | companies.id | CASCADE |
| admin_users.user_id | Auth user (alvo não exposto pela introspecção) | CASCADE |

Não foi observada FK para várias colunas que semanticamente apontam para utilizadores, nomeadamente `profiles.id`, `companies.user_id`, `profissionais.user_id`, `candidaturas.user_id`, `avaliacoes.user_id`, `notificacoes.user_id`, `preferencias_notificacao.user_id`, `conversas.cliente_id`, `mensagens.remetente_id` e os identificadores de auditoria. A ausência de FK não prova ausência de relação lógica.

## 3. Políticas RLS públicas observadas

- `admin_acessos_bi`: SELECT admin.
- `admin_users`: SELECT próprio.
- `avaliacoes`: admin ALL; autor CRUD limitado; leitura pública apenas de aprovadas.
- `candidaturas`: INSERT/SELECT candidato; SELECT empresa dona; SELECT admin; UPDATE empresa/admin.
- `categorias`: admin ALL; SELECT anon/auth.
- `companies`: admin SELECT/UPDATE/DELETE; dono INSERT/SELECT/UPDATE; anon SELECT aprovadas.
- `contact_submissions`: INSERT anon.
- `conversas`: INSERT cliente e SELECT participante; a política administrativa ampla foi removida deliberadamente.
- `denuncias`: INSERT/SELECT autor; SELECT/UPDATE/DELETE admin.
- `mensagens`: INSERT/SELECT participante; UPDATE de leitura do destinatário; a política administrativa ampla foi removida deliberadamente.
- `modelos_mensagem`: SELECT admin.
- `notificacoes`: SELECT próprias e UPDATE própria de leitura.
- `pedidos_servico`: INSERT cliente; SELECT cliente/profissional/admin; UPDATE cliente/profissional.
- `preferencias_cliente`: CRUD próprio.
- `preferencias_notificacao`: SELECT/INSERT/UPDATE próprio.
- `produto_imagens`: admin ALL; dono CRUD; leitura pública.
- `produtos`: admin ALL; dono CRUD; leitura pública sujeita à política.
- `profiles`: SELECT/UPDATE próprio.
- `profissionais`: admin ALL; dono CRUD; leitura anon/auth.
- `servicos`: admin ALL; dono CRUD; leitura anon/auth.
- `vagas`: admin ALL; dono CRUD; leitura anon/auth.

As políticas de Storage estão definidas em `storage.objects` e foram observadas para os buckets `documentos-privados`, `empresas-logos`, `profissionais-avatars`, `profissionais-portfolio` e `produtos`. As políticas incluem acesso por proprietário, leitura pública condicionada à aprovação e acesso administrativo para alguns buckets. As políticas completas devem ser consultadas na migração ou no catálogo do projecto antes de qualquer alteração.

## 4. Funções SECURITY DEFINER e triggers

Funções administrativas e auxiliares observadas incluem:
- `public.is_admin()`: SECURITY DEFINER; verifica `admin_users.user_id = auth.uid()`. Esta é a fonte de verdade a manter.
- `public.admin_obter_empresa(uuid)`: SECURITY DEFINER; na versão auditada verifica `profiles.is_admin`, criando a inconsistência que esta fase corrige.
- `public.admin_listar_profissionais()` e `public.admin_avaliar_profissional(uuid,text,text)`: SECURITY DEFINER; ambas verificam `public.is_admin()`.
- `public.conversa_participante(uuid)`, `perfil_profissional_aprovado(uuid)`, `empresa_aprovada(uuid)`, `vaga_disponivel_para_candidatura(uuid)` e `empresa_dona_da_vaga(uuid)`: SECURITY DEFINER, auxiliares de RLS.
- `public.imagem_publica_aprovada(text,text)` e `caminho_documento_admin_visivel(text)`: SECURITY DEFINER para Storage.
- `public.produtos_proteger_estado()`: SECURITY DEFINER; define estado de aprovação e exige pelo menos uma imagem na aprovação.
- Outras funções SECURITY DEFINER de Auth/Storage pertencem à infraestrutura Supabase. Não devem ser alteradas por esta fase.

Triggers públicos observados:
- `pedidos_servico`: valida coerência de serviço/profissional e transições de estado.
- `produto_imagens`: valida limite e mínimo de imagens.
- `produtos`: actualiza timestamp e protege estado de aprovação.
- `profiles`: actualiza updated_at.
- `profissionais`: protege avaliação/estado e updated_at.
- `servicos`: protege avaliação/estado e updated_at.
- `vagas`: protege avaliação/estado e updated_at.

Os triggers internos de `storage.buckets` e `storage.objects` são geridos pelo Supabase Storage e não fazem parte da aplicação.

## 5. Storage e ficheiros associados

Buckets observados (todos privados):
- `company-files`
- `documentos-privados` (PDF/JPEG/PNG, limite 10 MiB)
- `empresas`
- `empresas-logos` (PNG/JPEG/WebP, limite 2 MiB)
- `produtos` (WebP/JPEG/PNG, limite 5 MiB)
- `profissionais`
- `profissionais-avatars` (PNG/JPEG/WebP, limite 1 MiB)
- `profissionais-portfolio` (PNG/JPEG/WebP, limite 5 MiB)
- `servicos`
- `vagas`

No momento da auditoria, foram observados 3 objectos no total nos buckets consultados: 1 em `documentos-privados` e 2 em `empresas-logos`. Os nomes dos objectos não são reproduzidos aqui. O primeiro segmento do caminho tinha formato UUID nos três casos; isso é apenas uma convenção de caminho, não uma FK nem prova de propriedade. Não foram encontrados objectos nos restantes buckets na consulta agregada.

Campos que guardam referências de ficheiros/URLs:
- `profiles.avatar_url`
- `profissionais.avatar_url`, `profissionais.portfolio`, `profissionais.bi_foto_path`
- `companies.logo_url`, `documents_url`, `documento_legalizacao_url`, `documento_legalizacao_path`
- `empresas_publicas.logo_url` (vista)
- `produto_imagens.url`, `produto_imagens_publicas.url` (vista)
- `candidaturas.cv_url`

Antes de uma futura eliminação, será necessário resolver cada referência para bucket/objecto e distinguir URLs externas de objectos internos. A Storage API deve ser usada para remover objectos; apagar linhas SQL em `storage.objects` não substitui a remoção correcta dos ficheiros.

## 6. Relações com Supabase Auth

- `admin_users.user_id` é a associação de autorização administrativa e tem CASCADE reportado na constraint, mas o catálogo consultado não expôs o alvo da FK.
- `profiles.id`, `companies.user_id`, `profissionais.user_id`, `candidaturas.user_id`, `avaliacoes.user_id`, `notificacoes.user_id`, `preferencias_notificacao.user_id`, `conversas.cliente_id` e `mensagens.remetente_id` são relações lógicas com Auth sem FK visível na introspecção actual.
- Não foi encontrada uma tabela de utilizadores independente da Auth; `profiles` guarda dados de perfil e tipo de conta.
- A eliminação de um utilizador Auth não pode ser considerada segura apenas com base em cascatas SQL. É necessária uma futura matriz de dependências e tratamento coordenado de Storage/Auth.

## 7. Decisões de segurança para esta fase

1. `admin_users` + `public.is_admin()` é a única fonte de autorização administrativa.
2. `profiles.is_admin` não será usado para conceder privilégios.
3. O painel e todas as acções administrativas novas verificam o utilizador no servidor.
4. As mensagens administrativas terão tabelas e políticas próprias; não se reabre o acesso administrativo às conversas privadas existentes.
5. Não haverá eliminação permanente de contas nem alterações destrutivas nesta fase.
6. Métricas sem fonte fiável (visitantes totais/activos, por exemplo) devem ser apresentadas como indisponíveis, nunca estimadas.
7. Alterações de aprovação de conteúdo não devem contornar os triggers de integridade nem a exigência de imagens dos produtos.

## 8. Limitações da auditoria

- As consultas foram de leitura e não modificaram dados.
- Catálogos do Supabase podem omitir detalhes de relações internas de `auth`; a FK de `admin_users` foi reportada como CASCADE, mas o alvo não foi exposto.
- As referências em texto/JSON/URLs e caminhos Storage não são integralmente inferíveis por FKs.
- As políticas e triggers de Storage são extensas e geridas parcialmente pelo serviço; devem ser novamente inspeccionadas antes de qualquer operação destrutiva.
