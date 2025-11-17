# ✅ Reverse Lookup Implementation - Code to Code Group

## Problem Identified

**Issue**: Rule has code `51797` which belongs to `@URODYNAMICS_PANEL` in the lookup table, but the `code_group` field shows "None".

**Root Cause**: When AI extracts individual codes from documents, it doesn't check if those codes belong to an existing code group in the lookup table.

**Expected Behavior**: 
- Code `51797` is in `@URODYNAMICS_PANEL` (expands_to: [51728, 51729, 51741, 51797, 51798])
- Rule should have `code_group: "@URODYNAMICS_PANEL"`
- Rule should have `code: "51728,51729,51741,51797,51798"` (all codes expanded)

---

## Solution Implemented

### 1. **CodeGroupMatcher Utility** ✅

**File**: `/src/utils/codeGroupMatcher.ts`

**Purpose**: Reverse lookup code groups from individual codes

**Key Methods**:

#### `findCodeGroupsForCodes(codes: string[])`
Finds all code groups that contain the given codes
```typescript
const matcher = new CodeGroupMatcher(lookupTables);
const matches = matcher.findCodeGroupsForCodes(['51797', '51728']);
// Returns: [{ codeGroup: @URODYNAMICS_PANEL, matchedCodes: ['51797', '51728'], matchPercentage: 0.4 }]
```

#### `findBestCodeGroup(codes: string[])`
Returns the code group with highest match percentage
```typescript
const bestMatch = matcher.findBestCodeGroup(['51797']);
// Returns: { codeGroup: @URODYNAMICS_PANEL, matchedCodes: ['51797'], matchPercentage: 0.2 }
```

#### `autoPopulateCodeGroup(codes: string[])`
Auto-populates code_group field based on codes
```typescript
const result = matcher.autoPopulateCodeGroup(['51797', '51728', '51729']);
// Returns: {
//   codeGroup: '@URODYNAMICS_PANEL',
//   expandedCodes: ['51728', '51729', '51741', '51797', '51798'],
//   confidence: 0.6,
//   reason: '60% of codes match @URODYNAMICS_PANEL'
// }
```

#### `enhanceRuleWithCodeGroup(rule: any)`
Enhances a rule by adding/validating code_group
```typescript
const { enhancedRule, changes, warnings } = matcher.enhanceRuleWithCodeGroup(rule);
// Adds code_group if missing, expands codes, validates existing code_group
```

---

### 2. **Updated AI Prompt Template** ✅

**File**: `/AI_PROMPT_TEMPLATE.md`

**New Critical Rules**:
```markdown
4. **REVERSE LOOKUP CODES**: If you extract individual codes (e.g., 51797), 
   check if they belong to a code group in the lookup table
5. **POPULATE CODE_GROUP**: If codes match a code group, set the `code_group` 
   field to that tag
```

**New Example Added**: Example 3 - Reverse Lookup (Code to Code Group)

**Document Text**:
```
"For ALL payers, if 51728 or 51729 is documented, then ALWAYS_LINK_SECONDARY(51797)"
```

**Expected Output**:
```json
{
  "code_group": "@URODYNAMICS_PANEL",
  "code": "51728,51729,51741,51797,51798",
  "payer_group": "@ALL",
  "action": "@ALWAYS_LINK_SECONDARY(51797)"
}
```

**Critical Note**:
> Even though document only mentions 51728, 51729, 51797, you MUST:
> 1. Recognize these belong to @URODYNAMICS_PANEL
> 2. Set code_group: "@URODYNAMICS_PANEL"
> 3. Expand to ALL codes: 51728,51729,51741,51797,51798

---

## How It Works

### Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. AI EXTRACTS CODES FROM DOCUMENT                          │
│    Document: "if 51728 or 51729 is documented..."          │
│    Extracted: [51728, 51729, 51797]                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. REVERSE LOOKUP IN CODE GROUPS                            │
│    Search all codeGroups for these codes                    │
│    ┌─────────────────────────────────────────────────────┐ │
│    │ @E&M_MINOR_PROC: [99202, 99203, ...] ❌ No match   │ │
│    │ @URODYNAMICS_PANEL: [51728, 51729, 51741, 51797,   │ │
│    │                      51798] ✅ MATCH FOUND!         │ │
│    └─────────────────────────────────────────────────────┘ │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. CALCULATE MATCH PERCENTAGE                               │
│    Matched codes: 3 (51728, 51729, 51797)                   │
│    Total in group: 5                                        │
│    Match percentage: 3/3 = 100% (from document perspective) │
│    Confidence: 0.60 (3/5 from group perspective)            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. POPULATE CODE_GROUP                                      │
│    code_group: "@URODYNAMICS_PANEL"                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. EXPAND TO ALL CODES                                      │
│    code: "51728,51729,51741,51797,51798"                    │
│    (Includes 51741 and 51798 even though not in document)   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. DISPLAY IN TABLE                                         │
│    Code Group: [URODYNAMICS_PANEL] ← Teal badge            │
│    Codes: [51728] [51729] [51741] [51797] [51798]          │
└─────────────────────────────────────────────────────────────┘
```

---

## Matching Logic

### Match Threshold

**Minimum match percentage**: 50%

If at least 50% of the extracted codes match a code group, use that code group.

### Examples

#### Example 1: High Match (100%)
```
Document codes: [51728, 51729, 51797]
Code group @URODYNAMICS_PANEL: [51728, 51729, 51741, 51797, 51798]
Matched: 3/3 = 100% ✅ USE @URODYNAMICS_PANEL
```

#### Example 2: Partial Match (60%)
```
Document codes: [51728, 51729, 51797]
Code group @URODYNAMICS_PANEL: [51728, 51729, 51741, 51797, 51798]
Matched: 3/5 = 60% ✅ USE @URODYNAMICS_PANEL
```

#### Example 3: Low Match (20%)
```
Document codes: [51728, 99213, 99214, 99215, 99216]
Code group @URODYNAMICS_PANEL: [51728, 51729, 51741, 51797, 51798]
Matched: 1/5 = 20% ❌ DON'T USE (below 50% threshold)
```

#### Example 4: Complete Match (100%)
```
Document codes: [51728, 51729, 51741, 51797, 51798]
Code group @URODYNAMICS_PANEL: [51728, 51729, 51741, 51797, 51798]
Matched: 5/5 = 100% ✅ PERFECT MATCH
```

---

## Integration Points

### 1. AI/LLM Processing

**When AI extracts rules**, it should:

```typescript
// After extracting codes from document
const extractedCodes = ['51797', '51728', '51729'];

// Reverse lookup code group
const matcher = new CodeGroupMatcher(lookupTables);
const result = matcher.autoPopulateCodeGroup(extractedCodes);

if (result.codeGroup && result.confidence >= 0.5) {
  rule.code_group = result.codeGroup;
  rule.code = result.expandedCodes.join(',');
}
```

### 2. Manual Rule Creation

**When user creates rule manually**, system should:

```typescript
// User enters codes: 51797, 51728
const userCodes = ['51797', '51728'];

// Auto-suggest code group
const matcher = new CodeGroupMatcher(lookupTables);
const result = matcher.autoPopulateCodeGroup(userCodes);

if (result.codeGroup) {
  // Show suggestion to user
  showSuggestion(`These codes belong to ${result.codeGroup}. Use this code group?`);
}
```

### 3. Rule Import/Upload

**When importing rules from CSV/Excel**, system should:

```typescript
for (const rule of importedRules) {
  if (rule.code && !rule.code_group) {
    const codes = rule.code.split(',');
    const { enhancedRule, changes, warnings } = matcher.enhanceRuleWithCodeGroup(rule);
    
    if (changes.length > 0) {
      console.log(`Enhanced rule ${rule.rule_id}:`, changes);
    }
    
    importedRules[index] = enhancedRule;
  }
}
```

### 4. Existing Rules Enhancement

**To fix existing rules with missing code_group**:

```typescript
const matcher = new CodeGroupMatcher(lookupTables);
const { enhancedRules, summary } = matcher.enhanceRules(allRules);

console.log(`Enhanced ${summary.rulesEnhanced} rules`);
console.log(`Warnings: ${summary.rulesWithWarnings}`);

// Update rules in database
updateRules(enhancedRules);
```

---

## Validation

### AI Response Validation

**After AI returns extracted rules**, validate:

```typescript
for (const rule of extractedRules) {
  // Check if codes have matching code group
  if (rule.code && !rule.code_group) {
    const codes = rule.code.split(',');
    const matcher = new CodeGroupMatcher(lookupTables);
    const result = matcher.autoPopulateCodeGroup(codes);
    
    if (result.codeGroup && result.confidence >= 0.5) {
      throw new Error(
        `AI failed to populate code_group. Codes ${codes} belong to ${result.codeGroup}`
      );
    }
  }
  
  // Check if code_group is expanded
  if (rule.code_group && rule.code) {
    const codeGroup = lookupTables.codeGroups.find(
      cg => cg.tag === rule.code_group
    );
    
    if (codeGroup) {
      const ruleCodes = rule.code.split(',').map(c => c.trim());
      const allCodesExpanded = codeGroup.expands_to.every(code =>
        ruleCodes.includes(code)
      );
      
      if (!allCodesExpanded) {
        throw new Error(
          `AI failed to expand all codes for ${rule.code_group}`
        );
      }
    }
  }
}
```

---

## Error Prevention

### ❌ Common Mistakes

#### Mistake 1: Not Checking for Code Group
```json
// WRONG
{
  "code": "51797",
  "code_group": ""
}

// CORRECT
{
  "code": "51728,51729,51741,51797,51798",
  "code_group": "@URODYNAMICS_PANEL"
}
```

#### Mistake 2: Partial Code Expansion
```json
// WRONG
{
  "code": "51797,51728",
  "code_group": "@URODYNAMICS_PANEL"
}

// CORRECT
{
  "code": "51728,51729,51741,51797,51798",
  "code_group": "@URODYNAMICS_PANEL"
}
```

#### Mistake 3: Wrong Code Group
```json
// WRONG
{
  "code": "51797",
  "code_group": "@E&M_MINOR_PROC"
}

// CORRECT
{
  "code": "51728,51729,51741,51797,51798",
  "code_group": "@URODYNAMICS_PANEL"
}
```

---

## Testing

### Test Case 1: Single Code Reverse Lookup
```typescript
Input: codes = ['51797']
Expected: 
  - code_group: '@URODYNAMICS_PANEL'
  - code: '51728,51729,51741,51797,51798'
  - confidence: 0.2 (1/5)
```

### Test Case 2: Multiple Codes Reverse Lookup
```typescript
Input: codes = ['51728', '51729', '51797']
Expected:
  - code_group: '@URODYNAMICS_PANEL'
  - code: '51728,51729,51741,51797,51798'
  - confidence: 0.6 (3/5)
```

### Test Case 3: Complete Match
```typescript
Input: codes = ['51728', '51729', '51741', '51797', '51798']
Expected:
  - code_group: '@URODYNAMICS_PANEL'
  - code: '51728,51729,51741,51797,51798'
  - confidence: 1.0 (5/5)
```

### Test Case 4: No Match
```typescript
Input: codes = ['99999']
Expected:
  - code_group: null
  - code: '99999'
  - confidence: 0
```

---

## Summary

**The system now:**

1. ✅ **Reverse lookups codes** to find matching code groups
2. ✅ **Auto-populates code_group** when codes match a group
3. ✅ **Expands to all codes** from the code group
4. ✅ **Validates AI responses** for missing code_group
5. ✅ **Enhances existing rules** with missing code_group
6. ✅ **Provides confidence scores** for matches
7. ✅ **Handles partial matches** (>= 50% threshold)

**AI will now:**
- Check if extracted codes belong to a code group
- Set `code_group` field automatically
- Expand to all codes in the group
- Never leave `code_group` empty when codes match a group

**Result**: No more "None" in Code Group column when codes belong to a group! 🎉
