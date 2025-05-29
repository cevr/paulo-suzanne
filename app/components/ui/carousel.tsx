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
  const reducer = React.useReducer(carouselReducer, {
    activeIndex: 0,
    length: 0,
  });
  const timerRef = React.useRef<number | undefined>(undefined);
  const elementRef = React.useRef<HTMLDivElement>(null);
  const [state, dispatch] = reducer;

  React.useEffect(() => {
    timerRef.current = window.setTimeout(() => {
      dispatch({ type: 'NEXT' });
    }, 5000);

    // if window is focused, reset timer
    function handleFocus() {
      clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        dispatch({ type: 'NEXT' });
      }, 5000);
    }

    function handleBlur() {
      clearTimeout(timerRef.current);
    }
    window.addEventListener('blur', handleBlur);

    window.addEventListener('focus', handleFocus);

    return () => {
      clearTimeout(timerRef.current);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [state.activeIndex]);

  React.useEffect(() => {
    // only if element or children are focused
    function handleKeyDown(e: KeyboardEvent) {
      if (
        elementRef.current?.contains(document.activeElement) ||
        elementRef.current === document.activeElement
      ) {
        if (e.key === 'ArrowRight') {
          dispatch({ type: 'NEXT' });
        }
        if (e.key === 'ArrowLeft') {
          dispatch({ type: 'PREV' });
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <CarouselContext value={reducer}>
      <div
        className={cn('relative outline-none', className)}
        ref={elementRef}
        tabIndex={0}
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

  // Drag state
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragOffset, setDragOffset] = React.useState(0);
  const [startX, setStartX] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    dispatch({ type: 'SET_LENGTH', payload: itemCount });
  }, [itemCount]);

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    e.preventDefault();
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    const containerWidth = containerRef.current?.offsetWidth || 0;

    // Convert pixel difference to percentage
    const offsetPercentage = (diff / containerWidth) * 100;
    setDragOffset(offsetPercentage);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) return;

    e.preventDefault();
    const containerWidth = containerRef.current?.offsetWidth || 0;
    const threshold = containerWidth * 0.25; // 25% of container width
    const pixelOffset = (dragOffset / 100) * containerWidth;

    setIsDragging(false);

    // Determine if we should navigate to next/prev
    if (Math.abs(pixelOffset) > threshold) {
      if (pixelOffset > 0) {
        // Dragged right, go to previous
        dispatch({ type: 'PREV' });
      } else {
        // Dragged left, go to next
        dispatch({ type: 'NEXT' });
      }
    }

    // Reset drag offset
    setDragOffset(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setDragOffset(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const currentX = e.clientX;
    const diff = currentX - startX;
    const containerWidth = containerRef.current?.offsetWidth || 0;

    // Convert pixel difference to percentage
    const offsetPercentage = (diff / containerWidth) * 100;
    setDragOffset(offsetPercentage);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;

    const containerWidth = containerRef.current?.offsetWidth || 0;
    const threshold = containerWidth * 0.25; // 25% of container width
    const pixelOffset = (dragOffset / 100) * containerWidth;

    setIsDragging(false);

    // Determine if we should navigate to next/prev
    if (Math.abs(pixelOffset) > threshold) {
      if (pixelOffset > 0) {
        // Dragged right, go to previous
        dispatch({ type: 'PREV' });
      } else {
        // Dragged left, go to next
        dispatch({ type: 'NEXT' });
      }
    }

    // Reset drag offset
    setDragOffset(0);
  };

  // Add global mouse event listeners for drag outside component
  React.useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const currentX = e.clientX;
      const diff = currentX - startX;
      const containerWidth = containerRef.current?.offsetWidth || 0;

      // Convert pixel difference to percentage
      const offsetPercentage = (diff / containerWidth) * 100;
      setDragOffset(offsetPercentage);
    };

    const handleGlobalMouseUp = () => {
      if (!isDragging) return;

      const containerWidth = containerRef.current?.offsetWidth || 0;
      const threshold = containerWidth * 0.25; // 25% of container width
      const pixelOffset = (dragOffset / 100) * containerWidth;

      setIsDragging(false);

      // Determine if we should navigate to next/prev
      if (Math.abs(pixelOffset) > threshold) {
        if (pixelOffset > 0) {
          // Dragged right, go to previous
          dispatch({ type: 'PREV' });
        } else {
          // Dragged left, go to next
          dispatch({ type: 'NEXT' });
        }
      }

      // Reset drag offset
      setDragOffset(0);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, startX, dragOffset, dispatch]);

  // Calculate the final transform value including drag offset
  const baseTransform = -state.activeIndex * 100;
  const finalTransform = baseTransform + dragOffset;

  return (
    <div
      ref={containerRef}
      className={cn('overflow-hidden', className)}
      {...props}
    >
      <div
        className={cn(
          'flex ease-in-out',
          isDragging ? 'transition-none' : 'transition-transform duration-500',
        )}
        style={{
          transform: `translateX(${finalTransform}%)`,
          touchAction: 'pan-y pinch-zoom',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {React.Children.map(children, (child) => (
          <div className="min-w-0 flex-[0_0_100%] bg-black">{child}</div>
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
      variant="neo"
      size="icon"
      className={cn(
        'absolute top-1/2 left-2 z-10 h-8 w-8 -translate-y-1/2 rounded-full',
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
      variant="neo"
      size="icon"
      className={cn(
        'absolute top-1/2 right-3 z-10 h-8 w-8 -translate-y-1/2 rounded-full',
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
