import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { EscolhaTipoConta } from '@/components/perfil/EscolhaTipoConta'
export const metadata:Metadata={title:'Escolhe o tipo de conta',description:'Escolha como pretende utilizar a NegóMapa.',robots:{index:false,follow:false}}
const opcoes=[
 {tipo:'cliente' as const,sigla:'CL',titulo:'Cliente',descricao:'Encontre serviços, produtos e oportunidades perto de si.'},
 {tipo:'profissional' as const,sigla:'PR',titulo:'Profissional',descricao:'Crie o seu perfil, receba pedidos e construa reputação.'},
 {tipo:'empresa' as const,sigla:'EM',titulo:'Empresa',descricao:'Publique vagas, encontre talento e gere a sua empresa.'},
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
    {opcoes.map(o=><Card key={o.tipo} variant="liquid" padding="lg" className="flex h-full flex-col">
     <CardHeader><CardTitle as="h2" className="text-xl">{o.titulo}</CardTitle><CardDescription className="mt-2 min-h-12">{o.descricao}</CardDescription></CardHeader>
     <CardContent className="mt-auto"><EscolhaTipoConta tipo={o.tipo} sigla={o.sigla}/></CardContent>
    </Card>)}
   </div>
   <p className="mt-7 text-center text-xs text-neutral-500 dark:text-neutral-400">A escolha não cria automaticamente um perfil profissional nem uma empresa.</p>
  </div>
 </main></MainLayout>
}