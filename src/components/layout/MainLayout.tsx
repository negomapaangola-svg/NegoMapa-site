'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: ReactNode;
  className?: string;
  hideGlobalSearch?: boolean;
}

const ADMIN_LINKS = [
  { href: '/admin', label: 'Visão geral' },
  { href: '/admin/profissionais', label: 'Profissionais' },
  { href: '/admin/empresas', label: 'Empresas' },
  { href: '/admin/servicos', label: 'Serviços' },
  { href: '/admin/vagas', label: 'Vagas' },
  { href: '/admin/conteudos', label: 'Conteúdos' },
  { href: '/admin/mensagens', label: 'Mensagens' },
  { href: '/admin/denuncias', label: 'Denúncias' },
];

export function MainLayout({ children, className, hideGlobalSearch = false }: MainLayoutProps) {
  const pathname = usePathname();
  const isAdminArea = pathname === '/admin' || pathname.startsWith('/admin/');
  return (
    <div className={cn('min-h-screen flex flex-col overflow-x-hidden', className)}>
      <Header hideGlobalSearch={hideGlobalSearch} />
      {isAdminArea ? (
        <nav aria-label="Navegação administrativa" className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
          <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 py-2 sm:px-6">
            {ADMIN_LINKS.map((item) => {
              const active = item.href === '/admin' ? pathname === '/admin' : pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined}
                  className={cn('inline-flex min-h-10 shrink-0 items-center rounded-lg px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950',
                    active ? 'bg-orange-700 text-white dark:bg-orange-600' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white')}>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
      <main className="flex-1 w-full max-w-full" role="main">
        {children}
      </main>
      {!isAdminArea ? <Footer /> : null}
    </div>
  );
}