# ✅ Mandatory Code Audit System - Complete Implementation

## Overview

A **mandatory, blocking code audit system** that ensures **100% code coverage** for every uploaded SOP document. The LLM **CANNOT** return output until all codes are extracted, matched, and remediated.

---

## 🎯 Core Requirements

### **1. Exhaustive Code Extraction**
✅ Extract **EVERY code** from **ENTIRE document**:
- Main body text
- Tables and grids
- Footnotes and annotations
- Appendices and attachments
- Code listings and examples
- Headers and captions
- Parenthetical references

### **2. Code Coverage Requirement**
✅ **Every extracted code** must appear in:
- At least one rule's `code` field, OR
- A code group in the lookup table

### **3. Rule-Lookup Linkage**
✅ **All rules** must reference codes through lookup table:
- Use code group tags (e.g., `@E&M_MINOR_PROC`)
- Perform reverse lookup for individual codes
- Ensure complete traceability

### **4. Mandatory Audit Step**
✅ **Before completing**, LLM must:
- Output list of ALL extracted codes
- Show which rule and lookup tag each code appears in
- Highlight ANY unmatched codes
- **BLOCK output** if codes are missing linkage

### **5. Complete JSON Output**
✅ Include `code_audit` section with:
- Code extraction summary
- Code inventory (every code with details)
- Coverage summary
- Remediation actions taken
- Lookup table updates

---

## 🔄 Mandatory Extraction Workflow

### **Phase 1: Exhaustive Code Extraction** (MANDATORY)
```
1. Scan ENTIRE document
   - Main text ✓
   - Tables ✓
   - Footnotes ✓
   - Appendices ✓
   - Headers ✓

2. Extract EVERY code found
   - CPT codes (5-digit: 99213, 51728)
   - ICD-10 codes (A12.34, Z23)
   - Modifiers (25, 59, GT)
   - HCPCS (J0585, G0463)

3. Record each code with:
   - Code number
   - Type (procedure/diagnosis/modifier)
   - Context (sentence where found)
   - Location (page, line number)

4. Create complete code inventory
```

### **Phase 2: Lookup Table Matching** (MANDATORY)
```
For each extracted code:
  1. Check if code exists in lookup table code groups
  2. Note which code group(s) contain this code
  
For each code group/tag needed:
  1. Search lookup table using ALL match types:
     - Exact match
     - Semantic match
     - Keyword match
     - Code overlap match
  2. Use existing tag if found
  3. Mark for creation if not found
```

### **Phase 3: Rule Generation** (MANDATORY)
```
1. Create rules from document text

2. For EVERY extracted code:
   - Ensure code appears in at least one rule's `code` field
   - If code not in any rule, CREATE new rule using context

3. Link all rules to lookup table tags:
   - Use code_group tags
   - Use payer_group tags
   - Use provider_group tags

4. Populate code_group field via reverse lookup:
   - If rule has individual codes
   - Check if codes belong to a code group
   - Set code_group field
```

### **Phase 4: Code Coverage Audit** (MANDATORY)
```
For each extracted code:
  ✅ Check: Code in at least one rule?
  ✅ Check: Code in lookup table (directly or via code group)?
  
  Status:
    - COVERED: In rules AND in lookup table
    - UNMATCHED: Not in rules OR not in lookup table
    
If ANY unmatched codes → Proceed to Phase 5
If ALL codes covered → Proceed to Phase 6
```

### **Phase 5: Automatic Remediation** (MANDATORY IF UNMATCHED)
```
For each UNMATCHED code:

  1. Determine if code should be in a code group:
     - If multiple related codes → Create code group
     - If single code → Use individual code
     
  2. Create code group (if needed):
     - tag: "@NEW_CODE_GROUP"
     - expands_to: [unmatched codes]
     - purpose: Extract from document context
     - status: "PENDING_REVIEW"
     
  3. Create rule:
     - Use extracted context as description
     - Set code_group to new/existing group
     - Populate all required fields
     
  4. Add code group to lookup table:
     - Update lookup_table_updates section
     - Mark as created_by: "AI"
     
  5. Link rule to code group:
     - Set rule.code_group field
     - Expand all codes from code group
     
  6. Re-verify coverage:
     - Confirm code now in rule
     - Confirm code now in lookup table
```

### **Phase 6: Final Validation** (MANDATORY)
```
Validation Checklist:
  ✅ All codes covered? (100% required)
  ✅ All rules linked to lookup table?
  ✅ No duplicate tags?
  ✅ Code audit complete?
  
If ANY check fails → BLOCK OUTPUT
If ALL checks pass → Proceed to Phase 7
```

### **Phase 7: Output Generation** (MANDATORY)
```
Generate JSON output with:

1. rules: Array of all extracted rules

2. code_audit: COMPLETE audit section
   - total_codes_extracted
   - extraction_sources (main_text, tables, etc.)
   - codes_by_type (procedure, diagnosis, modifier)
   - code_inventory (EVERY code with full details)
   - coverage_summary
   - unmatched_codes (should be empty)
   - remediation_actions (what was auto-created)
   - lookup_table_updates (new code groups, etc.)

3. validation: Validation results
   - all_codes_covered: true
   - all_rules_linked: true
   - audit_passed: true

4. summary: High-level summary
   - audit_status: "PASSED"
   - coverage_score: 100

**CRITICAL**: DO NOT return output without code_audit section!
```

---

## 📊 Code Audit Section Structure

### **Complete Example**

```json
{
  "code_audit": {
    "total_codes_extracted": 12,
    "extraction_sources": {
      "main_text": 8,
      "tables": 3,
      "footnotes": 1,
      "appendices": 0
    },
    "codes_by_type": {
      "procedure": 10,
      "diagnosis": 1,
      "modifier": 1
    },
    "code_inventory": [
      {
        "code": "99202",
        "type": "procedure",
        "context": "Office visit for new patient, straightforward complexity",
        "location": "Page 2, Line 15",
        "status": "covered",
        "in_rules": ["AUTO-001", "AUTO-003"],
        "in_lookup_groups": ["@E&M_MINOR_PROC"],
        "coverage": "complete"
      },
      {
        "code": "51728",
        "type": "procedure",
        "context": "Complex cystometrogram with voiding pressure studies",
        "location": "Page 5, Table 1",
        "status": "covered",
        "in_rules": ["AUTO-002"],
        "in_lookup_groups": ["@URODYNAMICS_PANEL"],
        "coverage": "complete"
      },
      {
        "code": "25",
        "type": "modifier",
        "context": "Add modifier 25 to E&M when performed with procedure",
        "location": "Page 3, Line 42",
        "status": "covered",
        "in_rules": ["AUTO-001"],
        "in_lookup_groups": [],
        "coverage": "complete"
      }
    ],
    "coverage_summary": {
      "codes_in_rules": 12,
      "codes_in_lookup": 11,
      "unmatched_codes": 0,
      "coverage_percentage": 100.0,
      "all_codes_covered": true
    },
    "unmatched_codes": [],
    "remediation_actions": [
      {
        "action": "created_code_group",
        "tag": "@URODYNAMICS_PANEL",
        "codes": ["51728", "51729", "51797", "51798"],
        "reason": "Codes found in document but not in lookup table"
      },
      {
        "action": "created_rule",
        "rule_id": "AUTO-002",
        "codes": ["51728", "51729", "51797", "51798"],
        "reason": "Unmatched codes required rule creation"
      },
      {
        "action": "added_to_lookup_table",
        "tag": "@URODYNAMICS_PANEL",
        "reason": "New code group added to ensure traceability"
      }
    ],
    "lookup_table_updates": {
      "new_code_groups": [
        {
          "tag": "@URODYNAMICS_PANEL",
          "expands_to": ["51728", "51729", "51797", "51798"],
          "purpose": "Urodynamic testing procedures including cystometrogram and voiding studies",
          "status": "PENDING_REVIEW",
          "created_by": "AI",
          "source_document": "POS 11 SOP - Urodynamics"
        }
      ],
      "updated_code_groups": [],
      "new_payer_groups": [],
      "new_provider_groups": []
    }
  }
}
```

---

## 🚫 Blocking Mechanism

### **LLM CANNOT Return Output If:**

1. ❌ **Code extraction incomplete**
   - Not all sections scanned
   - Codes missed from tables/footnotes

2. ❌ **Unmatched codes exist**
   - Code in document but not in any rule
   - Code not in lookup table

3. ❌ **Rules not linked to lookup**
   - Rule uses code_group not in lookup table
   - Rule uses payer_group not in lookup table

4. ❌ **Code audit section missing**
   - No code_audit in output
   - Incomplete code_audit data

5. ❌ **Coverage < 100%**
   - Any code without coverage
   - Audit status not "PASSED"

### **What LLM Must Do Instead:**

```
IF unmatched codes exist:
  1. Create code groups for unmatched codes
  2. Create rules using extracted context
  3. Add code groups to lookup table
  4. Link rules to code groups
  5. Re-verify 100% coverage
  6. THEN return output

IF code_audit missing:
  1. Generate complete code inventory
  2. Calculate coverage summary
  3. Document remediation actions
  4. Include lookup table updates
  5. THEN return output

IF coverage < 100%:
  1. Identify which codes are uncovered
  2. Perform automatic remediation
  3. Verify coverage now 100%
  4. THEN return output
```

---

## ✅ Success Criteria

### **Output is ONLY valid if:**

1. ✅ `code_audit` section present and complete
2. ✅ `code_audit.total_codes_extracted` > 0
3. ✅ `code_audit.code_inventory` contains ALL codes
4. ✅ `code_audit.coverage_summary.all_codes_covered` = true
5. ✅ `code_audit.coverage_summary.coverage_percentage` = 100.0
6. ✅ `code_audit.unmatched_codes` = [] (empty array)
7. ✅ `validation.all_codes_covered` = true
8. ✅ `validation.all_rules_linked` = true
9. ✅ `validation.audit_passed` = true
10. ✅ `summary.audit_status` = "PASSED"

---

## 📋 Example Scenario

### **Input Document**
```
POS 11 SOP - Office Procedures

E&M Codes:
- 99202: New patient, straightforward
- 99203: New patient, low complexity
- 99213: Established patient, low complexity

Modifier Rules:
- Add modifier 25 to E&M when performed with minor procedure
- Add modifier 59 for distinct procedural service

Urodynamics Panel:
- 51728: Complex cystometrogram
- 51729: Complex cystometrogram with voiding
- 51797: Voiding pressure studies
```

### **Phase 1: Code Extraction**
```
Extracted 7 codes:
  - 99202 (procedure) - Page 1, Line 5
  - 99203 (procedure) - Page 1, Line 6
  - 99213 (procedure) - Page 1, Line 7
  - 25 (modifier) - Page 2, Line 3
  - 59 (modifier) - Page 2, Line 4
  - 51728 (procedure) - Page 3, Line 2
  - 51729 (procedure) - Page 3, Line 3
  - 51797 (procedure) - Page 3, Line 4
```

### **Phase 2: Lookup Matching**
```
Checking lookup table:
  - 99202, 99203, 99213: Found in @E&M_MINOR_PROC ✓
  - 25, 59: Modifiers (not in code groups) ✓
  - 51728, 51729, 51797: NOT FOUND ❌
  
Need to create: @URODYNAMICS_PANEL
```

### **Phase 3: Rule Generation**
```
Created rules:
  - AUTO-001: E&M with modifier 25 (covers 99202, 99203, 99213, 25)
  - AUTO-002: E&M with modifier 59 (covers 99202, 99203, 99213, 59)
  - AUTO-003: Urodynamics panel (covers 51728, 51729, 51797)
```

### **Phase 4: Coverage Audit**
```
Checking coverage:
  ✅ 99202: In AUTO-001, AUTO-002, in @E&M_MINOR_PROC
  ✅ 99203: In AUTO-001, AUTO-002, in @E&M_MINOR_PROC
  ✅ 99213: In AUTO-001, AUTO-002, in @E&M_MINOR_PROC
  ✅ 25: In AUTO-001
  ✅ 59: In AUTO-002
  ❌ 51728: In AUTO-003, NOT in lookup table
  ❌ 51729: In AUTO-003, NOT in lookup table
  ❌ 51797: In AUTO-003, NOT in lookup table
  
Unmatched: 3 codes need remediation
```

### **Phase 5: Remediation**
```
Creating code group:
  tag: @URODYNAMICS_PANEL
  expands_to: [51728, 51729, 51797]
  purpose: "Urodynamic testing procedures"
  
Adding to lookup table:
  lookup_table_updates.new_code_groups.push(@URODYNAMICS_PANEL)
  
Updating rule AUTO-003:
  code_group: "@URODYNAMICS_PANEL"
  
Re-verifying coverage:
  ✅ 51728: In AUTO-003, in @URODYNAMICS_PANEL
  ✅ 51729: In AUTO-003, in @URODYNAMICS_PANEL
  ✅ 51797: In AUTO-003, in @URODYNAMICS_PANEL
  
Coverage now: 100% ✅
```

### **Phase 6: Validation**
```
✅ All codes covered: 7/7 = 100%
✅ All rules linked: 3/3 valid
✅ No duplicates: 0 found
✅ Code audit complete: Yes

Validation: PASSED ✅
```

### **Phase 7: Output**
```json
{
  "rules": [...],
  "code_audit": {
    "total_codes_extracted": 7,
    "coverage_summary": {
      "coverage_percentage": 100.0,
      "all_codes_covered": true
    },
    "unmatched_codes": [],
    "remediation_actions": [
      {
        "action": "created_code_group",
        "tag": "@URODYNAMICS_PANEL",
        "codes": ["51728", "51729", "51797"]
      }
    ]
  },
  "validation": {
    "all_codes_covered": true,
    "audit_passed": true
  },
  "summary": {
    "audit_status": "PASSED"
  }
}
```

---

## 🎯 Benefits

### **For Data Quality**
- ✅ **100% Code Coverage** - No code ever missed
- ✅ **Complete Traceability** - Every code linked to rule and lookup table
- ✅ **Automatic Remediation** - Unmatched codes auto-fixed
- ✅ **Audit Trail** - Full record of all actions taken

### **For Compliance**
- ✅ **Mandatory Audit** - Cannot skip or bypass
- ✅ **Blocking Mechanism** - Invalid output rejected
- ✅ **Complete Documentation** - Every code accounted for
- ✅ **Verification** - 100% coverage required

### **For Users**
- ✅ **Confidence** - Know all codes are covered
- ✅ **Transparency** - See exactly what was extracted
- ✅ **Automatic** - No manual checking needed
- ✅ **Detailed Reports** - Full code inventory provided

---

## 🚀 Summary

**The Mandatory Code Audit System ensures:**

1. ✅ **EVERY code extracted** from entire document
2. ✅ **EVERY code covered** in at least one rule
3. ✅ **EVERY code linked** to lookup table
4. ✅ **AUTOMATIC remediation** of unmatched codes
5. ✅ **MANDATORY audit** before output
6. ✅ **BLOCKING mechanism** if audit fails
7. ✅ **COMPLETE code_audit section** in output
8. ✅ **100% coverage required** - no exceptions
9. ✅ **FULL traceability** - code → rule → lookup table
10. ✅ **AUDIT TRAIL** - all actions documented

**Result: Complete code coverage and traceability guaranteed!** 🎉
