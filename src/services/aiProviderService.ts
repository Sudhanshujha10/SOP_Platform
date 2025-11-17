/**
 * Centralized AI provider management supporting OpenAI, Anthropic, and Gemini
 * Admin configures the provider; end users never see API keys
 */

import { lookupTables } from '@/data/lookupTables';
import { AdvancedSOPRule } from '@/types/advanced';

export type AIProvider = 'openai' | 'anthropic' | 'gemini';

// Backend API URL
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001/api';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
}

export interface ExtractionRequest {
  text: string;
  clientPrefix: string;
  uploadDate?: string;
  fileName?: string;
}

export interface ExtractionResult {
  rules: AdvancedSOPRule[];
  confidence: number;
  warnings: string[];
  suggestions: string[];
  needsDefinition: string[];
  validationErrors: Array<{ ruleId: string; errors: string[] }>;
}

/**
 * AI Provider Service - Handles all AI operations
 */
export class AIProviderService {
  private static STORAGE_KEY = 'billblaze_ai_config';
  
  /**
   * Get current AI configuration
   */
  static getConfig(): AIConfig {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse AI config:', e);
      }
    }
    
    // Default configuration
    return {
      provider: 'openai',
      apiKey: '',
      model: 'gpt-4-turbo-preview'
    };
  }

  /**
   * Set AI configuration (admin only)
   */
  static setConfig(config: AIConfig): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
  }

  /**
   * Extract rules using configured AI provider (legacy - single step)
   */
  static async extractRules(request: ExtractionRequest): Promise<ExtractionResult> {
    // Use new two-step pipeline
    return await this.extractRulesWithPipeline(request);
  }

  /**
   * Three-step extraction pipeline (JSON-first approach)
   * All AI calls go through backend proxy to avoid CORS
   */
  static async extractRulesWithPipeline(request: ExtractionRequest): Promise<ExtractionResult> {
    const config = this.getConfig();
    
    if (!config.apiKey) {
      throw new Error('AI provider not configured. Please configure in Settings.');
    }

    try {
      console.log('═══════════════════════════════════════════════════');
      console.log('🚀 STARTING JSON-FIRST EXTRACTION PIPELINE (via Backend)');
      console.log('═══════════════════════════════════════════════════');
      
      // Step 1: Convert document text to structured JSON (via backend)
      const structuredJSON = await this.convertToStructuredJSON(request.text, config);
      
      // Step 2: Extract candidates from structured JSON (via backend)
      const candidates = await this.extractCandidatesFromJSON(structuredJSON, request, config);
      
      // Step 3: Normalize each candidate to exact schema (via backend)
      const normalizedRules = await this.normalizeRules(
        candidates, 
        request.clientPrefix, 
        config,
        request.uploadDate,
        request.fileName
      );
      
      // Step 4: Strict validation (local)
      const { StrictValidationService } = await import('./strictValidationService');
      const validation = StrictValidationService.validateBatch(normalizedRules);
      
      console.log('═══════════════════════════════════════════════════');
      console.log('✅ PIPELINE COMPLETE');
      console.log(`📊 Valid Rules: ${validation.validRules.length}`);
      console.log(`❌ Invalid Rules: ${validation.invalidRules.length}`);
      console.log(`⚠️ NEEDSDEFINITION: ${validation.allNeedsDefinition.length}`);
      console.log('═══════════════════════════════════════════════════\n');
      
      return {
        rules: validation.validRules,
        confidence: 85,
        warnings: validation.invalidRules.map(r => 
          `Rule ${r.rule.rule_id}: ${r.validation.errors.map(e => e.message).join(', ')}`
        ),
        suggestions: [],
        needsDefinition: validation.allNeedsDefinition,
        validationErrors: validation.invalidRules.map(r => ({
          ruleId: r.rule.rule_id || 'unknown',
          errors: r.validation.errors.map(e => e.message)
        }))
      };
    } catch (error) {
      console.error('❌ Extraction pipeline error:', error);
      throw error;
    }
  }

  /**
   * Step 1: Convert document text to structured JSON (via backend proxy)
   */
  private static async convertToStructuredJSON(text: string, config: AIConfig): Promise<any> {
    console.log('═══════════════════════════════════════════════════');
    console.log('📄 STEP 1: CONVERTING DOCUMENT TO STRUCTURED JSON (via Backend)');
    console.log('═══════════════════════════════════════════════════');
    console.log('📄 Document text length:', text.length);
    console.log('🔌 Calling backend proxy...');
    
    try {
      const response = await fetch(`${BACKEND_API_URL}/ai/convert-to-json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: config.provider,
          model: config.model,
          text: text,
          apiKey: config.apiKey
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Backend API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'JSON conversion failed');
      }

      const structuredJSON = result.data;
      console.log('✅ Successfully received structured JSON from backend');
      console.log('📊 STRUCTURED JSON SUMMARY:');
      console.log(`   - Sections: ${structuredJSON.sections?.length || 0}`);
      console.log(`   - Total Codes: ${structuredJSON.all_codes?.length || 0}`);
      console.log(`   - Total Payers: ${structuredJSON.all_payers?.length || 0}`);
      console.log('═══════════════════════════════════════════════════\n');
      
      return structuredJSON;
    } catch (error) {
      console.error('❌ Failed to convert document to JSON via backend');
      console.error('Error:', error);
      throw new Error(`JSON conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * OLD METHOD - REMOVED (was causing CORS)
   * Keeping comment for reference
   */
  private static async convertToStructuredJSON_OLD_DIRECT_CALL(text: string, config: AIConfig): Promise<any> {
    // This method made direct API calls and caused CORS errors
    // Now replaced with backend proxy call above
    const prompt = `Convert this medical billing policy document into a well-structured JSON format.

Extract and organize ALL text content preserving the document structure. Identify:
- Policy sections and titles
- Rule descriptions and requirements
- Procedure/diagnosis codes mentioned
- Payer/insurance company names
- Provider types
- Actions or requirements (add modifier, remove code, require auth, etc.)
- Effective dates and date ranges
- References (page numbers, policy sections)
- Documentation requirements
- Any conditions or triggers

Return a JSON object with this structure:
{
  "document_title": "title if present",
  "sections": [
    {
      "section_title": "section name",
      "content": "full text content",
      "codes_mentioned": ["list of CPT/ICD codes"],
      "payers_mentioned": ["list of insurance companies"],
      "actions_mentioned": ["list of actions/requirements"],
      "dates_mentioned": ["list of dates"],
      "references": ["page numbers, sections"]
    }
  ],
  "all_codes": ["complete list of all codes mentioned"],
  "all_payers": ["complete list of all payers mentioned"],
  "all_dates": ["complete list of all dates mentioned"]
}

DOCUMENT TEXT:
${text}

Return ONLY valid JSON. No markdown, no explanations.`;

    console.log('📤 Sending document to AI for JSON conversion...');
    const response = await this.callAIProvider(prompt, config, true);
    
    console.log('📥 JSON conversion response received');
    console.log('─────────────────────────────────────────────────');
    console.log('RAW RESPONSE:');
    console.log(response.substring(0, 500) + '...');
    console.log('─────────────────────────────────────────────────');
    
    try {
      const parsed = JSON.parse(response);
      console.log('✅ Successfully parsed structured JSON');
      console.log('📊 STRUCTURED JSON SUMMARY:');
      console.log(`   - Sections: ${parsed.sections?.length || 0}`);
      console.log(`   - Total Codes: ${parsed.all_codes?.length || 0}`);
      console.log(`   - Total Payers: ${parsed.all_payers?.length || 0}`);
      console.log('═══════════════════════════════════════════════════\n');
      return parsed;
    } catch (e) {
      console.error('❌ Failed to parse JSON conversion');
      console.error('Error:', e);
      console.error('Response was:', response);
      throw new Error('Failed to convert document to structured JSON');
    }
  }

  /**
   * Step 2: Extract rule candidates from structured JSON (via backend proxy)
   */
  private static async extractCandidatesFromJSON(
    structuredJSON: any,
    request: ExtractionRequest,
    config: AIConfig
  ): Promise<any[]> {
    console.log('═══════════════════════════════════════════════════');
    console.log('🤖 STEP 2: EXTRACTING RULE CANDIDATES FROM JSON (via Backend)');
    console.log('═══════════════════════════════════════════════════');
    console.log('📋 Processing structured JSON with', structuredJSON.sections?.length || 0, 'sections');
    console.log('🏷️ Client prefix:', request.clientPrefix);
    console.log('🔌 Calling backend proxy...');
    
    try {
      const response = await fetch(`${BACKEND_API_URL}/ai/extract-candidates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: config.provider,
          model: config.model,
          structuredJSON: structuredJSON,
          apiKey: config.apiKey
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Backend API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Candidate extraction failed');
      }

      const candidates = result.data;
      console.log('✅ Successfully extracted candidates from backend');
      console.log(`📈 Total candidates extracted: ${Array.isArray(candidates) ? candidates.length : 0}`);
      console.log('═══════════════════════════════════════════════════\n');
      
      return Array.isArray(candidates) ? candidates : [];
    } catch (error) {
      console.error('❌ Failed to extract candidates via backend');
      console.error('Error:', error);
      return [];
    }
  }

  /**
   * OLD METHOD - REMOVED (was causing CORS)
   */
  private static async extractCandidatesFromJSON_OLD_DIRECT_CALL(
    structuredJSON: any,
    request: ExtractionRequest,
    config: AIConfig
  ): Promise<any[]> {
    // This method made direct API calls and caused CORS errors
    // Now replaced with backend proxy call above
    console.log('📋 Processing structured JSON with', structuredJSON.sections?.length || 0, 'sections');
    console.log('🏷️ Client prefix:', request.clientPrefix);
    
    const prompt = `Extract all claim-editing rule candidates from this structured policy document JSON.

Analyze each section and identify distinct billing rules. For each rule, extract:
- What procedure/diagnosis codes it applies to (from codes_mentioned)
- What payer(s) it applies to (from payers_mentioned)
- What action to take (from actions_mentioned and content)
- Any conditions or triggers
- Effective dates (from dates_mentioned)
- Source reference (from references)

STRUCTURED DOCUMENT JSON:
${JSON.stringify(structuredJSON, null, 2)}

Return JSON array of rule candidates with these fields:
{
  "codes": "procedure/diagnosis codes or code groups",
  "payers": "insurance companies or payer groups",
  "action_description": "what action to take (add modifier, remove code, require auth, etc.)",
  "conditions": "when this rule applies",
  "effective_date": "YYYY-MM-DD format",
  "end_date": "YYYY-MM-DD format if mentioned",
  "reference": "source reference from document",
  "documentation_trigger": "keywords for documentation requirements"
}

Extract ALL rules from ALL sections. Be thorough and precise.
Return ONLY valid JSON array of objects. No markdown, no explanations.`;

    console.log('📤 Sending extraction request to AI...');
    const response = await this.callAIProvider(prompt, config, true);
    
    console.log('📥 AI Response received:');
    console.log('─────────────────────────────────────────────────');
    console.log('RAW RESPONSE:');
    console.log(response);
    console.log('─────────────────────────────────────────────────');
    
    try {
      const parsed = JSON.parse(response);
      console.log('✅ Successfully parsed JSON');
      console.log('📊 EXTRACTED CANDIDATES:');
      console.log(JSON.stringify(parsed, null, 2));
      console.log(`📈 Total candidates extracted: ${Array.isArray(parsed) ? parsed.length : 0}`);
      console.log('═══════════════════════════════════════════════════\n');
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('❌ Failed to parse candidates JSON');
      console.error('Error:', e);
      console.error('Response was:', response);
      console.log('═══════════════════════════════════════════════════\n');
      return [];
    }
  }

  /**
   * Step 3: Normalize candidates to schema (via backend proxy - SEPARATE CALL PER RULE)
   */
  private static async normalizeRules(
    candidates: any[], 
    clientPrefix: string,
    config: AIConfig,
    uploadDate?: string,
    fileName?: string
  ): Promise<Partial<AdvancedSOPRule>[]> {
    console.log('═══════════════════════════════════════════════════');
    console.log('🔄 STEP 3: NORMALIZING CANDIDATES TO SCHEMA (via Backend)');
    console.log('═══════════════════════════════════════════════════');
    console.log(`📊 Total candidates to normalize: ${candidates.length}`);
    console.log('⚠️ Each candidate will be normalized in a SEPARATE backend API call');
    console.log('🆕 AI will create new tags if needed (no NEEDSDEFINITION)');
    
    const rules: Partial<AdvancedSOPRule>[] = [];
    const allNewTags: any = {
      payers: new Set(),
      providers: new Set(),
      code_groups: new Set(),
      actions: new Set(),
      chart_sections: new Set()
    };
    
    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      
      console.log(`\n🔄 Normalizing candidate ${i + 1}/${candidates.length}...`);
      console.log('📋 Candidate data:', JSON.stringify(candidate, null, 2));
      console.log('🔌 Calling backend proxy...');
      
      try {
        const response = await fetch(`${BACKEND_API_URL}/ai/normalize-rule`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            provider: config.provider,
            model: config.model,
            candidate: candidate,
            clientPrefix: clientPrefix,
            lookupTables: lookupTables,
            ruleIndex: i,
            apiKey: config.apiKey,
            uploadDate: uploadDate || new Date().toISOString().split('T')[0],
            fileName: fileName || 'Uploaded document'
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Backend API error: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Rule normalization failed');
        }

        const normalized = result.data;
        const newTags = result.new_tags || {};
        
        console.log('✅ Successfully normalized rule via backend');
        console.log('📊 NORMALIZED RULE:');
        console.log(JSON.stringify(normalized, null, 2));
        
        // Track new tags created
        if (newTags.payers?.length) {
          newTags.payers.forEach((tag: string) => allNewTags.payers.add(tag));
        }
        if (newTags.providers?.length) {
          newTags.providers.forEach((tag: string) => allNewTags.providers.add(tag));
        }
        if (newTags.code_groups?.length) {
          newTags.code_groups.forEach((tag: string) => allNewTags.code_groups.add(tag));
        }
        if (newTags.actions?.length) {
          newTags.actions.forEach((tag: string) => allNewTags.actions.add(tag));
        }
        if (newTags.chart_sections?.length) {
          newTags.chart_sections.forEach((tag: string) => allNewTags.chart_sections.add(tag));
        }
        
        // Add metadata
        normalized.status = 'pending';
        normalized.confidence = 85;
        normalized.source = 'ai';
        normalized.validation_status = 'valid';
        normalized.created_by = 'AI Extraction';
        normalized.last_modified = new Date().toISOString();
        normalized.version = 1;
        
        rules.push(normalized);
        console.log(`✅ Rule ${i + 1} normalized and added to collection`);
      } catch (e) {
        console.error(`❌ Failed to normalize candidate ${i + 1} via backend:`, e);
        console.error('Candidate was:', candidate);
      }
    }
    
    console.log(`\n📊 NORMALIZATION COMPLETE: ${rules.length}/${candidates.length} rules normalized`);
    
    // Log all new tags created
    const totalNewTags = 
      allNewTags.payers.size + 
      allNewTags.providers.size + 
      allNewTags.code_groups.size + 
      allNewTags.actions.size + 
      allNewTags.chart_sections.size;
    
    if (totalNewTags > 0) {
      console.log('\n🆕 NEW TAGS CREATED ACROSS ALL RULES:');
      if (allNewTags.payers.size > 0) {
        console.log(`   - Payers (${allNewTags.payers.size}):`, Array.from(allNewTags.payers).join(', '));
      }
      if (allNewTags.providers.size > 0) {
        console.log(`   - Providers (${allNewTags.providers.size}):`, Array.from(allNewTags.providers).join(', '));
      }
      if (allNewTags.code_groups.size > 0) {
        console.log(`   - Code Groups (${allNewTags.code_groups.size}):`, Array.from(allNewTags.code_groups).join(', '));
      }
      if (allNewTags.actions.size > 0) {
        console.log(`   - Actions (${allNewTags.actions.size}):`, Array.from(allNewTags.actions).join(', '));
      }
      if (allNewTags.chart_sections.size > 0) {
        console.log(`   - Chart Sections (${allNewTags.chart_sections.size}):`, Array.from(allNewTags.chart_sections).join(', '));
      }
      console.log(`\n📈 Total new tags: ${totalNewTags}`);
    }
    
    console.log('═══════════════════════════════════════════════════\n');
    
    return rules;
  }

  /**
   * OLD METHOD - REMOVED (was causing CORS)
   */
  private static async normalizeRules_OLD_DIRECT_CALL(
    candidates: any[], 
    clientPrefix: string,
    config: AIConfig
  ): Promise<Partial<AdvancedSOPRule>[]> {
    // This method made direct API calls and caused CORS errors
    // Now replaced with backend proxy call above
    console.log(`📊 Total candidates to normalize: ${candidates.length}`);
    console.log('⚠️ Each candidate will be normalized in a SEPARATE AI call');
    
    const rules: Partial<AdvancedSOPRule>[] = [];
    
    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      
      console.log(`\n🔄 Normalizing candidate ${i + 1}/${candidates.length}...`);
      console.log('📋 Candidate data:', JSON.stringify(candidate, null, 2));
      
      const prompt = `Normalize this rule candidate to the SOP schema using ONLY values from the lookup tables.

LOOKUP TABLES:
${JSON.stringify(lookupTables, null, 2)}

RULE CANDIDATE:
${JSON.stringify(candidate, null, 2)}

Map to this EXACT schema:
{
  "rule_id": "${clientPrefix}-${this.generateCategory(candidate)}-${String(i + 1).padStart(4, '0')}",
  "code": "@CODE_GROUP or specific codes",
  "code_group": "@CODE_GROUP if applicable",
  "codes_selected": ["code1", "code2"] if SWAP/CONDITIONAL,
  "action": "@ACTION(@modifier)",
  "payer_group": "@PAYER|@PAYER",
  "provider_group": "@PROVIDER",
  "description": "Single sentence with inline @tags ending with period.",
  "documentation_trigger": "keyword1;keyword2",
  "chart_section": "SECTION_NAME",
  "effective_date": "YYYY-MM-DD",
  "end_date": "",
  "reference": "Document p. X",
  "modifiers": ["@25", "@52"] if applicable
}

STRICT RULES:
1. Use ONLY tags from lookup tables provided above
2. If a value doesn't exist in lookups, use "NEEDSDEFINITION_ORIGINALVALUE"
3. Description must be ONE sentence ending with period
4. Include inline @tags in description
5. codes_selected required for @SWAP/@COND_ADD/@COND_REMOVE
6. Date format: YYYY-MM-DD
7. All @tags must match lookup table tags exactly

Return ONLY valid JSON object. No markdown, no explanations.`;

      try {
        console.log(`📤 Sending normalization request to AI...`);
        const response = await this.callAIProvider(prompt, config, true);
        
        console.log('📥 Normalization response received:');
        console.log('─────────────────────────────────────────────────');
        console.log('RAW RESPONSE:');
        console.log(response);
        console.log('─────────────────────────────────────────────────');
        
        const normalized = JSON.parse(response);
        
        console.log('✅ Successfully parsed normalized rule');
        console.log('📊 NORMALIZED RULE:');
        console.log(JSON.stringify(normalized, null, 2));
        
        // Add metadata
        normalized.status = 'pending';
        normalized.confidence = 85;
        normalized.source = 'ai';
        normalized.validation_status = 'valid';
        normalized.created_by = 'AI Extraction';
        normalized.last_modified = new Date().toISOString();
        normalized.version = 1;
        
        rules.push(normalized);
        console.log(`✅ Rule ${i + 1} normalized and added to collection`);
      } catch (e) {
        console.error(`❌ Failed to normalize candidate ${i + 1}:`, e);
        console.error('Candidate was:', candidate);
      }
    }
    
    console.log(`\n📊 NORMALIZATION COMPLETE: ${rules.length}/${candidates.length} rules normalized`);
    console.log('═══════════════════════════════════════════════════\n');
    
    return rules;
  }

  /**
   * Generate category from candidate
   */
  private static generateCategory(candidate: any): string {
    const actionDesc = (candidate.action_description || '').toLowerCase();
    
    if (actionDesc.includes('modifier')) return 'MOD';
    if (actionDesc.includes('e&m') || actionDesc.includes('e/m')) return 'EM';
    if (actionDesc.includes('procedure')) return 'PROC';
    if (actionDesc.includes('diagnosis')) return 'DX';
    if (actionDesc.includes('telehealth')) return 'TELE';
    
    return 'RULE';
  }

  /**
   * Call configured AI provider
   */
  private static async callAIProvider(prompt: string, config: AIConfig, jsonMode: boolean = false): Promise<string> {
    switch (config.provider) {
      case 'openai':
        return await this.callOpenAI(prompt, config, jsonMode);
      case 'anthropic':
        return await this.callAnthropic(prompt, config);
      case 'gemini':
        return await this.callGemini(prompt, config);
      default:
        throw new Error('No AI provider configured');
    }
  }

  /**
   * Call OpenAI
   */
  private static async callOpenAI(prompt: string, config: AIConfig, jsonMode: boolean): Promise<string> {
    try {
      const model = config.model || 'gpt-4-turbo-preview';
      
      // Only use JSON mode for models that support it
      const supportsJsonMode = model.includes('gpt-4') || model.includes('gpt-3.5-turbo-1106') || model.includes('gpt-3.5-turbo-0125');
      
      // Determine max tokens based on model
      let maxTokens = 4096; // Safe default
      if (model.includes('gpt-4-32k')) {
        maxTokens = 8192;
      } else if (model.includes('gpt-4-turbo') || model.includes('gpt-4-1106') || model.includes('gpt-4-0125')) {
        maxTokens = 4096;
      } else if (model.includes('gpt-3.5-turbo-16k')) {
        maxTokens = 8192;
      } else if (model.includes('gpt-3.5')) {
        maxTokens = 4096;
      }
      
      const requestBody: any = {
        model,
        messages: [{
          role: 'system',
          content: 'You are an expert medical billing rule extraction system. Return only valid JSON.'
        }, {
          role: 'user',
          content: prompt
        }],
        temperature: 0.2,
        max_tokens: maxTokens
      };
      
      // Add JSON mode only if supported
      if (jsonMode && supportsJsonMode) {
        requestBody.response_format = { type: 'json_object' };
      }
      
      console.log('🔌 Calling OpenAI API:', {
        model,
        jsonMode: jsonMode && supportsJsonMode,
        maxTokens,
        promptLength: prompt.length
      });
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || response.statusText || 'Unknown error';
        console.error('OpenAI API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`OpenAI API error (${response.status}): ${errorMessage}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('Invalid OpenAI response structure:', data);
        throw new Error('Invalid response from OpenAI API');
      }
      
      return data.choices[0].message.content || '';
    } catch (error) {
      if (error instanceof Error) {
        console.error('OpenAI API call failed:', error.message);
      }
      throw error;
    }
  }

  /**
   * Call Anthropic
   */
  private static async callAnthropic(prompt: string, config: AIConfig): Promise<string> {
    const model = config.model || 'claude-3-opus-20240229';
    
    // Claude models support up to 4096 output tokens
    const maxTokens = 4096;
    
    console.log('🔌 Calling Anthropic API:', {
      model,
      maxTokens,
      promptLength: prompt.length
    });
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text || '';
  }

  /**
   * Call Gemini
   */
  private static async callGemini(prompt: string, config: AIConfig): Promise<string> {
    const model = config.model || 'gemini-pro';
    
    // Gemini models support up to 2048 output tokens
    const maxOutputTokens = 2048;
    
    console.log('🔌 Calling Gemini API:', {
      model,
      maxOutputTokens,
      promptLength: prompt.length
    });
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens,
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  /**
   * Generate client prefix suggestion using AI (via backend proxy)
   */
  static async suggestClientPrefix(organisationName: string): Promise<string> {
    const config = this.getConfig();
    
    if (!config.apiKey) {
      // Fallback to simple algorithm if AI not configured
      return this.generatePrefixFallback(organisationName);
    }

    try {
      console.log('🔌 Calling backend to generate prefix for:', organisationName);
      
      const response = await fetch(`${BACKEND_API_URL}/ai/generate-prefix`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: config.provider,
          model: config.model,
          organisationName: organisationName,
          apiKey: config.apiKey
        })
      });

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.prefix) {
        console.log('✅ Prefix generated via backend:', result.prefix);
        return result.prefix;
      }
      
      throw new Error('No prefix returned from backend');
    } catch (error) {
      console.error('❌ Failed to generate prefix via backend:', error);
      console.log('⚠️ Using fallback prefix generation');
      return this.generatePrefixFallback(organisationName);
    }
  }


  /**
   * Suggest prefix with OpenAI
   */
  private static async suggestPrefixOpenAI(prompt: string, config: AIConfig): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 10
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim().toUpperCase() || '';
  }

  /**
   * Suggest prefix with Anthropic
   */
  private static async suggestPrefixAnthropic(prompt: string, config: AIConfig): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    return data.content?.[0]?.text?.trim().toUpperCase() || '';
  }

  /**
   * Suggest prefix with Gemini
   */
  private static async suggestPrefixGemini(prompt: string, config: AIConfig): Promise<string> {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${config.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 10,
        }
      })
    });

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toUpperCase() || '';
  }

  /**
   * Fallback prefix generation (no AI)
   */
  private static generatePrefixFallback(organisationName: string): string {
    // Take first letters of each word, max 4 letters
    const words = organisationName.trim().split(/\s+/);
    let prefix = '';
    
    for (const word of words) {
      if (prefix.length >= 4) break;
      if (word.length > 0) {
        prefix += word[0].toUpperCase();
      }
    }
    
    // If still empty or too short, use first 2-4 chars
    if (prefix.length < 2) {
      prefix = organisationName.substring(0, Math.min(4, organisationName.length)).toUpperCase();
    }
    
    return prefix;
  }

}
