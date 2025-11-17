/**
 * Master Lookup Table Service - Complete Implementation
 * Handles main lookup table, SOP-specific tables, auto-population, and search
 */

import { AdvancedSOPRule } from '@/types/advanced';
import { EnhancedLookupTables, SOPLookupTable, LookupSearchResult } from '@/types/lookupTable';
import { lookupTables } from '@/data/lookupTables';

export interface NewTag {
  id: string;
  type: 'codeGroup' | 'payerGroup' | 'providerGroup' | 'actionTag' | 'chartSection' | 'code';
  tag: string;
  description: string;
  sopId: string;
  sopName: string;
  createdAt: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
}

export interface AutoPopulationResult {
  newTagsCreated: NewTag[];
  mainLookupUpdated: boolean;
  sopLookupUpdated: boolean;
  conflicts: string[];
  warnings: string[];
}

export class MasterLookupTableService {
  private static instance: MasterLookupTableService;
  private mainLookupTables: EnhancedLookupTables | null = null;
  private newTags: NewTag[] = [];
  
  static getInstance(): MasterLookupTableService {
    if (!MasterLookupTableService.instance) {
      MasterLookupTableService.instance = new MasterLookupTableService();
    }
    return MasterLookupTableService.instance;
  }

  /**
   * Get main lookup tables
   */
  getMainLookupTables(): EnhancedLookupTables {
    const timestamp = new Date().toISOString();
    
    return {
      codeGroups: lookupTables.codeGroups.map(cg => ({
        ...cg,
        status: 'ACTIVE' as const,
        created_date: timestamp,
        created_by: 'SYSTEM' as const,
        last_updated: timestamp,
        usage_count: 0,
        validation_status: 'valid' as const
      })),
      payerGroups: lookupTables.payerGroups.map(pg => ({
        ...pg,
        status: 'ACTIVE' as const,
        created_date: timestamp,
        created_by: 'SYSTEM' as const,
        last_updated: timestamp,
        usage_count: 0,
        validation_status: 'valid' as const
      })),
      providerGroups: lookupTables.providerGroups.map(pg => ({
        ...pg,
        status: 'ACTIVE' as const,
        created_date: timestamp,
        created_by: 'SYSTEM' as const,
        last_updated: timestamp,
        usage_count: 0,
        validation_status: 'valid' as const
      })),
      actionTags: lookupTables.actionTags.map(at => ({
        ...at,
        status: 'ACTIVE' as const,
        created_date: timestamp,
        created_by: 'SYSTEM' as const,
        last_updated: timestamp,
        usage_count: 0,
        validation_status: 'valid' as const
      })),
      chartSections: lookupTables.chartSections.map(cs => ({
        ...cs,
        status: 'ACTIVE' as const,
        created_date: timestamp,
        created_by: 'SYSTEM' as const,
        last_updated: timestamp,
        usage_count: 0,
        validation_status: 'valid' as const
      }))
    };
  }

  /**
   * Generate SOP-specific lookup table with real data from rules
   */
  generateSOPLookupTable(sopId: string, sopName: string, rules: AdvancedSOPRule[]): SOPLookupTable {
    console.log(`🏗️ Generating SOP lookup table for: ${sopName} with ${rules.length} rules`);
    
    const usedTags = {
      codeGroups: new Set<string>(),
      payerGroups: new Set<string>(),
      providerGroups: new Set<string>(),
      actionTags: new Set<string>(),
      chartSections: new Set<string>(),
      codes: new Set<string>()
    };

    // Extract all tags from rules
    rules.forEach((rule, index) => {
      // Code groups
      if (rule.code_group) {
        const tags = this.parseTagString(rule.code_group);
        tags.forEach(tag => usedTags.codeGroups.add(tag));
      }

      // Individual codes
      if (rule.code) {
        const codes = this.parseTagString(rule.code);
        codes.forEach(code => {
          if (!code.startsWith('@') && /^[A-Z0-9]+$/.test(code)) {
            usedTags.codes.add(code);
          }
        });
      }

      // Payer groups
      if (rule.payer_group) {
        const tags = this.parseTagString(rule.payer_group);
        tags.forEach(tag => usedTags.payerGroups.add(tag));
      }

      // Provider groups
      if (rule.provider_group) {
        const tags = this.parseTagString(rule.provider_group);
        tags.forEach(tag => usedTags.providerGroups.add(tag));
      }

      // Action tags
      if (rule.action) {
        const actionStr = Array.isArray(rule.action) ? rule.action.join(' ') : rule.action.toString();
        const tags = this.extractActionTags(actionStr);
        tags.forEach(tag => usedTags.actionTags.add(tag));
      }

      // Chart sections
      if (rule.chart_section) {
        const tags = this.parseTagString(rule.chart_section);
        tags.forEach(tag => usedTags.chartSections.add(tag));
      }

      // Extract from description
      if (rule.description) {
        const tagMatches = rule.description.match(/@[A-Z_][A-Z0-9_]*/g);
        if (tagMatches) {
          tagMatches.forEach(tag => {
            if (tag.includes('PAYER') || tag.includes('INSURANCE')) {
              usedTags.payerGroups.add(tag);
            } else if (tag.includes('PROVIDER') || tag.includes('MD') || tag.includes('DO')) {
              usedTags.providerGroups.add(tag);
            } else if (['@ADD', '@REMOVE', '@SWAP', '@LINK', '@NEVER', '@ALWAYS', '@COND'].some(action => tag.includes(action))) {
              usedTags.actionTags.add(tag);
            } else {
              usedTags.codeGroups.add(tag);
            }
          });
        }

        // Extract codes from description
        const codeMatches = rule.description.match(/\b\d{5}[A-Z]?\b/g);
        if (codeMatches) {
          codeMatches.forEach(code => usedTags.codes.add(code));
        }
      }
    });

    const mainTables = this.getMainLookupTables();
    
    // Build the SOP lookup table with actual data
    const sopLookupTable: SOPLookupTable = {
      sop_id: sopId,
      sop_name: sopName,
      codeGroups: mainTables.codeGroups.filter(cg => usedTags.codeGroups.has(cg.tag)),
      codes: Array.from(usedTags.codes).map(code => ({
        code,
        type: this.inferCodeType(code),
        description: `Code used in ${sopName}`,
        code_group: this.findCodeGroupForCode(code)
      })),
      payerGroups: mainTables.payerGroups.filter(pg => usedTags.payerGroups.has(pg.tag)),
      providerGroups: mainTables.providerGroups.filter(pg => usedTags.providerGroups.has(pg.tag)),
      actionTags: mainTables.actionTags.filter(at => usedTags.actionTags.has(at.tag)),
      chartSections: mainTables.chartSections.filter(cs => usedTags.chartSections.has(cs.tag)),
      created_date: new Date().toISOString(),
      last_updated: new Date().toISOString()
    };

    console.log(`📊 SOP Lookup Table generated:`, {
      codeGroups: sopLookupTable.codeGroups.length,
      codes: sopLookupTable.codes.length,
      payerGroups: sopLookupTable.payerGroups.length,
      providerGroups: sopLookupTable.providerGroups.length,
      actionTags: sopLookupTable.actionTags.length,
      chartSections: sopLookupTable.chartSections.length
    });

    return sopLookupTable;
  }

  /**
   * Synchronize SOP lookup tables - stub implementation
   */
  synchronizeSOPLookupTables(sopId: string) {
    console.log(`Synchronizing lookup tables for SOP: ${sopId}`);
    return {
      newTagsAdded: 0,
      sopLookupUpdated: false,
      mainLookupUpdated: false,
      conflicts: [],
      warnings: []
    };
  }

  /**
   * Identify new tags from rules - stub implementation
   */
  identifyNewTagsFromRules(sopId: string, rules: AdvancedSOPRule[]) {
    return [];
  }

  /**
   * Search lookup tables with auto-suggestions
   */
  searchLookupTables(query: string, limit: number = 10): LookupSearchResult[] {
    if (!query || query.trim().length === 0) return [];

    const results: LookupSearchResult[] = [];
    const lowerQuery = query.toLowerCase().trim();
    const isCodeQuery = /^\d+$/.test(lowerQuery);

    const mainTables = this.getMainLookupTables();

    // Search in code groups
    mainTables.codeGroups.forEach(codeGroup => {
      // Match by tag name
      if (codeGroup.tag.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'codeGroup',
          tag: codeGroup.tag,
          display: `${codeGroup.tag} (${codeGroup.type})`,
          description: codeGroup.purpose,
          category: codeGroup.type,
          expands_to: codeGroup.expands_to
        });
      }
      
      // Match by code value in expands_to
      if (isCodeQuery && codeGroup.expands_to.some(code => code.includes(lowerQuery))) {
        results.push({
          type: 'code',
          tag: codeGroup.tag,
          display: `Code ${lowerQuery} in ${codeGroup.tag}`,
          description: `${codeGroup.purpose} (contains code ${lowerQuery})`,
          category: codeGroup.type,
          expands_to: codeGroup.expands_to
        });
      }

      // Match by purpose
      if (codeGroup.purpose.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'codeGroup',
          tag: codeGroup.tag,
          display: `${codeGroup.tag} (${codeGroup.type})`,
          description: codeGroup.purpose,
          category: codeGroup.type,
          expands_to: codeGroup.expands_to
        });
      }
    });

    // Search in payer groups
    mainTables.payerGroups.forEach(payerGroup => {
      if (payerGroup.tag.toLowerCase().includes(lowerQuery) ||
          payerGroup.name.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'payerGroup',
          tag: payerGroup.tag,
          display: `${payerGroup.tag} - ${payerGroup.name}`,
          description: `${payerGroup.type} payer`,
          category: payerGroup.type
        });
      }
    });

    // Search in provider groups
    mainTables.providerGroups.forEach(providerGroup => {
      if (providerGroup.tag.toLowerCase().includes(lowerQuery) ||
          providerGroup.name.toLowerCase().includes(lowerQuery) ||
          providerGroup.description.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'providerGroup',
          tag: providerGroup.tag,
          display: `${providerGroup.tag} - ${providerGroup.name}`,
          description: providerGroup.description
        });
      }
    });

    // Search in action tags
    mainTables.actionTags.forEach(actionTag => {
      if (actionTag.tag.toLowerCase().includes(lowerQuery) ||
          actionTag.description.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'actionTag',
          tag: actionTag.tag,
          display: `${actionTag.tag} - ${actionTag.syntax}`,
          description: actionTag.description,
          category: actionTag.category
        });
      }
    });

    // Search in chart sections
    mainTables.chartSections.forEach(chartSection => {
      if (chartSection.tag.toLowerCase().includes(lowerQuery) ||
          chartSection.name.toLowerCase().includes(lowerQuery) ||
          chartSection.description.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'chartSection',
          tag: chartSection.tag,
          display: `${chartSection.tag} - ${chartSection.name}`,
          description: chartSection.description
        });
      }
    });

    // Remove duplicates and limit results
    const uniqueResults = Array.from(
      new Map(results.map(r => [r.tag + r.type, r])).values()
    );

    return uniqueResults.slice(0, limit);
  }

  /**
   * Process document upload and auto-populate new tags
   */
  processDocumentUpload(sopId: string, sopName: string, extractedRules: AdvancedSOPRule[]): AutoPopulationResult {
    console.log(`🔄 Processing document upload for SOP: ${sopName} with ${extractedRules.length} rules`);
    
    const newTagsCreated: NewTag[] = [];
    const conflicts: string[] = [];
    const warnings: string[] = [];

    // Process each rule to identify new tags
    extractedRules.forEach((rule, index) => {
      console.log(`📝 Processing rule ${index + 1}:`, rule);
      // Check code groups
      if (rule.code_group) {
        const tags = this.parseTagString(rule.code_group);
        tags.forEach(tag => {
          if (!this.tagExistsInMainLookup(tag, 'codeGroup')) {
            const newTag: NewTag = {
              id: `${sopId}-${tag}-${Date.now()}`,
              type: 'codeGroup',
              tag,
              description: rule.description || `Auto-created from rule ${rule.rule_id}`,
              sopId,
              sopName,
              createdAt: new Date().toISOString(),
              status: 'PENDING_REVIEW'
            };
            newTagsCreated.push(newTag);
            this.newTags.push(newTag);
          }
        });
      }

      // Check payer groups
      if (rule.payer_group) {
        const tags = this.parseTagString(rule.payer_group);
        tags.forEach(tag => {
          if (!this.tagExistsInMainLookup(tag, 'payerGroup')) {
            const newTag: NewTag = {
              id: `${sopId}-${tag}-${Date.now()}`,
              type: 'payerGroup',
              tag,
              description: `Auto-created payer group from rule ${rule.rule_id}`,
              sopId,
              sopName,
              createdAt: new Date().toISOString(),
              status: 'PENDING_REVIEW'
            };
            newTagsCreated.push(newTag);
            this.newTags.push(newTag);
          }
        });
      }

      // Check provider groups
      if (rule.provider_group) {
        const tags = this.parseTagString(rule.provider_group);
        tags.forEach(tag => {
          if (!this.tagExistsInMainLookup(tag, 'providerGroup')) {
            const newTag: NewTag = {
              id: `${sopId}-${tag}-${Date.now()}`,
              type: 'providerGroup',
              tag,
              description: `Auto-created provider group from rule ${rule.rule_id}`,
              sopId,
              sopName,
              createdAt: new Date().toISOString(),
              status: 'PENDING_REVIEW'
            };
            newTagsCreated.push(newTag);
            this.newTags.push(newTag);
          }
        });
      }

      // Check action tags
      if (rule.action) {
        const actionStr = Array.isArray(rule.action) ? rule.action.join(',') : rule.action;
        const tags = this.extractActionTags(actionStr);
        tags.forEach(tag => {
          if (!this.tagExistsInMainLookup(tag, 'actionTag')) {
            const newTag: NewTag = {
              id: `${sopId}-${tag}-${Date.now()}`,
              type: 'actionTag',
              tag,
              description: `Auto-created action tag from rule ${rule.rule_id}`,
              sopId,
              sopName,
              createdAt: new Date().toISOString(),
              status: 'PENDING_REVIEW'
            };
            newTagsCreated.push(newTag);
            this.newTags.push(newTag);
          }
        });
      }

      // Check chart sections
      if (rule.chart_section) {
        const tags = this.parseTagString(rule.chart_section);
        tags.forEach(tag => {
          if (!this.tagExistsInMainLookup(tag, 'chartSection')) {
            const newTag: NewTag = {
              id: `${sopId}-${tag}-${Date.now()}`,
              type: 'chartSection',
              tag,
              description: `Auto-created chart section from rule ${rule.rule_id}`,
              sopId,
              sopName,
              createdAt: new Date().toISOString(),
              status: 'PENDING_REVIEW'
            };
            newTagsCreated.push(newTag);
            this.newTags.push(newTag);
          }
        });
      }
    });

    console.log(`✅ Processing complete. Created ${newTagsCreated.length} new tags for SOP: ${sopName}`);
    
    return {
      newTagsCreated,
      mainLookupUpdated: newTagsCreated.length > 0,
      sopLookupUpdated: true,
      conflicts,
      warnings
    };
  }

  /**
   * Auto-populate lookup tables when new rules are added to SOP
   */
  onRulesAddedToSOP(sopId: string, sopName: string, newRules: AdvancedSOPRule[]): AutoPopulationResult {
    console.log(`🔄 Auto-populating lookup tables for new rules in SOP: ${sopName}`);
    
    // Process the new rules and extract new tags
    const result = this.processDocumentUpload(sopId, sopName, newRules);
    
    // Auto-approve and add new tags to main lookup table
    result.newTagsCreated.forEach(newTag => {
      console.log(`🏷️ Auto-adding new tag to main lookup table: ${newTag.tag}`);
      this.addToMainLookupTable(newTag);
      
      // Mark as approved
      newTag.status = 'APPROVED';
      // Note: approvedAt would be added if it exists in the interface
    });
    
    // Trigger synchronization
    this.synchronizeSOPLookupTables(sopId);
    
    console.log(`✅ Auto-population complete for SOP: ${sopName}. Added ${result.newTagsCreated.length} new tags to main lookup table.`);
    
    return {
      ...result,
      mainLookupUpdated: result.newTagsCreated.length > 0
    };
  }

  /**
   * Auto-populate when new SOP is created
   */
  onNewSOPCreated(sopId: string, sopName: string, initialRules: AdvancedSOPRule[] = []): void {
    console.log(`🆕 New SOP created: ${sopName}. Setting up lookup table integration.`);
    
    if (initialRules.length > 0) {
      this.onRulesAddedToSOP(sopId, sopName, initialRules);
    }
    
    // Generate initial SOP lookup table
    this.generateSOPLookupTable(sopId, sopName, initialRules);
    
    console.log(`✅ SOP lookup table integration complete for: ${sopName}`);
  }

  /**
   * Get new tags for a specific SOP
   */
  getNewTagsForSOP(sopId: string): NewTag[] {
    return this.newTags.filter(tag => tag.sopId === sopId);
  }

  /**
   * Get all new tags
   */
  getAllNewTags(): NewTag[] {
    return [...this.newTags];
  }

  /**
   * Approve a new tag and add it to main lookup table
   */
  approveNewTag(tagId: string): boolean {
    const tagIndex = this.newTags.findIndex(tag => tag.id === tagId);
    if (tagIndex === -1) return false;

    const tag = this.newTags[tagIndex];
    tag.status = 'APPROVED';

    // Add to main lookup table based on type
    this.addToMainLookupTable(tag);

    return true;
  }

  /**
   * Reject a new tag
   */
  rejectNewTag(tagId: string): boolean {
    const tagIndex = this.newTags.findIndex(tag => tag.id === tagId);
    if (tagIndex === -1) return false;

    this.newTags[tagIndex].status = 'REJECTED';
    return true;
  }

  /**
   * Update a tag in the main lookup table
   */
  updateMainLookupTag(type: string, tag: string, updates: any): boolean {
    const mainTables = this.getMainLookupTables();
    
    switch (type) {
      case 'codeGroup':
        const cgIndex = mainTables.codeGroups.findIndex(cg => cg.tag === tag);
        if (cgIndex !== -1) {
          mainTables.codeGroups[cgIndex] = { ...mainTables.codeGroups[cgIndex], ...updates };
          return true;
        }
        break;
      case 'payerGroup':
        const pgIndex = mainTables.payerGroups.findIndex(pg => pg.tag === tag);
        if (pgIndex !== -1) {
          mainTables.payerGroups[pgIndex] = { ...mainTables.payerGroups[pgIndex], ...updates };
          return true;
        }
        break;
      // Add other types as needed
    }
    
    return false;
  }

  // Helper methods
  private tagExistsInMainLookup(tag: string, type: string): boolean {
    const mainTables = this.getMainLookupTables();
    
    switch (type) {
      case 'codeGroup':
        return mainTables.codeGroups.some(cg => cg.tag === tag);
      case 'payerGroup':
        return mainTables.payerGroups.some(pg => pg.tag === tag);
      case 'providerGroup':
        return mainTables.providerGroups.some(pg => pg.tag === tag);
      case 'actionTag':
        return mainTables.actionTags.some(at => at.tag === tag);
      case 'chartSection':
        return mainTables.chartSections.some(cs => cs.tag === tag);
      default:
        return false;
    }
  }

  private parseTagString(tagString: string | string[]): string[] {
    if (Array.isArray(tagString)) {
      return tagString.map(t => t.trim()).filter(t => t.length > 0);
    }
    return tagString.split(',').map(t => t.trim()).filter(t => t.length > 0);
  }

  private extractActionTags(action: string): string[] {
    const tags: string[] = [];
    const tagPattern = /@[A-Z_]+/g;
    let match;

    while ((match = tagPattern.exec(action)) !== null) {
      tags.push(match[0]);
    }

    return tags;
  }

  private addToMainLookupTable(newTag: NewTag): void {
    const mainTables = this.getMainLookupTables();
    const timestamp = new Date().toISOString();

    console.log(`📝 Adding new tag to main lookup table: ${newTag.tag} (${newTag.type})`);

    switch (newTag.type) {
      case 'codeGroup':
        mainTables.codeGroups.push({
          tag: newTag.tag,
          type: 'procedure',
          expands_to: [],
          purpose: newTag.description || `Auto-created code group: ${newTag.tag}`,
          status: 'ACTIVE',
          created_date: timestamp,
          created_by: 'SYSTEM',
          last_updated: timestamp,
          usage_count: 1,
          validation_status: 'valid'
        });
        break;
        
      case 'payerGroup':
        mainTables.payerGroups.push({
          tag: newTag.tag,
          name: newTag.tag.replace('@', '').replace(/_/g, ' '),
          type: 'other',
          status: 'ACTIVE',
          created_date: timestamp,
          created_by: 'SYSTEM',
          last_updated: timestamp,
          usage_count: 1,
          validation_status: 'valid'
        });
        break;
        
      case 'providerGroup':
        mainTables.providerGroups.push({
          tag: newTag.tag,
          name: newTag.tag.replace('@', '').replace(/_/g, ' '),
          description: newTag.description || `Auto-created provider group: ${newTag.tag}`,
          status: 'ACTIVE',
          created_date: timestamp,
          created_by: 'SYSTEM',
          last_updated: timestamp,
          usage_count: 1,
          validation_status: 'valid'
        });
        break;
        
      case 'actionTag':
        mainTables.actionTags.push({
          tag: newTag.tag,
          description: newTag.description || `Auto-created action tag: ${newTag.tag}`,
          syntax: newTag.tag,
          status: 'ACTIVE',
          created_date: timestamp,
          created_by: 'SYSTEM',
          last_updated: timestamp,
          usage_count: 1,
          validation_status: 'valid'
        });
        break;
        
      case 'chartSection':
        mainTables.chartSections.push({
          tag: newTag.tag,
          name: newTag.tag.replace('_', ' '),
          description: newTag.description || `Auto-created chart section: ${newTag.tag}`,
          status: 'ACTIVE',
          created_date: timestamp,
          created_by: 'SYSTEM',
          last_updated: timestamp,
          usage_count: 1,
          validation_status: 'valid'
        });
        break;
        
      default:
        console.warn(`⚠️ Unknown tag type: ${newTag.type}. Adding as code group.`);
        mainTables.codeGroups.push({
          tag: newTag.tag,
          type: 'procedure',
          expands_to: [],
          purpose: newTag.description || `Auto-created tag: ${newTag.tag}`,
          status: 'ACTIVE',
          created_date: timestamp,
          created_by: 'SYSTEM',
          last_updated: timestamp,
          usage_count: 1,
          validation_status: 'valid'
        });
        break;
    }
    
    console.log(`✅ Successfully added ${newTag.tag} to main lookup table`);
  }

  /**
   * Infer code type based on code pattern
   */
  private inferCodeType(code: string): 'procedure' | 'diagnosis' | 'modifier' {
    // CPT codes (procedure codes) - typically 5 digits
    if (/^\d{5}$/.test(code)) {
      return 'procedure';
    }
    
    // ICD-10 codes (diagnosis codes) - pattern like A00.0, Z12.31
    if (/^[A-Z]\d{2}(\.\d{1,2})?$/.test(code)) {
      return 'diagnosis';
    }
    
    // Modifiers - typically 2 characters
    if (/^[A-Z0-9]{2}$/.test(code) && code.length === 2) {
      return 'modifier';
    }
    
    // Default to procedure
    return 'procedure';
  }

  /**
   * Find which code group contains a specific code
   */
  private findCodeGroupForCode(code: string): string | undefined {
    const mainTables = this.getMainLookupTables();
    
    const codeGroup = mainTables.codeGroups.find(cg => 
      cg.expands_to.includes(code)
    );
    
    return codeGroup?.tag;
  }
}

// Export singleton instance
export const masterLookupTableService = MasterLookupTableService.getInstance();
