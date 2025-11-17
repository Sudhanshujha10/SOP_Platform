/**
 * Direct Extraction Service
 * Processes each row/paragraph directly through LLM with full schema
 * No intermediate JSON conversion - straight to SOP rules
 */

const { extractText, segmentText } = require('./documentParser');
const { buildExtractionPrompt } = require('./promptLoader');

/**
 * Process document directly - extract rules from each segment
 */
async function processDocumentDirect(file, provider, model, apiKey, clientPrefix, uploadDate, callAIFunction, lookupTables = null) {
  console.log('🚀 DIRECT EXTRACTION PIPELINE STARTED');
  console.log(`   - File: ${file.originalname}`);
  console.log(`   - Provider: ${provider}`);
  console.log(`   - Client Prefix: ${clientPrefix}`);
  
  if (lookupTables) {
    console.log(`   - Lookup Tables: ${lookupTables.codeGroups?.length || 0} code groups, ${lookupTables.payerGroups?.length || 0} payer groups`);
  } else {
    console.log(`   - Lookup Tables: None provided (will use empty lookup tables)`);
  }
  
  // Step 1: Extract text from document
  console.log('\n📄 STEP 1: Extracting text from document...');
  const text = await extractText(file);
  console.log(`   ✅ Extracted ${text.length} characters`);
  
  // Step 2: Segment into paragraphs/rows
  console.log('\n📊 STEP 2: Segmenting text into processable chunks...');
  const segments = segmentText(text);
  console.log(`   ✅ Created ${segments.length} segments`);
  
  // Step 3: Process each segment directly through LLM
  console.log('\n🤖 STEP 3: Processing each segment through LLM...');
  const allRules = [];
  const allNewTags = {
    code_groups: new Set(),
    payer_groups: new Set(),
    provider_groups: new Set(),
    actions: new Set(),
    chart_sections: new Set()
  };
  
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🔍 Processing segment ${i + 1}/${segments.length}`);
    console.log(`   📏 Length: ${segment.length} chars`);
    console.log(`   📄 Preview: ${segment.substring(0, 100)}...`);
    
    try {
      const rule = await extractRuleFromSegment(
        segment,
        i,
        clientPrefix,
        uploadDate,
        file.originalname,
        provider,
        model,
        apiKey,
        callAIFunction,
        lookupTables
      );
      
      if (rule) {
        console.log(`   ✅ Rule extracted: ${rule.rule_id}`);
        allRules.push(rule);
        
        // Track new tags
        if (rule.new_tags) {
          if (rule.new_tags.code_groups) rule.new_tags.code_groups.forEach(t => allNewTags.code_groups.add(t));
          if (rule.new_tags.payer_groups) rule.new_tags.payer_groups.forEach(t => allNewTags.payer_groups.add(t));
          if (rule.new_tags.provider_groups) rule.new_tags.provider_groups.forEach(t => allNewTags.provider_groups.add(t));
          if (rule.new_tags.actions) rule.new_tags.actions.forEach(t => allNewTags.actions.add(t));
          if (rule.new_tags.chart_sections) rule.new_tags.chart_sections.forEach(t => allNewTags.chart_sections.add(t));
        }
      } else {
        console.log(`   ⚠️ No rule found in this segment`);
      }
      
    } catch (error) {
      console.error(`   ❌ Failed to process segment ${i + 1}:`, error.message);
      // Continue with next segment
    }
  }
  
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📊 EXTRACTION COMPLETE`);
  console.log(`   ✅ Total rules extracted: ${allRules.length}`);
  console.log(`   🆕 New tags created: ${
    allNewTags.code_groups.size + 
    allNewTags.payer_groups.size + 
    allNewTags.provider_groups.size + 
    allNewTags.actions.size + 
    allNewTags.chart_sections.size
  }`);
  
  if (allNewTags.code_groups.size > 0) {
    console.log(`      - Code groups: ${Array.from(allNewTags.code_groups).join(', ')}`);
  }
  if (allNewTags.payer_groups.size > 0) {
    console.log(`      - Payer groups: ${Array.from(allNewTags.payer_groups).join(', ')}`);
  }
  if (allNewTags.provider_groups.size > 0) {
    console.log(`      - Provider groups: ${Array.from(allNewTags.provider_groups).join(', ')}`);
  }
  if (allNewTags.actions.size > 0) {
    console.log(`      - Actions: ${Array.from(allNewTags.actions).join(', ')}`);
  }
  if (allNewTags.chart_sections.size > 0) {
    console.log(`      - Chart sections: ${Array.from(allNewTags.chart_sections).join(', ')}`);
  }
  
  return {
    rules: allRules,
    newTags: {
      code_groups: Array.from(allNewTags.code_groups),
      payer_groups: Array.from(allNewTags.payer_groups),
      provider_groups: Array.from(allNewTags.provider_groups),
      actions: Array.from(allNewTags.actions),
      chart_sections: Array.from(allNewTags.chart_sections)
    }
  };
}

/**
 * Extract a single SOP rule from a text segment
 */
async function extractRuleFromSegment(segment, index, clientPrefix, uploadDate, fileName, provider, model, apiKey, callAIFunction, lookupTables = null) {
  // Use the AI_PROMPT_TEMPLATE.md with lookup tables
  const prompt = buildExtractionPrompt(
    segment,
    index,
    clientPrefix,
    uploadDate,
    fileName,
    lookupTables
  );

  console.log(`   📤 Sending to ${provider} LLM...`);
  const startTime = Date.now();
  
  const response = await callAIFunction(prompt, model, apiKey);
  
  const elapsed = Date.now() - startTime;
  console.log(`   📥 Response received (${elapsed}ms)`);
  
  // Parse response
  let cleanedResponse = response.trim();
  if (cleanedResponse.startsWith('```json')) {
    cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
  } else if (cleanedResponse.startsWith('```')) {
    cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
  }
  
  const result = JSON.parse(cleanedResponse);
  
  if (!result.rule) {
    return null;
  }
  
  // Add metadata
  const timestamp = new Date().toISOString();
  result.rule.status = 'pending';
  result.rule.confidence = 85;
  result.rule.source = 'ai';
  result.rule.validation_status = 'valid';
  result.rule.created_by = 'AI Direct Extraction';
  result.rule.created_at = timestamp;
  result.rule.updated_at = timestamp;
  result.rule.last_modified = timestamp;
  result.rule.version = 1;
  result.rule.new_tags = result.new_tags;
  
  return result.rule;
}

module.exports = {
  processDocumentDirect
};
