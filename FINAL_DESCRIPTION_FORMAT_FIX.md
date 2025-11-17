# ✅ Final Description Format Fix - ONE RULE, ONE SENTENCE

## 🎯 Root Cause Identified

The LLM was **combining multiple rules into one description** instead of creating **separate rules** for each condition.

### **Problem Examples from Screenshots**:

❌ **AU-MOD-0009** (WRONG):
```
"For BCBS ANTHEM payers ADD(25) when billed with any 0- or 10-day procedure except for urinalysis (81003); the PROCEDURE_SECTION must include "E/M service". For AETNA payers ADD(25) when billed with any 0 or 10 day procedure including the urinalysis; the PROCEDURE_SECTION must include "E/M service". For UHC payers ADD(25) when billed with 0- and 10-day procedure codes, do not add with a PVR or urinalysis; the PROCEDURE_SECTION must include "E/M service". For AMBETTER payers ADD(25) when billed with 0-, and 10-day global period; the PROCEDURE_SECTION must include "E/M service". For CIGNA payers REMOVE(25) when billed with PVR and urinalysis except for uroflow (51741), ADD(25) for 0- and 10-day global procedures; the PROCEDURE_SECTION must include "E/M service"."
```

**Problems**:
- ❌ 5+ different payer rules combined into ONE description
- ❌ Multiple sentences
- ❌ Should be 5+ separate rule objects

❌ **AU-MOD-0002** (WRONG):
```
"For ALL payers REMOVE(51798) when ultrasound diagnosis for urodynamic test is not distinct and ADD(MODIFIER_XU) when diagnosis codes are distinct; the PROCEDURE_SECTION must include "distinct diagnosis". For ALL payers REMOVE(A4550) when surgical trays are on the claim; the CLAIMS_PROCESSING must include "surgical tray removal". For ALL payers ADD(PVKIT) when a post vasectomy semen analysis kit is documented; the PROCEDURE_SECTION must include "PVKIT provided". For ALL payers ADD(51700) and ADD(MODIFIER_52) when a voiding trial is performed with the catheter already in place; the PROCEDURE_SECTION must include "voiding trial"."
```

**Problems**:
- ❌ 4 different rules combined into ONE description
- ❌ Multiple sentences
- ❌ Should be 4 separate rule objects

---

## ✅ Solution Implemented

### **1. Added "ONE RULE PER CONDITION" Section to AI_PROMPT_TEMPLATE.md**

**Location**: Lines 42-57

**Key Instructions**:
```markdown
### **⚠️ CRITICAL: ONE RULE PER CONDITION**

**YOU MUST CREATE SEPARATE RULES FOR:**
- ✅ Different payer groups (e.g., @BCBS vs @ANTHEM = 2 separate rules)
- ✅ Different conditions/triggers (e.g., "with PVR" vs "without PVR" = 2 separate rules)
- ✅ Different actions on same code (e.g., ADD vs REMOVE = 2 separate rules)
- ✅ Different chart sections (e.g., @PROCEDURE_SECTION vs @CLAIMS_PROCESSING = 2 separate rules)

**NEVER COMBINE:**
- ❌ Multiple payers in one description (unless using pipe delimiter in same rule)
- ❌ Multiple conditions in one description (e.g., "For X payers do Y. For Z payers do W.")
- ❌ Multiple sentences in one description
- ❌ Different triggers in one description

**If you see text like**: "For X payers do Y. For Z payers do W."
**You MUST create**: 2 separate rule objects, each with its own description
```

### **2. Added Explicit Examples Showing How to Split Rules**

**Bad Example** (what NOT to do):
```
"For BCBS ANTHEM payers ADD(25) when billed with any 0- or 10-day procedure except for urinalysis (81003); the PROCEDURE_SECTION must include "E/M service". For AETNA payers ADD(25) when billed with any 0 or 10 day procedure including the urinalysis; the PROCEDURE_SECTION must include "E/M service"."
```

**Good Example** (what TO do - create separate rules):
```
Rule 1: For @BCBS|@ANTHEM payers @ADD(@25) when billed with 0- or 10-day procedure except urinalysis; the @PROCEDURE_SECTION must include "E/M service".

Rule 2: For @AETNA payers @ADD(@25) when billed with 0- or 10-day procedure including urinalysis; the @PROCEDURE_SECTION must include "E/M service".
```

### **3. Updated promptLoader.js with "Extract ONLY ONE RULE" Instruction**

**Location**: Lines 83-90

**Key Instructions**:
```javascript
**⚠️ IMPORTANT: Extract ONLY ONE RULE from this segment**

If this segment contains text describing multiple rules (e.g., "For X payers do Y. For Z payers do W."):
- Extract ONLY the FIRST complete rule you encounter
- Create ONE description following the format: "For @PAYER payers @ACTION(@item) when <trigger>; the @CHART_SECTION must include "<keywords>"."
- DO NOT include other rules in the description
- DO NOT write multiple sentences
- The other rules will be extracted in subsequent processing passes
```

---

## 📋 Correct Format (Final)

### **Template**:
```
For @PAYER_GROUP payers @ACTION(@item) when <trigger>; the @CHART_SECTION must include "<keywords>".
```

### **Rules**:
1. ✅ **ONE sentence ONLY**
2. ✅ **ONE rule per description**
3. ✅ **ONE payer group** (or pipe-delimited payers with SAME condition)
4. ✅ **ONE condition/trigger**
5. ✅ **ONE chart section**
6. ✅ **@ACTION immediately after payers**
7. ✅ **Semicolon before chart section**
8. ✅ **Quoted keywords**

---

## 🔄 How to Fix Screenshot Examples

### **Example 1: AU-MOD-0009 (Multiple Payers)**

**WRONG** (current - 1 rule with 5+ payers):
```
"For BCBS ANTHEM payers ADD(25) when billed with any 0- or 10-day procedure except for urinalysis (81003); the PROCEDURE_SECTION must include "E/M service". For AETNA payers ADD(25) when billed with any 0 or 10 day procedure including the urinalysis; the PROCEDURE_SECTION must include "E/M service". For UHC payers ADD(25) when billed with 0- and 10-day procedure codes, do not add with a PVR or urinalysis; the PROCEDURE_SECTION must include "E/M service". For AMBETTER payers ADD(25) when billed with 0-, and 10-day global period; the PROCEDURE_SECTION must include "E/M service". For CIGNA payers REMOVE(25) when billed with PVR and urinalysis except for uroflow (51741), ADD(25) for 0- and 10-day global procedures; the PROCEDURE_SECTION must include "E/M service"."
```

**CORRECT** (should be 6+ separate rules):

**Rule 1**:
```json
{
  "rule_id": "AU-MOD-0009-01",
  "description": "For @BCBS|@ANTHEM payers @ADD(@25) when billed with 0- or 10-day procedure except urinalysis; the @PROCEDURE_SECTION must include \"E/M service\".",
  "code": "81003",
  "action": "@ADD(@25)",
  "payer_group": "@BCBS|@ANTHEM",
  "chart_section": "PROCEDURE_SECTION",
  "documentation_trigger": "billed; 0-day procedure; 10-day procedure; except urinalysis"
}
```

**Rule 2**:
```json
{
  "rule_id": "AU-MOD-0009-02",
  "description": "For @AETNA payers @ADD(@25) when billed with 0- or 10-day procedure including urinalysis; the @PROCEDURE_SECTION must include \"E/M service\".",
  "code": "81003",
  "action": "@ADD(@25)",
  "payer_group": "@AETNA",
  "chart_section": "PROCEDURE_SECTION",
  "documentation_trigger": "billed; 0-day procedure; 10-day procedure; including urinalysis"
}
```

**Rule 3**:
```json
{
  "rule_id": "AU-MOD-0009-03",
  "description": "For @UHC payers @ADD(@25) when billed with 0- or 10-day procedure without PVR or urinalysis; the @PROCEDURE_SECTION must include \"E/M service\".",
  "code": "81003",
  "action": "@ADD(@25)",
  "payer_group": "@UHC",
  "chart_section": "PROCEDURE_SECTION",
  "documentation_trigger": "billed; 0-day procedure; 10-day procedure; without PVR; without urinalysis"
}
```

**Rule 4**:
```json
{
  "rule_id": "AU-MOD-0009-04",
  "description": "For @AMBETTER payers @ADD(@25) when billed with 0- or 10-day global period; the @PROCEDURE_SECTION must include \"E/M service\".",
  "code": "81003",
  "action": "@ADD(@25)",
  "payer_group": "@AMBETTER",
  "chart_section": "PROCEDURE_SECTION",
  "documentation_trigger": "billed; 0-day global; 10-day global"
}
```

**Rule 5**:
```json
{
  "rule_id": "AU-MOD-0009-05",
  "description": "For @CIGNA payers @REMOVE(@25) when billed with PVR and urinalysis except uroflow; the @PROCEDURE_SECTION must include \"PVR and urinalysis\".",
  "code": "51741",
  "action": "@REMOVE(@25)",
  "payer_group": "@CIGNA",
  "chart_section": "PROCEDURE_SECTION",
  "documentation_trigger": "billed; PVR; urinalysis; except uroflow"
}
```

**Rule 6**:
```json
{
  "rule_id": "AU-MOD-0009-06",
  "description": "For @CIGNA payers @ADD(@25) when billed with 0- or 10-day global procedures; the @PROCEDURE_SECTION must include \"E/M service\".",
  "code": "81003",
  "action": "@ADD(@25)",
  "payer_group": "@CIGNA",
  "chart_section": "PROCEDURE_SECTION",
  "documentation_trigger": "billed; 0-day global; 10-day global"
}
```

---

### **Example 2: AU-MOD-0002 (Multiple Conditions)**

**WRONG** (current - 1 rule with 4 conditions):
```
"For ALL payers REMOVE(51798) when ultrasound diagnosis for urodynamic test is not distinct and ADD(MODIFIER_XU) when diagnosis codes are distinct; the PROCEDURE_SECTION must include "distinct diagnosis". For ALL payers REMOVE(A4550) when surgical trays are on the claim; the CLAIMS_PROCESSING must include "surgical tray removal". For ALL payers ADD(PVKIT) when a post vasectomy semen analysis kit is documented; the PROCEDURE_SECTION must include "PVKIT provided". For ALL payers ADD(51700) and ADD(MODIFIER_52) when a voiding trial is performed with the catheter already in place; the PROCEDURE_SECTION must include "voiding trial"."
```

**CORRECT** (should be 5 separate rules):

**Rule 1**:
```json
{
  "rule_id": "AU-MOD-0002-01",
  "description": "For @ALL payers @REMOVE(@51798) when ultrasound diagnosis for urodynamic test is not distinct; the @PROCEDURE_SECTION must include \"same diagnosis\".",
  "code": "51798",
  "action": "@REMOVE(@51798)",
  "payer_group": "@ALL",
  "chart_section": "PROCEDURE_SECTION",
  "documentation_trigger": "ultrasound; urodynamic test; not distinct diagnosis"
}
```

**Rule 2**:
```json
{
  "rule_id": "AU-MOD-0002-02",
  "description": "For @ALL payers @ADD(@MODIFIER_XU) when ultrasound and urodynamic test have distinct diagnosis codes; the @PROCEDURE_SECTION must include \"distinct diagnosis\".",
  "code": "51798",
  "action": "@ADD(@MODIFIER_XU)",
  "payer_group": "@ALL",
  "chart_section": "PROCEDURE_SECTION",
  "documentation_trigger": "ultrasound; urodynamic test; distinct diagnosis"
}
```

**Rule 3**:
```json
{
  "rule_id": "AU-MOD-0002-03",
  "description": "For @ALL payers @REMOVE(@A4550) when surgical trays are on vasectomy claim; the @CLAIMS_PROCESSING must include \"surgical tray removal\".",
  "code": "A4550",
  "action": "@REMOVE(@A4550)",
  "payer_group": "@ALL",
  "chart_section": "CLAIMS_PROCESSING",
  "documentation_trigger": "surgical trays; vasectomy claim"
}
```

**Rule 4**:
```json
{
  "rule_id": "AU-MOD-0002-04",
  "description": "For @ALL payers @ADD(@PVKIT) when post-vasectomy semen analysis kit is documented; the @PROCEDURE_SECTION must include \"PVKIT provided\".",
  "code": "PVKIT",
  "action": "@ADD(@PVKIT)",
  "payer_group": "@ALL",
  "chart_section": "PROCEDURE_SECTION",
  "documentation_trigger": "post-vasectomy; semen analysis kit; PVKIT"
}
```

**Rule 5**:
```json
{
  "rule_id": "AU-MOD-0002-05",
  "description": "For @ALL payers @ADD(@51700) and @ADD(@MODIFIER_52) when voiding trial is performed with catheter already in place; the @PROCEDURE_SECTION must include \"voiding trial\".",
  "code": "51700",
  "action": "@ADD(@51700) and @ADD(@MODIFIER_52)",
  "payer_group": "@ALL",
  "chart_section": "PROCEDURE_SECTION",
  "documentation_trigger": "voiding trial; catheter in place"
}
```

---

## 🎯 Key Takeaways

### **What Changed**:

1. ✅ **Explicit "ONE RULE PER CONDITION" section** in AI_PROMPT_TEMPLATE.md
2. ✅ **Clear examples** showing how to split combined rules
3. ✅ **"Extract ONLY ONE RULE" instruction** in promptLoader.js
4. ✅ **Emphasis on creating separate rule objects** for different conditions

### **What LLM Should Do**:

1. ✅ **Read the segment**
2. ✅ **Identify the FIRST complete rule**
3. ✅ **Create ONE description** following the format
4. ✅ **Return ONE rule object**
5. ✅ **Let subsequent processing handle other rules in the segment**

### **What LLM Should NOT Do**:

1. ❌ **Combine multiple payers** with different conditions
2. ❌ **Combine multiple conditions** in one description
3. ❌ **Write multiple sentences**
4. ❌ **Try to extract all rules from segment at once**

---

## 🧪 Testing

### **Test Case 1: Document with Multiple Payer Rules**

**Input**:
```
For BCBS and Anthem, add modifier 25 when billed with 0-day procedures except urinalysis.
For Aetna, add modifier 25 when billed with 0-day procedures including urinalysis.
For UHC, add modifier 25 when billed with 0-day procedures without PVR.
```

**Expected Output**: **3 separate rules**, each with ONE description:

```json
[
  {
    "rule_id": "AU-MOD-0001",
    "description": "For @BCBS|@ANTHEM payers @ADD(@25) when billed with 0-day procedures except urinalysis; the @PROCEDURE_SECTION must include \"E/M service\"."
  },
  {
    "rule_id": "AU-MOD-0002",
    "description": "For @AETNA payers @ADD(@25) when billed with 0-day procedures including urinalysis; the @PROCEDURE_SECTION must include \"E/M service\"."
  },
  {
    "rule_id": "AU-MOD-0003",
    "description": "For @UHC payers @ADD(@25) when billed with 0-day procedures without PVR; the @PROCEDURE_SECTION must include \"E/M service\"."
  }
]
```

### **Test Case 2: Document with Multiple Condition Rules**

**Input**:
```
For all payers, remove 51798 when ultrasound diagnosis is not distinct.
For all payers, add modifier XU when diagnosis codes are distinct.
For all payers, remove A4550 when surgical trays are on the claim.
```

**Expected Output**: **3 separate rules**, each with ONE description:

```json
[
  {
    "rule_id": "AU-MOD-0001",
    "description": "For @ALL payers @REMOVE(@51798) when ultrasound diagnosis is not distinct; the @PROCEDURE_SECTION must include \"same diagnosis\"."
  },
  {
    "rule_id": "AU-MOD-0002",
    "description": "For @ALL payers @ADD(@MODIFIER_XU) when diagnosis codes are distinct; the @PROCEDURE_SECTION must include \"distinct diagnosis\"."
  },
  {
    "rule_id": "AU-MOD-0003",
    "description": "For @ALL payers @REMOVE(@A4550) when surgical trays are on vasectomy claim; the @CLAIMS_PROCESSING must include \"surgical tray removal\"."
  }
]
```

---

## ✅ Success Criteria

**The fix is successful if**:

1. ✅ Each rule has **ONE sentence** in description
2. ✅ Each rule has **ONE payer group** (or pipe-delimited payers with same condition)
3. ✅ Each rule has **ONE condition/trigger**
4. ✅ Each rule has **ONE chart section**
5. ✅ No descriptions contain multiple sentences
6. ✅ No descriptions contain "For X payers... For Y payers..."
7. ✅ Different payers with different conditions = separate rules
8. ✅ Different conditions = separate rules
9. ✅ All descriptions follow format: `For @PAYER payers @ACTION(@item) when <trigger>; the @CHART_SECTION must include "<keywords>".`

---

## 📊 Summary

**Root Cause**: LLM was combining multiple rules into one description

**Solution**: 
1. Added explicit "ONE RULE PER CONDITION" section
2. Added "Extract ONLY ONE RULE" instruction
3. Provided clear examples of splitting rules
4. Emphasized creating separate rule objects

**Expected Result**: Each rule will have ONE concise description following the structured format

**Files Modified**:
1. ✅ `/AI_PROMPT_TEMPLATE.md` - Added ONE RULE PER CONDITION section
2. ✅ `/backend/promptLoader.js` - Added Extract ONLY ONE RULE instruction

**The LLM will now create separate rules instead of combining them!** 🎉
