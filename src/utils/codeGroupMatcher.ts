// Code Group Matcher - Reverse lookup code groups from individual codes

import { EnhancedLookupTables, EnhancedCodeGroup } from '@/types/lookupTable';

export interface CodeGroupMatch {
  codeGroup: EnhancedCodeGroup;
  matchedCodes: string[];
  matchPercentage: number;
}

export class CodeGroupMatcher {
  private lookupTables: EnhancedLookupTables;

  constructor(lookupTables: EnhancedLookupTables) {
    this.lookupTables = lookupTables;
  }

  /**
   * Find code groups that contain the given codes
   * Returns matches sorted by match percentage (highest first)
   */
  findCodeGroupsForCodes(codes: string[]): CodeGroupMatch[] {
    const matches: CodeGroupMatch[] = [];
    const cleanCodes = codes.map(c => c.trim()).filter(c => c && !c.startsWith('@'));

    if (cleanCodes.length === 0) return matches;

    for (const codeGroup of this.lookupTables.codeGroups) {
      const matchedCodes = cleanCodes.filter(code => 
        codeGroup.expands_to.includes(code)
      );

      if (matchedCodes.length > 0) {
        const matchPercentage = matchedCodes.length / cleanCodes.length;
        matches.push({
          codeGroup,
          matchedCodes,
          matchPercentage
        });
      }
    }

    // Sort by match percentage (highest first)
    return matches.sort((a, b) => b.matchPercentage - a.matchPercentage);
  }

  /**
   * Find the best matching code group for given codes
   * Returns the code group with highest match percentage
   */
  findBestCodeGroup(codes: string[]): CodeGroupMatch | null {
    const matches = this.findCodeGroupsForCodes(codes);
    return matches.length > 0 ? matches[0] : null;
  }

  /**
   * Check if all codes belong to a single code group
   */
  isCompleteMatch(codes: string[]): { isComplete: boolean; codeGroup?: EnhancedCodeGroup } {
    const cleanCodes = codes.map(c => c.trim()).filter(c => c && !c.startsWith('@'));
    
    for (const codeGroup of this.lookupTables.codeGroups) {
      const allCodesMatch = cleanCodes.every(code => 
        codeGroup.expands_to.includes(code)
      );

      if (allCodesMatch) {
        return { isComplete: true, codeGroup };
      }
    }

    return { isComplete: false };
  }

  /**
   * Auto-populate code_group field based on codes
   * This is the reverse of code expansion
   */
  autoPopulateCodeGroup(codes: string[]): {
    codeGroup: string | null;
    expandedCodes: string[];
    confidence: number;
    reason: string;
  } {
    const cleanCodes = codes.map(c => c.trim()).filter(c => c && !c.startsWith('@'));

    if (cleanCodes.length === 0) {
      return {
        codeGroup: null,
        expandedCodes: [],
        confidence: 0,
        reason: 'No codes provided'
      };
    }

    // Check for complete match first
    const completeMatch = this.isCompleteMatch(cleanCodes);
    if (completeMatch.isComplete && completeMatch.codeGroup) {
      return {
        codeGroup: completeMatch.codeGroup.tag,
        expandedCodes: completeMatch.codeGroup.expands_to,
        confidence: 1.0,
        reason: 'All codes match a single code group'
      };
    }

    // Find best partial match
    const bestMatch = this.findBestCodeGroup(cleanCodes);
    if (bestMatch) {
      // If match percentage is high (>= 50%), use it
      if (bestMatch.matchPercentage >= 0.5) {
        return {
          codeGroup: bestMatch.codeGroup.tag,
          expandedCodes: bestMatch.codeGroup.expands_to,
          confidence: bestMatch.matchPercentage,
          reason: `${Math.round(bestMatch.matchPercentage * 100)}% of codes match ${bestMatch.codeGroup.tag}`
        };
      }
    }

    // No good match found
    return {
      codeGroup: null,
      expandedCodes: cleanCodes,
      confidence: 0,
      reason: 'No matching code group found'
    };
  }

  /**
   * Enhance rule with code group information
   * Takes a rule with codes and adds/updates code_group field
   */
  enhanceRuleWithCodeGroup(rule: any): {
    enhancedRule: any;
    changes: string[];
    warnings: string[];
  } {
    const changes: string[] = [];
    const warnings: string[] = [];
    const enhancedRule = { ...rule };

    // If rule already has code_group, validate it
    if (rule.code_group) {
      const codeGroup = this.lookupTables.codeGroups.find(
        cg => cg.tag === rule.code_group || cg.tag === `@${rule.code_group.replace('@', '')}`
      );

      if (codeGroup) {
        // Verify codes match the code group
        const ruleCodes = rule.code ? rule.code.split(',').map((c: string) => c.trim()) : [];
        const cleanCodes = ruleCodes.filter((c: string) => !c.startsWith('@'));
        
        const allCodesInGroup = cleanCodes.every((code: string) => 
          codeGroup.expands_to.includes(code)
        );

        if (!allCodesInGroup) {
          warnings.push(`Some codes don't match code group ${rule.code_group}`);
        }

        // Expand codes if needed
        if (cleanCodes.length < codeGroup.expands_to.length) {
          enhancedRule.code = codeGroup.expands_to.join(',');
          changes.push(`Expanded codes from ${rule.code_group}`);
        }
      } else {
        warnings.push(`Code group ${rule.code_group} not found in lookup table`);
      }
    } else if (rule.code) {
      // No code_group but has codes - try to find matching code group
      const codes = rule.code.split(',').map((c: string) => c.trim());
      const result = this.autoPopulateCodeGroup(codes);

      if (result.codeGroup && result.confidence >= 0.5) {
        enhancedRule.code_group = result.codeGroup;
        enhancedRule.code = result.expandedCodes.join(',');
        changes.push(`Auto-populated code_group: ${result.codeGroup} (${result.reason})`);
      } else {
        warnings.push(`Could not find matching code group for codes: ${rule.code}`);
      }
    }

    return { enhancedRule, changes, warnings };
  }

  /**
   * Batch enhance multiple rules
   */
  enhanceRules(rules: any[]): {
    enhancedRules: any[];
    summary: {
      totalRules: number;
      rulesEnhanced: number;
      rulesWithWarnings: number;
      changes: string[];
      warnings: string[];
    };
  } {
    const enhancedRules: any[] = [];
    const allChanges: string[] = [];
    const allWarnings: string[] = [];
    let rulesEnhanced = 0;
    let rulesWithWarnings = 0;

    for (const rule of rules) {
      const { enhancedRule, changes, warnings } = this.enhanceRuleWithCodeGroup(rule);
      enhancedRules.push(enhancedRule);

      if (changes.length > 0) {
        rulesEnhanced++;
        allChanges.push(`Rule ${rule.rule_id}: ${changes.join(', ')}`);
      }

      if (warnings.length > 0) {
        rulesWithWarnings++;
        allWarnings.push(`Rule ${rule.rule_id}: ${warnings.join(', ')}`);
      }
    }

    return {
      enhancedRules,
      summary: {
        totalRules: rules.length,
        rulesEnhanced,
        rulesWithWarnings,
        changes: allChanges,
        warnings: allWarnings
      }
    };
  }
}
