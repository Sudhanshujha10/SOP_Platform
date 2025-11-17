/**
 * Document Processing Service for AI-Powered Rule Extraction
 * Implements comprehensive lookup table integration with LLM processing
 */

import { AdvancedSOPRule } from '@/types/advanced';
import { TagValidationService } from './tagValidationService';
import { RuleValidationResult, TagCreationRequest } from '@/types/lookupTable';
import { masterLookupTableService } from './masterLookupTableService';
import { SOPManagementService } from './sopManagementService';

export interface ExtractedRule {
  rule: Partial<AdvancedSOPRule>;
  validation: RuleValidationResult;
  confidence: number;
  source_text: string;
}

export interface DocumentProcessingResult {
  extractedRules: ExtractedRule[];
  newTagsCreated: TagCreationRequest[];
  errors: string[];
  warnings: string[];
  summary: {
    totalRulesExtracted: number;
    validRules: number;
    rulesNeedingReview: number;
    invalidRules: number;
    newTagsDetected: number;
  };
}

export class DocumentProcessingService {
  private tagValidationService: TagValidationService;

  constructor(tagValidationService: TagValidationService) {
    this.tagValidationService = tagValidationService;
  }

  /**
   * Process uploaded document and extract rules with Main Lookup Table integration
   * Implements the required synchronization flow:
   * Document Upload → LLM Processing → Check Main Lookup Table → Three-way Sync
   */
  async processDocument(
    documentContent: string,
    documentName: string,
    processingType: 'new' | 'update' | 'bulk',
    sopId?: string
  ): Promise<DocumentProcessingResult> {
    console.log(`📄 Processing document: ${documentName} (Type: ${processingType})`);
    
    const extractedRules: ExtractedRule[] = [];
    const newTagsCreated: TagCreationRequest[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Step 1: Extract rule candidates from document using LLM
      console.log('🤖 Step 1: LLM Rule Extraction');
      const ruleCandidates = await this.extractRulesWithLLM(documentContent, documentName);
      
      // Step 2: For each rule, check Main Lookup Table and validate tags
      console.log('🔍 Step 2: Main Lookup Table Validation');
      for (const candidate of ruleCandidates) {
        const validatedRule = await this.validateRuleAgainstMainLookupTable(candidate);
        extractedRules.push(validatedRule);
        
        // Collect new tags that need to be created
        if (validatedRule.validation.newTagsToCreate.length > 0) {
          newTagsCreated.push(...validatedRule.validation.newTagsToCreate);
        }
      }
      
      // Step 3: Create new tags in Main Lookup Table
      console.log('➕ Step 3: Creating New Tags in Main Lookup Table');
      await this.createNewTagsInMainLookupTable(newTagsCreated, sopId);
      
      // Step 4: If SOP is provided, perform three-way synchronization
      if (sopId) {
        console.log('🔄 Step 4: Three-way Synchronization');
        const validRules = extractedRules
          .filter(er => er.validation.status === 'VALID')
          .map(er => er.rule as AdvancedSOPRule);
          
        // Add rules to SOP
        const sop = SOPManagementService.getSOPById(sopId);
        if (sop) {
          const updatedRules = [...sop.rules, ...validRules];
          SOPManagementService.updateSOP(sopId, { rules: updatedRules });
        }
        
        // Perform synchronization
        const syncResult = masterLookupTableService.synchronizeSOPLookupTables(sopId);
        console.log('✅ Synchronization result:', syncResult);
      }

      // Step 5: Generate summary
      const summary = {
        totalRulesExtracted: extractedRules.length,
        validRules: extractedRules.filter(r => r.validation.status === 'VALID').length,
        rulesNeedingReview: extractedRules.filter(r => r.validation.status === 'NEEDS_REVIEW').length,
        invalidRules: extractedRules.filter(r => r.validation.status === 'INVALID').length,
        newTagsDetected: [...new Set(newTagsCreated.map(t => t.tag))].length
      };

      return {
        extractedRules,
        newTagsCreated,
        errors,
        warnings,
        summary
      };

    } catch (error) {
      errors.push(`Document processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return {
        extractedRules: [],
        newTagsCreated: [],
        errors,
        warnings,
        summary: {
          totalRulesExtracted: 0,
          validRules: 0,
          rulesNeedingReview: 0,
          invalidRules: 0,
          newTagsDetected: 0
        }
      };
    }
  }

  /**
   * Extract rules using LLM with Main Lookup Table integration
   */
  private async extractRulesWithLLM(documentContent: string, documentName: string): Promise<{
    rule: Partial<AdvancedSOPRule>;
    confidence: number;
    source_text: string;
  }[]> {
    console.log(`🤖 LLM Processing document: ${documentName}`);
    
    // TODO: Replace with actual LLM integration
    // This should call your LLM service with the document content
    // and return structured rule data
    
    return this.extractRuleCandidates(documentContent);
  }

  /**
   * Validate rule against Main Lookup Table
   */
  private async validateRuleAgainstMainLookupTable(candidate: {
    rule: Partial<AdvancedSOPRule>;
    confidence: number;
    source_text: string;
  }): Promise<ExtractedRule> {
    console.log(`🔍 Validating rule against Main Lookup Table: ${candidate.rule.rule_id || 'unknown'}`);
    
    // Use tag validation service to check against main lookup table
    const validation = this.tagValidationService.validateRule(candidate.rule);
    
    // Auto-populate codes from tags
    if (candidate.rule.code) {
      const codes = this.autoPopulateCodesFromTags(candidate.rule.code);
      if (codes.length > 0) {
        candidate.rule.code = codes.join(',');
      }
    }
    
    return {
      rule: candidate.rule,
      validation,
      confidence: candidate.confidence,
      source_text: candidate.source_text
    };
  }

  /**
   * Create new tags in Main Lookup Table
   */
  private async createNewTagsInMainLookupTable(
    newTags: TagCreationRequest[], 
    sopId?: string
  ): Promise<void> {
    console.log(`➕ Creating ${newTags.length} new tags in Main Lookup Table`);
    
    for (const tagRequest of newTags) {
      const success = masterLookupTableService.addTagToMainLookupTable(
        tagRequest.tag,
        tagRequest.type as any,
        {
          description: tagRequest.description,
          purpose: tagRequest.purpose,
          expands_to: tagRequest.expands_to,
          source_rule_id: 'document_upload',
          source_sop_id: sopId
        }
      );
      
      if (success) {
        console.log(`✅ Created tag: ${tagRequest.tag} (${tagRequest.type})`);
      } else {
        console.error(`❌ Failed to create tag: ${tagRequest.tag}`);
      }
    }
  }

  /**
   * Extract rule candidates from document
   * This is a placeholder for AI/LLM integration
   */
  private async extractRuleCandidates(documentContent: string): Promise<{
    rule: Partial<AdvancedSOPRule>;
    confidence: number;
    source_text: string;
  }[]> {
    // TODO: Integrate with your AI/LLM service
    // This should:
    // 1. Parse document content
    // 2. Identify rule patterns
    // 3. Extract payer groups, procedure groups, actions, codes
    // 4. Generate rule descriptions with inline @tags
    // 5. Return structured rule objects

    // Placeholder implementation
    const candidates: {
      rule: Partial<AdvancedSOPRule>;
      confidence: number;
      source_text: string;
    }[] = [];

    // Example: Parse simple rule format from document
    const lines = documentContent.split('\n');
    let currentRule: Partial<AdvancedSOPRule> = {};
    let sourceText = '';

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Simple pattern matching (replace with AI/LLM)
      if (trimmed.startsWith('Rule:') || trimmed.startsWith('SOP:')) {
        if (currentRule.description) {
          candidates.push({
            rule: currentRule,
            confidence: 0.85,
            source_text: sourceText
          });
        }
        currentRule = {};
        sourceText = trimmed;
      } else if (trimmed) {
        sourceText += '\n' + trimmed;
        
        // Extract components (simplified)
        if (trimmed.toLowerCase().includes('payer:')) {
          const match = trimmed.match(/@[A-Z_]+/g);
          if (match) currentRule.payer_group = match[0];
        }
        if (trimmed.toLowerCase().includes('procedure:')) {
          const match = trimmed.match(/@[A-Z_]+/g);
          if (match) currentRule.code = match[0];
        }
        if (trimmed.toLowerCase().includes('action:')) {
          const match = trimmed.match(/@[A-Z_]+/g);
          if (match) currentRule.action = match[0];
        }
        if (!currentRule.description && trimmed.length > 20) {
          currentRule.description = trimmed;
        }
      }
    }

    // Add last rule
    if (currentRule.description) {
      candidates.push({
        rule: currentRule,
        confidence: 0.85,
        source_text: sourceText
      });
    }

    return candidates;
  }

  /**
   * Auto-populate codes from code group tags
   */
  private autoPopulateCodesFromTags(codeField: string): string[] {
    const tags = codeField.split(',').map(t => t.trim());
    const expandedCodes: string[] = [];

    for (const tag of tags) {
      if (tag.startsWith('@')) {
        // This is a tag - expand it
        const codes = this.tagValidationService.autoPopulateCodesFromTag(tag);
        expandedCodes.push(...codes);
      } else {
        // This is already a code
        expandedCodes.push(tag);
      }
    }

    return [...new Set(expandedCodes)]; // Remove duplicates
  }

  /**
   * Generate rule ID
   */
  generateRuleId(prefix: string = 'AU'): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Validate bulk import
   */
  async validateBulkImport(rules: Partial<AdvancedSOPRule>[]): Promise<{
    validRules: Partial<AdvancedSOPRule>[];
    invalidRules: { rule: Partial<AdvancedSOPRule>; errors: string[] }[];
    newTags: TagCreationRequest[];
  }> {
    const validRules: Partial<AdvancedSOPRule>[] = [];
    const invalidRules: { rule: Partial<AdvancedSOPRule>; errors: string[] }[] = [];
    const newTags: TagCreationRequest[] = [];

    for (const rule of rules) {
      const validation = this.tagValidationService.validateRule(rule);

      if (validation.status === 'VALID') {
        validRules.push(rule);
      } else if (validation.status === 'NEEDS_REVIEW') {
        validRules.push(rule); // Include but flag for review
        newTags.push(...validation.newTagsToCreate);
      } else {
        invalidRules.push({
          rule,
          errors: validation.errors
        });
      }
    }

    return {
      validRules,
      invalidRules,
      newTags: [...new Set(newTags.map(t => JSON.stringify(t)))].map(t => JSON.parse(t))
    };
  }
}
