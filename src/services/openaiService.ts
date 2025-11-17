import { SOPRule, ExtractionRequest, ExtractionResult, LookupTables } from '@/types/sop';

const OPENAI_API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

/**
 * OpenAI Service for extracting and normalizing claim-editing rules
 */
export class OpenAIService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Extract rules from source text using OpenAI
   */
  async extractRules(request: ExtractionRequest): Promise<ExtractionResult> {
    const prompt = this.buildExtractionPrompt(request);

    try {
      const response = await fetch(OPENAI_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [{
            role: 'system',
            content: 'You are an expert medical billing rule extraction system. You extract and normalize claim-editing rules from policy documents into structured JSON format.'
          }, {
            role: 'user',
            content: prompt
          }],
          temperature: 0.2,
          max_tokens: 8192,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      const generatedText = data.choices?.[0]?.message?.content;

      if (!generatedText) {
        throw new Error('No response from OpenAI API');
      }

      return this.parseAIResponse(generatedText, request.clientPrefix);
    } catch (error) {
      console.error('OpenAI extraction error:', error);
      throw error;
    }
  }

  /**
   * Build the extraction prompt for OpenAI
   */
  private buildExtractionPrompt(request: ExtractionRequest): string {
    const { text, clientPrefix, lookupTables } = request;

    return `You are an expert medical billing rule extraction system. Your task is to extract claim-editing rules from policy documents and normalize them into a structured format.

## AVAILABLE LOOKUP TAGS

### Code Groups:
${lookupTables.codeGroups.map(cg => `${cg.tag} - ${cg.purpose} (${cg.expands_to.slice(0, 5).join(', ')}${cg.expands_to.length > 5 ? '...' : ''})`).join('\n')}

### Payer Groups:
${lookupTables.payerGroups.map(pg => `${pg.tag} - ${pg.name}`).join('\n')}

### Provider Groups:
${lookupTables.providerGroups.map(pg => `${pg.tag} - ${pg.name}`).join('\n')}

### Action Tags:
${lookupTables.actionTags.map(at => `${at.tag} - ${at.description} (Syntax: ${at.syntax})`).join('\n')}

### Chart Sections:
${lookupTables.chartSections.map(cs => `${cs.tag} - ${cs.name}`).join('\n')}

## DESCRIPTION PATTERN (STRICT FORMAT)
For @PAYER_GROUP payers, if <trigger condition> is documented and the @CHART_SECTION states "<keyword phrase>," then @ACTION(@item).

## RULES FOR EXTRACTION

1. **Identify claim-editing sentences**: Look for phrases like:
   - "must add modifier"
   - "do not bill"
   - "requires diagnosis"
   - "append modifier"
   - "remove code"
   - "swap code"
   - "link diagnosis"

2. **Normalize to single sentence**: Each rule must be ONE sentence ending with a period.

3. **Use lookup tags**: Replace specific codes/payers with @TAG when applicable.

4. **Fill all CSV columns**:
   - rule_id: ${clientPrefix}-[MNEMONIC]-[0001, 0002, etc.]
   - code: ONLY the target code or @GROUP (no actions)
   - action: ONLY @ACTION(@code) statements, space-separated
   - payer_group: Pipe-delimited @PAYER tags (e.g., @BCBS|@ANTHEM)
   - provider_group: @PROVIDER tag
   - description: Single sentence with inline tags
   - documentation_trigger: Semicolon-separated keywords
   - chart_section: One tag or blank
   - effective_date: YYYY-MM-DD (use today if not specified: ${new Date().toISOString().split('T')[0]})
   - end_date: YYYY-MM-DD or leave blank
   - reference: Source file + page number

## SOURCE TEXT TO ANALYZE:
${text}

## OUTPUT FORMAT
Return ONLY a valid JSON array of rules. Each rule must have this exact structure:

[
  {
    "rule_id": "${clientPrefix}-MOD25-0001",
    "code": "@E&M_MINOR_PROC",
    "action": "@ADD(@25)",
    "payer_group": "@BCBS|@ANTHEM",
    "provider_group": "@PHYSICIAN_MD_DO",
    "description": "For @BCBS|@ANTHEM payers, if office E&M is billed with 0-/10-day global procedure and the @ASSESSMENT_PLAN states \\"separate service,\\" then @ADD(@25).",
    "documentation_trigger": "separate service;global procedure;E&M",
    "chart_section": "ASSESSMENT_PLAN",
    "effective_date": "2024-01-01",
    "end_date": "",
    "reference": "Source document p. 1"
  }
]

Extract ALL claim-editing rules from the text. Return ONLY the JSON array, no additional text.`;
  }

  /**
   * Parse AI JSON response into structured rules
   */
  private parseAIResponse(responseText: string, clientPrefix: string): ExtractionResult {
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonText = responseText.trim();
      
      // Remove markdown code blocks if present
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }

      const rules: SOPRule[] = JSON.parse(jsonText);

      // Validate and enhance rules
      const validatedRules = rules.map((rule, index) => ({
        ...rule,
        status: 'Review' as const,
        // Ensure rule_id has correct format
        rule_id: rule.rule_id || `${clientPrefix}-RULE-${String(index + 1).padStart(4, '0')}`
      }));

      const warnings: string[] = [];
      const suggestions: string[] = [];

      // Analyze extraction quality
      if (validatedRules.length === 0) {
        warnings.push('No rules were extracted from the source text');
      }

      validatedRules.forEach((rule, idx) => {
        if (!rule.description.endsWith('.')) {
          warnings.push(`Rule ${idx + 1}: Description should end with a period`);
        }
        if (!rule.code.startsWith('@') && !/^\d+$/.test(rule.code)) {
          suggestions.push(`Rule ${idx + 1}: Consider using a @CODE_GROUP tag instead of individual code`);
        }
        if (!rule.documentation_trigger) {
          warnings.push(`Rule ${idx + 1}: Missing documentation triggers`);
        }
      });

      return {
        rules: validatedRules,
        confidence: this.calculateConfidence(validatedRules, warnings),
        warnings,
        suggestions
      };
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate confidence score based on rule quality
   */
  private calculateConfidence(rules: SOPRule[], warnings: string[]): number {
    if (rules.length === 0) return 0;

    let score = 100;
    
    // Deduct points for warnings
    score -= warnings.length * 5;

    // Check rule completeness
    rules.forEach(rule => {
      if (!rule.code) score -= 10;
      if (!rule.action) score -= 10;
      if (!rule.payer_group) score -= 5;
      if (!rule.description) score -= 15;
      if (!rule.effective_date) score -= 5;
    });

    return Math.max(0, Math.min(100, score / rules.length));
  }

  /**
   * Validate API key by making a test request
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(OPENAI_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{
            role: 'user',
            content: 'Test'
          }],
          max_tokens: 5
        })
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Create an OpenAI service instance
 */
export const createOpenAIService = (apiKey: string): OpenAIService => {
  return new OpenAIService(apiKey);
};

// Backward compatibility alias
export const createGeminiService = createOpenAIService;
