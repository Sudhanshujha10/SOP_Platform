# Lookup Table First - Complete Implementation Guide

## Overview

This document describes the complete implementation of the **Lookup Table First** logic for SOP document processing. Every entity extraction MUST follow this strict order: Check lookup table → Use existing → Create only if missing.

---

## Architecture

### Components Created

1. **LLM_PROCESSING_RULES.md** - Detailed rules for AI/LLM processing
2. **AI_PROMPT_TEMPLATE.md** - Ready-to-use prompt template for any LLM
3. **lookupMatchingService.ts** - Fuzzy matching service with 4-tier priority
4. **tagValidationService.ts** - Tag validation and auto-creation (already exists)
5. **documentProcessingService.ts** - Document processing workflow (already exists)

---

## Processing Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. DOCUMENT UPLOAD                                          │
│    User uploads SOP document (e.g., POS 11 SOP)            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. AI/LLM EXTRACTION                                        │
│    - Parse document content                                 │
│    - Identify entities (payers, procedures, actions, etc.)  │
│    - Extract rule candidates                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. LOOKUP TABLE MATCHING (MANDATORY)                        │
│    For EACH entity:                                         │
│    ┌──────────────────────────────────────────────────┐    │
│    │ Priority 1: EXACT MATCH (confidence: 1.0)        │    │
│    │ ↓                                                 │    │
│    │ Priority 2: SEMANTIC MATCH (confidence: 0.85+)   │    │
│    │ ↓                                                 │    │
│    │ Priority 3: KEYWORD MATCH (confidence: 0.60+)    │    │
│    │ ↓                                                 │    │
│    │ Priority 4: CODE OVERLAP (confidence: 0.50+)     │    │
│    │ ↓                                                 │    │
│    │ No Match: CREATE NEW (confidence > 0.8)          │    │
│    └──────────────────────────────────────────────────┘    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. CODE EXPANSION                                           │
│    - Expand code group tags to ALL codes                    │
│    - Populate rule.code with expanded codes                 │
│    - Example: @E&M_MINOR_PROC → 99202,99203,...,99215      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. RULE GENERATION                                          │
│    - Create rule with tags in description                   │
│    - All tags reference lookup table entries                │
│    - All codes expanded from code groups                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. VALIDATION                                               │
│    - Verify all tags exist in lookup table                  │
│    - Check code expansion completed                         │
│    - Validate no duplicates created                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. DISPLAY WITH BADGES                                      │
│    - Render all tags as colored badges                      │
│    - Display codes as chips                                 │
│    - Show validation status                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Matching Logic Details

### Priority 1: Exact Match (Confidence: 1.0)

**When**: Document text exactly matches lookup table entry

**Example**:
```
Document: "Office E&M visits with minor procedures"
Lookup:   purpose: "Office E&M visits with minor procedures"
Result:   EXACT MATCH → Use @E&M_MINOR_PROC
```

**Code**:
```typescript
const cleanText = documentText.toLowerCase().trim();
for (const codeGroup of lookupTables.codeGroups) {
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
```

### Priority 2: Semantic Match (Confidence: 0.85-0.99)

**When**: Document text has same meaning but different wording

**Example**:
```
Document: "E&M office visits including minor procedures"
Lookup:   purpose: "Office E&M visits with minor procedures"
Result:   SEMANTIC MATCH → Use @E&M_MINOR_PROC
```

**Code**:
```typescript
for (const codeGroup of lookupTables.codeGroups) {
  const similarity = calculateSemanticSimilarity(
    cleanText, 
    codeGroup.purpose.toLowerCase()
  );
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
```

### Priority 3: Keyword Match (Confidence: 0.60-0.84)

**When**: Document text shares significant keywords

**Example**:
```
Document: "Office evaluation and management with procedures"
Lookup:   purpose: "Office E&M visits with minor procedures"
Keywords: ["office", "procedures"] match
Result:   KEYWORD MATCH → Use @E&M_MINOR_PROC
```

**Code**:
```typescript
const keywords = extractKeywords(cleanText);
for (const codeGroup of lookupTables.codeGroups) {
  const purposeKeywords = extractKeywords(codeGroup.purpose.toLowerCase());
  const matchScore = calculateKeywordOverlap(keywords, purposeKeywords);
  
  if (matchScore > 0.6) {
    return {
      matched: true,
      tag: codeGroup.tag,
      matchType: 'KEYWORD',
      confidence: matchScore,
      expandedCodes: codeGroup.expands_to
    };
  }
}
```

### Priority 4: Code Overlap Match (Confidence: 0.50-0.79)

**When**: Document mentions codes that overlap with code group

**Example**:
```
Document mentions: 99202, 99203, 99213
Lookup @E&M_MINOR_PROC expands_to: [99202, 99203, 99204, 99205, 99212, 99213, 99214, 99215]
Overlap: 3/8 = 0.375, but 3/3 = 1.0 from document perspective
Result:   CODE OVERLAP → Use @E&M_MINOR_PROC
```

**Code**:
```typescript
if (mentionedCodes && mentionedCodes.length > 0) {
  for (const codeGroup of lookupTables.codeGroups) {
    const overlapScore = calculateCodeOverlap(
      mentionedCodes, 
      codeGroup.expands_to
    );
    
    if (overlapScore > 0.5) {
      return {
        matched: true,
        tag: codeGroup.tag,
        matchType: 'CODE_OVERLAP',
        confidence: overlapScore,
        expandedCodes: codeGroup.expands_to
      };
    }
  }
}
```

### No Match: Create New Tag

**When**: ALL matching attempts fail AND confidence > 0.8

**Example**:
```
Document: "Telehealth mental health visits"
Lookup:   No match found
Result:   CREATE NEW → @TELEHEALTH_MENTAL_HEALTH
          Status: NEEDS_DEFINITION
          Confidence: 0.85
```

**Code**:
```typescript
// Only create if confidence is high
if (confidence > 0.8) {
  const newTag = {
    tag: '@TELEHEALTH_MENTAL_HEALTH',
    type: 'codeGroup',
    purpose: 'Telehealth mental health visits',
    expands_to: [], // To be defined by user
    status: 'NEEDS_DEFINITION',
    created_by: 'AI',
    confidence_score: 0.85
  };
  
  lookupTables.codeGroups.push(newTag);
}
```

---

## Code Expansion Rules

### Rule 1: Always Expand Code Groups

**CORRECT**:
```json
{
  "code_group": "@E&M_MINOR_PROC",
  "code": "99202,99203,99204,99205,99212,99213,99214,99215"
}
```

**WRONG**:
```json
{
  "code_group": "@E&M_MINOR_PROC",
  "code": "" // ❌ Missing expansion
}
```

### Rule 2: Preserve Individual Codes

**Document**: "99202, 99203, and also 99499"

**CORRECT**:
```json
{
  "code_group": "@E&M_MINOR_PROC",
  "code": "99202,99203,99204,99205,99212,99213,99214,99215,99499"
}
```

### Rule 3: Multiple Code Groups

**Document**: "E&M visits and urodynamics procedures"

**CORRECT**:
```json
{
  "code_group": "@E&M_MINOR_PROC,@URODYNAMICS_PANEL",
  "code": "99202,99203,99204,99205,99212,99213,99214,99215,51728,51729,51741,51797,51798"
}
```

---

## Integration with AI/LLM

### Step 1: Prepare Prompt

Use the template in `AI_PROMPT_TEMPLATE.md` and inject:

```typescript
const prompt = AI_PROMPT_TEMPLATE
  .replace('{DOCUMENT_CONTENT}', documentContent)
  .replace('{CODE_GROUPS_JSON}', JSON.stringify(lookupTables.codeGroups))
  .replace('{PAYER_GROUPS_JSON}', JSON.stringify(lookupTables.payerGroups))
  .replace('{PROVIDER_GROUPS_JSON}', JSON.stringify(lookupTables.providerGroups))
  .replace('{ACTION_TAGS_JSON}', JSON.stringify(lookupTables.actionTags))
  .replace('{DOCUMENT_NAME}', documentName);
```

### Step 2: Call AI/LLM Service

```typescript
const response = await callAIService(prompt);
const extractedRules = JSON.parse(response);
```

### Step 3: Validate Response

```typescript
for (const rule of extractedRules.rules) {
  // Verify all tags exist or were created
  const validation = tagValidationService.validateRule(rule);
  
  // Verify codes expanded
  if (rule.code_group && !rule.code) {
    throw new Error('Code group not expanded');
  }
  
  // Verify no duplicates
  const allTags = extractAllTagsFromRule(rule);
  for (const tag of allTags) {
    const tagValidation = tagValidationService.validateTag(tag);
    if (!tagValidation.exists && !extractedRules.validation.new_tags_created.includes(tag)) {
      throw new Error(`Tag ${tag} not found and not created`);
    }
  }
}
```

---

## Example: Complete Processing Flow

### Input Document
```
POS 11 SOP - Office Setting Rules

For Blue Cross Blue Shield commercial plans, physicians (MD/DO) must add 
modifier 25 to office E&M visits with minor procedures when both services 
are performed on the same day.
```

### Step 1: AI Extraction

AI identifies:
- Payer: "Blue Cross Blue Shield commercial plans"
- Provider: "physicians (MD/DO)"
- Action: "add modifier 25"
- Procedure: "office E&M visits with minor procedures"

### Step 2: Lookup Table Matching

**Payer Group**:
```
Search: "Blue Cross Blue Shield commercial plans"
Found: @BCBS_COMMERCIAL (SEMANTIC match, 0.92)
Use: @BCBS_COMMERCIAL
```

**Provider Group**:
```
Search: "physicians (MD/DO)"
Found: @PHYSICIAN_MD_DO (EXACT match, 1.0)
Use: @PHYSICIAN_MD_DO
```

**Action**:
```
Search: "add modifier 25"
Found: @ADD (EXACT match, 1.0)
Use: @ADD(@25)
```

**Code Group**:
```
Search: "office E&M visits with minor procedures"
Found: @E&M_MINOR_PROC (EXACT match, 1.0)
Expands to: [99202, 99203, 99204, 99205, 99212, 99213, 99214, 99215]
Use: @E&M_MINOR_PROC
Populate codes: "99202,99203,99204,99205,99212,99213,99214,99215"
```

### Step 3: Rule Generation

```json
{
  "rule_id": "AUTO-1234567890-ABCD",
  "description": "For @BCBS_COMMERCIAL payers, @PHYSICIAN_MD_DO must @ADD(@25) modifier to @E&M_MINOR_PROC when both services are performed on the same day",
  "code_group": "@E&M_MINOR_PROC",
  "code": "99202,99203,99204,99205,99212,99213,99214,99215",
  "payer_group": "@BCBS_COMMERCIAL",
  "provider_group": "@PHYSICIAN_MD_DO",
  "action": "@ADD(@25)",
  "modifiers": ["25"],
  "status": "active",
  "source": "POS 11 SOP",
  "effective_date": "2025-01-01"
}
```

### Step 4: Validation

```json
{
  "validation": {
    "all_tags_exist": true,
    "codes_expanded": true,
    "no_duplicates": true,
    "lookup_matches": {
      "@BCBS_COMMERCIAL": { "match_type": "SEMANTIC", "confidence": 0.92 },
      "@PHYSICIAN_MD_DO": { "match_type": "EXACT", "confidence": 1.0 },
      "@ADD": { "match_type": "EXACT", "confidence": 1.0 },
      "@E&M_MINOR_PROC": { "match_type": "EXACT", "confidence": 1.0 }
    },
    "new_tags_created": []
  }
}
```

### Step 5: Display

**Description with Badges**:
```
For [BCBS_COMMERCIAL] payers, [PHYSICIAN_MD_DO] must [ADD(@25)] modifier 
to [E&M_MINOR_PROC] when both services are performed on the same day
```

**Codes as Chips**:
```
[99202] [99203] [99204] [99205] [99212] [99213] [99214] [99215]
```

---

## Error Prevention Checklist

Before submitting any rule, verify:

- [ ] All entities checked against lookup table FIRST
- [ ] Existing tags used when found (no duplicates)
- [ ] Code groups expanded to ALL codes
- [ ] Description uses tags (not plain text)
- [ ] Match type recorded for each tag
- [ ] Confidence score calculated
- [ ] New tags marked as NEEDS_DEFINITION
- [ ] Validation passed with no errors

---

## Testing

### Test Case 1: Perfect Match
```
Input: "For BCBS commercial, add 25 to E&M visits with minor procedures"
Expected: All tags matched, codes expanded, no new tags created
```

### Test Case 2: Semantic Match
```
Input: "Blue Cross Blue Shield commercial plans need modifier 25 on office E&M with procedures"
Expected: SEMANTIC matches, codes expanded, no new tags created
```

### Test Case 3: Code Overlap
```
Input: "For codes 99202, 99203, 99213, add modifier 25"
Expected: CODE_OVERLAP match to @E&M_MINOR_PROC, all codes expanded
```

### Test Case 4: New Tag Creation
```
Input: "For telehealth mental health visits, add modifier 95"
Expected: New tag @TELEHEALTH_MENTAL_HEALTH created, marked NEEDS_DEFINITION
```

---

## Summary

**The system guarantees**:

1. ✅ **No Duplicates**: Never creates new tags for existing entities
2. ✅ **Complete Expansion**: All code groups expanded to full code lists
3. ✅ **Consistent References**: All tags reference lookup table entries
4. ✅ **Visual Badges**: All tags rendered as colored badges
5. ✅ **Code Chips**: All codes displayed as individual chips
6. ✅ **Validation**: Every rule validated before display
7. ✅ **Traceability**: Match type and confidence recorded

**REMEMBER: LOOKUP TABLE FIRST - ALWAYS!**
