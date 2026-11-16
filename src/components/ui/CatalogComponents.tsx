'use client';

import type { FormEvent, ReactNode } from 'react';
import Link from 'next/link';
import { AppImage } from './AppImage';
import { Avatar } from './Avatar';
import { CompanyLogo } from './CompanyLogo';
import { Button } from './Button';
import { Card } from './Card';
import { Badge } from './Badge';
import { Rating } from '@/components/avaliacoes/Rating';
import { cn, formatCurrency } from '@/lib/utils';

export function PageHeader({ title, description, eyebrow, action, className }: {
  title: string; description?: string; eyebrow?: string; action?: ReactNode; className?: string;
}) {
  return <header className={cn('flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}>
    <div className="min-w-0">{eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-[.14em] text-orange-600 dark:text-orange-300">{eyebrow}</p>}
      <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-cream sm:text-3xl">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600 dark:text-cream-text">{description}</p>}
    </div>{action && <div className="shrink-0">{action}</div>}
  </header>;
}

export function SearchBar({ action = '/descobrir', defaultValue = '', placeholder = 'O que procura?', className, onSearch }: {
  action?: string; defaultValue?: string; placeholder?: string; className?: string; onSearch?: (term: string) => void;
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    if (!onSearch) return;
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSearch(String(data.get('q') ?? '').trim());
  }
  return <form role="search" action={action} method="get" onSubmit={submit} className={cn('flex flex-col gap-2 rounded-2xl border border-card-border bg-white/90 p-2 shadow-sm dark:bg-neutral-900 sm:flex-row', className)}>
    <label className="sr-only" htmlFor="catalog-search">Pesquisar</label>
    <input id="catalog-search" name="q" type="search" defaultValue={defaultValue} placeholder={placeholder} maxLength={100}
      className="min-h-11 min-w-0 flex-1 rounded-xl bg-transparent px-3 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:text-cream" />
    <Button type="submit" size="md" className="min-h-11 sm:min-w-28">Pesquisar</Button>
  </form>;
}

export function FilterChips({ items, value, onChange, className }: {
  items: Array<{ label: string; value: string; href?: string }>; value?: string; onChange?: (value: string) => void; className?: string;
}) {
  return <div className={cn('flex flex-wrap gap-2', className)} aria-label="Filtros rápidos">
    {items.map((item) => item.href ? <Link key={item.value} href={item.href} aria-current={value === item.value ? 'page' : undefined}
      className={cn('inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500',
        value === item.value ? 'border-orange-500 bg-orange-500 text-white' : 'border-card-border bg-white text-ink hover:border-orange-400 dark:bg-neutral-900 dark:text-cream')}>
      {item.label}
    </Link> : <button key={item.value} type="button" aria-pressed={value === item.value} onClick={() => onChange?.(item.value)}
      className={cn('inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500',
        value === item.value ? 'border-orange-500 bg-orange-500 text-white' : 'border-card-border bg-white text-ink hover:border-orange-400 dark:bg-neutral-900 dark:text-cream')}>
      {item.label}
    </button>)}
  </div>;
}

export function SettingsSheet({ title = 'Filtros e definições', children, className }: {
  title?: string; children: ReactNode; className?: string;
}) {
  return <details className={cn('group rounded-2xl border border-card-border bg-white dark:bg-neutral-900', className)}>
    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-ink marker:hidden dark:text-cream">
      {title}<span aria-hidden="true" className="text-orange-600 transition-transform group-open:rotate-180">⌄</span>
    </summary>
    <div className="border-t border-card-border p-4">{children}</div>
  </details>;
}

export function ResultsHeader({ count, label = 'resultados', children, className }: {
  count: number; label?: string; children?: ReactNode; className?: string;
}) {
  return <div className={cn('mb-4 flex flex-wrap items-center justify-between gap-3', className)}>
    <p className="text-sm text-neutral-600 dark:text-cream-text" role="status" aria-live="polite">
      <strong className="font-semibold text-ink dark:text-cream">{count.toLocaleString('pt-AO')}</strong> {label}
    </p>{children}
  </div>;
}

export function InfoChip({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('inline-flex min-h-7 items-center rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200', className)}>{children}</span>;
}

export function RatingBadge({ average, total }: { average: number; total: number }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200" aria-label={total ? `Avaliação ${average.toFixed(1)} de 5, ${total} avaliações` : 'Sem avaliações'}>
    <span aria-hidden="true">★</span>{total ? average.toFixed(1).replace('.', ',') : 'Sem avaliações'}{total > 0 && <span className="font-normal opacity-75">({total})</span>}
  </span>;
}

export function AvailabilityDisplay({ available, label }: { available: boolean; label?: string }) {
  return <Badge variant={available ? 'approved' : 'neutral'}><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />{label ?? (available ? 'Disponível' : 'Indisponível')}</Badge>;
}

function whatsappHref(phone?: string | null, message?: string) {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (!digits) return undefined;
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
}

export function ContactCTA({ whatsapp, message = 'Olá! Encontrei o seu contacto no NegoMapa.', label = 'WhatsApp', className }: {
  whatsapp?: string | null; message?: string; label?: string; className?: string;
}) {
  const href = whatsappHref(whatsapp, message);
  if (!href) return null;
  return <a href={href} target="_blank" rel="noopener noreferrer" className={cn('inline-flex min-h-11 items-center justify-center rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2', className)}>
    {label}
  </a>;
}

export interface ProductCardData {
  name: string; description?: string | null; image?: string | null; href: string;
  price?: number | null; priceType?: string | null; priceLabel?: string;
  location?: string | null; fulfilment?: string | null; companyName?: string | null; companyHref?: string;
  whatsapp?: string | null;
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const price = product.priceLabel ?? (product.priceType === 'sob_consulta' || product.price == null ? 'Sob consulta' : formatCurrency(product.price));
  return <Card padding="none" className="flex h-full flex-col overflow-hidden">
    <Link href={product.href} className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500">
      <div className="aspect-[4/3] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        <AppImage src={product.image} alt={product.name} width={800} height={600} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" fallback={<span className="flex h-full items-center justify-center text-4xl text-neutral-400" aria-hidden="true">🛒</span>} />
      </div>
    </Link>
    <div className="flex flex-1 flex-col gap-2 p-4">
      <h3 className="line-clamp-2 text-base font-bold text-ink dark:text-cream"><Link href={product.href} className="hover:text-orange-600">{product.name}</Link></h3>
      {product.description && <p className="line-clamp-2 text-sm text-neutral-600 dark:text-cream-text">{product.description}</p>}
      <p className="text-lg font-bold text-orange-700 dark:text-orange-300">{price}</p>
      {product.location && <p className="text-sm text-neutral-600 dark:text-cream-text">⌖ {product.location}</p>}
      {product.fulfilment && <InfoChip>{product.fulfilment}</InfoChip>}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-card-border pt-3">
        {product.companyName && product.companyHref ? <Link href={product.companyHref} className="min-h-11 inline-flex items-center text-sm font-semibold text-ink hover:text-orange-600 dark:text-cream">{product.companyName}</Link> : <span />}
        <ContactCTA whatsapp={product.whatsapp} message={`Olá! Tenho interesse em ${product.name}.`} />
      </div>
    </div>
  </Card>;
}

export interface ServiceCardData {
  name: string; description?: string | null; image?: string | null; href: string;
  price?: number | null; priceType?: string | null; priceLabel?: string;
  location?: string | null; providerType?: string | null; providerName?: string | null;
  providerHref?: string; whatsapp?: string | null;
}

export function ServiceCard({ service }: { service: ServiceCardData }) {
  const price = service.priceLabel ?? (service.priceType === 'sob_consulta' || service.price == null ? 'Sob consulta' : formatCurrency(service.price));
  return <Card padding="none" className="flex h-full flex-col overflow-hidden">
    <Link href={service.href} className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500">
      <div className="aspect-[4/3] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        <AppImage src={service.image} alt={service.name} width={800} height={600} className="h-full w-full object-cover" fallback={<span className="flex h-full items-center justify-center text-4xl text-neutral-400" aria-hidden="true">🛠</span>} />
      </div>
    </Link>
    <div className="flex flex-1 flex-col gap-2 p-4">
      <h3 className="line-clamp-2 text-base font-bold text-ink dark:text-cream"><Link href={service.href} className="hover:text-orange-600">{service.name}</Link></h3>
      {service.description && <p className="line-clamp-2 text-sm text-neutral-600 dark:text-cream-text">{service.description}</p>}
      <p className="text-lg font-bold text-orange-700 dark:text-orange-300">{price}</p>
      {service.location && <p className="text-sm text-neutral-600 dark:text-cream-text">⌖ {service.location}</p>}
      {service.providerType && <InfoChip>{service.providerType}</InfoChip>}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-card-border pt-3">
        {service.providerName && service.providerHref ? <Link href={service.providerHref} className="min-h-11 inline-flex items-center text-sm font-semibold text-ink hover:text-orange-600 dark:text-cream">{service.providerName}</Link> : <span />}
        <ContactCTA whatsapp={service.whatsapp} message={`Olá! Tenho interesse no serviço ${service.name}.`} />
      </div>
    </div>
  </Card>;
}

export interface CompanyCardData {
  name: string; category?: string | null; location?: string | null; href: string;
  logo?: string | null; rating?: number; reviewCount?: number; whatsapp?: string | null;
}

export function CompanyCard({ company, contactAction }: { company: CompanyCardData; contactAction?: ReactNode }) {
  return <Card padding="md" className="flex h-full flex-col gap-3">
    <div className="flex items-start gap-3">
      <CompanyLogo src={company.logo} alt={company.name} name={company.name} width={56} height={56} className="h-14 w-14 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1"><h3 className="line-clamp-2 font-bold text-ink dark:text-cream"><Link href={company.href} className="hover:text-orange-600">{company.name}</Link></h3>
        {company.category && <p className="mt-1 text-sm text-neutral-600 dark:text-cream-text">{company.category}</p>}
      </div>
    </div>
    {company.location && <p className="text-sm text-neutral-600 dark:text-cream-text">⌖ {company.location}</p>}
    <div className="flex flex-wrap items-center justify-between gap-2">
      {typeof company.rating === 'number' ? <Rating media={company.rating} total={company.reviewCount ?? 0} size="sm" /> : <RatingBadge average={0} total={0} />}
      {contactAction ?? <ContactCTA whatsapp={company.whatsapp} />}
    </div>
  </Card>;
}

export interface ProfessionalCardData {
  name: string; service: string; location?: string | null; href: string;
  avatar?: string | null; available?: boolean; availabilityLabel?: string;
  rating?: number; reviewCount?: number; whatsapp?: string | null;
}

export function ProfessionalCard({ professional }: { professional: ProfessionalCardData }) {
  return <Card padding="md" className="flex h-full flex-col gap-3">
    <div className="flex items-center gap-3">
      <Avatar src={professional.avatar} alt={professional.name} name={professional.name} width={56} height={56} className="h-14 w-14 shrink-0" />
      <div className="min-w-0 flex-1"><h3 className="line-clamp-2 font-bold text-ink dark:text-cream"><Link href={professional.href} className="hover:text-orange-600">{professional.name}</Link></h3>
        <p className="mt-1 text-sm text-neutral-600 dark:text-cream-text">{professional.service}</p>
      </div>
    </div>
    {professional.location && <p className="text-sm text-neutral-600 dark:text-cream-text">⌖ {professional.location}</p>}
    {typeof professional.available === 'boolean' && <AvailabilityDisplay available={professional.available} label={professional.availabilityLabel} />}
    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-card-border pt-3">
      {typeof professional.rating === 'number' ? <Rating media={professional.rating} total={professional.reviewCount ?? 0} size="sm" /> : <span />}
      <ContactCTA whatsapp={professional.whatsapp} label="Enviar mensagem" />
    </div>
  </Card>;
}

export function LoadingSkeleton({ count = 3, className }: { count?: number; className?: string }) {
  return <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3', className)} aria-label="A carregar resultados" aria-busy="true">
    {Array.from({ length: Math.max(1, Math.min(count, 12)) }, (_, index) => <div key={index} className="overflow-hidden rounded-2xl border border-card-border bg-white dark:bg-neutral-900">
      <div className="aspect-[4/3] animate-pulse bg-neutral-200 dark:bg-neutral-800" />
      <div className="space-y-3 p-4"><div className="h-4 w-3/4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" /><div className="h-3 w-full animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" /><div className="h-3 w-1/2 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" /></div>
    </div>)}
  </div>;
}

export function ErrorState({ title = 'Não foi possível carregar os resultados', description = 'Verifique a ligação e tente novamente.', onRetry, className }: {
  title?: string; description?: string; onRetry?: () => void; className?: string;
}) {
  return <div role="alert" className={cn('rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/20', className)}>
    <h3 className="font-semibold text-red-900 dark:text-red-200">{title}</h3>
    <p className="mt-1 text-sm text-red-800 dark:text-red-300">{description}</p>
    {onRetry && <Button type="button" variant="outline" className="mt-4 min-h-11" onClick={onRetry}>Tentar novamente</Button>}
  </div>;
}
