// Tag Validation and Auto-Creation Service

import { 
  EnhancedLookupTables, 
  TagValidationResult, 
  TagCreationRequest, 
  RuleValidationResult,
  EnhancedCodeGroup,
  EnhancedPayerGroup,
  EnhancedProviderGroup
} from '@/types/lookupTable';
import { AdvancedSOPRule } from '@/types/sop';

export class TagValidationService {
  private lookupTables: EnhancedLookupTables;

  constructor(lookupTables: EnhancedLookupTables) {
    this.lookupTables = lookupTables;
  }

  /**
   * Extract all tags from a rule description
   */
  extractTagsFromDescription(description: string): string[] {
    const tagPattern = /@[A-Z_][A-Z0-9_]*(?:\([^)]*\))?(?:\|@[A-Z_][A-Z0-9_]*(?:\([^)]*\))?)*(?:→@[A-Z0-9_-]*)?/g;
    const matches = description.match(tagPattern) || [];
    
    // Split multi-tags and clean
    const allTags: string[] = [];
    matches.forEach(match => {
      if (match.includes('|')) {
        const splitTags = match.split('|').map(t => t.trim());
        allTags.push(...splitTags);
      } else {
        allTags.push(match);
      }
    });

    // Remove duplicates and clean
    return [...new Set(allTags.map(tag => tag.replace(/\([^)]*\)/g, '').trim()))];
  }

  /**
   * Extract all tags from rule fields
   */
  extractAllTagsFromRule(rule: Partial<AdvancedSOPRule>): {
    descriptionTags: string[];
    codeGroupTags: string[];
    payerGroupTags: string[];
    providerGroupTags: string[];
    actionTags: string[];
    allTags: string[];
  } {
    const descriptionTags = rule.description ? this.extractTagsFromDescription(rule.description) : [];
    
    const codeGroupTags = rule.code ? 
      rule.code.split(',').map(c => c.trim()).filter(c => c.startsWith('@')) : [];
    
    const payerGroupTags = Array.isArray(rule.payer_group) ? 
      rule.payer_group.filter(p => String(p).startsWith('@')) :
      (String(rule.payer_group || '').startsWith('@') ? [String(rule.payer_group)] : []);
    
    const providerGroupTags = Array.isArray(rule.provider_group) ?
      rule.provider_group.filter(p => String(p).startsWith('@')) :
      (String(rule.provider_group || '').startsWith('@') ? [String(rule.provider_group)] : []);
    
    const actionTags = Array.isArray(rule.action) ?
      rule.action.filter(a => String(a).startsWith('@')) :
      (String(rule.action || '').startsWith('@') ? [String(rule.action)] : []);

    const allTags = [
      ...descriptionTags,
      ...codeGroupTags,
      ...payerGroupTags,
      ...providerGroupTags,
      ...actionTags
    ];

    return {
      descriptionTags,
      codeGroupTags,
      payerGroupTags,
      providerGroupTags,
      actionTags,
      allTags: [...new Set(allTags)]
    };
  }

  /**
   * Validate a single tag against lookup tables
   */
  validateTag(tag: string): TagValidationResult {
    const cleanTag = tag.replace('@', '');
    
    // Check code groups
    const codeGroup = this.lookupTables.codeGroups.find(
      cg => cg.tag.replace('@', '') === cleanTag
    );
    if (codeGroup) {
      return {
        tag,
        exists: true,
        status: codeGroup.status,
        type: 'codeGroup',
        needsCreation: false
      };
    }

    // Check payer groups
    const payerGroup = this.lookupTables.payerGroups.find(
      pg => pg.tag.replace('@', '') === cleanTag
    );
    if (payerGroup) {
      return {
        tag,
        exists: true,
        status: payerGroup.status,
        type: 'payerGroup',
        needsCreation: false
      };
    }

    // Check provider groups
    const providerGroup = this.lookupTables.providerGroups.find(
      pg => pg.tag.replace('@', '') === cleanTag
    );
    if (providerGroup) {
      return {
        tag,
        exists: true,
        status: providerGroup.status,
        type: 'providerGroup',
        needsCreation: false
      };
    }

    // Check action tags
    const actionTag = this.lookupTables.actionTags.find(
      at => at.tag.replace('@', '') === cleanTag
    );
    if (actionTag) {
      return {
        tag,
        exists: true,
        status: actionTag.status,
        type: 'actionTag',
        needsCreation: false
      };
    }

    // Check chart sections
    const chartSection = this.lookupTables.chartSections.find(
      cs => cs.tag === cleanTag
    );
    if (chartSection) {
      return {
        tag,
        exists: true,
        status: chartSection.status,
        type: 'chartSection',
        needsCreation: false
      };
    }

    // Tag doesn't exist - suggest type based on context
    const suggestedType = this.suggestTagType(cleanTag);
    
    return {
      tag,
      exists: false,
      needsCreation: true,
      suggestedType,
      confidence: 0.7
    };
  }

  /**
   * Suggest tag type based on naming patterns
   */
  private suggestTagType(tag: string): string {
    const cleanTag = tag.toUpperCase();
    
    // Payer patterns
    if (cleanTag.includes('BCBS') || cleanTag.includes('AETNA') || 
        cleanTag.includes('CIGNA') || cleanTag.includes('UHC') ||
        cleanTag.includes('HUMANA') || cleanTag.includes('MEDICARE') ||
        cleanTag.includes('MEDICAID') || cleanTag.includes('COMMERCIAL')) {
      return 'payerGroup';
    }

    // Provider patterns
    if (cleanTag.includes('PHYSICIAN') || cleanTag.includes('PROVIDER') ||
        cleanTag.includes('NP') || cleanTag.includes('PA') ||
        cleanTag.includes('MD') || cleanTag.includes('DO')) {
      return 'providerGroup';
    }

    // Action patterns
    if (cleanTag.startsWith('ADD') || cleanTag.startsWith('REMOVE') ||
        cleanTag.startsWith('SWAP') || cleanTag.startsWith('LINK') ||
        cleanTag.startsWith('COND') || cleanTag.startsWith('ALWAYS') ||
        cleanTag.startsWith('NEVER')) {
      return 'actionTag';
    }

    // Chart section patterns
    if (cleanTag.includes('SECTION') || cleanTag.includes('HPI') ||
        cleanTag.includes('ASSESSMENT') || cleanTag.includes('PLAN') ||
        cleanTag.includes('PROCEDURE') || cleanTag.includes('DIAGNOSIS')) {
      return 'chartSection';
    }

    // Default to code group (procedure/diagnosis)
    return 'codeGroup';
  }

  /**
   * Validate entire rule and identify missing tags
   */
  validateRule(rule: Partial<AdvancedSOPRule>): RuleValidationResult {
    const extractedTags = this.extractAllTagsFromRule(rule);
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingTags: string[] = [];
    const newTagsToCreate: TagCreationRequest[] = [];

    // Validate all tags
    extractedTags.allTags.forEach(tag => {
      const validation = this.validateTag(tag);
      
      if (!validation.exists) {
        missingTags.push(tag);
        warnings.push(`Tag ${tag} not found in lookup tables`);
        
        // Create suggestion for new tag
        newTagsToCreate.push({
          tag,
          type: validation.suggestedType as any,
          created_by: 'AI',
          confidence_score: validation.confidence,
          description: `Auto-detected ${validation.suggestedType} from rule`,
          expands_to: []
        });
      } else if (validation.status === 'NEEDS_DEFINITION') {
        warnings.push(`Tag ${tag} exists but needs definition`);
      } else if (validation.status === 'DEPRECATED') {
        warnings.push(`Tag ${tag} is deprecated`);
      }
    });

    // Check required fields
    if (!rule.rule_id) {
      errors.push('Rule ID is required');
    }
    if (!rule.description) {
      errors.push('Description is required');
    }
    if (!rule.code) {
      errors.push('Code group is required');
    }

    // Determine overall status
    let status: 'VALID' | 'NEEDS_REVIEW' | 'INVALID' = 'VALID';
    if (errors.length > 0) {
      status = 'INVALID';
    } else if (warnings.length > 0 || missingTags.length > 0) {
      status = 'NEEDS_REVIEW';
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missingTags,
      newTagsToCreate,
      status
    };
  }

  /**
   * Auto-populate codes from lookup table
   */
  autoPopulateCodesFromTag(tag: string): string[] {
    const cleanTag = tag.replace('@', '');
    
    const codeGroup = this.lookupTables.codeGroups.find(
      cg => cg.tag.replace('@', '') === cleanTag
    );

    return codeGroup ? codeGroup.expands_to : [];
  }

  /**
   * Create new tag in lookup table
   */
  createNewTag(request: TagCreationRequest): EnhancedCodeGroup | EnhancedPayerGroup | EnhancedProviderGroup | null {
    const now = new Date().toISOString();
    
    switch (request.type) {
      case 'codeGroup':
        const newCodeGroup: EnhancedCodeGroup = {
          tag: request.tag,
          type: 'procedure', // Default, can be updated
          expands_to: request.expands_to || [],
          purpose: request.purpose || request.description || 'Auto-created from document',
          status: 'NEEDS_DEFINITION',
          created_date: now,
          created_by: request.created_by,
          confidence_score: request.confidence_score,
          source_document: request.source_document,
          usage_count: 0
        };
        this.lookupTables.codeGroups.push(newCodeGroup);
        return newCodeGroup;

      case 'payerGroup':
        const newPayerGroup: EnhancedPayerGroup = {
          tag: request.tag,
          name: request.name || request.tag.replace('@', '').replace(/_/g, ' '),
          type: 'other', // Default, can be updated
          status: 'NEEDS_DEFINITION',
          created_date: now,
          created_by: request.created_by,
          confidence_score: request.confidence_score,
          source_document: request.source_document,
          usage_count: 0
        };
        this.lookupTables.payerGroups.push(newPayerGroup);
        return newPayerGroup;

      case 'providerGroup':
        const newProviderGroup: EnhancedProviderGroup = {
          tag: request.tag,
          name: request.name || request.tag.replace('@', '').replace(/_/g, ' '),
          description: request.description || 'Auto-created from document',
          status: 'NEEDS_DEFINITION',
          created_date: now,
          created_by: request.created_by,
          confidence_score: request.confidence_score,
          source_document: request.source_document,
          usage_count: 0
        };
        this.lookupTables.providerGroups.push(newProviderGroup);
        return newProviderGroup;

      default:
        return null;
    }
  }

  /**
   * Increment usage count for a tag
   */
  incrementTagUsage(tag: string): void {
    const cleanTag = tag.replace('@', '');
    const now = new Date().toISOString();

    // Check and update in all lookup tables
    const codeGroup = this.lookupTables.codeGroups.find(cg => cg.tag.replace('@', '') === cleanTag);
    if (codeGroup) {
      codeGroup.usage_count++;
      codeGroup.last_used = now;
      return;
    }

    const payerGroup = this.lookupTables.payerGroups.find(pg => pg.tag.replace('@', '') === cleanTag);
    if (payerGroup) {
      payerGroup.usage_count++;
      payerGroup.last_used = now;
      return;
    }

    const providerGroup = this.lookupTables.providerGroups.find(pg => pg.tag.replace('@', '') === cleanTag);
    if (providerGroup) {
      providerGroup.usage_count++;
      providerGroup.last_used = now;
      return;
    }
  }

  /**
   * Check if tag can be deleted (not in use)
   */
  canDeleteTag(tag: string): { canDelete: boolean; reason?: string } {
    const cleanTag = tag.replace('@', '');

    const codeGroup = this.lookupTables.codeGroups.find(cg => cg.tag.replace('@', '') === cleanTag);
    if (codeGroup && codeGroup.usage_count > 0) {
      return { canDelete: false, reason: `Tag is used in ${codeGroup.usage_count} rules` };
    }

    const payerGroup = this.lookupTables.payerGroups.find(pg => pg.tag.replace('@', '') === cleanTag);
    if (payerGroup && payerGroup.usage_count > 0) {
      return { canDelete: false, reason: `Tag is used in ${payerGroup.usage_count} rules` };
    }

    const providerGroup = this.lookupTables.providerGroups.find(pg => pg.tag.replace('@', '') === cleanTag);
    if (providerGroup && providerGroup.usage_count > 0) {
      return { canDelete: false, reason: `Tag is used in ${providerGroup.usage_count} rules` };
    }

    return { canDelete: true };
  }
}
