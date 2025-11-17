// Rule Quality Audit Service - Comprehensive QA for LLM-extracted rules

import { AdvancedSOPRule } from '@/types/advanced';
import { EnhancedLookupTables } from '@/types/lookupTable';

// ============================================================================
// Types
// ============================================================================

export interface ExtractedCode {
  code: string;
  type: 'procedure' | 'diagnosis' | 'modifier' | 'unknown';
  context: string;
  section: string;
  lineNumber?: number;
  pageNumber?: number;
}

export interface ExtractedCodeGroup {
  tag: string;
  context: string;
  section: string;
  mentionedCodes?: string[];
}

export interface DocumentExtractionResult {
  documentName: string;
  allCodes: ExtractedCode[];
  allCodeGroups: ExtractedCodeGroup[];
  totalUniqueCodes: number;
  totalUniqueCodeGroups: number;
}

export interface CodeMappingValidation {
  code: string;
  inDocument: boolean;
  inRules: boolean;
  inLookupTable: boolean;
  mappedToCodeGroup?: string;
  rulesUsing: string[]; // rule_ids
  context: string;
  status: 'valid' | 'missing_in_rules' | 'missing_in_lookup' | 'mapping_error';
  issues: string[];
}

export interface CodeGroupValidation {
  tag: string;
  existsInLookupTable: boolean;
  codesInLookupTable: string[];
  codesInRules: string[];
  missingCodes: string[];
  extraCodes: string[];
  rulesUsing: string[];
  status: 'valid' | 'incomplete' | 'not_found' | 'mapping_error';
  issues: string[];
}

export interface RuleValidationResult {
  ruleId: string;
  status: 'valid' | 'warning' | 'error';
  issues: RuleIssue[];
  warnings: RuleWarning[];
  codeValidation: {
    allCodesExpanded: boolean;
    allCodesMappedToLookup: boolean;
    codeGroupExists: boolean;
    descriptionMatchesContext: boolean;
  };
}

export interface RuleIssue {
  severity: 'error' | 'critical';
  field: string;
  message: string;
  suggestion?: string;
}

export interface RuleWarning {
  field: string;
  message: string;
  suggestion?: string;
}

export interface AuditReport {
  documentName: string;
  processedAt: string;
  summary: {
    totalCodesInDocument: number;
    totalCodeGroupsInDocument: number;
    totalRulesCreated: number;
    totalCodesInRules: number;
    missingCodesCount: number;
    mappingErrorsCount: number;
    contextMismatchCount: number;
    validRulesCount: number;
    rulesWithWarningsCount: number;
    rulesWithErrorsCount: number;
  };
  documentExtraction: DocumentExtractionResult;
  codeMappingValidation: CodeMappingValidation[];
  codeGroupValidation: CodeGroupValidation[];
  ruleValidation: RuleValidationResult[];
  missingCodes: ExtractedCode[];
  mappingErrors: CodeMappingValidation[];
  contextMismatches: RuleValidationResult[];
  recommendations: string[];
  canPublish: boolean;
  blockingIssues: string[];
}

// ============================================================================
// Service
// ============================================================================

export class RuleQualityAuditService {
  private lookupTables: EnhancedLookupTables;

  constructor(lookupTables: EnhancedLookupTables) {
    this.lookupTables = lookupTables;
  }

  /**
   * Extract all codes from document text
   */
  extractAllCodesFromDocument(
    documentText: string,
    documentName: string
  ): ExtractedCode[] {
    const codes: ExtractedCode[] = [];
    const lines = documentText.split('\n');

    // Common CPT code patterns: 5 digits, sometimes with modifiers
    const codePattern = /\b(\d{5})(?:-(\d{2}))?\b/g;

    lines.forEach((line, index) => {
      let match;
      while ((match = codePattern.exec(line)) !== null) {
        const code = match[1];
        const modifier = match[2];

        // Determine section (simple heuristic - can be improved)
        const section = this.determineSectionFromContext(line, lines, index);

        codes.push({
          code: modifier ? `${code}-${modifier}` : code,
          type: this.determineCodeType(code),
          context: line.trim(),
          section,
          lineNumber: index + 1
        });

        // If there's a modifier, also add it separately
        if (modifier) {
          codes.push({
            code: modifier,
            type: 'modifier',
            context: line.trim(),
            section,
            lineNumber: index + 1
          });
        }
      }
    });

    return codes;
  }

  /**
   * Extract all code group mentions from document
   */
  extractCodeGroupsFromDocument(
    documentText: string,
    documentName: string
  ): ExtractedCodeGroup[] {
    const codeGroups: ExtractedCodeGroup[] = [];
    const lines = documentText.split('\n');

    // Pattern for @TAG mentions
    const tagPattern = /@([A-Z_][A-Z0-9_]*)/g;

    lines.forEach((line, index) => {
      let match;
      while ((match = tagPattern.exec(line)) !== null) {
        const tag = `@${match[1]}`;
        const section = this.determineSectionFromContext(line, lines, index);

        codeGroups.push({
          tag,
          context: line.trim(),
          section
        });
      }
    });

    // Also look for code group descriptions in lookup table
    for (const codeGroup of this.lookupTables.codeGroups) {
      const purposeLower = codeGroup.purpose.toLowerCase();
      const textLower = documentText.toLowerCase();

      if (textLower.includes(purposeLower)) {
        // Find the line with this text
        const lineIndex = lines.findIndex(line =>
          line.toLowerCase().includes(purposeLower)
        );

        if (lineIndex !== -1) {
          codeGroups.push({
            tag: codeGroup.tag,
            context: lines[lineIndex].trim(),
            section: this.determineSectionFromContext(lines[lineIndex], lines, lineIndex),
            mentionedCodes: codeGroup.expands_to
          });
        }
      }
    }

    return codeGroups;
  }

  /**
   * Perform exhaustive extraction from document
   */
  performExhaustiveExtraction(
    documentText: string,
    documentName: string
  ): DocumentExtractionResult {
    const allCodes = this.extractAllCodesFromDocument(documentText, documentName);
    const allCodeGroups = this.extractCodeGroupsFromDocument(documentText, documentName);

    // Get unique codes
    const uniqueCodes = new Set(allCodes.map(c => c.code));
    const uniqueCodeGroups = new Set(allCodeGroups.map(cg => cg.tag));

    return {
      documentName,
      allCodes,
      allCodeGroups,
      totalUniqueCodes: uniqueCodes.size,
      totalUniqueCodeGroups: uniqueCodeGroups.size
    };
  }

  /**
   * Validate code mapping between document, rules, and lookup table
   */
  validateCodeMapping(
    documentExtraction: DocumentExtractionResult,
    rules: AdvancedSOPRule[]
  ): CodeMappingValidation[] {
    const validations: CodeMappingValidation[] = [];

    // Get all unique codes from document
    const documentCodes = new Set(documentExtraction.allCodes.map(c => c.code));

    // Get all codes from rules
    const ruleCodes = new Set<string>();
    const codeToRules = new Map<string, string[]>();

    for (const rule of rules) {
      if (rule.code) {
        const codes = rule.code.split(',').map(c => c.trim());
        codes.forEach(code => {
          ruleCodes.add(code);
          if (!codeToRules.has(code)) {
            codeToRules.set(code, []);
          }
          codeToRules.get(code)!.push(rule.rule_id);
        });
      }
    }

    // Validate each code from document
    for (const extractedCode of documentExtraction.allCodes) {
      const code = extractedCode.code;
      const inRules = ruleCodes.has(code);
      const inLookupTable = this.isCodeInLookupTable(code);
      const mappedToCodeGroup = this.findCodeGroupForCode(code);

      const issues: string[] = [];
      let status: CodeMappingValidation['status'] = 'valid';

      if (!inRules) {
        issues.push(`Code ${code} found in document but not in any rule`);
        status = 'missing_in_rules';
      }

      if (!inLookupTable) {
        issues.push(`Code ${code} not found in lookup table`);
        status = 'missing_in_lookup';
      }

      if (inRules && !mappedToCodeGroup) {
        issues.push(`Code ${code} in rules but not mapped to any code group`);
        status = 'mapping_error';
      }

      validations.push({
        code,
        inDocument: true,
        inRules,
        inLookupTable,
        mappedToCodeGroup: mappedToCodeGroup?.tag,
        rulesUsing: codeToRules.get(code) || [],
        context: extractedCode.context,
        status,
        issues
      });
    }

    // Also check codes in rules that aren't in document
    for (const code of ruleCodes) {
      if (!documentCodes.has(code)) {
        const inLookupTable = this.isCodeInLookupTable(code);
        const mappedToCodeGroup = this.findCodeGroupForCode(code);

        validations.push({
          code,
          inDocument: false,
          inRules: true,
          inLookupTable,
          mappedToCodeGroup: mappedToCodeGroup?.tag,
          rulesUsing: codeToRules.get(code) || [],
          context: 'Not found in document (may be from code group expansion)',
          status: inLookupTable ? 'valid' : 'missing_in_lookup',
          issues: inLookupTable
            ? []
            : [`Code ${code} in rules but not in lookup table`]
        });
      }
    }

    return validations;
  }

  /**
   * Validate code group usage and expansion
   */
  validateCodeGroups(
    documentExtraction: DocumentExtractionResult,
    rules: AdvancedSOPRule[]
  ): CodeGroupValidation[] {
    const validations: CodeGroupValidation[] = [];

    // Get all code groups used in rules
    const codeGroupsInRules = new Set<string>();
    const codeGroupToRules = new Map<string, string[]>();
    const codeGroupToCodes = new Map<string, Set<string>>();

    for (const rule of rules) {
      if (rule.code_group) {
        const groups = rule.code_group.split(',').map(g => g.trim());
        groups.forEach(group => {
          codeGroupsInRules.add(group);
          if (!codeGroupToRules.has(group)) {
            codeGroupToRules.set(group, []);
          }
          codeGroupToRules.get(group)!.push(rule.rule_id);

          // Track codes for this group
          if (rule.code) {
            if (!codeGroupToCodes.has(group)) {
              codeGroupToCodes.set(group, new Set());
            }
            const codes = rule.code.split(',').map(c => c.trim());
            codes.forEach(code => codeGroupToCodes.get(group)!.add(code));
          }
        });
      }
    }

    // Validate each code group
    for (const codeGroup of codeGroupsInRules) {
      const cleanTag = codeGroup.replace('@', '');
      const lookupEntry = this.lookupTables.codeGroups.find(
        cg => cg.tag === codeGroup || cg.tag === `@${cleanTag}`
      );

      const existsInLookupTable = !!lookupEntry;
      const codesInLookupTable = lookupEntry?.expands_to || [];
      const codesInRules = Array.from(codeGroupToCodes.get(codeGroup) || []);

      const issues: string[] = [];
      let status: CodeGroupValidation['status'] = 'valid';

      if (!existsInLookupTable) {
        issues.push(`Code group ${codeGroup} not found in lookup table`);
        status = 'not_found';
      } else {
        // Check if all codes from lookup table are in rules
        const missingCodes = codesInLookupTable.filter(
          code => !codesInRules.includes(code)
        );
        const extraCodes = codesInRules.filter(
          code => !codesInLookupTable.includes(code)
        );

        if (missingCodes.length > 0) {
          issues.push(
            `Code group ${codeGroup} missing ${missingCodes.length} codes in rules: ${missingCodes.join(', ')}`
          );
          status = 'incomplete';
        }

        if (extraCodes.length > 0) {
          issues.push(
            `Code group ${codeGroup} has ${extraCodes.length} extra codes not in lookup table: ${extraCodes.join(', ')}`
          );
          status = 'mapping_error';
        }

        validations.push({
          tag: codeGroup,
          existsInLookupTable,
          codesInLookupTable,
          codesInRules,
          missingCodes,
          extraCodes,
          rulesUsing: codeGroupToRules.get(codeGroup) || [],
          status,
          issues
        });
      }
    }

    return validations;
  }

  /**
   * Validate individual rule
   */
  validateRule(
    rule: AdvancedSOPRule,
    documentExtraction: DocumentExtractionResult
  ): RuleValidationResult {
    const issues: RuleIssue[] = [];
    const warnings: RuleWarning[] = [];

    // Check code group expansion
    let allCodesExpanded = true;
    let codeGroupExists = true;

    if (rule.code_group) {
      const groups = rule.code_group.split(',').map(g => g.trim());
      for (const group of groups) {
        const cleanTag = group.replace('@', '');
        const lookupEntry = this.lookupTables.codeGroups.find(
          cg => cg.tag === group || cg.tag === `@${cleanTag}`
        );

        if (!lookupEntry) {
          codeGroupExists = false;
          issues.push({
            severity: 'error',
            field: 'code_group',
            message: `Code group ${group} not found in lookup table`,
            suggestion: `Add ${group} to lookup table or use existing code group`
          });
        } else {
          // Check if all codes are expanded
          const ruleCodes = rule.code ? rule.code.split(',').map(c => c.trim()) : [];
          const missingCodes = lookupEntry.expands_to.filter(
            code => !ruleCodes.includes(code)
          );

          if (missingCodes.length > 0) {
            allCodesExpanded = false;
            issues.push({
              severity: 'error',
              field: 'code',
              message: `Code group ${group} not fully expanded. Missing: ${missingCodes.join(', ')}`,
              suggestion: `Add missing codes to rule.code field`
            });
          }
        }
      }
    }

    // Check if all codes are mapped to lookup table
    let allCodesMappedToLookup = true;
    if (rule.code) {
      const codes = rule.code.split(',').map(c => c.trim());
      for (const code of codes) {
        if (!this.isCodeInLookupTable(code)) {
          allCodesMappedToLookup = false;
          warnings.push({
            field: 'code',
            message: `Code ${code} not found in lookup table`,
            suggestion: `Add ${code} to appropriate code group in lookup table`
          });
        }
      }
    }

    // Check description context match
    let descriptionMatchesContext = true;
    if (rule.code_group) {
      const groups = rule.code_group.split(',').map(g => g.trim());
      for (const group of groups) {
        const cleanTag = group.replace('@', '');
        const lookupEntry = this.lookupTables.codeGroups.find(
          cg => cg.tag === group || cg.tag === `@${cleanTag}`
        );

        if (lookupEntry && rule.description) {
          const purposeLower = lookupEntry.purpose.toLowerCase();
          const descLower = rule.description.toLowerCase();

          // Simple check - can be improved with semantic matching
          if (!descLower.includes(purposeLower.split(' ')[0])) {
            descriptionMatchesContext = false;
            warnings.push({
              field: 'description',
              message: `Description may not match code group ${group} context`,
              suggestion: `Verify description aligns with: ${lookupEntry.purpose}`
            });
          }
        }
      }
    }

    // Determine overall status
    let status: RuleValidationResult['status'] = 'valid';
    if (issues.length > 0) {
      status = 'error';
    } else if (warnings.length > 0) {
      status = 'warning';
    }

    return {
      ruleId: rule.rule_id,
      status,
      issues,
      warnings,
      codeValidation: {
        allCodesExpanded,
        allCodesMappedToLookup,
        codeGroupExists,
        descriptionMatchesContext
      }
    };
  }

  /**
   * Generate comprehensive audit report
   */
  generateAuditReport(
    documentText: string,
    documentName: string,
    rules: AdvancedSOPRule[]
  ): AuditReport {
    // Step 1: Exhaustive extraction
    const documentExtraction = this.performExhaustiveExtraction(
      documentText,
      documentName
    );

    // Step 2: Validate code mapping
    const codeMappingValidation = this.validateCodeMapping(
      documentExtraction,
      rules
    );

    // Step 3: Validate code groups
    const codeGroupValidation = this.validateCodeGroups(
      documentExtraction,
      rules
    );

    // Step 4: Validate each rule
    const ruleValidation = rules.map(rule =>
      this.validateRule(rule, documentExtraction)
    );

    // Step 5: Calculate summary
    const missingCodes = codeMappingValidation.filter(
      v => v.status === 'missing_in_rules'
    );
    const mappingErrors = codeMappingValidation.filter(
      v => v.status === 'mapping_error' || v.status === 'missing_in_lookup'
    );
    const contextMismatches = ruleValidation.filter(
      v => !v.codeValidation.descriptionMatchesContext
    );

    const validRulesCount = ruleValidation.filter(v => v.status === 'valid').length;
    const rulesWithWarningsCount = ruleValidation.filter(
      v => v.status === 'warning'
    ).length;
    const rulesWithErrorsCount = ruleValidation.filter(
      v => v.status === 'error'
    ).length;

    // Step 6: Determine if can publish
    const blockingIssues: string[] = [];
    if (missingCodes.length > 0) {
      blockingIssues.push(
        `${missingCodes.length} codes from document not present in rules`
      );
    }
    if (rulesWithErrorsCount > 0) {
      blockingIssues.push(`${rulesWithErrorsCount} rules have critical errors`);
    }

    const canPublish = blockingIssues.length === 0;

    // Step 7: Generate recommendations
    const recommendations: string[] = [];
    if (missingCodes.length > 0) {
      recommendations.push(
        `Review and add ${missingCodes.length} missing codes to rules`
      );
    }
    if (mappingErrors.length > 0) {
      recommendations.push(
        `Fix ${mappingErrors.length} code mapping errors in lookup table`
      );
    }
    if (contextMismatches.length > 0) {
      recommendations.push(
        `Review ${contextMismatches.length} rules with context mismatches`
      );
    }
    if (codeGroupValidation.some(v => v.status === 'incomplete')) {
      recommendations.push('Ensure all code groups are fully expanded in rules');
    }

    return {
      documentName,
      processedAt: new Date().toISOString(),
      summary: {
        totalCodesInDocument: documentExtraction.totalUniqueCodes,
        totalCodeGroupsInDocument: documentExtraction.totalUniqueCodeGroups,
        totalRulesCreated: rules.length,
        totalCodesInRules: new Set(
          rules.flatMap(r => (r.code ? r.code.split(',').map(c => c.trim()) : []))
        ).size,
        missingCodesCount: missingCodes.length,
        mappingErrorsCount: mappingErrors.length,
        contextMismatchCount: contextMismatches.length,
        validRulesCount,
        rulesWithWarningsCount,
        rulesWithErrorsCount
      },
      documentExtraction,
      codeMappingValidation,
      codeGroupValidation,
      ruleValidation,
      missingCodes: missingCodes.map(v =>
        documentExtraction.allCodes.find(c => c.code === v.code)!
      ),
      mappingErrors,
      contextMismatches,
      recommendations,
      canPublish,
      blockingIssues
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private determineCodeType(code: string): ExtractedCode['type'] {
    // Simple heuristic - can be improved
    const codeNum = parseInt(code);
    if (codeNum >= 99000 && codeNum <= 99999) return 'procedure';
    if (codeNum >= 10000 && codeNum <= 69999) return 'procedure';
    if (codeNum >= 70000 && codeNum <= 79999) return 'diagnosis';
    return 'unknown';
  }

  private determineSectionFromContext(
    line: string,
    allLines: string[],
    lineIndex: number
  ): string {
    // Look backwards for section headers
    for (let i = lineIndex; i >= 0 && i > lineIndex - 20; i--) {
      const prevLine = allLines[i].trim();
      // Check if line looks like a header (all caps, short, etc.)
      if (
        prevLine.length > 0 &&
        prevLine.length < 100 &&
        (prevLine === prevLine.toUpperCase() || prevLine.endsWith(':'))
      ) {
        return prevLine.replace(':', '').trim();
      }
    }
    return 'Unknown Section';
  }

  private isCodeInLookupTable(code: string): boolean {
    return this.lookupTables.codeGroups.some(cg =>
      cg.expands_to.includes(code)
    );
  }

  private findCodeGroupForCode(code: string) {
    return this.lookupTables.codeGroups.find(cg =>
      cg.expands_to.includes(code)
    );
  }
}
