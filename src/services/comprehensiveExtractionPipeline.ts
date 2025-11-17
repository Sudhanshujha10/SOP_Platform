// Comprehensive Extraction Pipeline - Exhaustive code coverage and validation

import { AdvancedSOPRule } from '@/types/advanced';
import { EnhancedLookupTables } from '@/types/lookupTable';
import { TagValidationService } from './tagValidationService';
// import { LookupTableAutoPopulationService, AutoPopulationResult } from './lookupTableAutoPopulationService';

// ============================================================================
// Core Types
// ============================================================================

export interface ExtractedCode {
  code: string;
  type: 'procedure' | 'diagnosis' | 'modifier';
  context: string;
  lineNumber: number;
  inRules: string[];
  inLookupTable: boolean;
  lookupTableGroups: string[];
  status: 'covered' | 'missing_in_rules' | 'missing_in_lookup' | 'orphaned';
}

export interface CodeCoverageReport {
  totalCodesInDocument: number;
  totalCodesInRules: number;
  coveredCodes: ExtractedCode[];
  missingInRules: ExtractedCode[];
  missingInLookup: ExtractedCode[];
  orphanedCodes: ExtractedCode[];
  coveragePercentage: number;
}

export interface RuleLookupValidation {
  ruleId: string;
  codeGroupsValid: boolean;
  payerGroupsValid: boolean;
  providerGroupsValid: boolean;
  brokenLinks: string[];
  allValid: boolean;
}

export interface ConflictReport {
  type: 'duplicate_tag' | 'code_multiple_groups' | 'orphaned_code' | 'missing_link';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  affectedEntities: string[];
  resolution: string;
}

export interface ValidationChecklist {
  allCodesInRules: boolean;
  allCodesInLookup: boolean;
  allRulesLinked: boolean;
  noDuplicates: boolean;
  score: number;
  passed: boolean;
}

export interface PipelineResult {
  documentName: string;
  extractedRules: AdvancedSOPRule[];
  codeCoverage: CodeCoverageReport;
  ruleLookupValidation: RuleLookupValidation[];
  conflicts: ConflictReport[];
  validation: ValidationChecklist;
  // autoPopulationResult: AutoPopulationResult;
  updatedLookupTables: EnhancedLookupTables;
  timestamp: string;
}

// ============================================================================
// Service
// ============================================================================

export class ComprehensiveExtractionPipeline {
  private lookupTables: EnhancedLookupTables;
  private tagValidationService: TagValidationService;
  // private autoPopulationService: LookupTableAutoPopulationService;

  constructor(lookupTables: EnhancedLookupTables) {
    this.lookupTables = lookupTables;
    this.tagValidationService = new TagValidationService(lookupTables);
    // this.autoPopulationService = new LookupTableAutoPopulationService(lookupTables);
  }

  /**
   * Main pipeline execution
   */
  async execute(
    documentText: string,
    documentName: string,
    extractedRules: AdvancedSOPRule[]
  ): Promise<PipelineResult> {
    console.log(`[Pipeline] Starting comprehensive extraction for: ${documentName}`);

    // Step 1: Extract all codes from document
    const extractedCodes = this.extractAllCodes(documentText);
    console.log(`[Pipeline] Found ${extractedCodes.length} codes in document`);

    // Step 2: Auto-populate lookup table with missing tags (disabled)
    // const autoPopulationResult = this.autoPopulationService.autoPopulateLookupTable(
    //   documentText,
    //   documentName,
    //   extractedRules,
    //   { autoApprove: false, minConfidence: 0.7 }
    // );
    console.log(`[Pipeline] Auto-population: disabled`);

    // Update lookup tables reference
    // this.lookupTables = autoPopulationResult.updatedLookupTables;
    // this.tagValidationService = new TagValidationService(this.lookupTables);

    // Step 3: Audit code coverage
    const codeCoverage = this.auditCodeCoverage(extractedCodes, extractedRules);
    console.log(`[Pipeline] Code coverage: ${codeCoverage.coveragePercentage.toFixed(1)}%`);

    // Step 4: Validate rule-lookup links
    const ruleLookupValidation = this.validateRuleLookupLinks(extractedRules);
    const validRules = ruleLookupValidation.filter(r => r.allValid).length;
    console.log(`[Pipeline] Rule validation: ${validRules}/${extractedRules.length} valid`);

    // Step 5: Detect conflicts
    const conflicts = this.detectConflicts(extractedCodes, extractedRules, ruleLookupValidation);
    console.log(`[Pipeline] Detected ${conflicts.length} conflicts`);

    // Step 6: Run validation checklist
    const validation = this.runValidation(codeCoverage, ruleLookupValidation, conflicts);
    console.log(`[Pipeline] Validation score: ${validation.score}/100 - ${validation.passed ? 'PASSED' : 'FAILED'}`);

    return {
      documentName,
      extractedRules,
      codeCoverage,
      ruleLookupValidation,
      conflicts,
      validation,
      // autoPopulationResult,
      updatedLookupTables: this.lookupTables,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Extract all codes from document text
   */
  private extractAllCodes(documentText: string): ExtractedCode[] {
    const codes: ExtractedCode[] = [];
    const seenCodes = new Set<string>();
    const lines = documentText.split('\n');

    const cptPattern = /\b(\d{5})\b/g;
    const icdPattern = /\b([A-Z]\d{2}(?:\.\d{1,4})?)\b/g;
    const modPattern = /\b(?:modifier|mod)\s+(\d{2})\b/gi;

    lines.forEach((line, index) => {
      // CPT codes
      let match;
      while ((match = cptPattern.exec(line)) !== null) {
        const code = match[1];
        if (!seenCodes.has(code)) {
          seenCodes.add(code);
          codes.push({
            code,
            type: 'procedure',
            context: line.trim().substring(0, 100),
            lineNumber: index + 1,
            inRules: [],
            inLookupTable: false,
            lookupTableGroups: [],
            status: 'missing_in_rules'
          });
        }
      }

      // ICD codes
      while ((match = icdPattern.exec(line)) !== null) {
        const code = match[1];
        if (!seenCodes.has(code)) {
          seenCodes.add(code);
          codes.push({
            code,
            type: 'diagnosis',
            context: line.trim().substring(0, 100),
            lineNumber: index + 1,
            inRules: [],
            inLookupTable: false,
            lookupTableGroups: [],
            status: 'missing_in_rules'
          });
        }
      }

      // Modifiers
      while ((match = modPattern.exec(line)) !== null) {
        const code = match[1];
        if (!seenCodes.has(code)) {
          seenCodes.add(code);
          codes.push({
            code,
            type: 'modifier',
            context: line.trim().substring(0, 100),
            lineNumber: index + 1,
            inRules: [],
            inLookupTable: false,
            lookupTableGroups: [],
            status: 'missing_in_rules'
          });
        }
      }
    });

    return codes;
  }

  /**
   * Audit code coverage
   */
  private auditCodeCoverage(
    extractedCodes: ExtractedCode[],
    rules: AdvancedSOPRule[]
  ): CodeCoverageReport {
    const codesInRules = new Set<string>();
    const codeToRules = new Map<string, string[]>();

    // Collect codes from rules
    rules.forEach(rule => {
      if (rule.code) {
        const codes = rule.code.split(',').map(c => c.trim()).filter(c => !c.startsWith('@'));
        codes.forEach(code => {
          codesInRules.add(code);
          if (!codeToRules.has(code)) {
            codeToRules.set(code, []);
          }
          codeToRules.get(code)!.push(rule.rule_id || 'unknown');
        });
      }
    });

    // Check each extracted code
    const coveredCodes: ExtractedCode[] = [];
    const missingInRules: ExtractedCode[] = [];
    const missingInLookup: ExtractedCode[] = [];
    const orphanedCodes: ExtractedCode[] = [];

    extractedCodes.forEach(extractedCode => {
      const inRules = codesInRules.has(extractedCode.code);
      if (inRules) {
        extractedCode.inRules = codeToRules.get(extractedCode.code) || [];
      }

      const lookupGroups = this.findCodeInLookup(extractedCode.code);
      extractedCode.inLookupTable = lookupGroups.length > 0;
      extractedCode.lookupTableGroups = lookupGroups;

      if (inRules && extractedCode.inLookupTable) {
        extractedCode.status = 'covered';
        coveredCodes.push(extractedCode);
      } else if (!inRules && !extractedCode.inLookupTable) {
        extractedCode.status = 'orphaned';
        orphanedCodes.push(extractedCode);
      } else if (!inRules) {
        extractedCode.status = 'missing_in_rules';
        missingInRules.push(extractedCode);
      } else {
        extractedCode.status = 'missing_in_lookup';
        missingInLookup.push(extractedCode);
      }
    });

    const coveragePercentage = extractedCodes.length > 0
      ? (coveredCodes.length / extractedCodes.length) * 100
      : 100;

    return {
      totalCodesInDocument: extractedCodes.length,
      totalCodesInRules: codesInRules.size,
      coveredCodes,
      missingInRules,
      missingInLookup,
      orphanedCodes,
      coveragePercentage
    };
  }

  /**
   * Validate rule-lookup links
   */
  private validateRuleLookupLinks(rules: AdvancedSOPRule[]): RuleLookupValidation[] {
    return rules.map(rule => {
      const brokenLinks: string[] = [];
      let codeGroupsValid = true;
      let payerGroupsValid = true;
      let providerGroupsValid = true;

      // Validate code groups
      if (rule.code_group) {
        const tags = rule.code_group.split(',').map(t => t.trim());
        tags.forEach(tag => {
          const cleanTag = tag.startsWith('@') ? tag : `@${tag}`;
          const exists = this.lookupTables.codeGroups.some(cg => cg.tag === cleanTag);
          if (!exists) {
            codeGroupsValid = false;
            brokenLinks.push(`code_group: ${cleanTag}`);
          }
        });
      }

      // Validate payer groups
      if (rule.payer_group) {
        const payerGroupStr = Array.isArray(rule.payer_group) ? rule.payer_group.join(',') : rule.payer_group;
        const tags = payerGroupStr.split(',').map(t => t.trim());
        tags.forEach(tag => {
          const cleanTag = tag.startsWith('@') ? tag : `@${tag}`;
          const exists = this.lookupTables.payerGroups.some(pg => pg.tag === cleanTag);
          if (!exists) {
            payerGroupsValid = false;
            brokenLinks.push(`payer_group: ${cleanTag}`);
          }
        });
      }

      // Validate provider groups
      if (rule.provider_group) {
        const providerGroupStr = Array.isArray(rule.provider_group) ? rule.provider_group.join(',') : rule.provider_group;
        const tags = providerGroupStr.split(',').map(t => t.trim());
        tags.forEach(tag => {
          const cleanTag = tag.startsWith('@') ? tag : `@${tag}`;
          const exists = this.lookupTables.providerGroups.some(pg => pg.tag === cleanTag);
          if (!exists) {
            providerGroupsValid = false;
            brokenLinks.push(`provider_group: ${cleanTag}`);
          }
        });
      }

      return {
        ruleId: rule.rule_id || 'unknown',
        codeGroupsValid,
        payerGroupsValid,
        providerGroupsValid,
        brokenLinks,
        allValid: brokenLinks.length === 0
      };
    });
  }

  /**
   * Detect conflicts
   */
  private detectConflicts(
    extractedCodes: ExtractedCode[],
    rules: AdvancedSOPRule[],
    ruleLookupValidation: RuleLookupValidation[]
  ): ConflictReport[] {
    const conflicts: ConflictReport[] = [];

    // Orphaned codes
    extractedCodes.filter(c => c.status === 'orphaned').forEach(code => {
      conflicts.push({
        type: 'orphaned_code',
        severity: 'high',
        description: `Code ${code.code} found in document but not in rules or lookup table`,
        affectedEntities: [code.code],
        resolution: 'Add to rule and create code group in lookup table'
      });
    });

    // Missing in lookup
    extractedCodes.filter(c => c.status === 'missing_in_lookup').forEach(code => {
      conflicts.push({
        type: 'missing_link',
        severity: 'high',
        description: `Code ${code.code} in rules but not in lookup table`,
        affectedEntities: [code.code, ...code.inRules],
        resolution: 'Add code to appropriate code group in lookup table'
      });
    });

    // Broken rule links
    ruleLookupValidation.filter(r => !r.allValid).forEach(validation => {
      validation.brokenLinks.forEach(link => {
        conflicts.push({
          type: 'missing_link',
          severity: 'critical',
          description: `Rule ${validation.ruleId} has broken link: ${link}`,
          affectedEntities: [validation.ruleId, link],
          resolution: 'Create missing tag in lookup table or fix rule reference'
        });
      });
    });

    // Codes in multiple groups
    const codeToGroups = new Map<string, string[]>();
    this.lookupTables.codeGroups.forEach(group => {
      group.expands_to.forEach(code => {
        if (!codeToGroups.has(code)) {
          codeToGroups.set(code, []);
        }
        codeToGroups.get(code)!.push(group.tag);
      });
    });

    codeToGroups.forEach((groups, code) => {
      if (groups.length > 1) {
        conflicts.push({
          type: 'code_multiple_groups',
          severity: 'medium',
          description: `Code ${code} appears in ${groups.length} groups: ${groups.join(', ')}`,
          affectedEntities: [code, ...groups],
          resolution: 'Review and assign to primary group only'
        });
      }
    });

    return conflicts;
  }

  /**
   * Run validation checklist
   */
  private runValidation(
    codeCoverage: CodeCoverageReport,
    ruleLookupValidation: RuleLookupValidation[],
    conflicts: ConflictReport[]
  ): ValidationChecklist {
    const allCodesInRules = codeCoverage.missingInRules.length === 0;
    const allCodesInLookup = codeCoverage.missingInLookup.length === 0;
    const allRulesLinked = ruleLookupValidation.every(r => r.allValid);
    const noDuplicates = !conflicts.some(c => c.type === 'duplicate_tag');

    let score = 0;
    if (allCodesInRules) score += 25;
    if (allCodesInLookup) score += 25;
    if (allRulesLinked) score += 30;
    if (noDuplicates) score += 20;

    const passed = allCodesInRules && allCodesInLookup && allRulesLinked && noDuplicates;

    return {
      allCodesInRules,
      allCodesInLookup,
      allRulesLinked,
      noDuplicates,
      score,
      passed
    };
  }

  // Helper methods
  private findCodeInLookup(code: string): string[] {
    const groups: string[] = [];
    this.lookupTables.codeGroups.forEach(group => {
      if (group.expands_to.includes(code)) {
        groups.push(group.tag);
      }
    });
    return groups;
  }

  getUpdatedLookupTables(): EnhancedLookupTables {
    return this.lookupTables;
  }
}
