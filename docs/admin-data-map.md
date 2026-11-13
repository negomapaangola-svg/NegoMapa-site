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

As políticas RLS públicas foram observadas com estes nomes: `admin_acessos_bi_select_admin`; `admin_users_select_own`; `avaliacoes_admin_all`, `avaliacoes_delete_own`, `avaliacoes_insert_own`, `avaliacoes_select_approved`, `avaliacoes_update_own`; `candidaturas_insert_candidato`, `candidaturas_select_admin`, `candidaturas_select_candidato`, `candidaturas_select_empresa`, `candidaturas_update_admin`, `candidaturas_update_empresa`; `categorias_all_admin`, `categorias_select_anon`, `categorias_select_auth`; `admin_delete_all_companies`, `admin_select_all_companies`, `admin_update_all_companies`, `anon_select_approved_companies`, `auth_insert_own_company`, `auth_select_approved_and_own_companies`, `auth_update_own_company_not_approved`; `Allow insert from anon`; `conversas_insert_cliente`, `conversas_select_participante`; `denuncias_delete_admin`, `denuncias_insert_own`, `denuncias_select_own_or_admin`, `denuncias_update_admin`; `mensagens_insert_participante`, `mensagens_select_participante`, `mensagens_update_lida_destinatario`; `modelos_mensagem_select_admin`; `notificacoes_select_proprias`, `notificacoes_update_propria_lida`; `pedidos_servico_insert_cliente`, `pedidos_servico_select_admin`, `pedidos_servico_select_cliente`, `pedidos_servico_select_profissional`, `pedidos_servico_update_cliente_cancelar`, `pedidos_servico_update_profissional`; `preferencias_cliente_delete_proprio`, `preferencias_cliente_insert_proprio`, `preferencias_cliente_select_proprio`, `preferencias_cliente_update_proprio`; políticas equivalentes de INSERT/SELECT/UPDATE próprio em `preferencias_notificacao`; `produto_imagens_all_admin`, `produto_imagens_delete_proprietario`, `produto_imagens_insert_proprietario`, `produto_imagens_select_proprietario`, `produto_imagens_select_publico`, `produto_imagens_update_proprietario`; `produtos_all_admin`, `produtos_delete_proprietario`, `produtos_insert_proprietario`, `produtos_select_proprietario`, `produtos_select_publico`, `produtos_update_proprietario`; `users_select_own_profile`, `users_update_own_profile`; `profissionais_all_admin`, `profissionais_delete_auth`, `profissionais_insert_auth`, `profissionais_select_anon`, `profissionais_select_auth`, `profissionais_update_auth`; `servicos_all_admin`, `servicos_delete_auth`, `servicos_insert_auth`, `servicos_select_anon`, `servicos_select_auth`, `servicos_update_auth`; `vagas_all_admin`, `vagas_delete_auth`, `vagas_insert_auth`, `vagas_select_anon`, `vagas_select_auth`, `vagas_update_auth`.

Políticas de `storage.objects` observadas: `documentos_privados_delete_owner`, `documentos_privados_insert_owner`, `documentos_privados_select_admin`, `documentos_privados_select_owner`, `documentos_privados_update_owner`; `empresas_logos_select_admin`; `imagens_dono_delete`, `imagens_dono_insert`, `imagens_dono_select`, `imagens_dono_update`, `imagens_publicas_aprovadas`; `produtos_storage_all_admin`, `produtos_storage_delete_proprietario`, `produtos_storage_insert_proprietario`, `produtos_storage_select_proprietario`, `produtos_storage_select_publico`, `produtos_storage_update_proprietario`. Todas usam roles anon/authenticated conforme indicado no catálogo. As expressões completas foram lidas do catálogo e devem ser novamente verificadas antes de qualquer alteração.

## 4. Funções SECURITY DEFINER e triggers

Todas as funções SECURITY DEFINER do esquema public observadas na auditoria: `admin_avaliar_produto(uuid,text,text)`, `admin_avaliar_profissional(uuid,text,text)`, `admin_listar_profissionais()`, `admin_obter_empresa(uuid)`, `admin_registar_acesso_bi_foto(uuid)`, `caminho_documento_admin_visivel(text)`, `conversa_participante(uuid)`, `criar_notificacao(uuid,text,text,text,text,uuid)`, `empresa_aprovada(uuid)`, `empresa_dona_da_vaga(uuid)`, `get_my_profissional_profile()`, `handle_new_user_profile_b2()`, `handle_updated_at()`, `imagem_publica_aprovada(text,text)`, `is_admin()`, `obter_bi_foto_proprio()`, `obter_bi_proprio()`, `obter_contacto_candidatura(uuid)`, `obter_minha_empresa()`, `perfil_profissional_aprovado(uuid)`, `produto_imagens_validar_limite()`, `produto_imagens_validar_minimo()`, `produtos_proteger_estado()`, `profissional_aprovado(uuid)`, `profissional_aprovado_id()`, `purgar_acessos_bi(integer,boolean)`, `rls_auto_enable()`, `vaga_disponivel_para_candidatura(uuid)` e `validar_servico_pedido()`.

Funções administrativas e auxiliares observadas incluem:
- `public.is_admin()`: SECURITY DEFINER; verifica `admin_users.user_id = auth.uid()`. Esta é a fonte de verdade a manter.
- `public.admin_obter_empresa(uuid)`: SECURITY DEFINER; na versão auditada verifica `profiles.is_admin`, criando a inconsistência que esta fase corrige.
- `public.admin_listar_profissionais()` e `public.admin_avaliar_profissional(uuid,text,text)`: SECURITY DEFINER; ambas verificam `public.is_admin()`.
- `public.conversa_participante(uuid)`, `perfil_profissional_aprovado(uuid)`, `empresa_aprovada(uuid)`, `vaga_disponivel_para_candidatura(uuid)` e `empresa_dona_da_vaga(uuid)`: SECURITY DEFINER, auxiliares de RLS.
- `public.imagem_publica_aprovada(text,text)` e `caminho_documento_admin_visivel(text)`: SECURITY DEFINER para Storage.
- `public.produtos_proteger_estado()`: SECURITY DEFINER; define estado de aprovação e exige pelo menos uma imagem na aprovação.
- Outras funções SECURITY DEFINER de Auth/Storage pertencem à infraestrutura Supabase. Não devem ser alteradas por esta fase.

Triggers públicos observados (nome → tabela → evento): `pedidos_servico_validar_servico` e `pedidos_servico_validar_transicao` → `pedidos_servico`; `trg_produto_imagens_validar_limite` e `trg_produto_imagens_validar_minimo` → `produto_imagens`; `trg_produtos_actualizar_timestamp` e `trg_produtos_proteger_estado` → `produtos`; `trg_profiles_updated_at_b2` → `profiles`; `trg_proteger_avaliacao_profissionais`, `trg_proteger_estado_profissionais`, `trigger_profissionais_updated_at` → `profissionais`; `trg_proteger_avaliacao_servicos`, `trg_proteger_estado_servicos`, `trigger_servicos_updated_at` → `servicos`; `trg_proteger_avaliacao_vagas`, `trg_proteger_estado_vagas`, `trigger_vagas_updated_at` → `vagas`.

Descrição funcional dos triggers públicos:
- `pedidos_servico`: valida coerência de serviço/profissional e transições de estado.
- `produto_imagens`: valida limite e mínimo de imagens.
- `produtos`: actualiza timestamp e protege estado de aprovação.
- `profiles`: actualiza updated_at.
- `profissionais`: protege avaliação/estado e updated_at.
- `servicos`: protege avaliação/estado e updated_at.
- `vagas`: protege avaliação/estado e updated_at.

Os triggers internos de `storage.buckets` e `storage.objects` são geridos pelo Supabase Storage e não fazem parte da aplicação. Os nomes observados incluem `enforce_bucket_name_length_trigger`, `enforce_versioning_status_transition`, `protect_active_lifecycle_states`, `protect_bucket_control_insert`, `protect_bucket_control_update`, `protect_bucket_control_update_role`, `protect_buckets_delete`, `wake_lifecycle_on_policy_write`, `wake_lifecycle_on_versioning_enable`, `protect_objects_delete` e `update_objects_updated_at`.

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


## 9. Revisão de segurança adicional — migração de fundação administrativa

Revisão baseada em catálogos e advisors do projecto original (leitura apenas; sem alterações à base de dados de produção).

### Políticas administrativas

As políticas admin_select_all_companies, admin_update_all_companies e admin_delete_all_companies são recriadas na migração para usar exclusivamente (SELECT public.is_admin()). A função consulta admin_users; profiles.is_admin deixa de ser uma fonte de autorização para empresas. A política users_update_own_profile continua a comparar o campo is_admin para impedir que o próprio utilizador altere esse atributo no seu perfil; essa comparação é uma salvaguarda anti-elevação, não uma concessão de privilégios.

As restantes políticas administrativas inventariadas já usam is_admin() (incluindo categorias, avaliações, candidaturas, denúncias, modelos de mensagem, pedidos de serviço, imagens de produto, produtos, profissionais, serviços e vagas). Devem ser verificadas novamente no ambiente isolado após a migração.

### Funções SECURITY DEFINER — classificação de permissões

A migração revoga EXECUTE a PUBLIC, anon e authenticated para funções exclusivamente de trigger/event trigger: handle_updated_at(), handle_new_user_profile_b2(), produto_imagens_validar_limite(), produto_imagens_validar_minimo(), produtos_proteger_estado(), validar_servico_pedido() e rls_auto_enable(). A nova função aprovar_produto_apos_primeira_imagem() também é exclusiva de trigger e tem EXECUTE revogado para os mesmos papéis.

As RPCs administrativas admin_avaliar_produto, admin_avaliar_profissional, admin_listar_profissionais, admin_registar_acesso_bi_foto, admin_obter_empresa, admin_dashboard_stats e admin_list_messages mantêm EXECUTE para authenticated, mas verificam internamente public.is_admin() antes de devolver dados ou executar alterações. A migração remove concessões a PUBLIC e anon nas RPCs explicitamente listadas.

As funções auxiliares usadas em políticas RLS permanecem executáveis pelos papéis necessários: conversa_participante verifica participação pelo utilizador autenticado; empresa_dona_da_vaga e get_my_profissional_profile limitam resultados ao proprietário; obter_minha_empresa, obter_bi_proprio, obter_bi_foto_proprio e profissional_aprovado_id limitam-se ao utilizador actual; empresa_aprovada, perfil_profissional_aprovado, profissional_aprovado e vaga_disponivel_para_candidatura devolvem apenas condições de aprovação; imagem_publica_aprovada verifica apenas se o objecto corresponde a conteúdo aprovado e permanece disponível a anon para a política de Storage. criar_notificacao e purgar_acessos_bi já não concedem EXECUTE a utilizadores comuns (service_role e owner, respectivamente).

### Vistas SECURITY DEFINER

| Vista | Propósito e colunas expostas | Acesso | Decisão |
|---|---|---|---|
| vagas_publicas | Projecção pública de título, descrição, requisitos, localização, contrato e salário de vagas aprovadas de empresas aprovadas | SELECT para anon/authenticated | Manter SECURITY DEFINER deliberadamente; não expõe email, contactos privados, documentos ou dados de conta |
| produtos_publicos | Projecção pública de produto: título, slug, descrição, preço, tipo, entrega e localização, apenas produtos aprovados de empresas aprovadas | SELECT para anon/authenticated | Manter SECURITY DEFINER deliberadamente; não expõe criador, empresa proprietária nem dados de conta |
| produto_imagens_publicas | ID, produto_id, URL e ordem de imagens de produtos aprovados de empresas aprovadas | SELECT para anon/authenticated | Manter SECURITY DEFINER deliberadamente; só expõe metadados de imagem pública aprovada |

As três vistas usam security_barrier=true; a migração revoga privilégios gerais e volta a conceder apenas SELECT a anon, authenticated e service_role. Mantém-se security_invoker=false intencionalmente: converter para invoker sem conceder privilégios adicionais sobre as tabelas-base quebraria a projecção pública; conceder SELECT amplo às tabelas-base exporia colunas privadas. O advisor security_definer_view pode continuar a reportar estas três vistas; é um aviso conhecido e documentado, não deve ser escondido nem interpretado como ausência de revisão.

### Limites de validação

A revisão acima é estática. A criação de uma branch Supabase isolada foi tentada, mas a API respondeu que branching só é suportado no plano Pro ou superior. Nenhuma migração foi aplicada à produção. As permissões e as políticas ainda precisam de ser confirmadas por execução numa branch isolada elegível, com sessões anon/authenticated representativas.


A migração também fixa search_path vazio nas RPCs administrativas SECURITY DEFINER relevantes e nas funções de trigger com objectos qualificados, reduzindo risco de resolução de objectos maliciosos em schemas graváveis. Os built-ins continuam disponíveis via pg_catalog.
