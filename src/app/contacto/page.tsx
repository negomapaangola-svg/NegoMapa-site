import { Metadata } from 'next';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FormularioContacto } from './_components/FormularioContacto';

export const metadata: Metadata = {
  title: 'Contacto | NegóMapa',
  description: 'Entre em contacto com a equipa da NegóMapa.',
};

export default function ContactoPage() {
  return (
    <MainLayout>
      <section className="py-12 lg:py-16 bg-cream dark:bg-navy-dark">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Card variant="liquid" padding="lg">
            <CardHeader className="space-y-3">
              <CardTitle as="h1" className="text-3xl md:text-4xl">
                Contacto
              </CardTitle>
              <p className="text-neutral-600 dark:text-cream-text/80">
                Para dúvidas sobre a plataforma, pedidos relacionados com dados pessoais ou denúncias, utilize o
                formulário abaixo. Os dados enviados são usados apenas para responder à sua mensagem, conforme a Política
                de Privacidade.
              </p>
            </CardHeader>
            <CardContent className="mt-6 space-y-8">
              <div className="p-4 rounded-[4px] border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20 text-sm text-yellow-800 dark:text-yellow-300">
                Entidade responsável pela plataforma: a definir pelo responsável da NegóMapa antes da publicação.
              </div>
              <FormularioContacto />
            </CardContent>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
}
