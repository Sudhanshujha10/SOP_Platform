/**
 * Prompt Loader Service
 * Loads and processes the AI_PROMPT_TEMPLATE.md file
 */

const fs = require('fs');
const path = require('path');

/**
 * Load the AI prompt template from AI_PROMPT_TEMPLATE.md
 * @returns {string} The complete prompt template
 */
function loadPromptTemplate() {
  try {
    const templatePath = path.join(__dirname, '..', 'AI_PROMPT_TEMPLATE.md');
    const template = fs.readFileSync(templatePath, 'utf8');
    console.log('✅ Loaded AI_PROMPT_TEMPLATE.md');
    return template;
  } catch (error) {
    console.error('❌ Failed to load AI_PROMPT_TEMPLATE.md:', error.message);
    throw new Error('Could not load AI prompt template');
  }
}

/**
 * Build a complete prompt for rule extraction from a segment
 * @param {string} segment - The text segment to process
 * @param {number} index - The segment index
 * @param {string} clientPrefix - Client prefix for rule IDs
 * @param {string} uploadDate - Upload date for effective_date
 * @param {string} fileName - Source file name for reference
 * @param {object} lookupTables - Lookup tables (code groups, payer groups, etc.)
 * @returns {string} Complete prompt
 */
function buildExtractionPrompt(segment, index, clientPrefix, uploadDate, fileName, lookupTables = null) {
  const template = loadPromptTemplate();
  
  // Replace placeholders in template
  let prompt = template
    .replace('{DOCUMENT_CONTENT}', segment)
    .replace('{CLIENT_PREFIX}', clientPrefix)
    .replace('{UPLOAD_DATE}', uploadDate)
    .replace('{FILE_NAME}', fileName)
    .replace('{SEGMENT_INDEX}', String(index + 1).padStart(4, '0'));
  
  // If lookup tables provided, inject them
  if (lookupTables) {
    if (lookupTables.codeGroups) {
      prompt = prompt.replace('{CODE_GROUPS_JSON}', JSON.stringify(lookupTables.codeGroups, null, 2));
    }
    if (lookupTables.payerGroups) {
      prompt = prompt.replace('{PAYER_GROUPS_JSON}', JSON.stringify(lookupTables.payerGroups, null, 2));
    }
    if (lookupTables.providerGroups) {
      prompt = prompt.replace('{PROVIDER_GROUPS_JSON}', JSON.stringify(lookupTables.providerGroups, null, 2));
    }
    if (lookupTables.actionTags) {
      prompt = prompt.replace('{ACTION_TAGS_JSON}', JSON.stringify(lookupTables.actionTags, null, 2));
    }
    if (lookupTables.chartSections) {
      prompt = prompt.replace('{CHART_SECTIONS_JSON}', JSON.stringify(lookupTables.chartSections, null, 2));
    }
  } else {
    // If no lookup tables provided, use empty arrays
    prompt = prompt
      .replace('{CODE_GROUPS_JSON}', '[]')
      .replace('{PAYER_GROUPS_JSON}', '[]')
      .replace('{PROVIDER_GROUPS_JSON}', '[]')
      .replace('{ACTION_TAGS_JSON}', '[]')
      .replace('{CHART_SECTIONS_JSON}', '[]');
  }
  
  // Add segment-specific instructions at the end
  prompt += `

## CURRENT SEGMENT PROCESSING

**Segment ${index + 1}:**
\`\`\`
${segment}
\`\`\`

**⚠️ IMPORTANT: Extract ONLY ONE RULE from this segment**

If this segment contains text describing multiple rules (e.g., "For X payers do Y. For Z payers do W."):
- Extract ONLY the FIRST complete rule you encounter
- Create ONE description following the format: "For @PAYER payers @ACTION(@item) when <trigger>; the @CHART_SECTION must include "<keywords>"."
- DO NOT include other rules in the description
- DO NOT write multiple sentences
- The other rules will be extracted in subsequent processing passes

**Generate rule_id as:** ${clientPrefix}-[CATEGORY]-${String(index + 1).padStart(4, '0')}
- CATEGORY options: MOD (modifier), AUTH (authorization), BUNDLE, ADD, REMOVE, SWAP, COND (conditional), LINK, NEVER

**Use effective_date:** ${uploadDate}

**Use reference:** "${fileName}" or "${fileName} p. [page]" if page mentioned

## ⚠️ CRITICAL EXTRACTION REQUIREMENTS - NO EXCEPTIONS

**YOU MUST EXTRACT:**
1. ✅ **EVERY CODE** mentioned in this segment (CPT, HCPCS, ICD-10, modifiers)
2. ✅ **COMPLETE DESCRIPTION** - Do not truncate or summarize, capture the full rule logic
3. ✅ **ALL CONDITIONS** - Extract every "if", "when", "for", conditional statement
4. ✅ **EVERY ACTION** - Do not skip any add/remove/swap/link instructions
5. ✅ **ALL DOCUMENTATION TRIGGERS** - Capture every keyword that triggers the rule

**DO NOT:**
- ❌ Skip rules because they seem similar to existing ones (de-duplication happens later)
- ❌ Truncate descriptions to save space
- ❌ Omit codes because they're already in lookup table
- ❌ Skip conditions because they seem obvious
- ❌ Combine multiple rules into one

**EXTRACTION PHILOSOPHY:**
- Extract EVERYTHING, let the system handle de-duplication
- Better to extract too much than miss anything
- Every sentence with billing implications = potential rule
- If unsure whether something is a rule, EXTRACT IT

## ⚠️ DESCRIPTION FORMAT - MANDATORY

**The description field MUST follow this EXACT format:**

\`\`\`
For @PAYER_GROUP payers @ACTION(@item) when <trigger>; the @CHART_SECTION must include "<keywords>".
\`\`\`

**⚠️ CRITICAL: CREATE SEPARATE RULES**

If you see text with multiple conditions like:
- "For X payers do Y. For Z payers do W."
- "When condition A do X. When condition B do Y."
- Different payers with different rules

**YOU MUST create SEPARATE rule objects** - DO NOT combine them into one description!

**Examples:**
\`\`\`
For @ALL payers @ADD(@51798) when post-voiding residual is measured using ultrasound; the @PROCEDURE_SECTION must include "PVR measurement".

For @COMMERCIAL_PPO payers @COND_ADD(@99417) when total visit time exceeds the level-5 threshold; the @TIME_ATTEST_SECTION must include "Total time documented".

For @ALL payers @ADD(@J1644) and @REMOVE(@51700) when hydrodistension is documented; the @PROCEDURE_SECTION must include "IC treatment".
\`\`\`

**CRITICAL RULES:**
- ✅ ONE sentence only - No paragraphs or multiple sentences
- ✅ ONE rule per condition - Create separate rules for different conditions
- ✅ @ACTION immediately after payers - Don't use "if...then" format
- ✅ Use "when" for trigger - Not "if" or "in case of"
- ✅ Use semicolon before chart section - Separates trigger from requirement
- ✅ Use "must include" with quoted keywords - Exact phrase to search
- ✅ Chain actions with "and" or "then" - ONLY for same condition
- ✅ Lowercase trigger text - Unless quoting exact documentation
- ❌ NEVER combine multiple payers with different conditions
- ❌ NEVER write multiple sentences in one description
- ❌ NEVER use "if...then" format - Use "when...must include"
- ❌ NEVER omit keyword quotes - Always quote the search phrase

## RESPONSE FORMAT

Return ONLY valid JSON in this exact format:

\`\`\`json
{
  "rule": {
    "rule_id": "...",
    "code": "...",
    "code_group": "...",
    "codes_selected": [...],
    "action": "...",
    "payer_group": "...",
    "provider_group": "...",
    "description": "...",
    "documentation_trigger": "...",
    "chart_section": "...",
    "effective_date": "...",
    "end_date": "",
    "reference": "..."
  },
  "new_tags": {
    "code_groups": [],
    "payer_groups": [],
    "provider_groups": [],
    "actions": [],
    "chart_sections": []
  }
}
\`\`\`

If this segment does NOT contain a billing rule, return:
\`\`\`json
{
  "rule": null,
  "new_tags": null
}
\`\`\`

Return ONLY valid JSON. No markdown code blocks, no explanations, no additional text.`;

  return prompt;
}

module.exports = {
  loadPromptTemplate,
  buildExtractionPrompt
};
