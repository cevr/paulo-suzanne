import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import * as React from 'react';

import { cn } from '~/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-6 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        neo: 'font-space-grotesk font-bold',
      },
      color: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        yellow: 'neo-brutalist-yellow bg-secondary btn-hover-effect-yellow',
        red: 'neo-brutalist-red btn-hover-effect-red',
        white: 'neo-brutalist-white btn-hover-effect-white',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      color: 'default',
      size: 'default',
    },
    compoundVariants: [
      {
        variant: 'neo',
        color: 'default',
        className: 'neo-brutalist btn-hover-effect',
      },
      {
        variant: 'neo',
        size: 'sm',
        color: 'default',
        className: 'neo-brutalist-sm btn-hover-effect-sm',
      },
      {
        variant: 'neo',
        size: 'sm',
        color: 'yellow',
        className: 'neo-brutalist-yellow-sm btn-hover-effect-yellow-sm',
      },
      {
        variant: 'neo',
        size: 'sm',
        color: 'red',
        className: 'neo-brutalist-red-sm btn-hover-effect-red-sm',
      },
      {
        variant: 'neo',
        size: 'sm',
        color: 'white',
        className: 'neo-brutalist-white-sm btn-hover-effect-white-sm',
      },
      {
        variant: 'neo',
        size: 'icon',
        color: 'default',
        className: 'neo-brutalist-sm btn-hover-effect-sm',
      },
    ],
  },
);

type ButtonVariantProps = VariantProps<typeof buttonVariants>;

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'>,
    ButtonVariantProps {
  asChild?: boolean;
}

function Button({
  className,
  variant,
  color,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? (Slot as any) : 'button';
  return (
    <Comp
      className={cn(buttonVariants({ variant, color, size, className }))}
      {...props}
    />
  );
}

Button.displayName = 'Button';

export { Button, buttonVariants };
