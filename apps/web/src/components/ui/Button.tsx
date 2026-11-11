import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/cn';

const VARIANTS = {
  primary: 'bg-accent-solid text-accent-fg hover:brightness-110',
  secondary: 'border border-border bg-raised/60 text-fg backdrop-blur hover:border-muted/60',
  ghost: 'text-muted hover:text-fg',
} as const;

const SIZES = {
  md: 'h-11 px-5 text-sm',
  lg: 'h-13 px-7 text-base',
} as const;

interface StyleProps {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  className?: string;
}

export const buttonClass = ({ variant = 'primary', size = 'md', className }: StyleProps = {}) =>
  cn(
    'inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap',
    'transition-[filter,border-color,color] duration-200 disabled:cursor-not-allowed disabled:opacity-60',
    VARIANTS[variant],
    SIZES[size],
    className,
  );

/** A link styled as a button. Internal paths use client-side navigation. */
export function ButtonLink({
  href,
  children,
  variant,
  size,
  className,
  ...props
}: StyleProps & { href: string; children: ReactNode } & Omit<ComponentProps<'a'>, 'href'>) {
  const classes = buttonClass({ variant, size, className });
  const isExternal = /^(https?:)?\/\//.test(href) || href.startsWith('mailto:');

  return isExternal ? (
    <a href={href} className={classes} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  ) : (
    <Link href={href} className={classes} {...props}>
      {children}
    </Link>
  );
}

export function Button({
  variant,
  size,
  className,
  type = 'button',
  ...props
}: StyleProps & ComponentProps<'button'>) {
  return <button type={type} className={buttonClass({ variant, size, className })} {...props} />;
}
