/**
 * Rule Approval Service
 * Manages rule approval workflow, conflict detection, and lookup table synchronization
 */

import { SOPRule, RuleStatus, RuleConflict, ConflictSeverity, NewTag, ConflictResolution } from '@/types/ruleApproval';
import { AdvancedSOPRule } from '@/types/advanced';
import { SOPManagementService } from './sopManagementService';
import { masterLookupTableService } from './masterLookupTableService';

class RuleApprovalServiceClass {
  private resolvedConflicts: Set<string> = new Set(); // Track resolved conflict IDs
  /**
   * Approve a rule - changes status to 'active'
   */
  approveRule(sopId: string, ruleId: string): void {
    const sop = SOPManagementService.getSOPById(sopId);
    if (!sop) {
      throw new Error(`SOP ${sopId} not found`);
    }

    const rule = sop.rules.find(r => r.rule_id === ruleId) as any;
    if (!rule) {
      throw new Error(`Rule ${ruleId} not found in SOP ${sopId}`);
    }

    rule.status = 'active';
    rule.updated_at = new Date().toISOString();

    // Sync new tags to lookup tables
    if (rule.new_tags) {
      this.syncNewTagsToLookupTables(rule.new_tags, ruleId);
    }

    SOPManagementService.updateSOP(sopId, { rules: sop.rules });
    console.log(`✅ Rule ${ruleId} approved`);
  }

  /**
   * Reject a rule - changes status to 'rejected'
   */
  rejectRule(sopId: string, ruleId: string, reason?: string): void {
    const sop = SOPManagementService.getSOPById(sopId);
    if (!sop) {
      throw new Error(`SOP ${sopId} not found`);
    }

    const rule = sop.rules.find(r => r.rule_id === ruleId) as any;
    if (!rule) {
      throw new Error(`Rule ${ruleId} not found in SOP ${sopId}`);
    }

    rule.status = 'rejected';
    rule.updated_at = new Date().toISOString();

    SOPManagementService.updateSOP(sopId, { rules: sop.rules });
    console.log(`❌ Rule ${ruleId} rejected${reason ? `: ${reason}` : ''}`);
  }

  /**
   * Edit a rule and update it
   */
  editRule(sopId: string, ruleId: string, changes: Partial<SOPRule>): void {
    const sop = SOPManagementService.getSOPById(sopId);
    if (!sop) {
      throw new Error(`SOP ${sopId} not found`);
    }
    const ruleIndex = sop.rules.findIndex(r => r.rule_id === ruleId);
    if (ruleIndex === -1) {
      throw new Error(`Rule ${ruleId} not found in SOP ${sopId}`);
    }

    // Update rule with changes
    const updatedRule = {
      ...sop.rules[ruleIndex],
      ...changes,
      updated_at: new Date().toISOString(),
      source: 'manual' as const
    } as any;

    sop.rules[ruleIndex] = updatedRule;
    SOPManagementService.updateSOP(sopId, { rules: sop.rules });

    // Detect conflicts after editing
    this.detectConflicts(sopId);

    console.log(`✏️ Rule ${ruleId} edited`);
  }
  /**
   * Delete rejected rules
   */
  deleteRejectedRules(sopId: string): number {
    const sop = SOPManagementService.getSOPById(sopId);
    if (!sop) {
      throw new Error(`SOP ${sopId} not found`);
    }

    const rejectedRules = sop.rules.filter(r => r.status === 'rejected');
    const activeRules = sop.rules.filter(r => r.status !== 'rejected');

    SOPManagementService.updateSOP(sopId, { rules: activeRules });
    console.log(`🗑️ Deleted ${rejectedRules.length} rejected rules`);
    
    return rejectedRules.length;
  }

  /**
   * Detect conflicts in rules
   */
  detectConflicts(sopId: string): RuleConflict[] {
    const sop = SOPManagementService.getSOPById(sopId);
    if (!sop) {
      throw new Error(`SOP ${sopId} not found`);
    }

    const conflicts: RuleConflict[] = [];
    const activeRules = sop.rules.filter(r => r.status === 'active' || r.status === 'pending');

    // Clear existing conflicts only for active rules
    activeRules.forEach(rule => {
      (rule as any).conflicts = [];
    }); // Check for overlapping rules (same code, same payer, different actions)
    for (let i = 0; i < activeRules.length; i++) {
      for (let j = i + 1; j < activeRules.length; j++) {
        const rule1 = activeRules[i];
        const rule2 = activeRules[j];
        // Overlapping codes
        const codes1 = (rule1.code || '').split(',').map(c => c.trim());
        const codes2 = (rule2.code || '').split(',').map(c => c.trim());
        const overlappingCodes = codes1.filter(c => codes2.includes(c));

        if (overlappingCodes.length > 0) {
          // Same payer group
          if (rule1.payer_group === rule2.payer_group) {
            // Different actions - potential conflict
            if (rule1.action !== rule2.action) {
              const conflictId = `conflict-${rule1.rule_id}-${rule2.rule_id}`;
              
              // Only add conflict if it hasn't been resolved
              if (!this.resolvedConflicts.has(conflictId)) {
                conflicts.push({
                  id: conflictId,
                  type: 'overlapping',
                  severity: 'high',
                  affectedRuleIds: [rule1.rule_id, rule2.rule_id],
                  description: `Overlapping rules for code(s) ${overlappingCodes.join(', ')} with different actions`,
                  suggestion: `Review rules ${rule1.rule_id} and ${rule2.rule_id} - they have conflicting actions for the same code and payer`
                });
              }
            }
          }
        }

        // Duplicate rules (same code, same action, same payer)
        if (
          rule1.code === rule2.code &&
          rule1.action === rule2.action &&
          rule1.payer_group === rule2.payer_group &&
          rule1.description === rule2.description
        ) {
          const conflictId = `conflict-${rule1.rule_id}-${rule2.rule_id}`;
          
          // Only add conflict if it hasn't been resolved
          if (!this.resolvedConflicts.has(conflictId)) {
            conflicts.push({
              id: conflictId,
              type: 'duplicate',
              severity: 'medium',
              affectedRuleIds: [rule1.rule_id, rule2.rule_id],
              description: `Duplicate rules detected`,
              suggestion: `Rules ${rule1.rule_id} and ${rule2.rule_id} are identical - consider keeping only one`
            });
          }
        }

        // Contradictory rules (ADD vs REMOVE for same code)
        if (
          overlappingCodes.length > 0 &&
          rule1.payer_group === rule2.payer_group &&
          ((rule1.action.includes('@ADD') && rule2.action.includes('@REMOVE')) ||
           (rule1.action.includes('@REMOVE') && rule2.action.includes('@ADD')))
        ) {
          const conflictId = `conflict-${rule1.rule_id}-${rule2.rule_id}`;
          
          // Only add conflict if it hasn't been resolved
          if (!this.resolvedConflicts.has(conflictId)) {
            conflicts.push({
              id: conflictId,
              type: 'contradictory',
              severity: 'high',
              affectedRuleIds: [rule1.rule_id, rule2.rule_id],
              description: `Contradictory actions (ADD vs REMOVE) for code(s) ${overlappingCodes.join(', ')}`,
              suggestion: `Review rules ${rule1.rule_id} and ${rule2.rule_id} - they have contradictory actions`
            });
          }
        }
      }
    }

    // Update rules with conflicts
    sop.rules.forEach(rule => {
      const ruleConflicts = conflicts.filter(c => c.affectedRuleIds.includes(rule.rule_id));
      if (ruleConflicts.length > 0) {
        (rule as any).conflicts = ruleConflicts;
      } else {
        (rule as any).conflicts = [];
      }
    });

    SOPManagementService.updateSOP(sopId, { rules: sop.rules });
    console.log(`🔍 Detected ${conflicts.length} conflicts`);
    
    return conflicts;
  }

  /**
   * Resolve a conflict
   */
  resolveConflict(sopId: string, resolution: ConflictResolution): void {
    console.log(`🔧 Resolving conflict ${resolution.conflictId} with action: ${resolution.action}`);
    
    const sop = SOPManagementService.getSOPById(sopId);
    if (!sop) {
      throw new Error(`SOP ${sopId} not found`);
    }

    // Find the conflict across all rules
    let conflict: RuleConflict | undefined;
    let conflictRule: any;
    
    for (const rule of sop.rules) {
      const ruleConflicts = (rule as any).conflicts || [];
      conflict = ruleConflicts.find((c: RuleConflict) => c.id === resolution.conflictId);
      if (conflict) {
        conflictRule = rule;
        break;
      }
    }

    if (!conflict) {
      console.error(`❌ Conflict ${resolution.conflictId} not found`);
      throw new Error(`Conflict ${resolution.conflictId} not found`);
    }

    const [ruleId1, ruleId2] = conflict.affectedRuleIds;
    console.log(`🔍 Conflict affects rules: ${ruleId1} and ${ruleId2}`);

    // Execute the resolution action
    switch (resolution.action) {
      case 'keep_first':
        console.log(`✅ KEEP_FIRST: Keeping first rule (${ruleId1}), rejecting second rule (${ruleId2})`);
        this.rejectRule(sopId, ruleId2, `Conflict resolution: kept first rule ${ruleId1}`);
        this.resolvedConflicts.add(resolution.conflictId);
        console.log(`🗑️ Rule ${ruleId2} has been marked as REJECTED`);
        break;

      case 'keep_second':
        console.log(`✅ KEEP_SECOND: Keeping second rule (${ruleId2}), rejecting first rule (${ruleId1})`);
        this.rejectRule(sopId, ruleId1, `Conflict resolution: kept second rule ${ruleId2}`);
        this.resolvedConflicts.add(resolution.conflictId);
        console.log(`🗑️ Rule ${ruleId1} has been marked as REJECTED`);
        break;

      case 'keep_both':
        console.log(`✅ Keeping both rules: ${ruleId1} and ${ruleId2}`);
        // Mark the conflict as resolved - both rules remain active
        this.resolvedConflicts.add(resolution.conflictId);
        break;

      case 'merge':
        if (resolution.mergedRule) {
          console.log(`🔄 Merging rules ${ruleId1} and ${ruleId2}`);
          this.rejectRule(sopId, ruleId1, 'Conflict resolution: merged');
          this.rejectRule(sopId, ruleId2, 'Conflict resolution: merged');
          SOPManagementService.addRulesToSOP(sopId, [resolution.mergedRule as any]);
          this.resolvedConflicts.add(resolution.conflictId);
        }
        break;

      case 'delete_both':
        console.log(`🗑️ Deleting both rules: ${ruleId1} and ${ruleId2}`);
        this.rejectRule(sopId, ruleId1, 'Conflict resolution: deleted both');
        this.rejectRule(sopId, ruleId2, 'Conflict resolution: deleted both');
        this.resolvedConflicts.add(resolution.conflictId);
        break;
    }

    // Remove the resolved conflict from all affected rules
    sop.rules.forEach(rule => {
      const ruleConflicts = (rule as any).conflicts || [];
      (rule as any).conflicts = ruleConflicts.filter((c: RuleConflict) => c.id !== resolution.conflictId);
    });

    // Update the SOP with the modified rules
    SOPManagementService.updateSOP(sopId, { rules: sop.rules });

    // Re-detect conflicts to find any remaining ones
    const remainingConflicts = this.detectConflicts(sopId);

    console.log(`✅ Conflict ${resolution.conflictId} resolved successfully. ${remainingConflicts.length} conflicts remaining.`);
  }

  /**
   * Get all new tags from SOP rules using master lookup service
   */
  getNewTags(sopId: string): NewTag[] {
    console.log('🔍 RuleApprovalService.getNewTags called for SOP:', sopId);
    
    const sop = SOPManagementService.getSOPById(sopId);
    if (!sop) {
      throw new Error(`SOP ${sopId} not found`);
    }

    // Use master lookup service to identify new tags
    const newTags = masterLookupTableService.identifyNewTagsFromRules(sopId, sop.rules);
    
    console.log('🎯 New tags identified:', newTags.length);
    console.log('🎯 New tags:', newTags.map(t => `${t.tag} (${t.type})`));
    
    return newTags;
  }
  /**
   * Sync new tags to lookup tables using master service
   */
  private syncNewTagsToLookupTables(newTags: any, ruleId: string): void {
    console.log('🔄 Syncing new tags to lookup tables via master service');
    
    // Use master lookup service for all tag synchronization
    if (newTags.code_groups) {
      newTags.code_groups.forEach((tag: string) => {
        const check = masterLookupTableService.checkTagExistence(tag, 'code_group');
        if (check.isNew) {
          masterLookupTableService.addTagToMainLookupTable(tag, 'code_group', {
            purpose: `Auto-generated from rule ${ruleId}`,
            source_rule_id: ruleId
          });
        }
      });
    }

    if (newTags.payer_groups) {
      newTags.payer_groups.forEach((tag: string) => {
        const check = masterLookupTableService.checkTagExistence(tag, 'payer_group');
        if (check.isNew) {
          masterLookupTableService.addTagToMainLookupTable(tag, 'payer_group', {
            description: `Auto-generated from rule ${ruleId}`,
            source_rule_id: ruleId
          });
        }
      });
    }

    if (newTags.provider_groups) {
      newTags.provider_groups.forEach((tag: string) => {
        const check = masterLookupTableService.checkTagExistence(tag, 'provider_group');
        if (check.isNew) {
          masterLookupTableService.addTagToMainLookupTable(tag, 'provider_group', {
            description: `Auto-generated from rule ${ruleId}`,
            source_rule_id: ruleId
          });
        }
      });
    }

    if (newTags.actions) {
      newTags.actions.forEach((tag: string) => {
        const check = masterLookupTableService.checkTagExistence(tag, 'action');
        if (check.isNew) {
          masterLookupTableService.addTagToMainLookupTable(tag, 'action', {
            description: `Auto-generated from rule ${ruleId}`,
            source_rule_id: ruleId
          });
        }
      });
    }

    if (newTags.chart_sections) {
      newTags.chart_sections.forEach((tag: string) => {
        const check = masterLookupTableService.checkTagExistence(tag, 'chart_section');
        if (check.isNew) {
          masterLookupTableService.addTagToMainLookupTable(tag, 'chart_section', {
            description: `Auto-generated from rule ${ruleId}`,
            source_rule_id: ruleId
          });
        }
      });
    }

    console.log('✅ Tag synchronization complete');
  }

  /**
   * Clear resolved conflicts (for testing purposes)
   */
  clearResolvedConflicts(): void {
    this.resolvedConflicts.clear();
    console.log('🧹 Cleared all resolved conflicts');
  }

  /**
   * Get resolved conflicts count (for debugging)
   */
  getResolvedConflictsCount(): number {
    return this.resolvedConflicts.size;
  }
}

// Export singleton instance
export const RuleApprovalService = new RuleApprovalServiceClass();
