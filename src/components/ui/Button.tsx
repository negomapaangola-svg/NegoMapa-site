'use client';

import { forwardRef, ButtonHTMLAttributes, ElementType } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'liquid' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  fullWidth?: boolean;
  asChild?: boolean;
  as?: ElementType;
}

const baseStyles = `
  inline-flex items-center justify-center gap-2
  font-heading font-bold rounded-[4px]
  transition-all duration-200 ease-out
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
  active:scale-[0.98]
`;

const variants = {
  primary: `
    bg-orange-500 text-ink
    hover:bg-orange-600
    shadow-sm hover:shadow-md
  `,
  secondary: `
    bg-secondary-100 text-secondary-900 dark:bg-secondary-800 dark:text-secondary-100
    hover:bg-secondary-200 dark:hover:bg-secondary-700
    border border-secondary-200 dark:border-secondary-700
  `,
  outline: `
    bg-transparent text-orange-500 dark:text-orange-400
    border-2 border-orange-500 dark:border-orange-400
    hover:bg-orange-50 dark:hover:bg-orange-900/20
  `,
  ghost: `
    bg-transparent text-secondary-700 dark:text-secondary-300
    hover:bg-secondary-100 dark:hover:bg-secondary-800
  `,
  destructive: `
    bg-red-600 text-white
    hover:bg-red-700
    shadow-sm hover:shadow-md
  `,
  liquid: `
    liquid-glass-button text-white
    shadow-lg
  `,
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-[26px] py-[12px] text-[14px] gap-2',
  lg: 'px-6 py-3 text-lg gap-2.5',
  xl: 'px-8 py-4 text-xl gap-3',
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