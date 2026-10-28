import { supabase } from '@/lib/supabase'

export default async function TestDbPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return (
      <div style={{ padding: '20px', fontFamily: 'monospace' }}>
        <h1>Teste de Conexão Supabase</h1>
        <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '4px', padding: '16px', marginBottom: '16px' }}>
          <h2 style={{ color: '#856404', marginTop: 0 }}>⚠ Configuração Necessária</h2>
          <p style={{ color: '#856404' }}>
            Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e/ou NEXT_PUBLIC_SUPABASE_ANON_KEY não estão definidas.
          </p>
          <p style={{ color: '#856404', marginBottom: 0 }}>
            Configure as variáveis no ambiente de deploy (Vercel) ou no .env.local para testar a conexão.
          </p>
        </div>
        <h2>Instruções:</h2>
        <ul>
          <li>Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local ou no painel da Vercel.</li>
          <li>Reinicie o servidor de desenvolvimento após adicionar as variáveis.</li>
        </ul>
      </div>
    )
  }

  const { data, error } = await supabase
    .from('companies')
    .select('id, name, slug, sector, province, is_approved')
    .limit(5)

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Teste de Conexão Supabase</h1>
      
      <h2>Resultado:</h2>
      {error ? (
        <p style={{ color: 'red' }}>ERRO: {error.message}</p>
      ) : (
        <div>
          <p style={{ color: 'green' }}>SUCESSO: Conexão ao Supabase funciona!</p>
          <p>Empresas encontradas: {data?.length || 0}</p>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
      
      <h2>Instruções:</h2>
      <ul>
        <li>Se vês "SUCESSO", a conexão está a funcionar.</li>
        <li>Se vês "ERRO", verifica as variáveis em .env.local.</li>
        <li>A tabela companies está vazia agora (0 empresas).</li>
      </ul>
    </div>
  )
}