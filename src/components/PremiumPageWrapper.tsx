import React from 'react';
import { PremiumHeader } from './PremiumHeader';
import { cn } from '@/lib/utils';
interface PremiumPageWrapperProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerTitle?: string;
  showNotifications?: boolean;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}
export const PremiumPageWrapper: React.FC<PremiumPageWrapperProps> = ({
  children,
  title,
  subtitle,
  headerTitle,
  showNotifications = true,
  className,
  maxWidth = 'full'
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-full'
  };
  return <div className="page-container">
      <PremiumHeader title={headerTitle} showNotifications={showNotifications} />
      
      <main className={cn('flex-1', className)}>
        <div className="content-container">
          <div className={cn('content-wrapper', maxWidthClasses[maxWidth])}>
            {(title || subtitle) && <div className="element-spacing mb-8 animate-fade-in">
                {title && <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl px-[11px]">
                    {title}
                  </h1>}
                {subtitle && <p className="mt-2 text-lg text-muted-foreground max-w-3xl px-[11px]">
                    {subtitle}
                  </p>}
              </div>}
            
            <div className="animate-slide-up">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>;
};