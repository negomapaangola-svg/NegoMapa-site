import type { ReactNode } from 'react';
import { EmptyStateImage } from '@/components/ui/EmptyStateImage';

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
  /** Ilustração opcional do estado vazio (caminho em public/images). */
  imagem?: string;
  children?: ReactNode;
  imagem?: string;
  acao?: ReactNode;
}

/** Estado vazio explícito: não substitui dados por exemplos. */
export function EstadoVazio({ titulo, texto, erro, children, imagem, acao }: EstadoVazioProps) {
  return (
    <div role="status" className="nm-empty">
      {imagem && !erro && (
        <EmptyStateImage
          src={imagem}
          alt="Ilustração de estado vazio"
          width={240}
          height={180}
          className="nm-empty-imagem"
        />
      )}
      <strong>{erro ? 'Não foi possível carregar esta secção' : titulo}</strong>
      <p>{erro ? 'Tente novamente dentro de instantes.' : texto}</p>
      {(children || acao) && <div className="nm-acoes">{acao ?? children}</div>}
    </div>
  );
}
