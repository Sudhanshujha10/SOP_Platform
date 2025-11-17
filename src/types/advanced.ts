// Advanced types for Bill Blaze extended features

import { SOPRule } from './sop';

// ============================================================================
// Document Processing Queue
// ============================================================================

export interface DocumentQueueItem {
  id: string;
  file: File;
  fileName: string;
  fileType: 'pdf' | 'docx' | 'csv' | 'xlsx';
  fileSize: number;
  status: 'queued' | 'processing' | 'completed' | 'error' | 'cancelled';
  progress: number; // 0-100
  rulesExtracted: number;
  estimatedTimeRemaining: number; // seconds
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  extractedRules?: AdvancedSOPRule[];
}

export interface ProcessingQueue {
  items: DocumentQueueItem[];
  currentIndex: number;
  totalDocuments: number;
  completedDocuments: number;
  isProcessing: boolean;
  estimatedTotalTime: number;
}

// ============================================================================
// Advanced SOP Rule (Extended Schema)
// ============================================================================

export interface AdvancedSOPRule extends SOPRule {
  // Additional fields for advanced features
  code_group?: string;              // @E&M_MINOR_PROC, @URODYNAMICS_PANEL
  codes_selected?: string[];        // Specific CPT codes [99213, 99214]
  modifiers?: string[];             // [@25, @52, @95]
  
  // Status and workflow
  status: 'pending' | 'reviewed' | 'approved' | 'active' | 'rejected' | 'needs_definition';
  confidence?: number;              // AI confidence score 0-100
  source: 'ai' | 'manual' | 'template' | 'csv';
  
  // Collaboration
  created_by?: string;
  reviewed_by?: string;
  approved_by?: string;
  comments?: RuleComment[];
  
  // Validation
  validation_status: 'valid' | 'warning' | 'error';
  validation_issues?: ValidationIssue[];
  
  // Metadata
  template_id?: string;
  version?: number;
  last_modified?: string;
  
  // Rule Approval Workflow fields
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

// Import conflict types from rule approval
export interface RuleConflict {
  id: string;
  type: 'overlapping' | 'duplicate' | 'contradictory' | 'missing_tag';
  severity: 'low' | 'medium' | 'high';
  affectedRuleIds: string[];
  description: string;
  suggestion?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface RuleComment {
  id: string;
  user: string;
  text: string;
  timestamp: string;
  resolved: boolean;
}

export interface ValidationIssue {
  field: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
}

// ============================================================================
// Template System
// ============================================================================

export interface RuleTemplate {
  id: string;
  name: string;
  specialty: 'primary_care' | 'urology' | 'cardiology' | 'orthopedics' | 'general';
  description: string;
  rules: AdvancedSOPRule[];
  created_at: string;
  updated_at: string;
  version: string;
  author: string;
  is_public: boolean;
}

export interface TemplateApprovalState {
  template_id: string;
  rules: Map<string, RuleApprovalStatus>; // rule_id -> status
  customizations: Map<string, Partial<AdvancedSOPRule>>; // rule_id -> changes
}

export interface RuleApprovalStatus {
  status: 'pending' | 'approved' | 'edited' | 'rejected';
  edited_rule?: Partial<AdvancedSOPRule>;
  rejection_reason?: string;
}

// ============================================================================
// CSV Upload & Field Mapping
// ============================================================================

export interface CSVUploadState {
  file: File;
  headers: string[];
  preview_data: string[][];
  total_rows: number;
  field_mapping: FieldMapping;
  validation_results?: CSVValidationResult;
}

export interface FieldMapping {
  mappings: Map<string, CSVFieldMap>; // csv_column -> target_field
  unmapped_columns: string[];
  custom_fields: CustomField[];
}

export interface CSVFieldMap {
  csv_column: string;
  target_field: keyof AdvancedSOPRule;
  confidence: number; // 0-100
  transformation?: 'none' | 'split' | 'join' | 'lookup' | 'custom';
  transformer_config?: any;
}

export interface CustomField {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'array';
  default_value?: any;
}

export interface CSVValidationResult {
  valid_rows: number;
  invalid_rows: number;
  warnings: CSVValidationWarning[];
  errors: CSVValidationError[];
  preview_rules: AdvancedSOPRule[];
}

export interface CSVValidationWarning {
  row: number;
  column: string;
  message: string;
  value: string;
}

export interface CSVValidationError {
  row: number;
  column: string;
  message: string;
  value: string;
}

// ============================================================================
// Dynamic Lookup Tables (Auto-Expanding)
// ============================================================================

export interface DynamicLookupGroup {
  tag: string;
  type: 'procedure' | 'diagnosis' | 'payer' | 'provider' | 'action' | 'modifier';
  status: 'defined' | 'needs_definition' | 'pending_approval';
  values: string[];
  description?: string;
  created_from: 'system' | 'ai' | 'user' | 'csv';
  usage_count: number;
  created_at: string;
  defined_by?: string;
  rules_using: string[]; // rule_ids
}

export interface LookupTableUpdate {
  action: 'create' | 'update' | 'delete';
  group: DynamicLookupGroup;
  affected_rules: string[];
  requires_approval: boolean;
}

// ============================================================================
// Manual Rule Creation
// ============================================================================

export interface RuleBuilderState {
  rule: Partial<AdvancedSOPRule>;
  step: 'basic' | 'conditions' | 'actions' | 'validation' | 'review';
  validation: RuleValidation;
  suggestions: RuleSuggestion[];
}

export interface RuleSuggestion {
  field: keyof AdvancedSOPRule;
  value: any;
  reason: string;
  confidence: number;
}

export interface RuleValidation {
  is_valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  completeness: number; // 0-100
}

// ============================================================================
// Collaboration & Workflow
// ============================================================================

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user' | 'viewer';
  permissions: Permission[];
}

export type Permission = 
  | 'create_rules'
  | 'edit_rules'
  | 'delete_rules'
  | 'approve_rules'
  | 'manage_templates'
  | 'manage_lookups'
  | 'view_only';

export interface WorkflowState {
  rule_id: string;
  current_stage: 'draft' | 'review' | 'approval' | 'active' | 'archived';
  assigned_to?: string;
  due_date?: string;
  history: WorkflowEvent[];
}

export interface WorkflowEvent {
  id: string;
  type: 'created' | 'updated' | 'reviewed' | 'approved' | 'rejected' | 'commented';
  user: string;
  timestamp: string;
  details: string;
  changes?: Partial<AdvancedSOPRule>;
}

// ============================================================================
// Batch Operations
// ============================================================================

export interface BatchOperation {
  id: string;
  type: 'approve' | 'reject' | 'edit' | 'delete' | 'export';
  rule_ids: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  results?: BatchOperationResult[];
}

export interface BatchOperationResult {
  rule_id: string;
  success: boolean;
  error?: string;
}

// ============================================================================
// Filters & Search
// ============================================================================

export interface RuleFilter {
  status?: AdvancedSOPRule['status'][];
  validation_status?: AdvancedSOPRule['validation_status'][];
  source?: AdvancedSOPRule['source'][];
  payer_group?: string[];
  code_group?: string[];
  has_warnings?: boolean;
  has_errors?: boolean;
  needs_definition?: boolean;
  date_range?: {
    start: string;
    end: string;
  };
  search_text?: string;
}

export interface RuleSearchResult {
  rules: AdvancedSOPRule[];
  total: number;
  facets: {
    status: Map<string, number>;
    source: Map<string, number>;
    validation_status: Map<string, number>;
  };
}

// ============================================================================
// Notifications
// ============================================================================

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  rule_id?: string;
  action_required?: boolean;
  created_at: string;
  read: boolean;
  link?: string;
}

// ============================================================================
// Analytics & Reporting
// ============================================================================

export interface RuleAnalytics {
  total_rules: number;
  by_status: Map<string, number>;
  by_source: Map<string, number>;
  by_payer: Map<string, number>;
  recent_changes: number;
  pending_approvals: number;
  rules_with_issues: number;
  undefined_groups: number;
}

// ============================================================================
// Export Types
// ============================================================================

export interface ExportConfig {
  format: 'csv' | 'excel' | 'json' | 'pdf';
  include_fields: (keyof AdvancedSOPRule)[];
  filters?: RuleFilter;
  include_metadata: boolean;
  include_comments: boolean;
}
