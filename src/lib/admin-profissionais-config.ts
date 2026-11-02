// Ativar só depois de aplicar a migração 20261102130000_admin_profissionais_suspenso_categoria.sql
// em produção e de validar a suspensão. Enquanto for false, o botão Suspender fica
// desativado na interface e a ação recusa o estado 'suspenso' no servidor.
export const SUSPENSAO_DISPONIVEL = false
