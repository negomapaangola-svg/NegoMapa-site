'use client';

import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: ReactNode;
  className?: string;
}

export function MainLayout({ children, className }: MainLayoutProps) {
  return (
    <div className={cn('min-h-screen flex flex-col overflow-x-hidden', className)}>
      <Header />
      <main className="flex-1 w-full max-w-full" role="main">
        {children}
      </main>
      <Footer />
    </div>
  );
}