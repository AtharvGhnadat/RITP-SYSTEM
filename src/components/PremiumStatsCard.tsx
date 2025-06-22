
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PremiumStatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'destructive';
  className?: string;
}

export const PremiumStatsCard: React.FC<PremiumStatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className
}) => {
  const variantStyles = {
    default: 'border-border',
    primary: 'border-primary/20 bg-primary/5',
    secondary: 'border-secondary/20 bg-secondary/5',
    success: 'border-success/20 bg-success/5',
    warning: 'border-warning/20 bg-warning/5',
    destructive: 'border-destructive/20 bg-destructive/5'
  };

  const iconStyles = {
    default: 'text-muted-foreground',
    primary: 'text-primary',
    secondary: 'text-secondary',
    success: 'text-success',
    warning: 'text-warning',
    destructive: 'text-destructive'
  };

  return (
    <Card className={cn(
      'premium-card transition-all duration-200 hover:shadow-md',
      variantStyles[variant],
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {title}
            </p>
            <div className="flex items-baseline space-x-2">
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
                {value}
              </h3>
              {trend && (
                <span className={cn(
                  'text-xs font-medium px-2 py-1 rounded-full',
                  trend.isPositive 
                    ? 'text-success bg-success/10' 
                    : 'text-destructive bg-destructive/10'
                )}>
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
              )}
            </div>
            {(subtitle || trend?.label) && (
              <p className="text-sm text-muted-foreground mt-2">
                {subtitle || trend?.label}
              </p>
            )}
          </div>
          
          {Icon && (
            <div className={cn(
              'p-3 rounded-lg bg-background/50',
              iconStyles[variant]
            )}>
              <Icon className="h-6 w-6" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface PremiumStatsGridProps {
  children: React.ReactNode;
  className?: string;
}

export const PremiumStatsGrid: React.FC<PremiumStatsGridProps> = ({
  children,
  className
}) => {
  return (
    <div className={cn(
      'grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
      className
    )}>
      {children}
    </div>
  );
};
