// CSV Schema Types - matches the complete Bill Blaze specification

export interface SOPRule {
  rule_id: string;                    // [CLIENT]-MNEMONIC-0001
  code?: string;                      // @TAG or individual code
  code_group?: string;                // Code group name
  codes_selected?: string[];          // Array of specific codes
  action: string | string[];          // @ACTION(@code) space-separated or array
  payer_group: string | string[];     // Pipe-delimited @PAYER tags or array
  provider_group: string | string[];  // @PROVIDER tags or array
  description?: string;               // Single English sentence with inline tags
  raw_description?: string;           // Raw description with tokens
  documentation_trigger?: string;     // Semicolon-separated keywords
  chart_section?: string;             // Lookup tag or blank
  effective_date?: string;            // YYYY-MM-DD
  end_date?: string;                  // YYYY-MM-DD or blank
  reference?: string;                 // File + page / bulletin
  status?: 'Active' | 'Review' | 'Retired' | 'pending' | 'reviewed' | 'approved' | 'active' | 'rejected' | 'needs_definition';
  tokens?: Token[];                   // Parsed tokens from description
  meta?: {
    effective_date?: string;
    end_date?: string;
    chart_section?: string;
    chart_id?: string;
    triggers?: string[];
    last_updated?: string;
    updated_by?: string;
  };
  query_count?: number;
  // Additional fields for compatibility with AdvancedSOPRule
  confidence?: number;
  source?: 'ai' | 'manual' | 'template' | 'csv';
  created_by?: string;
}

// Lookup Table Types

export interface CodeGroup {
  tag: string;                        // e.g., @E&M_MINOR_PROC
  type: 'procedure' | 'diagnosis' | 'modifier';
  expands_to: string[];               // Array of codes
  purpose: string;                    // Description
}

export interface PayerGroup {
  tag: string;                        // e.g., @BCBS
  name: string;                       // Display name
  type: 'commercial' | 'medicare' | 'medicaid' | 'other';
}

export interface ProviderGroup {
  tag: string;                        // e.g., @PHYSICIAN_MD_DO
  name: string;                       // Display name
  description: string;
}

export interface ActionTag {
  tag: string;                        // e.g., @ADD
  syntax: string;                     // e.g., @ADD(@code)
  description: string;
  category: 'modifier' | 'code' | 'diagnosis' | 'conditional';
}

export interface ChartSection {
  tag: string;                        // e.g., ASSESSMENT_PLAN
  name: string;                       // Display name
  description: string;
}

// Lookup Tables Collection
export interface LookupTables {
  codeGroups: CodeGroup[];
  payerGroups: PayerGroup[];
  providerGroups: ProviderGroup[];
  actionTags: ActionTag[];
  chartSections: ChartSection[];
}

// File Processing Types

export interface UploadedFile {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'csv';
  size: number;
  uploadedAt: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  extractedText?: string;
  extractedRules?: SOPRule[];
  errorMessage?: string;
}

// AI Extraction Types

export interface ExtractionRequest {
  fileId: string;
  text: string;
  clientPrefix: string;              // e.g., "AU", "HM", "CC"
  lookupTables: LookupTables;
}

export interface ExtractionResult {
  rules: SOPRule[];
  confidence: number;
  warnings: string[];
  suggestions: string[];
}

// Rule Validation Types

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface RuleValidation {
  isValid: boolean;
  errors: ValidationError[];
  checklist: {
    hasValidDescription: boolean;
    hasValidTags: boolean;
    hasValidCodeField: boolean;
    hasValidActionField: boolean;
    hasTriggerKeywords: boolean;
    hasChartSection: boolean;
    hasValidReference: boolean;
    hasClientPrefix: boolean;
  };
}

// Legacy types for backward compatibility
export interface Token {
  type: 'payer' | 'provider' | 'modifier' | 'code_group' | 'action';
  value: string;
}
