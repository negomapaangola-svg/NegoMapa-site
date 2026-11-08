import type { ReactNode } from 'react';
import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface SectionHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function SectionHeader({ title, description, action, className, ...props }: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        className
      )}
      {...props}
    >
      <div>
        <h2 className="text-xl font-bold text-neutral-900">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-sm text-neutral-500">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
