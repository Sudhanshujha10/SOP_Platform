/**
 * Bill Blaze Backend API Server
 * Handles all AI provider API calls to avoid CORS issues
 */

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const multer = require('multer');
const { extractText, segmentText } = require('./documentParser');
const { processDocumentDirect } = require('./directExtractionService');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.docx', '.doc', '.csv', '.txt'];
    const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
    
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not supported. Allowed: ${allowed.join(', ')}`));
    }
  }
});

// Store API keys (in production, use environment variables or secure key management)
let apiKeys = {
  openai: process.env.OPENAI_API_KEY || '',
  anthropic: process.env.ANTHROPIC_API_KEY || '',
  gemini: process.env.GEMINI_API_KEY || ''
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Bill Blaze API Server is running' });
});

// NEW: Direct extraction - process document directly to SOP rules
app.post('/api/documents/extract-direct', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }
    
    const { provider, model, apiKey, clientPrefix, uploadDate, lookupTables } = req.body;
    
    console.log('🚀 DIRECT EXTRACTION REQUEST:', {
      file: req.file.originalname,
      provider,
      model,
      clientPrefix,
      uploadDate,
      hasLookupTables: !!lookupTables
    });
    
    if (!provider || !model || !clientPrefix) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: provider, model, clientPrefix'
      });
    }
    
    const key = apiKey || apiKeys[provider];
    
    if (!key) {
      return res.status(400).json({
        success: false,
        error: `${provider} API key not configured`
      });
    }
    
    // Helper function to call AI
    const callAI = async (prompt, model, key) => {
      switch (provider) {
        case 'openai':
          return await callOpenAI(prompt, model, key, true);
        case 'anthropic':
          return await callAnthropic(prompt, model, key);
        case 'gemini':
          return await callGemini(prompt, model, key);
        default:
          throw new Error('Invalid provider');
      }
    };
    
    // Parse lookup tables if provided as JSON string
    let parsedLookupTables = null;
    if (lookupTables) {
      try {
        parsedLookupTables = typeof lookupTables === 'string' ? JSON.parse(lookupTables) : lookupTables;
        console.log('✅ Lookup tables parsed:', {
          codeGroups: parsedLookupTables.codeGroups?.length || 0,
          payerGroups: parsedLookupTables.payerGroups?.length || 0,
          providerGroups: parsedLookupTables.providerGroups?.length || 0
        });
      } catch (error) {
        console.error('⚠️ Failed to parse lookup tables:', error.message);
      }
    }
    
    // Process document directly
    const result = await processDocumentDirect(
      req.file,
      provider,
      model,
      key,
      clientPrefix,
      uploadDate || new Date().toISOString().split('T')[0],
      callAI,
      parsedLookupTables
    );
    
    console.log('✅ DIRECT EXTRACTION COMPLETE:', {
      rulesExtracted: result.rules.length,
      newTagsCreated: Object.values(result.newTags).flat().length
    });
    
    res.json({
      success: true,
      data: {
        rules: result.rules,
        newTags: result.newTags,
        fileName: req.file.originalname
      }
    });
    
  } catch (error) {
    console.error('❌ Direct extraction failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Direct extraction failed'
    });
  }
});

// OLD: Extract text from uploaded document (for backward compatibility)
app.post('/api/documents/extract', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }
    
    console.log('📥 File upload received:', {
      name: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size
    });
    
    // Extract text from file
    const text = await extractText(req.file);
    
    if (!text || text.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No text could be extracted from document. Please check file format.'
      });
    }
    
    // Segment text into rule candidates
    const segments = segmentText(text);
    
    console.log('✅ Document processed successfully:', {
      fileName: req.file.originalname,
      textLength: text.length,
      segmentCount: segments.length
    });
    
    res.json({
      success: true,
      data: {
        text: text,
        segments: segments,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        textLength: text.length,
        segmentCount: segments.length
      }
    });
    
  } catch (error) {
    console.error('❌ Document extraction failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Document extraction failed. Please ensure the file is a valid PDF, DOCX, CSV, or TXT file.'
    });
  }
});

// Configure API keys
app.post('/api/config/keys', (req, res) => {
  const { provider, apiKey } = req.body;
  
  if (!provider || !apiKey) {
    return res.status(400).json({ error: 'Provider and API key required' });
  }
  
  apiKeys[provider] = apiKey;
  res.json({ success: true, message: `${provider} API key configured` });
});

// Test AI provider connection
app.post('/api/ai/test', async (req, res) => {
  const { provider, apiKey } = req.body;
  
  try {
    let result;
    
    switch (provider) {
      case 'openai':
        result = await testOpenAI(apiKey);
        break;
      case 'anthropic':
        result = await testAnthropic(apiKey);
        break;
      case 'gemini':
        result = await testGemini(apiKey);
        break;
      default:
        return res.status(400).json({ error: 'Invalid provider' });
    }
    
    res.json({ success: true, message: 'Connection successful', result });
  } catch (error) {
    console.error('Connection test failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Connection test failed' 
    });
  }
});

// Generate client prefix
app.post('/api/ai/generate-prefix', async (req, res) => {
  const { provider, model, organisationName, apiKey } = req.body;
  
  console.log('🔧 Generate prefix request:', { provider, model, organisationName });
  
  try {
    const prompt = `Generate a 2-4 letter prefix code for this organization: "${organisationName}". Return ONLY the uppercase letters, no explanation.`;
    
    let prefix;
    const key = apiKey || apiKeys[provider];
    
    if (!key) {
      throw new Error(`${provider} API key not configured`);
    }
    
    switch (provider) {
      case 'openai':
        prefix = await callOpenAI(prompt, model, key, false);
        break;
      case 'anthropic':
        prefix = await callAnthropic(prompt, model, key);
        break;
      case 'gemini':
        prefix = await callGemini(prompt, model, key);
        break;
      default:
        throw new Error('Invalid provider');
    }
    
    // Clean up the response
    prefix = prefix.trim().toUpperCase().replace(/[^A-Z]/g, '').substring(0, 4);
    
    // Fallback if AI fails
    if (!prefix || prefix.length < 2) {
      prefix = generatePrefixFallback(organisationName);
    }
    
    console.log('✅ Generated prefix:', prefix);
    res.json({ success: true, prefix });
    
  } catch (error) {
    console.error('❌ Prefix generation failed:', error);
    
    // Fallback to manual generation
    const fallbackPrefix = generatePrefixFallback(organisationName);
    console.log('⚠️ Using fallback prefix:', fallbackPrefix);
    
    res.json({ 
      success: true, 
      prefix: fallbackPrefix,
      warning: 'Used fallback generation due to AI error'
    });
  }
});

// Helper function to sanitize text for JSON
function sanitizeTextForJSON(text) {
  if (!text) return '';
  
  // Remove control characters except newlines and tabs
  let sanitized = text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  // Normalize line endings
  sanitized = sanitized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Remove excessive whitespace
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n');
  
  // Trim
  sanitized = sanitized.trim();
  
  return sanitized;
}

// Helper function to chunk text if too large
function chunkText(text, maxLength = 15000) {
  if (text.length <= maxLength) {
    return [text];
  }
  
  const chunks = [];
  const paragraphs = text.split('\n\n');
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph).length > maxLength) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = paragraph;
      } else {
        // Paragraph itself is too long, split by sentences
        const sentences = paragraph.split('. ');
        for (const sentence of sentences) {
          if ((currentChunk + sentence).length > maxLength) {
            if (currentChunk) {
              chunks.push(currentChunk.trim());
            }
            currentChunk = sentence;
          } else {
            currentChunk += (currentChunk ? '. ' : '') + sentence;
          }
        }
      }
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// Convert document to structured JSON
app.post('/api/ai/convert-to-json', async (req, res) => {
  const { provider, model, text, apiKey } = req.body;
  
  console.log('📄 Convert to JSON request:', { provider, model, textLength: text?.length });
  
  try {
    // Validate input
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid text input. Please provide valid document text.' 
      });
    }
    
    // Sanitize text
    const sanitizedText = sanitizeTextForJSON(text);
    console.log('✅ Text sanitized. Length:', sanitizedText.length);
    
    if (sanitizedText.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Document text is empty after sanitization. Please check file format.' 
      });
    }
    
    // Check if text needs chunking
    const chunks = chunkText(sanitizedText, 15000);
    console.log(`📊 Text split into ${chunks.length} chunk(s)`);
    
    // Process first chunk (or combine results if multiple chunks)
    const textToProcess = chunks[0]; // For now, process first chunk
    
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
${textToProcess}

Return ONLY valid JSON. No markdown, no explanations.`;

    const key = apiKey || apiKeys[provider];
    
    if (!key) {
      return res.status(400).json({ 
        success: false, 
        error: `${provider} API key not configured. Please configure in Settings.` 
      });
    }
    
    let response;
    
    try {
      switch (provider) {
        case 'openai':
          response = await callOpenAI(prompt, model, key, true);
          break;
        case 'anthropic':
          response = await callAnthropic(prompt, model, key);
          break;
        case 'gemini':
          response = await callGemini(prompt, model, key);
          break;
        default:
          return res.status(400).json({ 
            success: false, 
            error: 'Invalid AI provider specified' 
          });
      }
    } catch (aiError) {
      console.error('❌ AI provider call failed:', aiError);
      return res.status(500).json({ 
        success: false, 
        error: `AI provider error: ${aiError.message}. Please check your API key and try again.` 
      });
    }
    
    // Validate and parse response
    let structuredJSON;
    try {
      // Clean response (remove markdown code blocks if present)
      let cleanedResponse = response.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
      }
      
      structuredJSON = JSON.parse(cleanedResponse);
      
      // Validate structure
      if (!structuredJSON.sections || !Array.isArray(structuredJSON.sections)) {
        throw new Error('Invalid JSON structure: missing sections array');
      }
      
      console.log('✅ JSON conversion successful');
      console.log(`   - Sections: ${structuredJSON.sections.length}`);
      console.log(`   - Codes: ${structuredJSON.all_codes?.length || 0}`);
      console.log(`   - Payers: ${structuredJSON.all_payers?.length || 0}`);
      
    } catch (parseError) {
      console.error('❌ Failed to parse AI response as JSON:', parseError);
      console.error('Raw response:', response.substring(0, 500));
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to parse document structure. The AI response was not valid JSON. Please try again or use a different document format.' 
      });
    }
    
    res.json({ success: true, data: structuredJSON });
    
  } catch (error) {
    console.error('❌ JSON conversion failed:', error);
    res.status(500).json({ 
      success: false, 
      error: `Document parsing failed: ${error.message}. Please check your file format and try again.` 
    });
  }
});

// Extract rule candidates from JSON (processes EACH section through LLM)
app.post('/api/ai/extract-candidates', async (req, res) => {
  const { provider, model, structuredJSON, apiKey } = req.body;
  
  console.log('🔍 Extract candidates request:', { provider, model });
  console.log('📊 Sections to process:', structuredJSON.sections?.length || 0);
  
  try {
    const key = apiKey || apiKeys[provider];
    
    if (!key) {
      return res.status(400).json({ 
        success: false, 
        error: `${provider} API key not configured. Please configure in Settings.` 
      });
    }
    
    const allCandidates = [];
    const sections = structuredJSON.sections || [];
    
    console.log('🔍 DEBUG: Starting section processing');
    console.log(`   - Total sections: ${sections.length}`);
    console.log(`   - API Key present: ${!!key}`);
    console.log(`   - Provider: ${provider}`);
    console.log(`   - Model: ${model}`);
    
    if (sections.length === 0) {
      console.warn('⚠️ WARNING: No sections found in structuredJSON');
      return res.json({ 
        success: true, 
        data: [],
        warning: 'No sections found in document structure'
      });
    }
    
    // Process EACH section through the LLM
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🔍 Processing section ${i + 1}/${sections.length}`);
      console.log(`   - Title: "${section.section_title || 'Untitled'}"`);
      console.log(`   - Content length: ${section.content?.length || 0} chars`);
      console.log(`   - Codes mentioned: ${section.codes_mentioned?.length || 0}`);
      console.log(`   - Payers mentioned: ${section.payers_mentioned?.length || 0}`);
      
      const prompt = `You are an expert medical billing SOP rule extraction system. Extract ALL billing rules from this policy section and return them as a JSON array.

SECTION ${i + 1}/${sections.length}: ${section.section_title || 'Untitled'}

SECTION TITLE: ${section.section_title || 'Untitled'}

SECTION CONTENT:
${section.content}

CODES MENTIONED: ${section.codes_mentioned?.join(', ') || 'None'}
PAYERS MENTIONED: ${section.payers_mentioned?.join(', ') || 'None'}
ACTIONS MENTIONED: ${section.actions_mentioned?.join(', ') || 'None'}
DATES MENTIONED: ${section.dates_mentioned?.join(', ') || 'None'}
REFERENCES: ${section.references?.join(', ') || 'None'}

INSTRUCTIONS:
Extract EVERY distinct billing rule from this section. For each rule, create a candidate object with:

{
  "codes": "procedure/diagnosis codes or code groups mentioned",
  "payers": "insurance companies or payer groups mentioned",
  "providers": "provider types mentioned (or 'All Providers' if not specified)",
  "action_description": "what action to take (add modifier, require auth, remove code, bundle, etc.)",
  "conditions": "when this rule applies (conditions, triggers)",
  "effective_date": "YYYY-MM-DD format if mentioned, or null",
  "end_date": "YYYY-MM-DD format if mentioned, or null",
  "reference": "source reference from document",
  "documentation_trigger": "keywords for documentation requirements"
}

IMPORTANT:
- Extract ALL rules, even if partially described
- If a field is not mentioned, use null or empty string
- Be generous - extract anything that looks like a billing rule
- Multiple rules per section are expected
- If no clear rules, return empty array

Return ONLY a JSON array of rule candidate objects. No markdown, no explanations.

Example:
[
  {
    "codes": "99201-99215",
    "payers": "Medicare, Medicaid",
    "providers": "Physicians",
    "action_description": "Add modifier 25",
    "conditions": "E&M with minor procedure same day",
    "effective_date": "2024-01-01",
    "end_date": null,
    "reference": "Section 4.2",
    "documentation_trigger": "E&M;minor procedure;same day"
  }
]`;

      try {
        console.log(`   📤 Sending to ${provider} LLM...`);
        console.log(`   📏 Prompt length: ${prompt.length} chars`);
        
        // Call LLM for this section
        let response;
        const startTime = Date.now();
        
        switch (provider) {
          case 'openai':
            response = await callOpenAI(prompt, model, key, true);
            break;
          case 'anthropic':
            response = await callAnthropic(prompt, model, key);
            break;
          case 'gemini':
            response = await callGemini(prompt, model, key);
            break;
          default:
            throw new Error('Invalid provider');
        }
        
        const elapsed = Date.now() - startTime;
        console.log(`   📥 LLM response received (${elapsed}ms)`);
        console.log(`   📏 Response length: ${response?.length || 0} chars`);
        
        if (!response || response.trim().length === 0) {
          console.error(`   ❌ Empty response from LLM`);
          continue;
        }
        
        // Parse response
        console.log(`   🔍 Parsing LLM response...`);
        console.log(`   📄 Raw response preview: ${response.substring(0, 200)}...`);
        
        let cleanedResponse = response.trim();
        if (cleanedResponse.startsWith('```json')) {
          cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
          console.log(`   🧹 Removed markdown code blocks`);
        } else if (cleanedResponse.startsWith('```')) {
          cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
          console.log(`   🧹 Removed markdown code blocks`);
        }
        
        let sectionCandidates;
        try {
          sectionCandidates = JSON.parse(cleanedResponse);
          console.log(`   ✅ Successfully parsed JSON`);
        } catch (parseError) {
          console.error(`   ❌ JSON parse error:`, parseError.message);
          console.error(`   📄 Failed to parse: ${cleanedResponse.substring(0, 500)}`);
          continue;
        }
        
        if (!Array.isArray(sectionCandidates)) {
          console.error(`   ❌ Response is not an array:`, typeof sectionCandidates);
          console.error(`   📄 Response:`, JSON.stringify(sectionCandidates).substring(0, 200));
          continue;
        }
        
        if (sectionCandidates.length > 0) {
          console.log(`   ✅ Extracted ${sectionCandidates.length} candidate(s) from this section`);
          console.log(`   📋 Candidates:`, JSON.stringify(sectionCandidates, null, 2).substring(0, 500));
          allCandidates.push(...sectionCandidates);
        } else {
          console.log(`   ⚠️ No candidates found in this section (empty array returned)`);
        }
        
      } catch (sectionError) {
        console.error(`   ❌ Failed to process section ${i + 1}:`);
        console.error(`   📛 Error type: ${sectionError.name}`);
        console.error(`   📛 Error message: ${sectionError.message}`);
        console.error(`   📛 Stack trace:`, sectionError.stack);
        // Continue with next section instead of failing completely
      }
    }
    
    console.log(`\n📊 TOTAL CANDIDATES EXTRACTED: ${allCandidates.length}`);
    
    if (allCandidates.length === 0) {
      console.warn('⚠️ No rule candidates extracted from any section');
    }
    
    res.json({ success: true, data: allCandidates });
    
  } catch (error) {
    console.error('❌ Candidate extraction failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Candidate extraction failed' 
    });
  }
});

// Normalize rule candidate
app.post('/api/ai/normalize-rule', async (req, res) => {
  const { provider, model, candidate, clientPrefix, lookupTables, ruleIndex, apiKey, uploadDate, fileName } = req.body;
  
  console.log('🔄 Normalize rule request:', { provider, model, ruleIndex });
  
  try {
    const category = generateCategory(candidate);
    const ruleId = `${clientPrefix}-${category}-${String(ruleIndex + 1).padStart(4, '0')}`;
    
    // Use upload date or current date for effective_date if not in candidate
    const effectiveDate = candidate.effective_date || uploadDate || new Date().toISOString().split('T')[0];
    
    // Use file name for reference if not in candidate
    const reference = candidate.reference || fileName || 'Uploaded document';
    
    const prompt = `Normalize this rule candidate to the SOP schema. You can use existing lookup table values OR create new tags if needed.

LOOKUP TABLES (existing tags):
${JSON.stringify(lookupTables, null, 2)}

RULE CANDIDATE:
${JSON.stringify(candidate, null, 2)}

IMPORTANT INSTRUCTIONS:
1. **Use existing tags from lookup tables when they match the rule's intent**
2. **Create NEW tags if the rule requires values not in lookup tables**:
   - For payers: Create @PAYER_NAME tags (e.g., @CIGNA, @AETNA, @HUMANA)
   - For providers: Create @PROVIDER_TYPE tags (e.g., @PHYSICIAN_NP, @THERAPIST_PT)
   - For code groups: Create @CODE_GROUP tags (e.g., @CARDIO_STRESS, @ECHO_COMPLETE)
   - For actions: Create @ACTION tags (e.g., @REQUIRE_AUTH, @ADD_MODIFIER)
   - For chart sections: Use existing or create new (e.g., CARDIAC_NOTES, PROCEDURE_DOCUMENTATION)

3. **Description pattern** (MUST follow exactly):
   "For @PAYER_GROUP payers, @ACTION(@item) when <condition>; the @CHART_SECTION must include \"<keywords>\"."
   
   Example: "For @MEDICARE|@MEDICAID payers, @REQUIRE_AUTH for @ECHO_CODES when ordered for routine screening; the DIAGNOSTIC_TESTS section must include \"medical necessity documented\"."

4. **Field requirements**:
   - rule_id: "${ruleId}"
   - code: Use @CODE_GROUP or specific codes
   - code_group: The @CODE_GROUP name (create if new)
   - codes_selected: Array of codes for SWAP/CONDITIONAL actions (empty array if not applicable)
   - action: @ACTION(@modifier) format
   - payer_group: @PAYER|@PAYER format (pipe-separated)
   - provider_group: @PROVIDER format
   - description: Single sentence with inline @tags, ending with period
   - documentation_trigger: Semicolon-separated keywords
   - chart_section: Section name (UPPERCASE_WITH_UNDERSCORES)
   - effective_date: "${effectiveDate}"
   - end_date: "" (empty string if not specified)
   - reference: "${reference}"
   - modifiers: Array of modifiers like ["@25", "@52"] or empty array

5. **New tags format**:
   - Payer tags: @INSURANCE_NAME (e.g., @BLUE_CROSS, @UNITED_HEALTHCARE)
   - Provider tags: @SPECIALTY_CREDENTIAL (e.g., @PHYSICIAN_MD_DO, @NP_PA)
   - Code group tags: @DESCRIPTIVE_NAME (e.g., @E&M_MINOR_PROC, @ECHO_CODES)
   - Action tags: @ACTION_NAME (e.g., @ADD, @REMOVE, @REQUIRE_AUTH)

6. **Return format**:
{
  "rule": {
    "rule_id": "${ruleId}",
    "code": "...",
    "code_group": "...",
    "codes_selected": [...],
    "action": "...",
    "payer_group": "...",
    "provider_group": "...",
    "description": "...",
    "documentation_trigger": "...",
    "chart_section": "...",
    "effective_date": "${effectiveDate}",
    "end_date": "",
    "reference": "${reference}",
    "modifiers": [...]
  },
  "new_tags": {
    "payers": ["@NEW_PAYER1", "@NEW_PAYER2"],
    "providers": ["@NEW_PROVIDER1"],
    "code_groups": ["@NEW_CODE_GROUP1"],
    "actions": ["@NEW_ACTION1"],
    "chart_sections": ["NEW_SECTION1"]
  }
}

Return ONLY valid JSON. No markdown, no explanations.`;

    const key = apiKey || apiKeys[provider];
    
    if (!key) {
      throw new Error(`${provider} API key not configured`);
    }
    
    let response;
    
    switch (provider) {
      case 'openai':
        response = await callOpenAI(prompt, model, key, true);
        break;
      case 'anthropic':
        response = await callAnthropic(prompt, model, key);
        break;
      case 'gemini':
        response = await callGemini(prompt, model, key);
        break;
      default:
        throw new Error('Invalid provider');
    }
    
    const result = JSON.parse(response);
    
    // Handle both old format (direct rule) and new format (rule + new_tags)
    let normalizedRule;
    let newTags = {};
    
    if (result.rule) {
      // New format with new_tags
      normalizedRule = result.rule;
      newTags = result.new_tags || {};
      console.log('✅ Rule normalized:', normalizedRule.rule_id);
      
      if (Object.keys(newTags).length > 0) {
        console.log('🆕 New tags created:');
        if (newTags.payers?.length) console.log('   - Payers:', newTags.payers.join(', '));
        if (newTags.providers?.length) console.log('   - Providers:', newTags.providers.join(', '));
        if (newTags.code_groups?.length) console.log('   - Code Groups:', newTags.code_groups.join(', '));
        if (newTags.actions?.length) console.log('   - Actions:', newTags.actions.join(', '));
        if (newTags.chart_sections?.length) console.log('   - Chart Sections:', newTags.chart_sections.join(', '));
      }
    } else {
      // Old format (backward compatibility)
      normalizedRule = result;
      console.log('✅ Rule normalized:', normalizedRule.rule_id);
    }
    
    res.json({ 
      success: true, 
      data: normalizedRule,
      new_tags: newTags
    });
    
  } catch (error) {
    console.error('❌ Rule normalization failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Rule normalization failed' 
    });
  }
});

// ==================== AI PROVIDER FUNCTIONS ====================

async function callOpenAI(prompt, model, apiKey, jsonMode) {
  const supportsJsonMode = model.includes('gpt-4') || model.includes('gpt-3.5-turbo-1106') || model.includes('gpt-3.5-turbo-0125');
  
  let maxTokens = 4096;
  if (model.includes('gpt-4-32k')) maxTokens = 8192;
  else if (model.includes('gpt-3.5-turbo-16k')) maxTokens = 8192;
  
  const requestBody = {
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
  
  if (jsonMode && supportsJsonMode) {
    requestBody.response_format = { type: 'json_object' };
  }
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

async function callAnthropic(prompt, model, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Anthropic API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.content[0].text;
}

async function callGemini(prompt, model, apiKey) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
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
          maxOutputTokens: 2048,
        }
      })
    }
  );
  
  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// Test functions
async function testOpenAI(apiKey) {
  return await callOpenAI('Say "test successful"', 'gpt-3.5-turbo', apiKey, false);
}

async function testAnthropic(apiKey) {
  return await callAnthropic('Say "test successful"', 'claude-3-haiku-20240307', apiKey);
}

async function testGemini(apiKey) {
  return await callGemini('Say "test successful"', 'gemini-pro', apiKey);
}

// Helper functions
function generatePrefixFallback(organisationName) {
  const words = organisationName.trim().split(/\s+/);
  let prefix = '';
  
  for (const word of words) {
    if (prefix.length >= 4) break;
    if (word.length > 0) {
      prefix += word[0].toUpperCase();
    }
  }
  
  if (prefix.length < 2) {
    prefix = organisationName.substring(0, Math.min(4, organisationName.length)).toUpperCase();
  }
  
  return prefix;
}

function generateCategory(candidate) {
  const actionDesc = (candidate.action_description || '').toLowerCase();
  
  if (actionDesc.includes('modifier')) return 'MOD';
  if (actionDesc.includes('authorization') || actionDesc.includes('auth')) return 'AUTH';
  if (actionDesc.includes('bundle') || actionDesc.includes('remove')) return 'BUNDLE';
  if (actionDesc.includes('add code') || actionDesc.includes('append')) return 'ADD';
  if (actionDesc.includes('swap') || actionDesc.includes('replace')) return 'SWAP';
  if (actionDesc.includes('deny') || actionDesc.includes('reject')) return 'DENY';
  
  return 'RULE';
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Bill Blaze API Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});
