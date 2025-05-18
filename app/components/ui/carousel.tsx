'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';

import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';

type CarouselProps = {
  children: React.ReactNode;
  className?: string;
};

type CarouselState = {
  activeIndex: number;
  length: number;
};

type CarouselAction =
  | { type: 'NEXT' }
  | { type: 'PREV' }
  | { type: 'GOTO'; payload: number }
  | { type: 'SET_LENGTH'; payload: number };

export const CarouselContext = React.createContext<
  [CarouselState, React.Dispatch<CarouselAction>] | undefined
>(undefined);

function carouselReducer(
  state: CarouselState,
  action: CarouselAction,
): CarouselState {
  switch (action.type) {
    case 'NEXT':
      return {
        ...state,
        activeIndex:
          state.activeIndex === state.length - 1 ? 0 : state.activeIndex + 1,
      };
    case 'PREV':
      return {
        ...state,
        activeIndex:
          state.activeIndex === 0 ? state.length - 1 : state.activeIndex - 1,
      };
    case 'GOTO':
      return {
        ...state,
        activeIndex: action.payload,
      };
    case 'SET_LENGTH':
      return {
        ...state,
        length: action.payload,
      };
    default:
      return state;
  }
}

export function Carousel({ children, className, ...props }: CarouselProps) {
  const state = React.useReducer(carouselReducer, {
    activeIndex: 0,
    length: 0,
  });

  return (
    <CarouselContext value={state}>
      <div
        className={cn('relative', className)}
        {...props}
      >
        {children}
      </div>
    </CarouselContext>
  );
}

type CarouselContentProps = {
  children: React.ReactNode;
  className?: string;
};

export function CarouselContent({
  children,
  className,
  ...props
}: CarouselContentProps) {
  const [state, dispatch] = useCarousel();
  const itemCount = React.Children.count(children);

  React.useEffect(() => {
    dispatch({ type: 'SET_LENGTH', payload: itemCount });
  }, [itemCount]);

  return (
    <div
      className={cn('overflow-hidden', className)}
      {...props}
    >
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${state.activeIndex * 100}%)` }}
      >
        {React.Children.map(children, (child) => (
          <div className="min-w-0 flex-[0_0_100%]">{child}</div>
        ))}
      </div>
    </div>
  );
}

type CarouselItemProps = {
  children: React.ReactNode;
  className?: string;
};

export function CarouselItem({
  children,
  className,
  ...props
}: CarouselItemProps) {
  return <div {...props}>{children}</div>;
}

export function CarouselPrevious({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  const [, dispatch] = useCarousel();

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        'absolute top-1/2 left-2 z-10 h-8 w-8 -translate-y-1/2 rounded-full bg-white',
        className,
      )}
      onClick={() => dispatch({ type: 'PREV' })}
      {...props}
    >
      <ChevronLeft className="h-4 w-4" />
      <span className="sr-only">Previous slide</span>
    </Button>
  );
}

export function CarouselNext({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  const [, dispatch] = useCarousel();

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        'absolute top-1/2 right-2 z-10 h-8 w-8 -translate-y-1/2 rounded-full bg-white',
        className,
      )}
      onClick={() => dispatch({ type: 'NEXT' })}
      {...props}
    >
      <ChevronRight className="h-4 w-4" />
      <span className="sr-only">Next slide</span>
    </Button>
  );
}

export function CarouselDots({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const [state, dispatch] = useCarousel();

  return (
    <div
      className={cn('mt-4 flex justify-center gap-1', className)}
      {...props}
    >
      {Array.from({ length: state.length }).map((_, index) => (
        <Button
          key={index}
          variant="outline"
          size="icon"
          className={cn(
            'h-2 w-2 rounded-full border-none p-0',
            state.activeIndex === index
              ? 'bg-primary'
              : 'bg-muted-foreground/20',
          )}
          onClick={() => dispatch({ type: 'GOTO', payload: index })}
        >
          <span className="sr-only">Go to slide {index + 1}</span>
        </Button>
      ))}
    </div>
  );
}

export function useCarousel() {
  const context = React.useContext(CarouselContext);

  if (!context) {
    throw new Error('useCarousel must be used within a <Carousel />');
  }

  return context;
}
