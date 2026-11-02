import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import type { ProfissionalPublico } from '@/lib/actions/profissionais-publicos';

/** Cartão da listagem: nome, área principal, localização e link. A bio não aparece aqui. */
export function ProfissionalCard({ profissional }: { profissional: ProfissionalPublico }) {
  const localizacao = [profissional.municipio, profissional.provincia].filter(Boolean).join(', ');

  return (
    <Link href={`/profissional/${profissional.slug}`} className="block h-full">
      <Card variant="liquid" padding="md" hover className="h-full flex flex-col border-card-border">
        <CardHeader>
          <CardTitle className="text-lg line-clamp-2">{profissional.nome}</CardTitle>
          {profissional.categoria && (
            <CardDescription className="text-sm">{profissional.categoria}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="mt-auto">
          {localizacao && (
            <p className="text-sm text-neutral-600 dark:text-cream-text">{localizacao}</p>
          )}
          <p className="mt-3 text-sm font-medium text-ink dark:text-cream">Ver perfil →</p>
        </CardContent>
      </Card>
    </Link>
  );
}
