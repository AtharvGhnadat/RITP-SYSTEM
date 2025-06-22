
import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className={cn(
        'animate-spin rounded-full border-2 border-muted border-t-primary',
        sizeClasses[size]
      )} />
    </div>
  );
};

export const LoadingSkeleton: React.FC<{ 
  className?: string;
  count?: number;
}> = ({ className, count = 1 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i}
          className={cn(
            'loading-skeleton h-4 w-full',
            className
          )}
        />
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="premium-card animate-pulse">
      <div className="premium-card-header">
        <div className="loading-skeleton h-6 w-3/4 mb-2" />
        <div className="loading-skeleton h-4 w-1/2" />
      </div>
      <div className="premium-card-content">
        <div className="space-y-3">
          <div className="loading-skeleton h-4 w-full" />
          <div className="loading-skeleton h-4 w-5/6" />
          <div className="loading-skeleton h-4 w-4/6" />
        </div>
      </div>
    </div>
  );
};
