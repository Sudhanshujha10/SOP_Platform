# LLM Processing Rules for SOP Document Upload

## Critical Rule: LOOKUP TABLE FIRST - ALWAYS

**Every entity extraction MUST follow this strict order:**

1. **LOOKUP TABLE FIRST** - Check if entity exists
2. **USE EXISTING** - If found, use exact tag from lookup table
3. **CREATE ONLY IF MISSING** - Only create new tag if genuinely not found
4. **NEVER DUPLICATE** - Never create new tags for existing entities

---

## Processing Workflow

### Step 1: Parse SOP Document
Extract all entities from the document:
- Payer groups (insurance companies, payer types)
- Code groups (procedure groups, diagnosis groups)
- Provider groups (physician types, provider specialties)
- Actions (ADD, REMOVE, SWAP, CONDITIONAL, etc.)
- Codes (CPT, ICD-10, HCPCS, modifiers)

### Step 2: Lookup Table Matching (MANDATORY)

For **EVERY** entity extracted, follow this process:

#### A. Code Groups / Procedure Groups

**Example from document**: "Office E&M visits with minor procedures"

**Process**:
1. Search lookup table `codeGroups` for matching purpose/description
2. **FOUND**: `@E&M_MINOR_PROC` with purpose "Office E&M visits with minor procedures"
3. **ACTION**: 
   - Use tag: `@E&M_MINOR_PROC`
   - Populate codes from `expands_to`: `99202, 99203, 99204, 99205, 99212, 99213, 99214, 99215`
4. **RESULT**:
   - Rule `code_group`: `@E&M_MINOR_PROC`
   - Rule `code`: `99202,99203,99204,99205,99212,99213,99214,99215`

**DO NOT**:
- ❌ Create new tag `@OFFICE_EM_VISITS`
- ❌ Create new tag `@EM_MINOR_PROCEDURES`
- ❌ Use different code list
- ❌ Modify existing codes

#### B. Payer Groups

**Example from document**: "Blue Cross Blue Shield commercial plans"

**Process**:
1. Search lookup table `payerGroups` for matching name/type
2. **FOUND**: `@BCBS_COMMERCIAL` with name "BCBS Commercial"
3. **ACTION**: Use tag `@BCBS_COMMERCIAL`
4. **RESULT**: Rule `payer_group`: `@BCBS_COMMERCIAL`

**DO NOT**:
- ❌ Create new tag `@BLUE_CROSS`
- ❌ Create new tag `@BCBS_COMM`
- ❌ Use generic `@COMMERCIAL`

#### C. Provider Groups

**Example from document**: "Physicians (MD/DO)"

**Process**:
1. Search lookup table `providerGroups` for matching description
2. **FOUND**: `@PHYSICIAN_MD_DO` with description "Licensed physicians (MD or DO)"
3. **ACTION**: Use tag `@PHYSICIAN_MD_DO`
4. **RESULT**: Rule `provider_group`: `@PHYSICIAN_MD_DO`

**DO NOT**:
- ❌ Create new tag `@PHYSICIANS`
- ❌ Create new tag `@MD_DO`
- ❌ Use separate tags `@MD` and `@DO`

#### D. Actions

**Example from document**: "Add modifier 25"

**Process**:
1. Search lookup table `actionTags` for matching syntax
2. **FOUND**: `@ADD` with syntax "@ADD(code/modifier)"
3. **ACTION**: Use tag `@ADD(@25)`
4. **RESULT**: Rule `action`: `@ADD(@25)`

**DO NOT**:
- ❌ Create new tag `@ADD_MODIFIER`
- ❌ Use plain text "Add 25"
- ❌ Create custom action format

---

## Matching Logic

### Fuzzy Matching Rules

When searching lookup tables, use these matching strategies:

#### 1. Exact Match (Priority 1)
```
Document: "Office E&M visits with minor procedures"
Lookup:   purpose: "Office E&M visits with minor procedures"
Result:   EXACT MATCH → Use @E&M_MINOR_PROC
```

#### 2. Semantic Match (Priority 2)
```
Document: "E&M office visits including minor procedures"
Lookup:   purpose: "Office E&M visits with minor procedures"
Result:   SEMANTIC MATCH → Use @E&M_MINOR_PROC
```

#### 3. Keyword Match (Priority 3)
```
Document: "Office evaluation and management with procedures"
Lookup:   purpose: "Office E&M visits with minor procedures"
Keywords: ["office", "E&M", "minor", "procedures"]
Result:   KEYWORD MATCH → Use @E&M_MINOR_PROC
```

#### 4. Code Overlap Match (Priority 4)
```
Document mentions codes: 99202, 99203, 99213
Lookup @E&M_MINOR_PROC expands_to: [99202, 99203, 99204, 99205, 99212, 99213, 99214, 99215]
Result:   CODE OVERLAP → Use @E&M_MINOR_PROC
```

### When to Create New Tag

**ONLY create new tag if ALL of these are true:**

1. ✅ No exact match found in lookup table
2. ✅ No semantic match found in lookup table
3. ✅ No keyword match found in lookup table
4. ✅ No code overlap match found in lookup table
5. ✅ Entity is genuinely new and distinct
6. ✅ Confidence score > 0.8 for new entity

**Example of valid new tag creation**:
```
Document: "Telehealth visits for mental health"
Lookup:   No existing code group for telehealth mental health
Result:   CREATE @TELEHEALTH_MENTAL_HEALTH
          Add to lookup table with codes
          Mark as NEEDS_DEFINITION for review
```

---

## Code Population Rules

### Rule 1: Always Expand Code Groups

When a code group tag is used, **ALWAYS** populate the `code` field with all codes from `expands_to`:

```typescript
// CORRECT
{
  code_group: "@E&M_MINOR_PROC",
  code: "99202,99203,99204,99205,99212,99213,99214,99215"
}

// WRONG - Missing code expansion
{
  code_group: "@E&M_MINOR_PROC",
  code: ""
}

// WRONG - Partial expansion
{
  code_group: "@E&M_MINOR_PROC",
  code: "99202,99203"
}
```

### Rule 2: Preserve Individual Codes

If document mentions specific codes not in a group, add them individually:

```typescript
// Document mentions: "99202, 99203, and also 99499"
// Lookup: @E&M_MINOR_PROC has 99202, 99203 but not 99499

// CORRECT
{
  code_group: "@E&M_MINOR_PROC",
  code: "99202,99203,99204,99205,99212,99213,99214,99215,99499"
}
```

### Rule 3: Multiple Code Groups

If multiple code groups apply, expand all:

```typescript
// Document: "E&M visits and urodynamics procedures"

// CORRECT
{
  code_group: "@E&M_MINOR_PROC,@URODYNAMICS_PANEL",
  code: "99202,99203,99204,99205,99212,99213,99214,99215,51728,51729,51741,51797,51798"
}
```

---

## Description Generation Rules

### Rule 1: Use Tags in Description

Always use tags from lookup table in the description:

```typescript
// CORRECT
{
  description: "For @BCBS_COMMERCIAL payers, @ADD(@25) modifier to @E&M_MINOR_PROC when performed with minor procedures"
}

// WRONG - Plain text instead of tags
{
  description: "For BCBS commercial payers, add modifier 25 to E&M visits with minor procedures"
}
```

### Rule 2: Preserve Original Context

Keep the semantic meaning from the original document:

```typescript
// Document: "Blue Cross Blue Shield commercial plans require modifier 25 on E&M visits when performed with minor procedures"

// CORRECT - Preserves context with tags
{
  description: "For @BCBS_COMMERCIAL payers, @ADD(@25) modifier to @E&M_MINOR_PROC when performed with minor procedures"
}
```

---

## Validation Requirements

### Before Creating Any Rule

**MANDATORY CHECKS**:

1. ✅ All payer group tags exist in or will be added to `payerGroups`
2. ✅ All code group tags exist in or will be added to `codeGroups`
3. ✅ All provider group tags exist in or will be added to `providerGroups`
4. ✅ All action tags exist in or will be added to `actionTags`
5. ✅ All codes in `code` field are valid CPT/ICD-10/HCPCS codes
6. ✅ Code group tags have been expanded to actual codes
7. ✅ No duplicate tags created for existing entities

### Validation Response Format

```typescript
{
  rule: {
    rule_id: "AUTO-GENERATED",
    description: "For @BCBS_COMMERCIAL payers, @ADD(@25) modifier to @E&M_MINOR_PROC when performed with minor procedures",
    code_group: "@E&M_MINOR_PROC",
    code: "99202,99203,99204,99205,99212,99213,99214,99215",
    payer_group: "@BCBS_COMMERCIAL",
    provider_group: "@PHYSICIAN_MD_DO",
    action: "@ADD(@25)",
    status: "active",
    source: "POS 11 SOP"
  },
  validation: {
    all_tags_exist: true,
    new_tags_created: [],
    codes_expanded: true,
    lookup_table_matches: {
      "@E&M_MINOR_PROC": "EXACT_MATCH",
      "@BCBS_COMMERCIAL": "EXACT_MATCH",
      "@PHYSICIAN_MD_DO": "EXACT_MATCH",
      "@ADD": "EXACT_MATCH"
    }
  },
  confidence: 0.95
}
```

---

## Badge Display Rules

### All Tags Must Be Rendered as Badges

In the UI, all tags must appear as colored badges:

```typescript
// Payer Group Badge
<Badge className="bg-blue-100 text-blue-800 border-blue-200">
  @BCBS_COMMERCIAL
</Badge>

// Code Group Badge
<Badge className="bg-teal-100 text-teal-800 border-teal-200">
  @E&M_MINOR_PROC
</Badge>

// Provider Group Badge
<Badge className="bg-purple-100 text-purple-800 border-purple-200">
  @PHYSICIAN_MD_DO
</Badge>

// Action Badge
<Badge className="bg-green-100 text-green-800 border-green-200">
  @ADD(@25)
</Badge>
```

### Codes Must Be Displayed as Chips

All codes in the `code` field must be shown as individual chips:

```typescript
// Codes Display
<div className="flex flex-wrap gap-1">
  <Chip>99202</Chip>
  <Chip>99203</Chip>
  <Chip>99204</Chip>
  <Chip>99205</Chip>
  <Chip>99212</Chip>
  <Chip>99213</Chip>
  <Chip>99214</Chip>
  <Chip>99215</Chip>
</div>
```

---

## Error Prevention

### Common Mistakes to AVOID

#### ❌ Mistake 1: Creating Duplicate Tags
```typescript
// WRONG - Creating new tag when one exists
Document: "BCBS commercial plans"
Lookup has: @BCBS_COMMERCIAL
Action: Created @BCBS_COMM  // ❌ WRONG

// CORRECT
Action: Use @BCBS_COMMERCIAL  // ✅ CORRECT
```

#### ❌ Mistake 2: Not Expanding Code Groups
```typescript
// WRONG - Tag without codes
{
  code_group: "@E&M_MINOR_PROC",
  code: ""  // ❌ WRONG
}

// CORRECT
{
  code_group: "@E&M_MINOR_PROC",
  code: "99202,99203,99204,99205,99212,99213,99214,99215"  // ✅ CORRECT
}
```

#### ❌ Mistake 3: Using Plain Text Instead of Tags
```typescript
// WRONG
{
  description: "For BCBS commercial payers..."  // ❌ WRONG
}

// CORRECT
{
  description: "For @BCBS_COMMERCIAL payers..."  // ✅ CORRECT
}
```

#### ❌ Mistake 4: Partial Code Expansion
```typescript
// WRONG - Only some codes
{
  code_group: "@E&M_MINOR_PROC",
  code: "99202,99203"  // ❌ WRONG - Missing other codes
}

// CORRECT - All codes
{
  code_group: "@E&M_MINOR_PROC",
  code: "99202,99203,99204,99205,99212,99213,99214,99215"  // ✅ CORRECT
}
```

---

## Lookup Table Structure Reference

### Code Groups
```typescript
{
  tag: "@E&M_MINOR_PROC",
  type: "procedure",
  expands_to: ["99202", "99203", "99204", "99205", "99212", "99213", "99214", "99215"],
  purpose: "Office E&M visits with minor procedures"
}
```

### Payer Groups
```typescript
{
  tag: "@BCBS_COMMERCIAL",
  name: "BCBS Commercial",
  type: "commercial"
}
```

### Provider Groups
```typescript
{
  tag: "@PHYSICIAN_MD_DO",
  name: "Physicians (MD/DO)",
  description: "Licensed physicians (MD or DO)"
}
```

### Action Tags
```typescript
{
  tag: "@ADD",
  syntax: "@ADD(code/modifier)",
  description: "Add code or modifier to claim",
  category: "code"
}
```

---

## Summary Checklist

Before submitting any extracted rule, verify:

- [ ] All tags checked against lookup table FIRST
- [ ] Existing tags used when found (no duplicates)
- [ ] Code groups expanded to all codes
- [ ] Description uses tags (not plain text)
- [ ] All badges will render correctly
- [ ] All codes will display as chips
- [ ] New tags only created when genuinely missing
- [ ] New tags marked as NEEDS_DEFINITION
- [ ] Validation passed with no errors
- [ ] Confidence score calculated

**REMEMBER: LOOKUP TABLE FIRST - ALWAYS!**
