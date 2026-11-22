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
                Entre em contacto com a equipa da NegóMapa para dúvidas sobre a plataforma, suporte, privacidade,
                denúncias, violação de direitos autorais, marca ou propriedade intelectual.
              </p>
            </CardHeader>

            <CardContent className="mt-6 space-y-8">
              <div className="p-4 rounded-[4px] border border-card-border bg-white dark:bg-neutral-800 text-sm text-neutral-700 dark:text-cream-text">
                <p className="font-semibold">NegóMapa</p>
                <p className="mt-1">
                  Plataforma digital angolana de serviços, profissionais, empresas e oportunidades.
                </p>

                <div className="mt-4 space-y-2">
                  <p>
                    <strong>Responsável:</strong> Fred Tomás
                  </p>
                  <p>
                    <strong>E-mail:</strong>{' '}
                    <a href="mailto:negomapaangola@gmail.com" className="underline">
                      negomapaangola@gmail.com
                    </a>
                  </p>
                  <p>
                    <strong>WhatsApp:</strong>{' '}
                    <a href="https://wa.me/244926311857" className="underline">
                      926 311 857
                    </a>
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-[4px] border border-card-border bg-white dark:bg-neutral-800 text-sm text-neutral-700 dark:text-cream-text">
                <p className="font-semibold">Canais de apoio</p>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>Dúvidas sobre a utilização da plataforma.</li>
                  <li>Suporte para profissionais, empresas e clientes.</li>
                  <li>Pedidos relacionados com privacidade e dados pessoais.</li>
                  <li>Denúncias de conteúdo inadequado, fraude, spam ou conta falsa.</li>
                  <li>Denúncias de violação de direitos autorais, marca ou propriedade intelectual.</li>
                </ul>
              </div>

              <FormularioContacto />

              <p className="text-sm text-neutral-600 dark:text-cream-text/80">
                Os dados enviados através do formulário são utilizados apenas para responder ao seu pedido, nos
                termos da nossa Política de Privacidade.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
}
