import { SOPRule, RuleValidation, ValidationError, LookupTables } from '@/types/sop';

/**
 * Rule Validation Service - Implements the quality checklist
 */
export class RuleValidationService {
  private lookupTables: LookupTables;

  constructor(lookupTables: LookupTables) {
    this.lookupTables = lookupTables;
  }

  /**
   * Validate a single rule against all quality criteria
   */
  validateRule(rule: SOPRule): RuleValidation {
    const errors: ValidationError[] = [];

    // 1. Description validation
    const hasValidDescription = this.validateDescription(rule.description, errors);

    // 2. Tag validation
    const hasValidTags = this.validateTags(rule, errors);

    // 3. Code field validation
    const hasValidCodeField = this.validateCodeField(rule.code, errors);

    // 4. Action field validation
    const hasValidActionField = this.validateActionField(rule.action, errors);

    // 5. Trigger keywords validation
    const hasTriggerKeywords = this.validateTriggerKeywords(rule.documentation_trigger, errors);

    // 6. Chart section validation
    const hasChartSection = this.validateChartSection(rule.chart_section, errors);

    // 7. Reference validation
    const hasValidReference = this.validateReference(rule.reference, errors);

    // 8. Client prefix validation
    const hasClientPrefix = this.validateClientPrefix(rule.rule_id, errors);

    // Additional validations
    this.validateEffectiveDate(rule.effective_date, errors);
    this.validateEndDate(rule.effective_date, rule.end_date, errors);
    this.validatePayerGroup(rule.payer_group, errors);

    const isValid = errors.filter(e => e.severity === 'error').length === 0;

    return {
      isValid,
      errors,
      checklist: {
        hasValidDescription,
        hasValidTags,
        hasValidCodeField,
        hasValidActionField,
        hasTriggerKeywords,
        hasChartSection,
        hasValidReference,
        hasClientPrefix
      }
    };
  }

  /**
   * Validate description format
   * Must be single sentence ending with period, containing inline tags
   */
  private validateDescription(description: string, errors: ValidationError[]): boolean {
    if (!description || description.trim().length === 0) {
      errors.push({
        field: 'description',
        message: 'Description is required',
        severity: 'error'
      });
      return false;
    }

    // Check for single sentence ending with period
    if (!description.trim().endsWith('.')) {
      errors.push({
        field: 'description',
        message: 'Description must end with a period',
        severity: 'error'
      });
      return false;
    }

    // Check for multiple sentences (more than one period)
    const periodCount = (description.match(/\./g) || []).length;
    if (periodCount > 1) {
      errors.push({
        field: 'description',
        message: 'Description must be exactly one sentence',
        severity: 'error'
      });
      return false;
    }

    // Check for inline tags
    const hasInlineTags = /@[A-Z_&]+/.test(description);
    if (!hasInlineTags) {
      errors.push({
        field: 'description',
        message: 'Description should contain inline @TAGS',
        severity: 'warning'
      });
    }

    return true;
  }

  /**
   * Validate all tags are spelled correctly per lookup
   */
  private validateTags(rule: SOPRule, errors: ValidationError[]): boolean {
    let isValid = true;

    // Extract all @TAGS from description
    const tagPattern = /@([A-Z_&]+)/g;
    const tagsInDescription = [...rule.description.matchAll(tagPattern)].map(m => `@${m[1]}`);

    // Get all valid tags
    const validTags = new Set([
      ...this.lookupTables.codeGroups.map(cg => cg.tag),
      ...this.lookupTables.payerGroups.map(pg => pg.tag),
      ...this.lookupTables.providerGroups.map(pg => pg.tag),
      ...this.lookupTables.actionTags.map(at => at.tag),
      ...this.lookupTables.chartSections.map(cs => `@${cs.tag}`)
    ]);

    // Validate each tag
    tagsInDescription.forEach(tag => {
      // Skip tags that are part of action syntax like @ADD(@25)
      if (tag.match(/@\d+/)) return;

      if (!validTags.has(tag) && !tag.match(/@[A-Z_&]+_SECTION$/)) {
        errors.push({
          field: 'description',
          message: `Invalid tag: ${tag}. Not found in lookup tables.`,
          severity: 'error'
        });
        isValid = false;
      }
    });

    return isValid;
  }

  /**
   * Validate code field contains ONLY code or @GROUP (no actions)
   */
  private validateCodeField(code: string, errors: ValidationError[]): boolean {
    if (!code || code.trim().length === 0) {
      errors.push({
        field: 'code',
        message: 'Code field is required',
        severity: 'error'
      });
      return false;
    }

    // Check if code field contains action syntax
    if (code.includes('@ADD') || code.includes('@REMOVE') || code.includes('@SWAP') || 
        code.includes('@COND_') || code.includes('@LINK') || code.includes('@NEVER')) {
      errors.push({
        field: 'code',
        message: 'Code field must contain ONLY the target code or @GROUP, not actions',
        severity: 'error'
      });
      return false;
    }

    // Validate it's either a @TAG or a valid code
    if (code.startsWith('@')) {
      const validCodeGroups = this.lookupTables.codeGroups.map(cg => cg.tag);
      if (!validCodeGroups.includes(code)) {
        errors.push({
          field: 'code',
          message: `Invalid code group: ${code}`,
          severity: 'error'
        });
        return false;
      }
    } else {
      // Validate it's a valid CPT/HCPCS/ICD code format
      if (!/^[A-Z0-9.]+$/.test(code)) {
        errors.push({
          field: 'code',
          message: `Invalid code format: ${code}`,
          severity: 'warning'
        });
      }
    }

    return true;
  }

  /**
   * Validate action field contains ONLY @ACTION(@code) statements
   */
  private validateActionField(action: string, errors: ValidationError[]): boolean {
    if (!action || action.trim().length === 0) {
      errors.push({
        field: 'action',
        message: 'Action field is required',
        severity: 'error'
      });
      return false;
    }

    // Check if action starts with valid action tag
    const validActionPrefixes = this.lookupTables.actionTags.map(at => at.tag);
    const actionParts = action.split(/\s+/);

    let isValid = true;
    actionParts.forEach(part => {
      const hasValidPrefix = validActionPrefixes.some(prefix => part.startsWith(prefix));
      if (!hasValidPrefix) {
        errors.push({
          field: 'action',
          message: `Invalid action syntax: ${part}. Must start with valid @ACTION tag.`,
          severity: 'error'
        });
        isValid = false;
      }
    });

    return isValid;
  }

  /**
   * Validate trigger keywords are present
   */
  private validateTriggerKeywords(triggers: string, errors: ValidationError[]): boolean {
    if (!triggers || triggers.trim().length === 0) {
      errors.push({
        field: 'documentation_trigger',
        message: 'Documentation triggers are required',
        severity: 'error'
      });
      return false;
    }

    // Check for semicolon separation
    if (!triggers.includes(';') && triggers.split(/\s+/).length > 1) {
      errors.push({
        field: 'documentation_trigger',
        message: 'Multiple triggers should be semicolon-separated',
        severity: 'warning'
      });
    }

    return true;
  }

  /**
   * Validate chart section
   */
  private validateChartSection(chartSection: string, errors: ValidationError[]): boolean {
    // Chart section can be blank
    if (!chartSection || chartSection.trim().length === 0) {
      return true;
    }

    const validSections = this.lookupTables.chartSections.map(cs => cs.tag);
    if (!validSections.includes(chartSection)) {
      errors.push({
        field: 'chart_section',
        message: `Invalid chart section: ${chartSection}`,
        severity: 'error'
      });
      return false;
    }

    return true;
  }

  /**
   * Validate reference cites file + page
   */
  private validateReference(reference: string, errors: ValidationError[]): boolean {
    if (!reference || reference.trim().length === 0) {
      errors.push({
        field: 'reference',
        message: 'Reference is required (file + page or bulletin #)',
        severity: 'error'
      });
      return false;
    }

    // Check for page reference pattern
    const hasPageRef = /p\.?\s*\d+|page\s+\d+|bulletin\s*#?\s*\d+/i.test(reference);
    if (!hasPageRef) {
      errors.push({
        field: 'reference',
        message: 'Reference should include page number or bulletin number',
        severity: 'warning'
      });
    }

    return true;
  }

  /**
   * Validate rule_id has correct client prefix
   */
  private validateClientPrefix(ruleId: string, errors: ValidationError[]): boolean {
    if (!ruleId || ruleId.trim().length === 0) {
      errors.push({
        field: 'rule_id',
        message: 'Rule ID is required',
        severity: 'error'
      });
      return false;
    }

    // Check format: [CLIENT]-[MNEMONIC]-[0001]
    const ruleIdPattern = /^[A-Z]{2,4}-[A-Z0-9_]+-\d{4}$/;
    if (!ruleIdPattern.test(ruleId)) {
      errors.push({
        field: 'rule_id',
        message: 'Rule ID must follow format: [CLIENT]-[MNEMONIC]-[0001]',
        severity: 'error'
      });
      return false;
    }

    return true;
  }

  /**
   * Validate effective date format
   */
  private validateEffectiveDate(effectiveDate: string, errors: ValidationError[]): boolean {
    if (!effectiveDate) {
      errors.push({
        field: 'effective_date',
        message: 'Effective date is required',
        severity: 'error'
      });
      return false;
    }

    // Check YYYY-MM-DD format
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(effectiveDate)) {
      errors.push({
        field: 'effective_date',
        message: 'Effective date must be in YYYY-MM-DD format',
        severity: 'error'
      });
      return false;
    }

    return true;
  }

  /**
   * Validate end date is after effective date
   */
  private validateEndDate(effectiveDate: string, endDate: string | undefined, errors: ValidationError[]): boolean {
    if (!endDate) return true; // End date is optional

    // Check YYYY-MM-DD format
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(endDate)) {
      errors.push({
        field: 'end_date',
        message: 'End date must be in YYYY-MM-DD format',
        severity: 'error'
      });
      return false;
    }

    // Check end date is after effective date
    if (new Date(endDate) <= new Date(effectiveDate)) {
      errors.push({
        field: 'end_date',
        message: 'End date must be after effective date',
        severity: 'error'
      });
      return false;
    }

    return true;
  }

  /**
   * Validate payer group format
   */
  private validatePayerGroup(payerGroup: string, errors: ValidationError[]): boolean {
    if (!payerGroup || payerGroup.trim().length === 0) {
      errors.push({
        field: 'payer_group',
        message: 'Payer group is required',
        severity: 'error'
      });
      return false;
    }

    // Check for pipe-delimited format
    const payers = payerGroup.split('|').map(p => p.trim());
    const validPayers = this.lookupTables.payerGroups.map(pg => pg.tag);

    let isValid = true;
    payers.forEach(payer => {
      if (!validPayers.includes(payer)) {
        errors.push({
          field: 'payer_group',
          message: `Invalid payer: ${payer}`,
          severity: 'error'
        });
        isValid = false;
      }
    });

    return isValid;
  }

  /**
   * Batch validate multiple rules
   */
  validateRules(rules: SOPRule[]): Map<string, RuleValidation> {
    const validations = new Map<string, RuleValidation>();

    rules.forEach(rule => {
      validations.set(rule.rule_id, this.validateRule(rule));
    });

    return validations;
  }
}

/**
 * Create a rule validation service instance
 */
export const createRuleValidationService = (lookupTables: LookupTables): RuleValidationService => {
  return new RuleValidationService(lookupTables);
};
