import { supabase } from '@/lib/supabase'

export default async function TestDbPage() {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
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