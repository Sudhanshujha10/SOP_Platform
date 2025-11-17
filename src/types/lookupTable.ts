// Enhanced Lookup Table Types with Auto-Expansion and Status Tracking

export type TagStatus = 'ACTIVE' | 'NEEDS_DEFINITION' | 'PENDING_REVIEW' | 'DEPRECATED';

export interface EnhancedCodeGroup {
  tag: string;
  type: 'procedure' | 'diagnosis' | 'modifier';
  expands_to: string[];
  purpose: string;
  status: TagStatus;
  created_date: string;
  created_by: 'SYSTEM' | 'AI' | 'USER';
  confidence_score?: number; // For AI-created tags
  source_document?: string;
  usage_count: number; // Number of rules using this tag
  last_used?: string;
}

export interface EnhancedPayerGroup {
  tag: string;
  name: string;
  type: 'commercial' | 'medicare' | 'medicaid' | 'other';
  status: TagStatus;
  created_date: string;
  created_by: 'SYSTEM' | 'AI' | 'USER';
  confidence_score?: number;
  source_document?: string;
  usage_count: number;
  last_used?: string;
}

export interface EnhancedProviderGroup {
  tag: string;
  name: string;
  description: string;
  status: TagStatus;
  created_date: string;
  created_by: 'SYSTEM' | 'AI' | 'USER';
  confidence_score?: number;
  source_document?: string;
  usage_count: number;
  last_used?: string;
}

export interface EnhancedActionTag {
  tag: string;
  syntax: string;
  description: string;
  category: 'code' | 'diagnosis' | 'conditional' | 'modifier';
  status: TagStatus;
  created_date: string;
  created_by: 'SYSTEM' | 'AI' | 'USER';
  usage_count: number;
  last_used?: string;
}

export interface EnhancedChartSection {
  tag: string;
  name: string;
  description: string;
  status: TagStatus;
  created_date: string;
  created_by: 'SYSTEM' | 'AI' | 'USER';
  usage_count: number;
  last_used?: string;
}

export interface EnhancedLookupTables {
  codeGroups: EnhancedCodeGroup[];
  payerGroups: EnhancedPayerGroup[];
  providerGroups: EnhancedProviderGroup[];
  actionTags: EnhancedActionTag[];
  chartSections: EnhancedChartSection[];
}

// SOP-Specific Lookup Table
export interface SOPLookupTable {
  sop_id: string;
  sop_name: string;
  codeGroups: EnhancedCodeGroup[];
  codes: {
    code: string;
    type: 'procedure' | 'diagnosis' | 'modifier';
    description: string;
    code_group?: string;
  }[];
  payerGroups: EnhancedPayerGroup[];
  providerGroups: EnhancedProviderGroup[];
  actionTags: EnhancedActionTag[];
  chartSections: EnhancedChartSection[];
  created_date: string;
  last_updated: string;
}

// Search/Auto-suggestion types
export interface LookupSearchResult {
  type: 'code' | 'codeGroup' | 'payerGroup' | 'providerGroup' | 'actionTag' | 'chartSection';
  tag: string;
  display: string;
  description: string;
  category?: string;
  expands_to?: string[];
}

// Tag Validation Result
export interface TagValidationResult {
  tag: string;
  exists: boolean;
  status?: TagStatus;
  type?: 'codeGroup' | 'payerGroup' | 'providerGroup' | 'actionTag' | 'chartSection';
  needsCreation: boolean;
  suggestedType?: string;
  confidence?: number;
}

// Tag Creation Request
export interface TagCreationRequest {
  tag: string;
  type: 'codeGroup' | 'payerGroup' | 'providerGroup' | 'actionTag' | 'chartSection';
  name?: string;
  description?: string;
  expands_to?: string[];
  purpose?: string;
  source_document?: string;
  created_by: 'AI' | 'USER';
  confidence_score?: number;
}

// Rule Validation Result
export interface RuleValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingTags: string[];
  newTagsToCreate: TagCreationRequest[];
  status: 'VALID' | 'NEEDS_REVIEW' | 'INVALID';
}
