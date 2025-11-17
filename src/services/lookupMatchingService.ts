// Lookup Table Matching Service - Implements Fuzzy Matching Logic

import { EnhancedLookupTables, EnhancedCodeGroup, EnhancedPayerGroup, EnhancedProviderGroup, EnhancedActionTag } from '@/types/lookupTable';

export interface MatchResult {
  matched: boolean;
  tag: string;
  matchType: 'EXACT' | 'SEMANTIC' | 'KEYWORD' | 'CODE_OVERLAP' | 'NONE';
  confidence: number;
  expandedCodes?: string[];
}

export class LookupMatchingService {
  private lookupTables: EnhancedLookupTables;

  constructor(lookupTables: EnhancedLookupTables) {
    this.lookupTables = lookupTables;
  }

  /**
   * Match code group from document text
   * Priority: Exact > Semantic > Keyword > Code Overlap
   */
  matchCodeGroup(documentText: string, mentionedCodes?: string[]): MatchResult {
    const cleanText = documentText.toLowerCase().trim();

    // Priority 1: Exact Match
    for (const codeGroup of this.lookupTables.codeGroups) {
      if (codeGroup.purpose.toLowerCase() === cleanText) {
        return {
          matched: true,
          tag: codeGroup.tag,
          matchType: 'EXACT',
          confidence: 1.0,
          expandedCodes: codeGroup.expands_to
        };
      }
    }

    // Priority 2: Semantic Match (high similarity)
    for (const codeGroup of this.lookupTables.codeGroups) {
      const similarity = this.calculateSemanticSimilarity(cleanText, codeGroup.purpose.toLowerCase());
      if (similarity > 0.85) {
        return {
          matched: true,
          tag: codeGroup.tag,
          matchType: 'SEMANTIC',
          confidence: similarity,
          expandedCodes: codeGroup.expands_to
        };
      }
    }

    // Priority 3: Keyword Match
    const keywords = this.extractKeywords(cleanText);
    let bestKeywordMatch: { codeGroup: EnhancedCodeGroup; score: number } | null = null;

    for (const codeGroup of this.lookupTables.codeGroups) {
      const purposeKeywords = this.extractKeywords(codeGroup.purpose.toLowerCase());
      const matchScore = this.calculateKeywordOverlap(keywords, purposeKeywords);
      
      if (matchScore > 0.6 && (!bestKeywordMatch || matchScore > bestKeywordMatch.score)) {
        bestKeywordMatch = { codeGroup, score: matchScore };
      }
    }

    if (bestKeywordMatch) {
      return {
        matched: true,
        tag: bestKeywordMatch.codeGroup.tag,
        matchType: 'KEYWORD',
        confidence: bestKeywordMatch.score,
        expandedCodes: bestKeywordMatch.codeGroup.expands_to
      };
    }

    // Priority 4: Code Overlap Match
    if (mentionedCodes && mentionedCodes.length > 0) {
      let bestCodeMatch: { codeGroup: EnhancedCodeGroup; score: number } | null = null;

      for (const codeGroup of this.lookupTables.codeGroups) {
        const overlapScore = this.calculateCodeOverlap(mentionedCodes, codeGroup.expands_to);
        
        if (overlapScore > 0.5 && (!bestCodeMatch || overlapScore > bestCodeMatch.score)) {
          bestCodeMatch = { codeGroup, score: overlapScore };
        }
      }

      if (bestCodeMatch) {
        return {
          matched: true,
          tag: bestCodeMatch.codeGroup.tag,
          matchType: 'CODE_OVERLAP',
          confidence: bestCodeMatch.score,
          expandedCodes: bestCodeMatch.codeGroup.expands_to
        };
      }
    }

    // No match found
    return {
      matched: false,
      tag: '',
      matchType: 'NONE',
      confidence: 0
    };
  }

  /**
   * Match payer group from document text
   */
  matchPayerGroup(documentText: string): MatchResult {
    const cleanText = documentText.toLowerCase().trim();

    // Priority 1: Exact Match
    for (const payerGroup of this.lookupTables.payerGroups) {
      if (payerGroup.name.toLowerCase() === cleanText) {
        return {
          matched: true,
          tag: payerGroup.tag,
          matchType: 'EXACT',
          confidence: 1.0
        };
      }
    }

    // Priority 2: Semantic Match
    for (const payerGroup of this.lookupTables.payerGroups) {
      const similarity = this.calculateSemanticSimilarity(cleanText, payerGroup.name.toLowerCase());
      if (similarity > 0.85) {
        return {
          matched: true,
          tag: payerGroup.tag,
          matchType: 'SEMANTIC',
          confidence: similarity
        };
      }
    }

    // Priority 3: Keyword Match
    const keywords = this.extractKeywords(cleanText);
    let bestMatch: { payerGroup: EnhancedPayerGroup; score: number } | null = null;

    for (const payerGroup of this.lookupTables.payerGroups) {
      const nameKeywords = this.extractKeywords(payerGroup.name.toLowerCase());
      const matchScore = this.calculateKeywordOverlap(keywords, nameKeywords);
      
      if (matchScore > 0.6 && (!bestMatch || matchScore > bestMatch.score)) {
        bestMatch = { payerGroup, score: matchScore };
      }
    }

    if (bestMatch) {
      return {
        matched: true,
        tag: bestMatch.payerGroup.tag,
        matchType: 'KEYWORD',
        confidence: bestMatch.score
      };
    }

    return {
      matched: false,
      tag: '',
      matchType: 'NONE',
      confidence: 0
    };
  }

  /**
   * Match provider group from document text
   */
  matchProviderGroup(documentText: string): MatchResult {
    const cleanText = documentText.toLowerCase().trim();

    // Priority 1: Exact Match
    for (const providerGroup of this.lookupTables.providerGroups) {
      if (providerGroup.name.toLowerCase() === cleanText || 
          providerGroup.description.toLowerCase() === cleanText) {
        return {
          matched: true,
          tag: providerGroup.tag,
          matchType: 'EXACT',
          confidence: 1.0
        };
      }
    }

    // Priority 2: Semantic Match
    for (const providerGroup of this.lookupTables.providerGroups) {
      const nameSimilarity = this.calculateSemanticSimilarity(cleanText, providerGroup.name.toLowerCase());
      const descSimilarity = this.calculateSemanticSimilarity(cleanText, providerGroup.description.toLowerCase());
      const similarity = Math.max(nameSimilarity, descSimilarity);
      
      if (similarity > 0.85) {
        return {
          matched: true,
          tag: providerGroup.tag,
          matchType: 'SEMANTIC',
          confidence: similarity
        };
      }
    }

    // Priority 3: Keyword Match
    const keywords = this.extractKeywords(cleanText);
    let bestMatch: { providerGroup: EnhancedProviderGroup; score: number } | null = null;

    for (const providerGroup of this.lookupTables.providerGroups) {
      const nameKeywords = this.extractKeywords(providerGroup.name.toLowerCase());
      const descKeywords = this.extractKeywords(providerGroup.description.toLowerCase());
      const allKeywords = [...nameKeywords, ...descKeywords];
      const matchScore = this.calculateKeywordOverlap(keywords, allKeywords);
      
      if (matchScore > 0.6 && (!bestMatch || matchScore > bestMatch.score)) {
        bestMatch = { providerGroup, score: matchScore };
      }
    }

    if (bestMatch) {
      return {
        matched: true,
        tag: bestMatch.providerGroup.tag,
        matchType: 'KEYWORD',
        confidence: bestMatch.score
      };
    }

    return {
      matched: false,
      tag: '',
      matchType: 'NONE',
      confidence: 0
    };
  }

  /**
   * Match action tag from document text
   */
  matchActionTag(documentText: string): MatchResult {
    const cleanText = documentText.toLowerCase().trim();

    // Check for action patterns
    for (const actionTag of this.lookupTables.actionTags) {
      const actionName = actionTag.tag.replace('@', '').toLowerCase();
      
      // Direct match
      if (cleanText.includes(actionName)) {
        return {
          matched: true,
          tag: actionTag.tag,
          matchType: 'EXACT',
          confidence: 1.0
        };
      }

      // Synonym match
      const synonyms = this.getActionSynonyms(actionName);
      for (const synonym of synonyms) {
        if (cleanText.includes(synonym)) {
          return {
            matched: true,
            tag: actionTag.tag,
            matchType: 'SEMANTIC',
            confidence: 0.9
          };
        }
      }
    }

    return {
      matched: false,
      tag: '',
      matchType: 'NONE',
      confidence: 0
    };
  }

  /**
   * Calculate semantic similarity between two texts
   * Uses simple word overlap and order similarity
   */
  private calculateSemanticSimilarity(text1: string, text2: string): number {
    const words1 = text1.split(/\s+/).filter(w => w.length > 2);
    const words2 = text2.split(/\s+/).filter(w => w.length > 2);

    if (words1.length === 0 || words2.length === 0) return 0;

    // Calculate word overlap
    const overlap = words1.filter(w => words2.includes(w)).length;
    const maxLength = Math.max(words1.length, words2.length);
    
    return overlap / maxLength;
  }

  /**
   * Extract meaningful keywords from text
   */
  private extractKeywords(text: string): string[] {
    const stopWords = new Set(['the', 'and', 'or', 'for', 'with', 'in', 'on', 'at', 'to', 'a', 'an', 'of', 'is', 'are', 'was', 'were']);
    
    return text
      .split(/\s+/)
      .map(w => w.toLowerCase().replace(/[^a-z0-9]/g, ''))
      .filter(w => w.length > 2 && !stopWords.has(w));
  }

  /**
   * Calculate keyword overlap score
   */
  private calculateKeywordOverlap(keywords1: string[], keywords2: string[]): number {
    if (keywords1.length === 0 || keywords2.length === 0) return 0;

    const overlap = keywords1.filter(k => keywords2.includes(k)).length;
    const maxLength = Math.max(keywords1.length, keywords2.length);
    
    return overlap / maxLength;
  }

  /**
   * Calculate code overlap score
   */
  private calculateCodeOverlap(codes1: string[], codes2: string[]): number {
    if (codes1.length === 0 || codes2.length === 0) return 0;

    const overlap = codes1.filter(c => codes2.includes(c)).length;
    const maxLength = Math.max(codes1.length, codes2.length);
    
    return overlap / maxLength;
  }

  /**
   * Get synonyms for action tags
   */
  private getActionSynonyms(action: string): string[] {
    const synonymMap: Record<string, string[]> = {
      'add': ['append', 'include', 'attach', 'insert'],
      'remove': ['delete', 'exclude', 'drop', 'omit'],
      'swap': ['replace', 'exchange', 'substitute', 'switch'],
      'link': ['associate', 'connect', 'relate', 'tie'],
      'cond_add': ['conditional add', 'conditionally add', 'add if'],
      'cond_remove': ['conditional remove', 'conditionally remove', 'remove if'],
      'always_add': ['always append', 'always include', 'mandatory add'],
      'never_add': ['never append', 'never include', 'exclude always']
    };

    return synonymMap[action] || [];
  }

  /**
   * Expand code group tag to actual codes
   */
  expandCodeGroup(tag: string): string[] {
    const codeGroup = this.lookupTables.codeGroups.find(
      cg => cg.tag === tag || cg.tag === `@${tag.replace('@', '')}`
    );

    return codeGroup ? codeGroup.expands_to : [];
  }

  /**
   * Get all codes from multiple code group tags
   */
  expandMultipleCodeGroups(tags: string[]): string[] {
    const allCodes: string[] = [];

    for (const tag of tags) {
      const codes = this.expandCodeGroup(tag);
      allCodes.push(...codes);
    }

    // Remove duplicates and return
    return [...new Set(allCodes)];
  }
}
