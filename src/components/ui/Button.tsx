'use client';

import { forwardRef, ButtonHTMLAttributes, ElementType } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'whatsapp' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  fullWidth?: boolean;
  asChild?: boolean;
  as?: ElementType;
}

const baseStyles = `
  inline-flex items-center justify-center gap-2
  font-heading font-bold rounded-xl
  transition-all duration-200 ease-out
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950
  disabled:opacity-70 disabled:cursor-not-allowed disabled:pointer-events-none
  active:scale-[0.98]
`;

const variants = {
  primary: `
    bg-orange-500 text-white
    hover:bg-orange-600
    shadow-sm hover:shadow-md
  `,
  secondary: `
    bg-neutral-100 text-neutral-900
    hover:bg-neutral-200
    border border-neutral-200
    dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700 dark:border-neutral-700
  `,
  outline: `
    bg-white text-orange-600
    border border-orange-500
    hover:bg-orange-50
    dark:bg-transparent dark:text-orange-300 dark:border-orange-400 dark:hover:bg-orange-950/40
  `,
  ghost: `
    bg-transparent text-neutral-700
    hover:bg-neutral-100
    dark:text-neutral-200 dark:hover:bg-neutral-800
  `,
  whatsapp: `
    bg-green-600 text-white
    hover:bg-green-700
    shadow-sm hover:shadow-md
  `,
  destructive: `
    bg-red-600 text-white
    hover:bg-red-700
    shadow-sm hover:shadow-md
  `,
};

const sizes = {
  sm: 'px-3 py-2 text-sm gap-1.5',
  md: 'px-5 py-3 text-sm gap-2',
  lg: 'px-6 py-4 text-base gap-2.5',
  xl: 'px-8 py-5 text-lg gap-3',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      asChild = false,
      as: Component = 'button',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const Comp = asChild ? Component : 'button';
    const buttonProps = asChild
      ? { ...props, ref }
      : { ref, disabled: isDisabled, 'aria-busy': loading, ...props };

    return (
      <Comp
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...buttonProps}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </Comp>
    );
  }
);

Button.displayName = 'Button';
