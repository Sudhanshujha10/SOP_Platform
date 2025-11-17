/**
 * Rule Approval Workflow Types
 * Defines types for rule approval, editing, and conflict resolution
 */

export type RuleStatus = 'pending' | 'active' | 'rejected';

export type ConflictSeverity = 'low' | 'medium' | 'high';

export interface RuleConflict {
  id: string;
  type: 'overlapping' | 'duplicate' | 'contradictory' | 'missing_tag';
  severity: ConflictSeverity;
  affectedRuleIds: string[];
  description: string;
  suggestion?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface RuleApprovalAction {
  type: 'approve' | 'reject' | 'edit';
  ruleId: string;
  timestamp: string;
  userId?: string;
  changes?: Partial<SOPRule>;
  reason?: string;
}

export interface SOPRule {
  rule_id: string;
  code: string;
  code_group: string;
  codes_selected: string[];
  action: string;
  payer_group: string;
  provider_group: string;
  description: string;
  documentation_trigger: string;
  chart_section: string;
  effective_date: string;
  end_date: string;
  reference: string;
  status: RuleStatus;
  confidence?: number;
  source?: string;
  validation_status?: string;
  created_at?: string;
  updated_at?: string;
  conflicts?: RuleConflict[];
  new_tags?: {
    code_groups?: string[];
    payer_groups?: string[];
    provider_groups?: string[];
    actions?: string[];
    chart_sections?: string[];
  };
}

export interface RuleFilterOptions {
  status?: RuleStatus[];
  conflictSeverity?: ConflictSeverity[];
  hasConflicts?: boolean;
  hasNewTags?: boolean;
  searchQuery?: string;
}

export interface RuleSearchSuggestion {
  type: 'code' | 'rule_id' | 'description' | 'tag' | 'payer' | 'provider';
  value: string;
  label: string;
  ruleId?: string;
}

export interface ConflictResolution {
  conflictId: string;
  action: 'keep_first' | 'keep_second' | 'keep_both' | 'merge' | 'delete_both';
  mergedRule?: SOPRule;
  timestamp: string;
}

export interface NewTag {
  tag: string;
  type: 'code_group' | 'payer_group' | 'provider_group' | 'action' | 'chart_section';
  expands_to?: string[];
  purpose?: string;
  created_at: string;
  created_by: 'ai' | 'user';
  status: 'pending' | 'approved' | 'rejected';
  used_in_rules: string[];
}
