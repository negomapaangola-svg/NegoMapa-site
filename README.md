# NegóMapa

Plataforma para encontrar serviços profissionais e oportunidades de emprego em Angola.

## Stack Tecnológica

- **Framework**: Next.js 16 (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS v4
- **Fontes**: Inter (via next/font)
- **Qualidade**: ESLint

## Estrutura do Projeto

```
src/
├── app/                    # App Router pages
│   ├── globals.css         # Estilos globais + design tokens
│   ├── layout.tsx          # Layout raiz
│   └── page.tsx            # Homepage
├── components/
│   ├── ui/                 # Componentes base reutilizáveis
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── index.ts
│   └── layout/             # Componentes de layout
│       ├── Header.tsx
│       ├── Footer.tsx
│       ├── MainLayout.tsx
│       └── index.ts
├── lib/
│   ├── design-tokens.ts    # Cores, tipografia, spacing, etc.
│   └── utils.ts            # Utilitários (cn, formatters, etc.)
├── styles/
│   └── liquid-glass.css    # Utilitários liquid glass
└── types/                  # Tipos TypeScript globais
```

## Identidade Visual

### Paleta de Cores
- **Primária**: Azul profissional (#0c8ce9) - confiança, tecnologia
- **Secundária**: Slate neutro - textos, fundos, bordas
- **Acento**: Laranja/terracota (#d9652a) - Angola, energia, ação
- **Sucesso/Alerta/Erro**: Semânticos padrão

### Liquid Glass
Usado **apenas** em elementos-chave:
- Navbar (`.liquid-glass-navbar`)
- Botões principais (`.liquid-glass-button`)
- Cards de destaque (`.liquid-glass-card`)
- Pequenos painéis (`.liquid-glass-panel`)

**NÃO usar** em: listas longas, formulários grandes, tabelas.

### Tipografia
- **Fonte**: Inter (variable font, otimizada)
- **Escala**: xs (0.75rem) → 5xl (3rem)
- **Pesos**: normal (400), medium (500), semibold (600), bold (700)

## Como Rodar Localmente

### Pré-requisitos
- Node.js 20+
- npm 10+

### Instalação
```bash
cd negomapa
npm install
```

### Desenvolvimento
```bash
npm run dev
```
Abre em http://localhost:3000

### Build de Produção
```bash
npm run build
npm run start
```

### Lint
```bash
npm run lint
```

## Princípios de Performance

1. **Next.js App Router** - RSC por padrão, streaming, suspense
2. **Tailwind CSS v4** - CSS-first, JIT, sem runtime
3. **Fontes otimizadas** - `next/font` com preload e display: swap
4. **Liquid glass seletivo** - Apenas 4 tipos de elementos
5. **Reduced motion** - Respeita `prefers-reduced-motion`
6. **High contrast** - Fallback automático via `prefers-contrast`
7. **Imagens** - Usar `next/image` com lazy loading

## Acessibilidade

- Semântica HTML5 correta
- Skip link no layout raiz
- Focus visible em todos os interativos
- ARIA labels onde necessário
- Contraste WCAG AA mínimo
- Suporte a modo escuro nativo

## Próximos Passos (Roadmap)

- [ ] Homepage completa com sections reais
- [ ] Página de Serviços (listagem, filtros, detalhes)
- [ ] Página de Empregos (listagem, filtros, detalhes)
- [ ] Cadastro de empresas/profissionais
- [ ] Painel admin
- [ ] Autenticação (NextAuth.js)
- [ ] Banco de dados (Prisma + PostgreSQL)
- [ ] Testes (Vitest + Playwright)

## Convenções de Código

- Componentes Client só quando necessário (`'use client'`)
- `cn()` para merge de classes Tailwind
- Props tipadas com interfaces
- Nomes descritivos, sem abreviações
- Comentários apenas para "porquê", não "o quê"

## Licença

Proprietário - NegóMapa