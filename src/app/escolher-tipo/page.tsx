import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { EscolhaTipoConta } from '@/components/perfil/EscolhaTipoConta'
export const metadata:Metadata={title:'Escolhe o tipo de conta',description:'Escolha como pretende utilizar a NegóMapa.',robots:{index:false,follow:false}}
const opcoes=[
 {tipo:'cliente' as const,sigla:'CL',titulo:'Cliente',descricao:'Descubra oportunidades e encontre o que precisa.',cor:'border-sky-200 bg-sky-50/60 dark:border-sky-900 dark:bg-sky-950/20',beneficios:['Encontrar serviços, profissionais e empresas','Explorar produtos e vagas','Guardar preferências e receber recomendações']},
 {tipo:'profissional' as const,sigla:'PR',titulo:'Profissional',descricao:'Apresente o seu trabalho e receba oportunidades.',cor:'border-teal-200 bg-teal-50/60 dark:border-teal-900 dark:bg-teal-950/20',beneficios:['Criar perfil profissional e publicar serviços','Receber pedidos na sua área de actuação','Mostrar o portfólio, construir reputação com avaliações e receber contactos por WhatsApp']},
 {tipo:'empresa' as const,sigla:'EM',titulo:'Empresa',descricao:'Dê visibilidade à empresa e encontre talento.',cor:'border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/20',beneficios:['Criar perfil público da empresa','Publicar produtos e vagas','Encontrar profissionais, gerir candidaturas e receber contactos por WhatsApp']},
]
export default async function EscolherTipoPage(){
 const user=await getUser()
 if(!user) redirect('/login?redirectTo=/escolher-tipo')
 const supabase=await createSupabaseServerClient()
 const {data:perfil,error}=await supabase.from('profiles').select('account_type').eq('id',user.id).maybeSingle()
 if(error) throw new Error('Não foi possível verificar o tipo de conta.')
 if(perfil?.account_type) redirect('/perfil')
 return <MainLayout><main id="main-content" className="min-h-[70vh] bg-cream px-4 py-12 dark:bg-navy-dark sm:py-16">
  <div className="mx-auto max-w-5xl">
   <header className="mx-auto mb-9 max-w-2xl text-center">
    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-600 dark:text-orange-300">Bem-vindo à NegóMapa</p>
    <h1 className="mt-3 text-3xl font-bold text-ink dark:text-cream sm:text-4xl">Escolhe o tipo de conta</h1>
    <p className="mt-3 text-neutral-600 dark:text-cream-text">Esta escolha só pode ser feita uma vez nesta fase.</p>
   </header>
   <div className="grid gap-5 md:grid-cols-3">
    {opcoes.map(o=><Card key={o.tipo} variant="liquid" padding="md" className={"flex h-full flex-col border " + o.cor}>
     <CardHeader><CardTitle as="h2" className="text-xl">{o.titulo}</CardTitle><CardDescription className="mt-1 min-h-10">{o.descricao}</CardDescription></CardHeader>
     <CardContent className="mt-auto"><ul className="mb-5 space-y-2 text-sm text-neutral-700 dark:text-cream-text">{o.beneficios.map((beneficio)=><li key={beneficio} className="flex gap-2"><span aria-hidden="true" className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60"/><span>{beneficio}</span></li>)}</ul><EscolhaTipoConta tipo={o.tipo} sigla={o.sigla}/></CardContent>
    </Card>)}
   </div>
   <p className="mt-7 text-center text-xs text-neutral-500 dark:text-neutral-400">A escolha não cria automaticamente um perfil profissional nem uma empresa.</p>
  </div>
 </main></MainLayout>
}