// Integrated Rules View with Validation and Filters

import React, { useState, useMemo } from 'react';
import { ProperRulesTable } from './ProperRulesTable';
import { RuleFilters, RuleFilterType } from './RuleFilters';
import { AdvancedSOPRule } from '@/types/advanced';
import { useRuleManagement } from '@/contexts/RuleManagementContext';

interface IntegratedRulesViewProps {
  rules: AdvancedSOPRule[];
  searchTerm?: string;
  onRulesUpdate?: (rules: AdvancedSOPRule[]) => void;
  onApprove?: (ruleId: string) => void;
  onReject?: (ruleId: string) => void;
  onEdit?: (ruleId: string) => void;
  onDelete?: (ruleId: string) => void;
  onViewConflict?: (ruleId: string) => void;
}

export const IntegratedRulesView: React.FC<IntegratedRulesViewProps> = ({
  rules,
  searchTerm = '',
  onRulesUpdate,
  onApprove,
  onReject,
  onEdit,
  onDelete,
  onViewConflict
}) => {
  const { tagValidationService } = useRuleManagement();
  const [activeFilter, setActiveFilter] = useState<RuleFilterType>('all');

  // Validate all rules
  const rulesWithValidation = useMemo(() => {
    return rules.map(rule => ({
      rule,
      validation: tagValidationService.validateRule(rule)
    }));
  }, [rules, tagValidationService]);

  // Calculate filter counts based on rule status
  const filterCounts = useMemo(() => {
    const counts = {
      all: rules.length,
      pending: 0,
      active: 0,
      rejected: 0,
      conflicts: 0
    };

    rules.forEach((rule) => {
      const status = (rule as any).status || 'active';
      
      // Count by status
      if (status === 'pending') counts.pending++;
      else if (status === 'active') counts.active++;
      else if (status === 'rejected') counts.rejected++;

      // Count conflicts
      const conflicts = (rule as any).conflicts;
      if (conflicts && conflicts.length > 0) {
        counts.conflicts++;
      }
    });

    return counts;
  }, [rules]);

  // Filter rules based on active filter
  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      const status = (rule as any).status || 'active';
      const conflicts = (rule as any).conflicts;

      switch (activeFilter) {
        case 'all':
          return true;
        case 'pending':
          return status === 'pending';
        case 'active':
          return status === 'active';
        case 'rejected':
          return status === 'rejected';
        case 'conflicts':
          return conflicts && conflicts.length > 0;
        default:
          return true;
      }
    });
  }, [rules, activeFilter]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <RuleFilters
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        counts={filterCounts}
      />

      {/* Rules Table */}
      <ProperRulesTable
        rules={filteredRules}
        searchTerm={searchTerm}
        onApprove={onApprove}
        onReject={onReject}
        onEdit={onEdit}
        onDelete={onDelete}
        onViewConflict={onViewConflict}
      />
    </div>
  );
};
