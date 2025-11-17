# ✅ Documentation Trigger & Reference Tracking - Complete Implementation

## Overview

Implemented two critical features for rule extraction:
1. **Documentation Trigger Extraction** - Identifies when documentation is required for a rule to apply
2. **Reference Tracking** - Tracks the source document and page/section for each rule

---

## 🎯 Problem Solved

### Issue 1: Documentation Trigger Accuracy
**Problem**: LLM wasn't accurately identifying when documentation is required for rules to apply.

**Solution**: Added comprehensive documentation trigger extraction logic with pattern recognition.

### Issue 2: Missing Reference Column
**Problem**: No way to track where a rule came from (source document, page, section).

**Solution**: Added Reference column to rule table and mandatory reference field in AI extraction.

---

## 📋 Documentation Trigger Extraction

### Common Patterns Recognized

#### 1. **"if documented" / "when documented" / "is documented"**
```
Example: "if 51728 or 51729 is documented"
Trigger: "documented"
```

#### 2. **"documentation of" / "documentation shows"**
```
Example: "if documentation shows incision and drainage"
Trigger: "documentation of; incision and drainage"
```

#### 3. **"must be documented" / "should be documented"**
```
Example: "tumor size must be documented"
Trigger: "documented; tumor size"
```

#### 4. **"when performed" / "if performed"**
```
Example: "when both services are performed on the same day"
Trigger: "performed; same day"
```

#### 5. **"states" / "indicates" / "shows"**
```
Example: "if chart states 'incision and drainage of vulva'"
Trigger: "states; incision and drainage"
```

#### 6. **Specific documentation requirements**
```
Example: "if a medium bladder tumor measuring 2 to 5 cm is documented"
Trigger: "documented; bladder tumor; 2 to 5 cm"
```

### Format
- **Semicolon-separated keywords**
- Include the main trigger word (documented, performed, states, etc.)
- Include key clinical terms that must be documented
- Example: `documented; bladder tumor; 2 to 5 cm`

### If No Documentation Trigger
- Leave field empty or set to empty string
- Rules that always apply regardless of documentation

---

## 📚 Reference Tracking

### Format
```
"{DOCUMENT_NAME} - Page {PAGE_NUMBER}"
```

### Examples
- `"POS 11 SOP - Page 3"`
- `"Medicare Bulletin 2024-01 - Section 2.3"`
- `"BCBS Commercial Policy - Page 5"`
- `"Urology Coding Guidelines - Page 12"`

### If Page Number Unknown
- Use section or heading: `"POS 11 SOP - Section: Office Procedures"`
- Or just document name: `"POS 11 SOP"`

### Multiple Sources
- List primary source: `"POS 11 SOP - Page 3 (ref: Medicare LCD)"`

---

## 🎨 Visual Display in Table

### New Table Structure
```
| Rule ID | Description | Code Group | Codes | Provider | Payer | Action | Doc Trigger | Reference | Status | Updated |
                                                                          ↑ NEW        ↑ NEW
```

### Documentation Trigger Column
Shows trigger keywords as **amber badges**:
```
[documented] [51728] [51729]
```
- Color: Amber background, amber text
- Format: Semicolon-separated values as individual badges
- Empty state: "None" in gray italic

### Reference Column
Shows source document as **text**:
```
POS 11 SOP - Page 3
```
- Color: Gray text
- Format: Plain text with document name and page/section
- Empty state: "No reference" in gray italic

---

## 📝 Complete Example

### Input Document
```
POS 11 SOP - Page 3

For ALL payers, if 51728 or 51729 is documented, then ALWAYS_LINK_SECONDARY(51797)
```

### AI Extraction Process

#### Step 1: Extract Rule Components
- Payer: "ALL payers" → `@ALL`
- Codes: [51728, 51729, 51797]
- Action: "ALWAYS_LINK_SECONDARY(51797)" → `@ALWAYS_LINK_SECONDARY(51797)`

#### Step 2: Reverse Lookup Code Group
- Codes [51728, 51729, 51797] found in `@URODYNAMICS_PANEL`
- Code group: `@URODYNAMICS_PANEL`
- Expand to all codes: `51728,51729,51741,51797,51798`

#### Step 3: Extract Documentation Trigger
- Pattern found: "if 51728 or 51729 is documented"
- Trigger word: "documented"
- Key terms: "51728", "51729"
- **Extract**: `documented; 51728; 51729`

#### Step 4: Extract Reference
- Document name: "POS 11 SOP"
- Page: "Page 3"
- **Extract**: `POS 11 SOP - Page 3`

### Output JSON
```json
{
  "rule_id": "AUTO-1234567890-WXYZ",
  "description": "For @ALL payers, if 51728 or 51729 is documented, then @ALWAYS_LINK_SECONDARY(51797)",
  "code_group": "@URODYNAMICS_PANEL",
  "code": "51728,51729,51741,51797,51798",
  "payer_group": "@ALL",
  "action": "@ALWAYS_LINK_SECONDARY(51797)",
  "documentation_trigger": "documented; 51728; 51729",
  "reference": "POS 11 SOP - Page 3"
}
```

### Table Display
```
┌──────────┬─────────────────────────────────────┬──────────────────┬─────────────────────────┬──────────┬──────┬─────────────────────────┬──────────────────────────┬──────────────────┬────────┬──────────┐
│ Rule ID  │ Description                         │ Code Group       │ Codes                   │ Provider │ Payer│ Action                  │ Doc Trigger              │ Reference        │ Status │ Updated  │
├──────────┼─────────────────────────────────────┼──────────────────┼─────────────────────────┼──────────┼──────┼─────────────────────────┼──────────────────────────┼──────────────────┼────────┼──────────┤
│ AUTO-... │ For @ALL payers, if 51728 or 51729  │[URODYNAMICS_PANEL│[51728] [51729] [51741] │          │ [ALL]│[ALWAYS_LINK_SECONDARY  │[documented] [51728]      │ POS 11 SOP -     │ Active │2024-01-01│
│          │ is documented, then                 │]                 │[51797] [51798]          │          │      │(51797)]                 │[51729]                   │ Page 3           │        │          │
│          │ @ALWAYS_LINK_SECONDARY(51797)       │                  │                         │          │      │                         │                          │                  │        │          │
└──────────┴─────────────────────────────────────┴──────────────────┴─────────────────────────┴──────────┴──────┴─────────────────────────┴──────────────────────────┴──────────────────┴────────┴──────────┘
```

**Legend**:
- `[URODYNAMICS_PANEL]` = Teal badge (code group)
- `[51728]` = Gray chip (code)
- `[ALL]` = Blue badge (payer)
- `[ALWAYS_LINK_SECONDARY(51797)]` = Gray badge (action)
- `[documented]` = Amber badge (doc trigger)
- `POS 11 SOP - Page 3` = Gray text (reference)

---

## 🔧 Implementation Details

### 1. AI Prompt Template Updates

**File**: `/AI_PROMPT_TEMPLATE.md`

**New Critical Rules**:
```markdown
6. DOCUMENTATION TRIGGER: Extract keywords that indicate when documentation 
   is required (e.g., "documented", "if documented", "when documented", 
   "documentation of", "must be documented")
   
7. REFERENCE TRACKING: Always populate the `reference` field with the source 
   document name and page/section (e.g., "POS 11 SOP - Page 3", 
   "Medicare Bulletin 2024-01")
```

**New Sections Added**:
- `## DOCUMENTATION TRIGGER EXTRACTION` - Detailed patterns and examples
- `## REFERENCE TRACKING` - Format and examples

**Updated Examples**:
- Example 1: Added documentation trigger and reference extraction
- Example 3: Shows complete flow with triggers and reference

**Updated Validation Checklist**:
```markdown
- [ ] DOCUMENTATION TRIGGER: Extracted if rule requires documentation
- [ ] REFERENCE: Populated with source document name and page/section
```

**Updated Error Prevention**:
```markdown
❌ NEVER DO THIS:
8. Miss documentation triggers (documented, performed, states, etc.)
9. Leave `reference` field empty - always populate with source document

✅ ALWAYS DO THIS:
6. Extract documentation triggers (documented, performed, states, shows, indicates)
7. Populate `reference` field with source document name and page/section
```

### 2. ProperRulesTable Component Updates

**File**: `/src/components/ProperRulesTable.tsx`

**New Render Functions**:

#### `renderDocumentationTrigger(rule)`
```typescript
const renderDocumentationTrigger = (rule: AdvancedSOPRule) => {
  if (!rule.documentation_trigger) {
    return <span className="text-gray-400 text-xs italic">None</span>;
  }
  
  const triggers = rule.documentation_trigger.split(';').map(t => t.trim());
  return (
    <div className="flex flex-wrap gap-1">
      {triggers.map((trigger, index) => (
        <Badge 
          key={index} 
          className="bg-amber-50 text-amber-700 border border-amber-200 text-xs px-2 py-0.5 rounded"
        >
          {trigger}
        </Badge>
      ))}
    </div>
  );
};
```

#### `renderReference(rule)`
```typescript
const renderReference = (rule: AdvancedSOPRule) => {
  if (!rule.reference) {
    return <span className="text-gray-400 text-xs italic">No reference</span>;
  }
  
  return (
    <div className="text-xs text-gray-700">
      {rule.reference}
    </div>
  );
};
```

**New Table Columns**:
- **Doc Trigger** (180px min-width) - Shows documentation trigger badges
- **Reference** (200px min-width) - Shows source document reference

---

## 🎯 Use Cases

### Use Case 1: Documentation-Dependent Rule
```
Document: "For BCBS commercial, if tumor size is documented, add modifier 52"

Extracted:
- documentation_trigger: "documented; tumor size"
- reference: "BCBS Policy - Page 12"

Display:
- Doc Trigger: [documented] [tumor size]
- Reference: BCBS Policy - Page 12
```

### Use Case 2: Performance-Based Rule
```
Document: "When E&M and minor procedure performed same day, add modifier 25"

Extracted:
- documentation_trigger: "performed; same day"
- reference: "Medicare Guidelines - Section 3.2"

Display:
- Doc Trigger: [performed] [same day]
- Reference: Medicare Guidelines - Section 3.2
```

### Use Case 3: Chart Documentation Rule
```
Document: "If chart states 'incision and drainage', link secondary code"

Extracted:
- documentation_trigger: "states; incision and drainage"
- reference: "Coding Manual - Page 45"

Display:
- Doc Trigger: [states] [incision and drainage]
- Reference: Coding Manual - Page 45
```

### Use Case 4: Always-Apply Rule
```
Document: "For all Medicare patients, add modifier 95 to telehealth"

Extracted:
- documentation_trigger: "" (empty - no documentation requirement)
- reference: "Medicare Telehealth Policy - Page 1"

Display:
- Doc Trigger: None
- Reference: Medicare Telehealth Policy - Page 1
```

---

## ✅ Validation

### AI Response Validation

**After AI returns extracted rules**, validate:

```typescript
for (const rule of extractedRules) {
  // Check documentation trigger if rule has documentation keywords
  const hasDocKeywords = rule.description.match(
    /documented|performed|states|shows|indicates/i
  );
  
  if (hasDocKeywords && !rule.documentation_trigger) {
    console.warn(
      `Rule ${rule.rule_id} has documentation keywords but no trigger extracted`
    );
  }
  
  // Check reference is populated
  if (!rule.reference) {
    throw new Error(
      `Rule ${rule.rule_id} missing reference field - source document unknown`
    );
  }
}
```

---

## 🎨 Color Scheme

### Documentation Trigger Badges
- Background: `bg-amber-50`
- Text: `text-amber-700`
- Border: `border-amber-200`
- Style: Rounded, compact padding

### Reference Text
- Text: `text-gray-700`
- Size: `text-xs`
- Style: Plain text, no background

---

## 📊 Benefits

### For Users
1. ✅ **Clear Documentation Requirements** - Know when documentation is needed
2. ✅ **Source Traceability** - Track where each rule came from
3. ✅ **Audit Trail** - Reference back to source documents
4. ✅ **Compliance** - Verify rules against source policies

### For Compliance
1. ✅ **Policy Verification** - Validate rules against source documents
2. ✅ **Audit Support** - Show source for each rule
3. ✅ **Change Tracking** - Know which document version was used
4. ✅ **Documentation Standards** - Enforce documentation requirements

### For AI Accuracy
1. ✅ **Pattern Recognition** - Consistent extraction of triggers
2. ✅ **Validation** - Verify triggers match rule content
3. ✅ **Source Attribution** - Always know where rule came from
4. ✅ **Quality Control** - Check AI extracted correct information

---

## 🧪 Testing

### Test Case 1: Documentation Trigger Extraction
```
Input: "if 51728 or 51729 is documented, then link 51797"
Expected:
  - documentation_trigger: "documented; 51728; 51729"
  - Display: [documented] [51728] [51729]
```

### Test Case 2: Performance Trigger
```
Input: "when performed on same day, add modifier 25"
Expected:
  - documentation_trigger: "performed; same day"
  - Display: [performed] [same day]
```

### Test Case 3: No Trigger
```
Input: "for all Medicare patients, add modifier 95"
Expected:
  - documentation_trigger: ""
  - Display: None
```

### Test Case 4: Reference Extraction
```
Input: Document name "POS 11 SOP", Page 3
Expected:
  - reference: "POS 11 SOP - Page 3"
  - Display: POS 11 SOP - Page 3
```

---

## 📋 Summary

**The system now:**

1. ✅ **Extracts documentation triggers** accurately
2. ✅ **Tracks source references** for all rules
3. ✅ **Displays triggers as badges** in amber color
4. ✅ **Shows references as text** in table
5. ✅ **Validates AI extraction** for both fields
6. ✅ **Handles empty states** gracefully
7. ✅ **Supports multiple trigger keywords** (semicolon-separated)

**AI will now:**
- Identify documentation requirements from rule text
- Extract trigger keywords (documented, performed, states, etc.)
- Include key clinical terms in trigger
- Always populate reference field with source document
- Format reference as "Document Name - Page/Section"

**Users can now:**
- See when documentation is required for a rule
- Know exactly where each rule came from
- Trace rules back to source documents
- Verify compliance with source policies

**Result**: Complete traceability and clear documentation requirements for all rules! 🎉
