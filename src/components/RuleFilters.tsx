// Rule Filters Component

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle, Tag, Filter, Clock } from 'lucide-react';

export type RuleFilterType = 
  | 'all' 
  | 'pending'
  | 'active'
  | 'rejected'
  | 'conflicts';

interface RuleFiltersProps {
  activeFilter: RuleFilterType;
  onFilterChange: (filter: RuleFilterType) => void;
  counts: {
    all: number;
    pending: number;
    active: number;
    rejected: number;
    conflicts: number;
  };
}

export const RuleFilters: React.FC<RuleFiltersProps> = ({ 
  activeFilter, 
  onFilterChange, 
  counts 
}) => {
  const filters = [
    {
      id: 'all' as const,
      label: 'All Rules',
      icon: Filter,
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      activeColor: 'bg-gray-600 text-white border-gray-600',
      count: counts.all
    },
    {
      id: 'pending' as const,
      label: 'Pending',
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      activeColor: 'bg-yellow-600 text-white border-yellow-600',
      count: counts.pending
    },
    {
      id: 'active' as const,
      label: 'Active',
      icon: CheckCircle2,
      color: 'bg-green-100 text-green-800 border-green-200',
      activeColor: 'bg-green-600 text-white border-green-600',
      count: counts.active
    },
    {
      id: 'rejected' as const,
      label: 'Rejected',
      icon: XCircle,
      color: 'bg-red-100 text-red-800 border-red-200',
      activeColor: 'bg-red-600 text-white border-red-600',
      count: counts.rejected
    },
    {
      id: 'conflicts' as const,
      label: 'Conflicts',
      icon: AlertTriangle,
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      activeColor: 'bg-orange-600 text-white border-orange-600',
      count: counts.conflicts
    }
  ];

  return (
    <div className="flex flex-wrap gap-2 p-4 bg-gray-50 border-b border-gray-200">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mr-2">
        <Filter className="w-4 h-4" />
        Filter by:
      </div>
      
      {filters.map(filter => {
        const Icon = filter.icon;
        const isActive = activeFilter === filter.id;
        const colorClass = isActive ? filter.activeColor : filter.color;
        
        return (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all hover:shadow-sm ${colorClass}`}
          >
            <Icon className="w-3.5 h-3.5" />
            {filter.label}
            <Badge className="ml-1 bg-white/30 text-current border-0 px-1.5 py-0 text-xs">
              {filter.count}
            </Badge>
          </button>
        );
      })}
    </div>
  );
};
