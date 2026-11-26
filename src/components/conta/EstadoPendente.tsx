import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'

type Props = {
  /** Tipo de conta que está pendente: profissional ou empresa. */
  tipo: 'profissional' | 'empresa'
}

/**
 * Bloqueio visual para contas de profissional ou empresa ainda não aprovadas.
 * A conta pode ver o seu perfil, mas não pode publicar vagas, produtos ou serviços.
 */
export function EstadoPendente({ tipo }: Props) {
  const etiqueta = tipo === 'profissional' ? 'profissional' : 'empresa'
  return (
    <Card variant="outlined" padding="md" role="status" aria-live="polite" className="border-amber-300 dark:border-amber-700">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="pending">Pendente</Badge>
        <p className="font-semibold text-ink dark:text-cream">A sua conta está pendente de aprovação.</p>
      </div>
      <p className="mt-3 text-sm text-neutral-700 dark:text-cream-text">
        Enquanto a conta de {etiqueta} não for aprovada pela equipa NegóMapa, pode ver o seu perfil, mas não pode publicar
        vagas, produtos ou serviços, nem usar acções de negócio.
      </p>
    </Card>
  )
}
