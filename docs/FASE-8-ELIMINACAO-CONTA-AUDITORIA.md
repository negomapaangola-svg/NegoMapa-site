# Fase 8 — Auditoria de eliminação autónoma de conta

Estado: **bloqueada para implementação destrutiva**. Esta auditoria é apenas documental; nenhuma conta, linha de negócio, ficheiro Storage ou migração foi alterada.

## Evidência consultada

- Repositório: `negomapaangola-svg/NegoMapa-site`, branch criada a partir de `main`.
- Supabase: projecto `sjelyaewgcmmtnudcgem`, PostgreSQL 17.6.1.
- Tabelas públicas: 24 (inventário abaixo); todas as tabelas públicas consultadas têm RLS activo.
- A função existente `public.admin_deactivate_account(uuid,text,text,boolean)` apenas desactiva um perfil, exige admin, recusa auto-desactivação e não elimina Auth nem Storage.
- A configuração actual `/conta/configuracoes` oferece apenas um pedido de eliminação enviado a `admin_messages`; a interface avisa expressamente que não elimina dados nem Auth.
- Não foi encontrada função de auto-eliminação existente.
- Buckets Storage consultados: todos privados.

## Inventário de relações e tratamento proposto

| Área/tabela | Relações observadas | Tratamento proposto (não executado) |
|---|---|---|
| `profiles` | PK `id` também identifica Auth; `preferencias_cliente.user_id` CASCADE | Remover dados pessoais no final da operação; manter registo mínimo de auditoria sem PII. |
| `profissionais` | `user_id` Auth; serviços, conversas e avaliações referenciam perfil; categoria SET NULL | Remover perfil público e conteúdo próprio; preservar categorias globais. |
| `companies` | `user_id` Auth; serviços, produtos, vagas, conversas, avaliações e denúncias dependem da empresa | Retirar conteúdo público e tratar cada relação antes da empresa; não apagar conteúdo com dependências comerciais/legais sem política definida. |
| `servicos` | Profissional CASCADE; empresa RESTRICT; categoria RESTRICT; pedidos e avaliações dependem do serviço | Retirar publicação; preservar registos de pedidos sujeitos a retenção e desvincular/anonymizar com integridade. |
| `produtos`, `produto_imagens` | Produto → empresa CASCADE; imagens → produto CASCADE; categoria NO ACTION | Remover imagens e anúncios próprios; não apagar categorias globais. |
| `vagas`, `candidaturas` | Vaga → empresa CASCADE; candidatura → vaga CASCADE; candidatura contém user_id, nome, mensagem, CV e contacto | Eliminar/anonymizar candidatura do titular; conservar candidatura de terceiro quando a conta eliminada for a empresa, conforme política de recrutamento e retenção. |
| `pedidos_servico` | cliente_id, profissional_id e servico_id; profissional/serviço RESTRICT | Não apagar automaticamente. Manter histórico mínimo ou anonimizar campos pessoais após definir prazo e obrigações. |
| `conversas`, `mensagens` | Conversa liga cliente, profissional e empresa; mensagens ligam conversa e remetente; mensagens CASCADE pela conversa | Não apagar a conversa partilhada inteira por causa de um participante. Anonimizar o remetente e preservar conteúdo necessário/legítimo ou apagar apenas após regra de retenção aprovada. |
| `avaliacoes` | Autor `user_id`; referências a profissional/empresa/serviço/vaga com CASCADE | Preservar avaliação útil de terceiros, removendo identificadores do autor quando permitido; eliminar avaliações que só existam devido a entidade removida se não houver retenção aplicável. |
| `denuncias` | Autor `user_id`; alvos profissional/empresa/serviço/vaga com CASCADE | Preservar evidência de moderação e auditoria pelo prazo aprovado; pseudonimizar autor, não apagar denúncias de terceiros. |
| `notificacoes`, `preferencias_notificacao` | `user_id` directo; notificações contêm corpo e referência | Eliminar preferências e notificações do titular; limpar referências pessoais em notificações de terceiros se necessário. |
| `admin_messages` | remetente, destinatário e parent; comunicação com administração | Preservar trilho de suporte/auditoria pelo prazo aprovado; pseudonimizar autor, sem apagar mensagens recebidas por terceiros. |
| `admin_account_deletion_audit`, `admin_users`, `admin_acessos_bi` | auditoria administrativa e dados de acesso sensível | Não apagar por auto-serviço. Contas administrativas protegidas; reter trilho mínimo e remover segredos/PII desnecessários segundo política. |
| `categorias`, `modelos_mensagem` | Dados de referência e templates globais | Não são propriedade do utilizador; nunca apagar durante a eliminação individual. |
| `contact_submissions` | Formulário geral, sem FK de proprietário observada | Não associar nem apagar por heurística; requer regra própria de retenção. |
| `conta_detalhes` | `user_id` → Auth CASCADE | Eliminar dados privados do titular. |

## Foreign keys com regras que impedem CASCADE indiscriminado

- `pedidos_servico.profissional_id → profissionais.id`: RESTRICT.
- `pedidos_servico.servico_id → servicos.id`: RESTRICT.
- `servicos.company_id → companies.id`: RESTRICT.
- `servicos.categoria_id → categorias.id`: RESTRICT.
- `produtos.categoria_id → categorias.id`: NO ACTION.
- `admin_messages.parent_id → admin_messages.id`: SET NULL.
- Existem ainda relações CASCADE em avaliações, candidaturas, conversas, mensagens, denúncias, imagens de produtos e preferências; a regra de FK não determina, por si só, se apagar é juridicamente ou funcionalmente correcto.

## Storage — buckets privados observados

- `company-files`
- `documentos-privados`
- `empresas-logos`
- `profissionais-avatars`
- `profissionais-portfolio`
- `profissionais`
- `empresas`
- `servicos`
- `vagas`
- `produtos`

As políticas consultadas usam convenções diferentes: prefixo do UID para alguns ficheiros, ID da empresa para produtos e paths ligados a entidades para outros. Não é seguro remover todos os objectos cujo nome apenas pareça conter um UID. O bucket `documentos-privados` contém documentos de identificação e deve ter tratamento de retenção separado. Nenhum bucket foi tornado público.

## Plano de implementação seguro

1. Aprovar uma matriz de retenção para pedidos, candidaturas, conversas, mensagens, avaliações, denúncias, comunicações administrativas e documentos legais/fiscais.
2. Criar pedido de eliminação autenticado, com reautenticação recente (palavra-passe ou OTP), confirmação forte e idempotência; a identidade alvo deve vir exclusivamente do JWT validado.
3. Recusar auto-eliminação de contas administrativas e garantir autorização separada para a operação administrativa.
4. Fazer inventário transaccional de dependências e marcar a conta como em eliminação, impedindo novas publicações e escritas.
5. Apagar apenas conteúdo privado elegível e despublicar imediatamente conteúdo público próprio; preservar relações partilhadas e registos sujeitos a retenção mediante pseudonimização.
6. Remover objectos Storage por lista exacta de paths obtida a partir das tabelas e prefixos de propriedade validados. Não usar remoção recursiva de buckets.
7. Executar a limpeza SQL em transacção; guardar estado da operação sem PII para retoma idempotente.
8. Só depois da confirmação de Storage e SQL, eliminar Auth pelo Admin API. Revogar sessões antes e tratar falhas entre etapas com uma fila de retoma e estado observável.
9. Guardar auditoria mínima (ID aleatório de operação, timestamps, contagens e resultado), sem cópia de dados pessoais eliminados.
10. Testar com utilizadores, relações e ficheiros sintéticos num projecto/branch isolado; validar que um segundo utilizador e todos os dados partilhados permanecem intactos.

## Reversão e falhas parciais

- Antes da eliminação Auth: a operação deve poder ser retomada; não reactivar automaticamente a conta depois de apagar ficheiros.
- Após limpeza SQL mas antes de Auth: manter estado de eliminação pendente e repetir apenas a fase Auth.
- Após Auth mas com Storage pendente: executar limpeza Storage idempotente por lista persistida de paths sem restaurar a conta.
- A eliminação Auth é irreversível pelo fluxo normal; a recuperação depende de backup/restauro administrativo e não deve ser prometida ao utilizador.
- A migração futura deve ter rollback aditivo (revogar nova função/endpoint e remover objectos de configuração), sem recriar os dados eliminados.

## Bloqueios concretos antes de uma eliminação real

- Não existe política aprovada de retenção legal/operacional para pedidos, recrutamento, comunicações, avaliações, denúncias e documentos.
- O schema apresenta referências RESTRICT/NO ACTION e dados partilhados; a regra de negócio para os preservar/anonymizar ainda não existe.
- Os buckets e paths têm vários modelos de propriedade; a enumeração de todos os caminhos e metadados de cada bucket ainda precisa de validação por tabela e amostras controladas.
- Não há ambiente local/CLI disponível nesta execução para criar migração com `supabase migration new`, correr testes da aplicação, lint e build.
- Nenhuma conta sintética foi criada e nenhum dado real foi alterado.

**Resultado:** auditoria de schema e plano preliminar concluídos; implementação, testes de ponta a ponta, migração e eliminação Auth/Storage não concluídos. Não considerar esta fase aceite.
