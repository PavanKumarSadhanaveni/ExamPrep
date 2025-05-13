import type React from 'react';
import { cn } from '@/lib/utils';

interface LoadingDotsProps {
  className?: string;
  text?: string;
}

const LoadingDots: React.FC<LoadingDotsProps> = ({ className, text = "Loading" }) => {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 p-4", className)}>
      <div className="loading-dots text-primary text-2xl font-semibold">
        <span>&bull;</span>
        <span>&bull;</span>
        <span>&bull;</span>
      </div>
      {text && <p className="text-muted-foreground">{text}</p>}
    </div>
  );
};

export default LoadingDots;
