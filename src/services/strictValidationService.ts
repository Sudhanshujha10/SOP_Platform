import { AdvancedSOPRule } from '@/types/advanced';
import { lookupTables } from '@/data/lookupTables';

/**
 * Strict Validation Service
 * Enforces all business rules, schema validation, and lookup constraints
 */

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  needsDefinition: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: string;
  severity: 'error';
}

export interface ValidationWarning {
  field: string;
  message: string;
  value?: string;
  severity: 'warning';
}

export class StrictValidationService {
  /**
   * Validate a single rule against all business constraints
   */
  static validateRule(rule: Partial<AdvancedSOPRule>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const needsDefinition: string[] = [];

    // 1. Required Fields Validation
    this.validateRequiredFields(rule, errors);

    // 2. Rule ID Format Validation
    this.validateRuleId(rule.rule_id, errors);

    // 3. Description Pattern Validation
    this.validateDescription(rule.description, errors, warnings);

    // 4. Code Group Validation
    this.validateCodeGroup(rule.code, rule.code_group, errors, needsDefinition);

    // 5. Payer Group Validation
    this.validatePayerGroup(rule.payer_group, errors, needsDefinition);

    // 6. Provider Group Validation
    this.validateProviderGroup(rule.provider_group, errors, needsDefinition);

    // 7. Action Validation
    this.validateAction(rule.action, errors, needsDefinition);

    // 8. Chart Section Validation
    this.validateChartSection(rule.chart_section, errors, needsDefinition);

    // 9. Codes Selected Validation (for swap/conditional rules)
    this.validateCodesSelected(rule, errors);

    // 10. Date Format Validation
    this.validateDates(rule.effective_date, rule.end_date, errors);

    // 11. Documentation Trigger Validation
    this.validateDocumentationTrigger(rule.documentation_trigger, warnings);

    // 12. Reference Validation
    this.validateReference(rule.reference, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      needsDefinition
    };
  }

  /**
   * Validate required fields
   */
  private static validateRequiredFields(rule: Partial<AdvancedSOPRule>, errors: ValidationError[]): void {
    const requiredFields: (keyof AdvancedSOPRule)[] = [
      'rule_id',
      'code',
      'action',
      'payer_group',
      'provider_group',
      'description',
      'effective_date'
    ];

    for (const field of requiredFields) {
      if (!rule[field] || (typeof rule[field] === 'string' && !rule[field]?.trim())) {
        errors.push({
          field,
          message: `${field} is required`,
          severity: 'error'
        });
      }
    }
  }

  /**
   * Validate Rule ID format (e.g., AU-MOD25-0001)
   */
  private static validateRuleId(ruleId: string | undefined, errors: ValidationError[]): void {
    if (!ruleId) return;

    const pattern = /^[A-Z]{2,4}-[A-Z0-9]+-\d{4}$/;
    if (!pattern.test(ruleId)) {
      errors.push({
        field: 'rule_id',
        message: 'Rule ID must follow format: PREFIX-CATEGORY-####  (e.g., AU-MOD25-0001)',
        value: ruleId,
        severity: 'error'
      });
    }
  }

  /**
   * Validate description pattern
   * Must be a single sentence ending with period, containing inline @tags
   */
  private static validateDescription(description: string | undefined, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!description) return;

    // Must be a single sentence
    const sentences = description.split(/[.!?]/).filter(s => s.trim());
    if (sentences.length > 1) {
      errors.push({
        field: 'description',
        message: 'Description must be a single sentence',
        value: description,
        severity: 'error'
      });
    }

    // Must end with period
    if (!description.trim().endsWith('.')) {
      errors.push({
        field: 'description',
        message: 'Description must end with a period',
        value: description,
        severity: 'error'
      });
    }

    // Should contain @tags
    const hasAtTags = /@[A-Z_]+/.test(description);
    if (!hasAtTags) {
      warnings.push({
        field: 'description',
        message: 'Description should contain inline @tags for clarity',
        value: description,
        severity: 'warning'
      });
    }

    // Check for proper @tag spelling
    const tags = description.match(/@[A-Z_|]+/g) || [];
    for (const tag of tags) {
      const cleanTag = tag.replace(/[|]/g, '');
      if (!this.isValidTag(cleanTag)) {
        warnings.push({
          field: 'description',
          message: `Unknown @tag: ${tag}. Verify spelling or add to lookup tables`,
          value: tag,
          severity: 'warning'
        });
      }
    }
  }

  /**
   * Validate code group
   */
  private static validateCodeGroup(code: string | undefined, codeGroup: string | undefined, errors: ValidationError[], needsDefinition: string[]): void {
    if (!code) return;

    // If code starts with @, it's a code group
    if (code.startsWith('@')) {
      const isValid = this.isValidCodeGroup(code);
      if (!isValid) {
        needsDefinition.push(code);
        errors.push({
          field: 'code',
          message: `Code group ${code} not found in lookup tables. Needs definition.`,
          value: code,
          severity: 'error'
        });
      }
    } else {
      // Specific codes - validate format
      const codes = code.split(',').map(c => c.trim());
      for (const c of codes) {
        if (!/^\d{5}$/.test(c) && !/^[A-Z]\d{4}$/.test(c)) {
          errors.push({
            field: 'code',
            message: `Invalid code format: ${c}. Must be 5-digit CPT or alphanumeric`,
            value: c,
            severity: 'error'
          });
        }
      }
    }
  }

  /**
   * Validate payer group
   */
  private static validatePayerGroup(payerGroup: string | undefined, errors: ValidationError[], needsDefinition: string[]): void {
    if (!payerGroup) return;

    const payers = payerGroup.split('|').map(p => p.trim());
    for (const payer of payers) {
      if (payer.startsWith('@')) {
        const isValid = this.isValidPayerGroup(payer);
        if (!isValid) {
          needsDefinition.push(payer);
          errors.push({
            field: 'payer_group',
            message: `Payer group ${payer} not found in lookup tables. Needs definition.`,
            value: payer,
            severity: 'error'
          });
        }
      }
    }
  }

  /**
   * Validate provider group
   */
  private static validateProviderGroup(providerGroup: string | undefined, errors: ValidationError[], needsDefinition: string[]): void {
    if (!providerGroup) return;

    if (providerGroup.startsWith('@')) {
      const isValid = this.isValidProviderGroup(providerGroup);
      if (!isValid) {
        needsDefinition.push(providerGroup);
        errors.push({
          field: 'provider_group',
          message: `Provider group ${providerGroup} not found in lookup tables. Needs definition.`,
          value: providerGroup,
          severity: 'error'
        });
      }
    }
  }

  /**
   * Validate action
   */
  private static validateAction(action: string | undefined, errors: ValidationError[], needsDefinition: string[]): void {
    if (!action) return;

    // Extract action tags
    const actionTags = action.match(/@[A-Z_]+/g) || [];
    for (const tag of actionTags) {
      const isValid = this.isValidActionTag(tag);
      if (!isValid) {
        needsDefinition.push(tag);
        errors.push({
          field: 'action',
          message: `Action tag ${tag} not found in lookup tables. Needs definition.`,
          value: tag,
          severity: 'error'
        });
      }
    }

    // Validate action syntax
    if (!/@(ADD|REMOVE|SWAP|COND_ADD|COND_REMOVE|LINK|DENY)/.test(action)) {
      errors.push({
        field: 'action',
        message: 'Action must contain valid action tag (@ADD, @REMOVE, @SWAP, etc.)',
        value: action,
        severity: 'error'
      });
    }
  }

  /**
   * Validate chart section
   */
  private static validateChartSection(chartSection: string | undefined, errors: ValidationError[], needsDefinition: string[]): void {
    if (!chartSection) return;

    const isValid = this.isValidChartSection(chartSection);
    if (!isValid) {
      needsDefinition.push(chartSection);
      errors.push({
        field: 'chart_section',
        message: `Chart section ${chartSection} not found in lookup tables. Needs definition.`,
        value: chartSection,
        severity: 'error'
      });
    }
  }

  /**
   * Validate codes_selected (required for swap/conditional rules)
   */
  private static validateCodesSelected(rule: Partial<AdvancedSOPRule>, errors: ValidationError[]): void {
    const action = rule.action || '';
    const requiresCodesSelected = /@SWAP|@COND_ADD|@COND_REMOVE/.test(action);

    if (requiresCodesSelected && (!rule.codes_selected || rule.codes_selected.length === 0)) {
      errors.push({
        field: 'codes_selected',
        message: 'codes_selected is required for SWAP/CONDITIONAL actions',
        severity: 'error'
      });
    }
  }

  /**
   * Validate date formats
   */
  private static validateDates(effectiveDate: string | undefined, endDate: string | undefined, errors: ValidationError[]): void {
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (effectiveDate && !datePattern.test(effectiveDate)) {
      errors.push({
        field: 'effective_date',
        message: 'Effective date must be in YYYY-MM-DD format',
        value: effectiveDate,
        severity: 'error'
      });
    }

    if (endDate && endDate.trim() && !datePattern.test(endDate)) {
      errors.push({
        field: 'end_date',
        message: 'End date must be in YYYY-MM-DD format or empty',
        value: endDate,
        severity: 'error'
      });
    }

    // End date must be after effective date
    if (effectiveDate && endDate && endDate.trim()) {
      if (new Date(endDate) <= new Date(effectiveDate)) {
        errors.push({
          field: 'end_date',
          message: 'End date must be after effective date',
          severity: 'error'
        });
      }
    }
  }

  /**
   * Validate documentation trigger
   */
  private static validateDocumentationTrigger(trigger: string | undefined, warnings: ValidationWarning[]): void {
    if (!trigger || !trigger.trim()) {
      warnings.push({
        field: 'documentation_trigger',
        message: 'Documentation trigger is recommended for rule clarity',
        severity: 'warning'
      });
    }
  }

  /**
   * Validate reference
   */
  private static validateReference(reference: string | undefined, warnings: ValidationWarning[]): void {
    if (!reference || !reference.trim()) {
      warnings.push({
        field: 'reference',
        message: 'Reference to source document is recommended',
        severity: 'warning'
      });
    }
  }

  /**
   * Check if tag is valid
   */
  private static isValidTag(tag: string): boolean {
    return this.isValidCodeGroup(tag) ||
           this.isValidPayerGroup(tag) ||
           this.isValidProviderGroup(tag) ||
           this.isValidActionTag(tag) ||
           this.isValidChartSection(tag);
  }

  /**
   * Check if code group exists in lookup tables
   */
  private static isValidCodeGroup(code: string): boolean {
    // lookupTables.codeGroups is an array, not an object with sub-properties
    return lookupTables.codeGroups.some(g => g.tag === code);
  }

  /**
   * Check if payer group exists
   */
  private static isValidPayerGroup(payer: string): boolean {
    return lookupTables.payerGroups.some(g => g.tag === payer);
  }

  /**
   * Check if provider group exists
   */
  private static isValidProviderGroup(provider: string): boolean {
    return lookupTables.providerGroups.some(g => g.tag === provider);
  }

  /**
   * Check if action tag exists
   */
  private static isValidActionTag(action: string): boolean {
    return lookupTables.actionTags.some(g => g.tag === action);
  }

  /**
   * Check if chart section exists
   */
  private static isValidChartSection(section: string): boolean {
    return lookupTables.chartSections.some(s => s.tag === section);
  }

  /**
   * Validate batch of rules
   */
  static validateBatch(rules: Partial<AdvancedSOPRule>[]): {
    validRules: AdvancedSOPRule[];
    invalidRules: Array<{ rule: Partial<AdvancedSOPRule>; validation: ValidationResult }>;
    allNeedsDefinition: string[];
  } {
    const validRules: AdvancedSOPRule[] = [];
    const invalidRules: Array<{ rule: Partial<AdvancedSOPRule>; validation: ValidationResult }> = [];
    const allNeedsDefinition = new Set<string>();

    for (const rule of rules) {
      const validation = this.validateRule(rule);
      
      if (validation.isValid) {
        validRules.push(rule as AdvancedSOPRule);
      } else {
        invalidRules.push({ rule, validation });
      }

      // Collect all NEEDSDEFINITION tags
      validation.needsDefinition.forEach(tag => allNeedsDefinition.add(tag));
    }

    return {
      validRules,
      invalidRules,
      allNeedsDefinition: Array.from(allNeedsDefinition)
    };
  }
}
