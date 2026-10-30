import type { ReactNode } from 'react';

interface HomeSectionProps {
  id: string;
  titulo: string;
  descricao?: string;
  children: ReactNode;
}

export function HomeSection({ id, titulo, descricao, children }: HomeSectionProps) {
  return (
    <section className="nm-sec" aria-labelledby={id}>
      <div className="nm-sec-head">
        <h2 id={id}>{titulo}</h2>
        {descricao && <p>{descricao}</p>}
      </div>
      {children}
    </section>
  );
}

interface EstadoVazioProps {
  titulo: string;
  texto: string;
  erro?: boolean;
  children?: ReactNode;
}

/** Estado vazio explícito: não substitui dados por exemplos. */
export function EstadoVazio({ titulo, texto, erro, children }: EstadoVazioProps) {
  return (
    <div role="status" className="nm-empty">
      <strong>{erro ? 'Não foi possível carregar esta secção' : titulo}</strong>
      <p>{erro ? 'Tente novamente dentro de instantes.' : texto}</p>
      {children && <div className="nm-acoes">{children}</div>}
    </div>
  );
}
