import Link from 'next/link';
import { hrefDescobrir, type ParamsDescobrir } from '@/lib/descobrir/params';

export function SeparadoresTipo({ params }: { params: ParamsDescobrir }) {
  const separadores = [
    { tipo: 'servicos' as const, rotulo: 'Serviços' },
    { tipo: 'produtos' as const, rotulo: 'Produtos' },
  ];

  return (
    <nav aria-label="Tipo de resultados" className="mt-6 flex flex-wrap items-center gap-x-2 border-b border-card-border">
      {separadores.map((separador) => {
        const activo = params.tipo === separador.tipo;
        return (
          <Link
            key={separador.tipo}
            href={hrefDescobrir(params, { tipo: separador.tipo, pagina: 1 })}
            aria-current={activo ? 'page' : undefined}
            className={`inline-flex min-h-[44px] items-center border-b-2 px-4 ${activo ? 'border-orange-500 font-bold text-ink dark:text-cream' : 'border-transparent font-medium text-neutral-600 hover:text-orange-600 dark:text-cream-text/80 dark:hover:text-orange-300'}`}
          >
            {separador.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
