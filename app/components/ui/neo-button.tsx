'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { Button as ShadcnButton } from '~/components/ui/button';
import { cn } from '~/lib/utils';

const neoButtonVariants = cva('font-space-grotesk font-bold transition-all', {
  variants: {
    neoVariant: {
      default: 'neo-brutalist btn-hover-effect',
      sm: 'neo-brutalist-sm btn-hover-effect-sm',
      yellow: 'neo-brutalist-yellow btn-hover-effect-yellow',
      yellowSm: 'neo-brutalist-yellow-sm btn-hover-effect-yellow-sm',
      red: 'neo-brutalist-red btn-hover-effect-red',
      redSm: 'neo-brutalist-red-sm btn-hover-effect-red-sm',
      whiteSm: 'neo-brutalist-white-sm btn-hover-effect-white-sm',
      white: 'neo-brutalist-white btn-hover-effect-white',
      none: '',
    },
  },
  defaultVariants: {
    neoVariant: 'default',
  },
});

export interface NeoButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof neoButtonVariants> {
  asChild?: boolean;
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

function NeoButton({
  className,
  neoVariant,
  variant,
  size,
  ...props
}: NeoButtonProps) {
  return (
    <ShadcnButton
      className={cn(neoButtonVariants({ neoVariant, className }))}
      variant={variant}
      size={size}
      {...props}
    />
  );
}

NeoButton.displayName = 'NeoButton';

export { NeoButton };
