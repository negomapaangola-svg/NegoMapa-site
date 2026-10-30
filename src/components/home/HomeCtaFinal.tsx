import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import type { Perfil } from './constants';

interface Props {
  perfil: Perfil;
}

export function HomeCtaFinal({ perfil }: Props) {
  const conteudo =
    perfil === 'visitante'
      ? {
          titulo: 'Comece a usar a NegóMapa',
          texto: 'Crie a sua conta grátis e encontre serviços, profissionais, vagas e oportunidades em Angola.',
          acoes: [
            { href: '/login', label: 'Entrar', variant: 'outline' as const },
            { href: '/cadastrar-empresa', label: 'Criar conta grátis', variant: 'primary' as const },
          ],
        }
      : perfil === 'profissional'
        ? {
            titulo: 'Mantenha o seu perfil atualizado',
            texto: 'Um perfil completo recebe mais pedidos. Atualize os seus dados e a sua disponibilidade.',
            acoes: [
              { href: '/editar-perfil', label: 'Editar perfil', variant: 'outline' as const },
              { href: '/vagas', label: 'Ver vagas', variant: 'primary' as const },
            ],
          }
        : {
            titulo: 'Encontre o talento de que precisa',
            texto: 'Publique vagas e gerencie as suas candidaturas num só lugar.',
            acoes: [
              { href: '/empresa/painel/vagas/nova', label: 'Publicar vaga', variant: 'primary' as const },
              { href: '/empresa/painel/vagas', label: 'Gerir vagas', variant: 'outline' as const },
            ],
          };

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24" aria-labelledby="cta-final-title">
      <Card variant="liquid" padding="lg" className="max-w-3xl mx-auto text-center">
        <CardHeader>
          <CardTitle id="cta-final-title" className="text-2xl sm:text-3xl">
            {conteudo.titulo}
          </CardTitle>
          <CardDescription>{conteudo.texto}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {conteudo.acoes.map((a) => (
            <Button key={a.href} size="lg" variant={a.variant} asChild className="w-full sm:w-auto min-w-[180px]">
              <Link href={a.href}>{a.label}</Link>
            </Button>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
