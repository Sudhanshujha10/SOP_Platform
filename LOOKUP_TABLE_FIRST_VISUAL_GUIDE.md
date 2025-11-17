# Lookup Table First - Visual Guide

## 🎯 The Golden Rule

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  LOOKUP TABLE FIRST - ALWAYS                                │
│                                                              │
│  1. Check if entity exists in lookup table                  │
│  2. If found → Use existing tag                             │
│  3. If not found → Create new tag (only if confidence > 0.8)│
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 4-Tier Matching Priority

```
┌─────────────────────────────────────────────────────────────┐
│ PRIORITY 1: EXACT MATCH                                     │
│ Confidence: 1.0                                             │
│                                                              │
│ Document: "Office E&M visits with minor procedures"         │
│ Lookup:   "Office E&M visits with minor procedures"         │
│ Result:   ✅ EXACT MATCH → @E&M_MINOR_PROC                  │
└─────────────────────────────────────────────────────────────┘
                           ↓ No match? Try next
┌─────────────────────────────────────────────────────────────┐
│ PRIORITY 2: SEMANTIC MATCH                                  │
│ Confidence: 0.85 - 0.99                                     │
│                                                              │
│ Document: "E&M office visits including minor procedures"    │
│ Lookup:   "Office E&M visits with minor procedures"         │
│ Result:   ✅ SEMANTIC MATCH → @E&M_MINOR_PROC               │
└─────────────────────────────────────────────────────────────┘
                           ↓ No match? Try next
┌─────────────────────────────────────────────────────────────┐
│ PRIORITY 3: KEYWORD MATCH                                   │
│ Confidence: 0.60 - 0.84                                     │
│                                                              │
│ Document: "Office evaluation and management with procedures"│
│ Lookup:   "Office E&M visits with minor procedures"         │
│ Keywords: ["office", "procedures"] match                    │
│ Result:   ✅ KEYWORD MATCH → @E&M_MINOR_PROC                │
└─────────────────────────────────────────────────────────────┘
                           ↓ No match? Try next
┌─────────────────────────────────────────────────────────────┐
│ PRIORITY 4: CODE OVERLAP                                    │
│ Confidence: 0.50 - 0.79                                     │
│                                                              │
│ Document mentions: 99202, 99203, 99213                      │
│ Lookup @E&M_MINOR_PROC: [99202, 99203, ..., 99215]         │
│ Overlap: 3 codes match                                      │
│ Result:   ✅ CODE_OVERLAP → @E&M_MINOR_PROC                 │
└─────────────────────────────────────────────────────────────┘
                           ↓ No match? Create new
┌─────────────────────────────────────────────────────────────┐
│ NO MATCH: CREATE NEW TAG                                    │
│ Confidence: Must be > 0.8                                   │
│                                                              │
│ Document: "Telehealth mental health visits"                 │
│ Lookup:   No match found                                    │
│ Result:   ⚠️ CREATE NEW → @TELEHEALTH_MENTAL_HEALTH         │
│           Status: NEEDS_DEFINITION                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Complete Processing Flow

```
┌──────────────────────────────────────────────────────────────┐
│ 📄 STEP 1: DOCUMENT UPLOAD                                  │
│                                                               │
│ User uploads: "POS 11 SOP.pdf"                              │
│                                                               │
│ Content: "For Blue Cross Blue Shield commercial plans,      │
│          physicians (MD/DO) must add modifier 25 to office  │
│          E&M visits with minor procedures..."                │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│ 🤖 STEP 2: AI/LLM EXTRACTION                                │
│                                                               │
│ AI identifies:                                               │
│ • Payer: "Blue Cross Blue Shield commercial plans"          │
│ • Provider: "physicians (MD/DO)"                            │
│ • Action: "add modifier 25"                                 │
│ • Procedure: "office E&M visits with minor procedures"      │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│ 🔍 STEP 3: LOOKUP TABLE MATCHING                            │
│                                                               │
│ For each entity, check lookup table:                        │
│                                                               │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Payer: "Blue Cross Blue Shield commercial plans"      │  │
│ │ Search payerGroups...                                  │  │
│ │ ✅ FOUND: @BCBS_COMMERCIAL (SEMANTIC, 0.92)           │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                               │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Provider: "physicians (MD/DO)"                         │  │
│ │ Search providerGroups...                               │  │
│ │ ✅ FOUND: @PHYSICIAN_MD_DO (EXACT, 1.0)               │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                               │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Action: "add modifier 25"                              │  │
│ │ Search actionTags...                                   │  │
│ │ ✅ FOUND: @ADD (EXACT, 1.0)                           │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                               │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Procedure: "office E&M visits with minor procedures"   │  │
│ │ Search codeGroups...                                   │  │
│ │ ✅ FOUND: @E&M_MINOR_PROC (EXACT, 1.0)               │  │
│ │ Expands to: [99202, 99203, ..., 99215]                │  │
│ └────────────────────────────────────────────────────────┘  │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│ 📝 STEP 4: CODE EXPANSION                                   │
│                                                               │
│ Code Group: @E&M_MINOR_PROC                                 │
│ Expands to:                                                  │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 99202, 99203, 99204, 99205,                            │  │
│ │ 99212, 99213, 99214, 99215                             │  │
│ └────────────────────────────────────────────────────────┘  │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│ ✨ STEP 5: RULE GENERATION                                  │
│                                                               │
│ {                                                            │
│   "rule_id": "AUTO-1234567890-ABCD",                        │
│   "description": "For @BCBS_COMMERCIAL payers,              │
│                   @PHYSICIAN_MD_DO must @ADD(@25)           │
│                   modifier to @E&M_MINOR_PROC...",          │
│   "code_group": "@E&M_MINOR_PROC",                          │
│   "code": "99202,99203,99204,99205,99212,99213,99214,99215",│
│   "payer_group": "@BCBS_COMMERCIAL",                        │
│   "provider_group": "@PHYSICIAN_MD_DO",                     │
│   "action": "@ADD(@25)"                                     │
│ }                                                            │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│ ✅ STEP 6: VALIDATION                                        │
│                                                               │
│ Checks:                                                      │
│ ✅ All tags exist in lookup table                           │
│ ✅ Code groups expanded                                     │
│ ✅ No duplicates created                                    │
│ ✅ Description uses tags                                    │
│ ✅ Match types recorded                                     │
│                                                               │
│ Status: VALID ✅                                             │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│ 🎨 STEP 7: DISPLAY WITH BADGES                              │
│                                                               │
│ Description:                                                 │
│ For [BCBS_COMMERCIAL] payers, [PHYSICIAN_MD_DO] must        │
│ [ADD(@25)] modifier to [E&M_MINOR_PROC] when...             │
│                                                               │
│ Codes:                                                       │
│ [99202] [99203] [99204] [99205]                             │
│ [99212] [99213] [99214] [99215]                             │
└──────────────────────────────────────────────────────────────┘
```

---

## ✅ vs ❌ Examples

### Example 1: Code Group Matching

```
┌─────────────────────────────────────────────────────────────┐
│ ✅ CORRECT                                                   │
│                                                              │
│ Document: "Office E&M visits with minor procedures"         │
│           ↓ Check lookup table                              │
│ Lookup:   @E&M_MINOR_PROC exists                            │
│           ↓ Use existing tag                                │
│ Result:   code_group: "@E&M_MINOR_PROC"                     │
│           code: "99202,99203,99204,99205,99212,99213,       │
│                  99214,99215"                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ❌ WRONG                                                     │
│                                                              │
│ Document: "Office E&M visits with minor procedures"         │
│           ↓ Skip lookup table                               │
│ Result:   code_group: "@OFFICE_EM_VISITS" ❌                │
│           (Created duplicate when @E&M_MINOR_PROC exists)   │
└─────────────────────────────────────────────────────────────┘
```

### Example 2: Code Expansion

```
┌─────────────────────────────────────────────────────────────┐
│ ✅ CORRECT                                                   │
│                                                              │
│ code_group: "@E&M_MINOR_PROC"                               │
│ code: "99202,99203,99204,99205,99212,99213,99214,99215"    │
│       ↑ ALL 8 codes expanded                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ❌ WRONG                                                     │
│                                                              │
│ code_group: "@E&M_MINOR_PROC"                               │
│ code: "99202,99203" ❌                                       │
│       ↑ Only 2 codes (missing 6 codes)                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ❌ WRONG                                                     │
│                                                              │
│ code_group: "@E&M_MINOR_PROC"                               │
│ code: "" ❌                                                  │
│       ↑ No codes expanded                                   │
└─────────────────────────────────────────────────────────────┘
```

### Example 3: Description with Tags

```
┌─────────────────────────────────────────────────────────────┐
│ ✅ CORRECT                                                   │
│                                                              │
│ "For @BCBS_COMMERCIAL payers, @ADD(@25) modifier to         │
│  @E&M_MINOR_PROC when performed with minor procedures"      │
│  ↑ Uses tags from lookup table                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ❌ WRONG                                                     │
│                                                              │
│ "For BCBS commercial payers, add modifier 25 to E&M visits  │
│  with minor procedures" ❌                                   │
│  ↑ Plain text instead of tags                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Badge Display

```
┌──────────────────────────────────────────────────────────────┐
│ RULE DISPLAY                                                 │
│                                                               │
│ Description:                                                 │
│ For ┌──────────────────┐ payers, ┌──────────────────┐ must  │
│     │ BCBS_COMMERCIAL  │         │ PHYSICIAN_MD_DO  │       │
│     │ (Blue badge)     │         │ (Purple badge)   │       │
│     └──────────────────┘         └──────────────────┘       │
│                                                               │
│ ┌──────────┐ modifier to ┌──────────────────┐ when...       │
│ │ ADD(@25) │              │ E&M_MINOR_PROC   │              │
│ │ (Green)  │              │ (Teal badge)     │              │
│ └──────────┘              └──────────────────┘              │
│                                                               │
│ Codes:                                                       │
│ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐                    │
│ │ 99202 │ │ 99203 │ │ 99204 │ │ 99205 │                    │
│ └───────┘ └───────┘ └───────┘ └───────┘                    │
│ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐                    │
│ │ 99212 │ │ 99213 │ │ 99214 │ │ 99215 │                    │
│ └───────┘ └───────┘ └───────┘ └───────┘                    │
└──────────────────────────────────────────────────────────────┘
```

---

## 📊 Confidence Scores

```
┌─────────────────────────────────────────────────────────────┐
│ CONFIDENCE SCALE                                             │
│                                                              │
│ 1.0         ████████████████████████████████████ EXACT      │
│ 0.95        ██████████████████████████████████               │
│ 0.90        ████████████████████████████████ SEMANTIC       │
│ 0.85        ██████████████████████████████                   │
│ 0.80        ████████████████████████████                     │
│ 0.75        ██████████████████████████ KEYWORD              │
│ 0.70        ████████████████████████                         │
│ 0.65        ██████████████████████                           │
│ 0.60        ████████████████████                             │
│ 0.55        ██████████████████ CODE_OVERLAP                 │
│ 0.50        ████████████████                                 │
│ < 0.50      ████████████ NO MATCH                           │
│                                                              │
│ Auto-create threshold: > 0.8                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Quick Reference

```
┌──────────────────────────────────────────────────────────────┐
│ MATCHING PRIORITY QUICK REFERENCE                            │
├──────────────────────────────────────────────────────────────┤
│ 1️⃣ EXACT        → Confidence: 1.0      → Use immediately    │
│ 2️⃣ SEMANTIC     → Confidence: 0.85+    → Use immediately    │
│ 3️⃣ KEYWORD      → Confidence: 0.60+    → Use immediately    │
│ 4️⃣ CODE_OVERLAP → Confidence: 0.50+    → Use immediately    │
│ 5️⃣ NO MATCH     → Confidence: > 0.8    → Create new tag     │
│                 → Confidence: ≤ 0.8    → Flag for review    │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ CODE EXPANSION RULES                                         │
├──────────────────────────────────────────────────────────────┤
│ ✅ Always expand ALL codes from expands_to array            │
│ ✅ Include individual codes mentioned in document           │
│ ✅ Expand multiple code groups if needed                    │
│ ❌ Never leave code field empty for code group tags         │
│ ❌ Never use partial expansion                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ VALIDATION CHECKLIST                                         │
├──────────────────────────────────────────────────────────────┤
│ □ All tags checked against lookup table                     │
│ □ Existing tags used (no duplicates)                        │
│ □ Code groups expanded to ALL codes                         │
│ □ Description uses tags (not plain text)                    │
│ □ Match type recorded                                       │
│ □ Confidence score calculated                               │
│ □ New tags marked NEEDS_DEFINITION                          │
└──────────────────────────────────────────────────────────────┘
```

---

## 🚀 Remember

```
╔═════════════════════════════════════════════════════════════╗
║                                                              ║
║  LOOKUP TABLE FIRST - ALWAYS!                               ║
║                                                              ║
║  1. Check lookup table BEFORE creating any tag              ║
║  2. Use existing tags when found (any match type)           ║
║  3. Expand ALL codes from code groups                       ║
║  4. Create new tags ONLY when genuinely missing             ║
║  5. Never duplicate existing entities                       ║
║                                                              ║
╚═════════════════════════════════════════════════════════════╝
```
