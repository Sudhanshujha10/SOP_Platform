/**
 * LLM Integration Service
 * Handles AI-powered rule extraction with Main Lookup Table integration
 * Implements the core requirement: "LLM always queries the Main Lookup Table first"
 */

import { AdvancedSOPRule } from '@/types/advanced';
import { masterLookupTableService } from './masterLookupTableService';
import { TagCreationRequest } from '@/types/lookupTable';

export interface LLMExtractionResult {
  rules: AdvancedSOPRule[];
  newTags: TagCreationRequest[];
  confidence: number;
  processingTime: number;
  warnings: string[];
}

export interface LLMPromptContext {
  documentContent: string;
  documentType: 'sop_document' | 'policy_update' | 'manual_rule';
  existingTags: {
    codeGroups: string[];
    payerGroups: string[];
    providerGroups: string[];
    actionTags: string[];
    chartSections: string[];
  };
  sopContext?: {
    sopId: string;
    sopName: string;
    existingRules: AdvancedSOPRule[];
  };
}

export class LLMIntegrationService {
  private static instance: LLMIntegrationService;

  private constructor() {}

  public static getInstance(): LLMIntegrationService {
    if (!LLMIntegrationService.instance) {
      LLMIntegrationService.instance = new LLMIntegrationService();
    }
    return LLMIntegrationService.instance;
  }

  /**
   * Extract rules from document with Main Lookup Table integration
   * Core Implementation: LLM queries Main Lookup Table FIRST
   */
  async extractRulesFromDocument(
    documentContent: string,
    documentType: 'sop_document' | 'policy_update' | 'manual_rule',
    sopId?: string
  ): Promise<LLMExtractionResult> {
    console.log(`🤖 LLM Processing: ${documentType}`);
    const startTime = Date.now();

    try {
      // Step 1: Query Main Lookup Table for existing tags
      console.log('🔍 Step 1: Querying Main Lookup Table for existing tags');
      const existingTags = this.getExistingTagsFromMainLookupTable();

      // Step 2: Build context for LLM prompt
      const promptContext: LLMPromptContext = {
        documentContent,
        documentType,
        existingTags
      };

      // Add SOP context if provided
      if (sopId) {
        const sop = await this.getSOPContext(sopId);
        if (sop) {
          promptContext.sopContext = sop;
        }
      }

      // Step 3: Generate LLM prompt with Main Lookup Table context
      const prompt = this.generateLLMPrompt(promptContext);

      // Step 4: Call LLM service (placeholder for actual implementation)
      console.log('🤖 Step 4: Calling LLM service');
      const llmResponse = await this.callLLMService(prompt);

      // Step 5: Parse LLM response and identify new tags
      console.log('🔍 Step 5: Parsing LLM response and identifying new tags');
      const parsedResult = this.parseLLMResponse(llmResponse, existingTags);

      const processingTime = Date.now() - startTime;
      console.log(`✅ LLM Processing completed in ${processingTime}ms`);

      return {
        rules: parsedResult.rules,
        newTags: parsedResult.newTags,
        confidence: parsedResult.confidence,
        processingTime,
        warnings: parsedResult.warnings
      };

    } catch (error) {
      console.error('❌ LLM Processing failed:', error);
      throw new Error(`LLM processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all existing tags from Main Lookup Table
   * This ensures LLM knows what tags already exist
   */
  private getExistingTagsFromMainLookupTable(): LLMPromptContext['existingTags'] {
    const mainLookupTables = masterLookupTableService.getMainLookupTables();

    return {
      codeGroups: mainLookupTables.codeGroups.map(cg => cg.tag),
      payerGroups: mainLookupTables.payerGroups.map(pg => pg.tag),
      providerGroups: mainLookupTables.providerGroups.map(pg => pg.tag),
      actionTags: mainLookupTables.actionTags.map(at => at.tag),
      chartSections: mainLookupTables.chartSections.map(cs => cs.tag)
    };
  }

  /**
   * Get SOP context for LLM processing
   */
  private async getSOPContext(sopId: string): Promise<LLMPromptContext['sopContext'] | null> {
    // This would typically call your SOP service
    // For now, return null as placeholder
    return null;
  }

  /**
   * Generate LLM prompt with Main Lookup Table context
   * Critical: This ensures LLM uses existing tags when possible
   */
  private generateLLMPrompt(context: LLMPromptContext): string {
    const { documentContent, documentType, existingTags, sopContext } = context;

    return `
# SOP Rule Extraction Task

## Instructions
You are an expert medical coding AI assistant. Extract structured SOP rules from the provided document.

**CRITICAL REQUIREMENT**: Before creating any new tags, you MUST check if equivalent tags already exist in the Main Lookup Table below. Use existing tags whenever possible to maintain consistency.

## Main Lookup Table (Existing Tags)
Use these existing tags instead of creating new ones:

### Code Groups (${existingTags.codeGroups.length} available):
${existingTags.codeGroups.join(', ')}

### Payer Groups (${existingTags.payerGroups.length} available):
${existingTags.payerGroups.join(', ')}

### Provider Groups (${existingTags.providerGroups.length} available):
${existingTags.providerGroups.join(', ')}

### Action Tags (${existingTags.actionTags.length} available):
${existingTags.actionTags.join(', ')}

### Chart Sections (${existingTags.chartSections.length} available):
${existingTags.chartSections.join(', ')}

## Document to Process
Type: ${documentType}
${sopContext ? `SOP Context: ${sopContext.sopName} (${sopContext.sopId})` : ''}

Content:
\`\`\`
${documentContent}
\`\`\`

## Output Format
Return a JSON object with this exact structure:

\`\`\`json
{
  "rules": [
    {
      "rule_id": "unique_rule_id",
      "description": "Rule description with inline @tags",
      "code": "CPT codes or @CODE_GROUP_TAG",
      "payer_group": "@EXISTING_PAYER_TAG",
      "provider_group": "@EXISTING_PROVIDER_TAG", 
      "action": "@EXISTING_ACTION_TAG(@parameters)",
      "chart_section": "@EXISTING_CHART_SECTION_TAG",
      "modifiers": ["modifier1", "modifier2"],
      "effective_date": "YYYY-MM-DD",
      "source": "ai",
      "status": "pending",
      "confidence_score": 0.95
    }
  ],
  "new_tags": [
    {
      "tag": "@NEW_TAG_NAME",
      "type": "payer_group|provider_group|code_group|action|chart_section",
      "name": "Human readable name",
      "description": "What this tag represents",
      "purpose": "Why this tag is needed",
      "confidence_score": 0.85,
      "created_by": "AI"
    }
  ],
  "confidence": 0.90,
  "warnings": ["Any issues or uncertainties"]
}
\`\`\`

## Rules for Tag Usage:
1. **Always check existing tags first** - Use @EXISTING_TAG instead of creating new ones
2. **Only create new tags** if no suitable existing tag exists
3. **Use consistent naming** - Follow the pattern @CATEGORY_SPECIFIC_NAME
4. **Include confidence scores** - Be honest about uncertainty
5. **Provide clear descriptions** - Explain what each new tag represents

Extract all rules from the document following these guidelines.
`;
  }

  /**
   * Call LLM service (placeholder for actual implementation)
   */
  private async callLLMService(prompt: string): Promise<string> {
    console.log('🤖 Calling LLM service...');
    
    // TODO: Replace with actual LLM API call
    // This should call your LLM service (OpenAI, Anthropic, etc.)
    // with the generated prompt
    
    // Placeholder response for testing
    const mockResponse = {
      rules: [
        {
          rule_id: "rule_001",
          description: "For @MEDICARE patients with @E&M_OFFICE_VISITS, @ADD modifier 25 when performed with procedures",
          code: "@E&M_OFFICE_VISITS",
          payer_group: "@MEDICARE",
          provider_group: "@PHYSICIAN_MD_DO",
          action: "@ADD(@MODIFIER_25)",
          chart_section: "ASSESSMENT_PLAN",
          modifiers: ["25"],
          effective_date: new Date().toISOString().split('T')[0],
          source: "ai",
          status: "pending",
          confidence_score: 0.92
        }
      ],
      new_tags: [],
      confidence: 0.92,
      warnings: []
    };

    return JSON.stringify(mockResponse);
  }

  /**
   * Parse LLM response and identify new tags
   */
  private parseLLMResponse(
    llmResponse: string, 
    existingTags: LLMPromptContext['existingTags']
  ): {
    rules: AdvancedSOPRule[];
    newTags: TagCreationRequest[];
    confidence: number;
    warnings: string[];
  } {
    try {
      const parsed = JSON.parse(llmResponse);
      
      const rules: AdvancedSOPRule[] = parsed.rules.map((rule: any) => ({
        ...rule,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const newTags: TagCreationRequest[] = parsed.new_tags || [];

      // Validate that new tags don't already exist
      const validatedNewTags = newTags.filter(tag => {
        const allExistingTags = [
          ...existingTags.codeGroups,
          ...existingTags.payerGroups,
          ...existingTags.providerGroups,
          ...existingTags.actionTags,
          ...existingTags.chartSections
        ];

        const exists = allExistingTags.includes(tag.tag);
        if (exists) {
          console.warn(`⚠️ Tag ${tag.tag} already exists in Main Lookup Table - skipping creation`);
        }
        return !exists;
      });

      return {
        rules,
        newTags: validatedNewTags,
        confidence: parsed.confidence || 0.8,
        warnings: parsed.warnings || []
      };

    } catch (error) {
      console.error('❌ Failed to parse LLM response:', error);
      throw new Error('Invalid LLM response format');
    }
  }

  /**
   * Validate rule against Main Lookup Table
   * Ensures all referenced tags exist or are marked for creation
   */
  validateRuleAgainstMainLookupTable(rule: AdvancedSOPRule): {
    isValid: boolean;
    missingTags: string[];
    warnings: string[];
  } {
    const missingTags: string[] = [];
    const warnings: string[] = [];

    // Extract all tags from rule
    const allTags = this.extractTagsFromRule(rule);

    // Check each tag against Main Lookup Table
    allTags.forEach(tag => {
      const check = masterLookupTableService.checkTagExistence(tag.tag, tag.type);
      if (check.isNew) {
        missingTags.push(tag.tag);
        warnings.push(`Tag ${tag.tag} (${tag.type}) not found in Main Lookup Table`);
      }
    });

    return {
      isValid: missingTags.length === 0,
      missingTags,
      warnings
    };
  }

  /**
   * Extract all tags from a rule
   */
  private extractTagsFromRule(rule: AdvancedSOPRule): Array<{tag: string, type: string}> {
    const tags: Array<{tag: string, type: string}> = [];

    // Extract tags from different fields
    if (rule.code_group) {
      const codeTags = rule.code_group.match(/@[A-Z_]+/g) || [];
      codeTags.forEach(tag => tags.push({tag, type: 'code_group'}));
    }

    if (rule.payer_group) {
      const payerStr = Array.isArray(rule.payer_group) ? rule.payer_group.join(' ') : rule.payer_group;
      const payerTags = payerStr.match(/@[A-Z_]+/g) || [];
      payerTags.forEach(tag => tags.push({tag, type: 'payer_group'}));
    }

    if (rule.provider_group) {
      const providerStr = Array.isArray(rule.provider_group) ? rule.provider_group.join(' ') : rule.provider_group;
      const providerTags = providerStr.match(/@[A-Z_]+/g) || [];
      providerTags.forEach(tag => tags.push({tag, type: 'provider_group'}));
    }

    if (rule.action) {
      const actionStr = Array.isArray(rule.action) ? rule.action.join(' ') : rule.action;
      const actionTags = actionStr.match(/@[A-Z_]+/g) || [];
      actionTags.forEach(tag => tags.push({tag, type: 'action'}));
    }

    if (rule.chart_section) {
      const chartTags = rule.chart_section.match(/@[A-Z_]+/g) || [];
      chartTags.forEach(tag => tags.push({tag, type: 'chart_section'}));
    }

    return tags;
  }
}

// Export singleton instance
export const llmIntegrationService = LLMIntegrationService.getInstance();
