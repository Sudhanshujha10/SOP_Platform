# ✅ Description Format Correction - Concise Structured Format

## 🎯 Problem Identified

The LLM is generating **long, paragraph-style descriptions** instead of the required **concise, structured one-sentence format**.

### **Examples of WRONG format** (from screenshots):

❌ **AU-REMOVE-0022**:
```
"For ALL payers, if Hydrodistension is documented in PROCEDURE_SECTION for IC (Interstitial Cystitis), then ADD(J1644), ADD(J1580). If for any other reason, then ADD(52000) for diagnostic cysto or REMOVE(51700) if bladder instillation meds are not instilled. For Priapism treatment documented in PROCEDURE_SECTION, ADD(54220), ADD(J2371), ADD(J1885). For chemotherapy infusion for kidney and bladder cancer in PROCEDURE_SECTION, ADD(96413), ADD(J9271). For Sacral Nerve Stimulator (SNS) adjustment in PROCEDURE_SECTION, ADD(64585) for temporary placement, ADD(95971) for simple programming, ADD(95972) for complex programming."
```
**Problems**:
- ❌ Multiple sentences (should be ONE sentence)
- ❌ Multiple rules combined (should be separate rules)
- ❌ Uses "if...then" format (should use "when...must include")
- ❌ No semicolon separator
- ❌ No quoted keywords

❌ **AU-MOD-0023**:
```
"For MEDICARE payers, if programming of device is performed without analysis documented in PROCEDURE_SECTION, then ADD(52) with a claim note that device was only programmed, and no analysis was done. For ALL payers, if lead removal CPT 64585 is performed within the global period of the PNE, it is not billable and should be reported as 99024. For ALL payers, if an infusion of Opdivo exceeds 90 minutes, then ADD(96415) in addition to @96413, and report wastage to Medicare with ADD(JW)."
```
**Problems**:
- ❌ Multiple sentences
- ❌ Multiple rules combined
- ❌ Includes explanations ("with a claim note that...")
- ❌ Uses "if...then" format
- ❌ No semicolon separator
- ❌ No quoted keywords

---

## ✅ Correct Format

### **Required Structure**:
```
For @PAYER_GROUP payers @ACTION(@item) when <trigger>; the @CHART_SECTION must include "<keywords>".
```

### **Format Rules**:

1. **ONE sentence only** - No paragraphs, no multiple sentences
2. **@ACTION immediately after payers** - Don't insert "if" or other words
3. **Use "when" for trigger** - Not "if" or "in case of"
4. **Use semicolon (;) before chart section** - Separates trigger from requirement
5. **Use "must include" with quoted keywords** - Exact phrase to search for
6. **Chain actions with "and" or "then"** - For multiple actions in same rule
7. **Lowercase trigger text** - Unless quoting exact documentation
8. **End with period**

---

## 🔄 Corrections for Screenshot Examples

### **Example 1: AU-REMOVE-0022 (Hydrodistension)**

**WRONG** (current):
```
"For ALL payers, if Hydrodistension is documented in PROCEDURE_SECTION for IC (Interstitial Cystitis), then ADD(J1644), ADD(J1580). If for any other reason, then ADD(52000) for diagnostic cysto or REMOVE(51700) if bladder instillation meds are not instilled."
```

**CORRECT** (should be split into separate rules):

**Rule 1**:
```
For @ALL payers @ADD(@J1644) when hydrodistension is documented for interstitial cystitis; the @PROCEDURE_SECTION must include "IC treatment".
```

**Rule 2**:
```
For @ALL payers @ADD(@J1580) when hydrodistension is documented for interstitial cystitis; the @PROCEDURE_SECTION must include "IC treatment".
```

**Rule 3**:
```
For @ALL payers @ADD(@52000) when diagnostic cystoscopy is performed; the @PROCEDURE_SECTION must include "diagnostic cysto".
```

**Rule 4**:
```
For @ALL payers @REMOVE(@51700) when bladder instillation medications are not instilled; the @PROCEDURE_SECTION must include "no instillation".
```

---

### **Example 2: AU-MOD-0023 (Device Programming)**

**WRONG** (current):
```
"For MEDICARE payers, if programming of device is performed without analysis documented in PROCEDURE_SECTION, then ADD(52) with a claim note that device was only programmed, and no analysis was done."
```

**CORRECT**:
```
For @MEDICARE payers @ADD(@52) when device programming without analysis is documented; the @PROCEDURE_SECTION must include "programming only".
```

---

### **Example 3: AU-COND-0012 (Chaperone)**

**WRONG** (current):
```
"For ALL payers, if documentation of a chaperone is present in PROCEDURE_SECTION, then COND_ADD(94459). For ALL payers, if gel pessary is not documented and visit is for a pessary fitting in PROCEDURE_SECTION, then COND_ADD(57160, A4561)."
```

**CORRECT** (should be split into separate rules):

**Rule 1**:
```
For @ALL payers @COND_ADD(@94459) when chaperone presence is documented; the @PROCEDURE_SECTION must include "chaperone present".
```

**Rule 2**:
```
For @ALL payers @COND_ADD(@57160) when pessary fitting without gel pessary is documented; the @PROCEDURE_SECTION must include "pessary fitting".
```

**Rule 3**:
```
For @ALL payers @COND_ADD(@A4561) when pessary fitting without gel pessary is documented; the @PROCEDURE_SECTION must include "pessary fitting".
```

---

### **Example 4: AU-MOD-0002 (Ultrasound)**

**WRONG** (current):
```
"For ALL payers, if an Ultrasound (76770) is performed with the urodynamic test and the diagnosis for both tests is for a urinary tract symptom, then REMOVE(51798) from the claim. If the diagnosis codes are distinct, then ADD(MODIFIER_XU). For vasectomy procedures, if HCPCS code A4550-Surgical trays is on the claim, please REMOVE(A4550). If documentation or billing notes indicate a post vasectomy semen analysis kit (PVKIT) was given to the patient, then ADD(PVKIT) to the claim."
```

**CORRECT** (should be split into separate rules):

**Rule 1**:
```
For @ALL payers @REMOVE(@51798) when ultrasound is performed with urodynamic test for same diagnosis; the @PROCEDURE_SECTION must include "urinary tract symptom".
```

**Rule 2**:
```
For @ALL payers @ADD(@MODIFIER_XU) when ultrasound and urodynamic test have distinct diagnoses; the @PROCEDURE_SECTION must include "distinct diagnosis".
```

**Rule 3**:
```
For @ALL payers @REMOVE(@A4550) when surgical trays are on vasectomy claim; the @PROCEDURE_SECTION must include "vasectomy".
```

**Rule 4**:
```
For @ALL payers @ADD(@PVKIT) when post-vasectomy semen analysis kit is given; the @PROCEDURE_SECTION must include "PVKIT given".
```

---

## 📋 Complete Format Examples

### **Example 1: Single ADD action**
```
For @ALL payers @ADD(@51798) when post-voiding residual is measured using ultrasound; the @PROCEDURE_SECTION must include "PVR measurement".
```

### **Example 2: Single REMOVE action**
```
For @MEDICARE payers @REMOVE(@G2211) when visit complexity is not documented; the @ASSESSMENT_PLAN must include "complexity assessment".
```

### **Example 3: COND_ADD action**
```
For @COMMERCIAL_PPO payers @COND_ADD(@99417) when total visit time exceeds the level-5 threshold; the @TIME_ATTEST_SECTION must include "Total time documented".
```

### **Example 4: Multiple actions chained**
```
For @ALL payers @ADD(@J1644) and @REMOVE(@51700) when hydrodistension is documented without instillation; the @PROCEDURE_SECTION must include "IC treatment".
```

### **Example 5: Multiple payers**
```
For @BCBS|@ANTHEM payers @ADD(@25) when separate E&M service is documented; the @ASSESSMENT_PLAN must include "separate evaluation".
```

### **Example 6: Complex trigger**
```
For @MEDICARE payers @COND_ADD(@Q2043) and @COND_ADD(@96415) when PROVENGE infusion time exceeds 90 minutes; the @PROCEDURE_SECTION must include "infusion time".
```

---

## 🚫 What NOT to Do

### **DON'T: Write multiple sentences**
❌ `"For ALL payers, if X is documented, then ADD(Y). If Z is documented, then REMOVE(W)."`

✅ **DO: Create separate rules**
```
Rule 1: For @ALL payers @ADD(@Y) when X is documented; the @PROCEDURE_SECTION must include "X".
Rule 2: For @ALL payers @REMOVE(@W) when Z is documented; the @PROCEDURE_SECTION must include "Z".
```

### **DON'T: Use "if...then" format**
❌ `"For ALL payers, if device programming is documented, then ADD(52)."`

✅ **DO: Use "when...must include" format**
```
For @ALL payers @ADD(@52) when device programming is documented; the @PROCEDURE_SECTION must include "programming".
```

### **DON'T: Include explanations**
❌ `"For MEDICARE payers ADD(52) with a claim note that device was only programmed."`

✅ **DO: Keep it concise**
```
For @MEDICARE payers @ADD(@52) when device programming without analysis is documented; the @PROCEDURE_SECTION must include "programming only".
```

### **DON'T: Omit keyword quotes**
❌ `"...the @PROCEDURE_SECTION must include programming only."`

✅ **DO: Quote the keywords**
```
...the @PROCEDURE_SECTION must include "programming only".
```

### **DON'T: Combine multiple rules**
❌ `"For ALL payers ADD(X) for condition A, ADD(Y) for condition B, REMOVE(Z) for condition C."`

✅ **DO: Create separate rules**
```
Rule 1: For @ALL payers @ADD(@X) when condition A; the @PROCEDURE_SECTION must include "A".
Rule 2: For @ALL payers @ADD(@Y) when condition B; the @PROCEDURE_SECTION must include "B".
Rule 3: For @ALL payers @REMOVE(@Z) when condition C; the @PROCEDURE_SECTION must include "C".
```

---

## 🎯 Key Principles

1. **ONE RULE = ONE SENTENCE** - Each rule should be a single, structured sentence
2. **ONE RULE = ONE CONDITION** - Don't combine multiple conditions in one rule
3. **CONCISE AND STRUCTURED** - Follow the exact format template
4. **ENGLISH FIRST, TAGS INLINE** - Write naturally, embed @tags within text
5. **KEYWORDS IN QUOTES** - Always quote the exact phrase to search for
6. **LOWERCASE TRIGGERS** - Use lowercase for trigger text unless quoting
7. **SEMICOLON SEPARATOR** - Use semicolon before chart section requirement
8. **NO EXPLANATIONS** - Don't include claim notes or additional context

---

## 🧪 Testing Checklist

For each generated description, verify:

- [ ] ✅ Starts with `For @PAYER_GROUP payers`
- [ ] ✅ @ACTION immediately after payers (no "if" or "then")
- [ ] ✅ Uses "when" for trigger condition
- [ ] ✅ Has semicolon (;) before chart section
- [ ] ✅ Uses "must include" with quoted keywords
- [ ] ✅ ONE sentence only (no multiple sentences)
- [ ] ✅ Ends with period
- [ ] ✅ Lowercase trigger text (unless quoting)
- [ ] ✅ No explanations or claim notes
- [ ] ✅ No "if...then" format

---

## 📊 Format Comparison

| Component | OLD Format (Wrong) | NEW Format (Correct) |
|-----------|-------------------|---------------------|
| **Structure** | Multiple sentences, paragraphs | ONE sentence |
| **Payer** | `For ALL payers, if...` | `For @ALL payers @ACTION...` |
| **Condition** | `if X is documented, then...` | `when X is documented;` |
| **Chart Section** | `in PROCEDURE_SECTION` | `; the @PROCEDURE_SECTION must include` |
| **Keywords** | No quotes | `"quoted keywords"` |
| **Separator** | Comma or "then" | Semicolon (;) |
| **Length** | Long paragraphs | Concise single sentence |
| **Multiple Actions** | Separate sentences | Chained with "and" or "then" |

---

## ✅ Summary

**The correct description format is**:

```
For @PAYER_GROUP payers @ACTION(@item) when <trigger>; the @CHART_SECTION must include "<keywords>".
```

**Key changes from old format**:
1. ✅ ONE sentence only (not paragraphs)
2. ✅ @ACTION immediately after payers (not "if...then")
3. ✅ Use "when" (not "if")
4. ✅ Use semicolon separator (not comma)
5. ✅ Use "must include" with quotes (not "states" or "shows")
6. ✅ Separate rules for separate conditions (not combined)
7. ✅ No explanations or claim notes
8. ✅ Lowercase trigger text

**All descriptions must follow this format - no exceptions!** 🎯
