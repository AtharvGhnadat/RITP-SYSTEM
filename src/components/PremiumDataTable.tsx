
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner, LoadingSkeleton } from '@/components/ui/loading-spinner';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: any, item: T) => React.ReactNode;
  className?: string;
  mobileLabel?: string;
}

interface PremiumDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  onAdd?: () => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  addButtonLabel?: string;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  className?: string;
}

export function PremiumDataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  searchable = true,
  searchPlaceholder = "Search...",
  onSearch,
  onAdd,
  onEdit,
  onDelete,
  addButtonLabel = "Add New",
  emptyStateTitle = "No data found",
  emptyStateDescription = "There are no items to display.",
  className
}: PremiumDataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  if (loading) {
    return (
      <div className={cn('space-y-6', className)}>
        {/* Search and Add Button Skeleton */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="loading-skeleton h-10 w-full sm:w-80" />
          <div className="loading-skeleton h-10 w-full sm:w-32" />
        </div>
        
        {/* Table Skeleton */}
        <div className="hidden sm:block">
          <div className="premium-table">
            <div className="loading-skeleton h-12 w-full mb-2" />
            <LoadingSkeleton count={5} className="h-12 mb-2" />
          </div>
        </div>
        
        {/* Mobile Cards Skeleton */}
        <div className="sm:hidden space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="table-card">
              <div className="loading-skeleton h-6 w-3/4 mb-4" />
              <div className="space-y-3">
                <div className="loading-skeleton h-4 w-full" />
                <div className="loading-skeleton h-4 w-5/6" />
                <div className="loading-skeleton h-4 w-4/6" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const isEmpty = !data || data.length === 0;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with Search and Add Button */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        {searchable && (
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 premium-input"
            />
          </div>
        )}
        
        {onAdd && (
          <Button
            onClick={onAdd}
            className="btn-primary touch-target"
          >
            <Plus className="mr-2 h-4 w-4" />
            {addButtonLabel}
          </Button>
        )}
      </div>

      {isEmpty ? (
        /* Empty State */
        <div className="text-center py-16">
          <div className="mx-auto max-w-md">
            <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {emptyStateTitle}
            </h3>
            <p className="text-muted-foreground mb-6">
              {emptyStateDescription}
            </p>
            {onAdd && (
              <Button
                onClick={onAdd}
                className="btn-primary"
              >
                <Plus className="mr-2 h-4 w-4" />
                {addButtonLabel}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden sm:block premium-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="premium-table">
                <thead>
                  <tr>
                    {columns.map((column) => (
                      <th
                        key={String(column.key)}
                        className={cn(
                          'text-left font-semibold text-muted-foreground',
                          column.className
                        )}
                      >
                        {column.label}
                      </th>
                    ))}
                    {(onEdit || onDelete) && (
                      <th className="text-right font-semibold text-muted-foreground">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, index) => (
                    <tr key={index} className="hover:bg-muted/30 transition-colors">
                      {columns.map((column) => (
                        <td
                          key={String(column.key)}
                          className={cn('py-4 px-4', column.className)}
                        >
                          {column.render
                            ? column.render(item[column.key], item)
                            : String(item[column.key] || '-')}
                        </td>
                      ))}
                      {(onEdit || onDelete) && (
                        <td className="py-4 px-4 text-right">
                          <div className="flex justify-end space-x-2">
                            {onEdit && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onEdit(item)}
                                className="touch-target"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {onDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onDelete(item)}
                                className="touch-target text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-4">
            {data.map((item, index) => (
              <div key={index} className="table-card">
                <div className="table-card-header">
                  {/* Use first column as header */}
                  {columns[0]?.render
                    ? columns[0].render(item[columns[0].key], item)
                    : String(item[columns[0].key] || 'Item')}
                </div>
                
                <div className="space-y-3">
                  {columns.slice(1).map((column) => (
                    <div key={String(column.key)} className="table-card-row">
                      <span className="table-card-label">
                        {column.mobileLabel || column.label}
                      </span>
                      <span className="table-card-value">
                        {column.render
                          ? column.render(item[column.key], item)
                          : String(item[column.key] || '-')}
                      </span>
                    </div>
                  ))}
                  
                  {(onEdit || onDelete) && (
                    <div className="flex justify-end space-x-2 pt-2 border-t border-border">
                      {onEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(item)}
                          className="touch-target"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDelete(item)}
                          className="touch-target text-destructive hover:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
