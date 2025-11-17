# ✅ Lookup Table Integration - Complete Implementation

## Overview

A fully functional, integrated Lookup Table system with:
- **Main Lookup Table** with CRUD operations
- **SOP-Specific Lookup Tables** for each SOP
- **Auto-suggestion search** with code and tag matching
- **Automatic population** from rules
- **Code group auto-detection** from descriptions

---

## 🎯 Features Implemented

### **1. Main Lookup Table** ✅
- Full CRUD operations (Create, Read, Update, Delete)
- Search with auto-suggestions
- Organized by type (Procedure, Diagnosis, Modifier)
- Edit and delete functionality
- Real-time updates

### **2. SOP-Specific Lookup Tables** ✅
- Generated automatically for each SOP
- Contains only tags used in that SOP
- Shows all codes, code groups, payer groups, provider groups, action tags
- Similar structure to main lookup table
- Export capability

### **3. Auto-Suggestion Search** ✅
- Search by code value (e.g., "99204")
- Search by tag name (e.g., "@E&M_MINOR_PROC")
- Search by description/purpose
- Real-time dropdown with results
- Shows code expansions

### **4. Automatic Population** ✅
- New tags from rules automatically added to main lookup table
- Code groups created from rule codes
- Payer groups auto-created
- Provider groups auto-created
- Status marked as "PENDING_REVIEW"

### **5. Code Group Auto-Detection** ✅
- LLM scans rule descriptions for code values
- If code found (e.g., "99204"), checks which code group it belongs to
- Automatically populates `code_group` field
- Works for codes mentioned anywhere in rule

---

## 📁 Files Created

### **1. lookupTableService.ts**
**Location**: `/src/services/lookupTableService.ts`

**Key Methods**:
```typescript
// Search with auto-suggestion
search(query: string, limit?: number): LookupSearchResult[]

// Find code group by code value
findCodeGroupByCode(code: string): EnhancedCodeGroup | null

// Get all codes organized by type
getAllCodesByType(): { procedure, diagnosis, modifier }

// Generate SOP-specific lookup table
generateSOPLookupTable(sopId, sopName, rules): SOPLookupTable

// Auto-populate from rules
autoPopulateFromRules(rules): { newCodeGroups, newPayerGroups, ... }

// Populate code_group field in rules
populateCodeGroupsInRules(rules): AdvancedSOPRule[]

// CRUD operations
addCodeGroup(codeGroup): EnhancedCodeGroup
updateCodeGroup(tag, updates): boolean
deleteCodeGroup(tag): boolean
// ... similar for payer groups, provider groups
```

### **2. LookupTableManager.tsx**
**Location**: `/src/components/LookupTableManager.tsx`

**Features**:
- Main lookup table UI
- Search bar with auto-suggestions
- Code groups organized by type (Procedure, Diagnosis, Modifier)
- Edit/Delete buttons for each entry
- Add new entries
- Collapsible sections

### **3. SOPLookupTable.tsx**
**Location**: `/src/components/SOPLookupTable.tsx`

**Features**:
- SOP-specific lookup table UI
- Shows only tags used in that SOP
- Search functionality
- Export to JSON
- Summary statistics
- Organized by type

### **4. Updated Types**
**Location**: `/src/types/lookupTable.ts`

**Added**:
```typescript
// SOP-Specific Lookup Table
export interface SOPLookupTable {
  sop_id: string;
  sop_name: string;
  codeGroups: EnhancedCodeGroup[];
  codes: {
    code: string;
    type: 'procedure' | 'diagnosis' | 'modifier';
    description: string;
    code_group?: string;
  }[];
  payerGroups: EnhancedPayerGroup[];
  providerGroups: EnhancedProviderGroup[];
  actionTags: EnhancedActionTag[];
  chartSections: EnhancedChartSection[];
  created_date: string;
  last_updated: string;
}

// Search/Auto-suggestion types
export interface LookupSearchResult {
  type: 'code' | 'codeGroup' | 'payerGroup' | 'providerGroup' | 'actionTag' | 'chartSection';
  tag: string;
  display: string;
  description: string;
  category?: string;
  expands_to?: string[];
}
```

### **5. Updated RuleManagementContext**
**Location**: `/src/contexts/RuleManagementContext.tsx`

**Added Methods**:
```typescript
generateSOPLookupTable(sopId, sopName, rules): SOPLookupTable
populateCodeGroupsInRules(rules): AdvancedSOPRule[]
autoPopulateFromRules(rules): void
```

### **6. Updated AI Prompt Template**
**Location**: `/AI_PROMPT_TEMPLATE.md`

**Added**:
- Code group detection from descriptions
- Reverse lookup for codes in descriptions
- Auto-population requirements

---

## 🔄 How It Works

### **Main Lookup Table**

#### **Search with Auto-Suggestion**
```typescript
// User types in search bar
const { lookupTableService } = useRuleManagement();

// Search supports:
// 1. Code values: "99204" → finds code groups containing this code
// 2. Tag names: "@E&M" → finds tags matching this
// 3. Descriptions: "office visit" → finds tags with this in description

const results = lookupTableService.search("99204");
// Returns:
// [
//   {
//     type: 'code',
//     tag: '@E&M_MINOR_PROC',
//     display: 'Code 99204 in @E&M_MINOR_PROC',
//     description: 'Office E&M visits with minor procedures',
//     expands_to: ['99202', '99203', '99204', '99205', ...]
//   }
// ]
```

#### **CRUD Operations**
```typescript
// Add new code group
lookupTableService.addCodeGroup({
  tag: '@NEW_GROUP',
  type: 'procedure',
  expands_to: ['12345', '12346'],
  purpose: 'Description of code group',
  status: 'ACTIVE',
  created_by: 'USER'
});

// Update code group
lookupTableService.updateCodeGroup('@NEW_GROUP', {
  purpose: 'Updated description',
  expands_to: ['12345', '12346', '12347']
});

// Delete code group
lookupTableService.deleteCodeGroup('@NEW_GROUP');

// Get updated tables
const updatedTables = lookupTableService.getUpdatedLookupTables();
```

### **SOP-Specific Lookup Table**

#### **Generation**
```typescript
const { generateSOPLookupTable } = useRuleManagement();

// Generate lookup table for specific SOP
const sopLookupTable = generateSOPLookupTable(
  'SOP-001',
  'POS 11 - Office Procedures',
  rules
);

// Result contains only tags used in this SOP:
// {
//   sop_id: 'SOP-001',
//   sop_name: 'POS 11 - Office Procedures',
//   codeGroups: [only code groups used in rules],
//   codes: [all individual codes with their code groups],
//   payerGroups: [only payer groups used],
//   providerGroups: [only provider groups used],
//   actionTags: [only action tags used],
//   ...
// }
```

#### **Display in View SOP Page**
```tsx
import { SOPLookupTable } from '@/components/SOPLookupTable';

const ViewSOPPage = ({ sop, rules }) => {
  const { generateSOPLookupTable } = useRuleManagement();
  
  const sopLookupTable = useMemo(() => 
    generateSOPLookupTable(sop.id, sop.name, rules),
    [sop.id, sop.name, rules]
  );

  return (
    <div>
      {/* SOP details */}
      
      {/* SOP-specific lookup table */}
      <SOPLookupTable lookupTable={sopLookupTable} />
    </div>
  );
};
```

### **Automatic Population from Rules**

#### **When Rules are Created**
```typescript
const { autoPopulateFromRules } = useRuleManagement();

// After LLM extracts rules or user creates rules
const newRules = [
  {
    rule_id: 'AUTO-001',
    code_group: '@NEW_CODE_GROUP', // Not in lookup table yet
    code: '12345,12346',
    payer_group: '@NEW_PAYER',
    description: 'New rule with new tags'
  }
];

// Auto-populate lookup table
autoPopulateFromRules(newRules);

// This will:
// 1. Check if @NEW_CODE_GROUP exists → NO
// 2. Create new code group with codes [12345, 12346]
// 3. Add to main lookup table with status PENDING_REVIEW
// 4. Check if @NEW_PAYER exists → NO
// 5. Create new payer group
// 6. Add to main lookup table with status PENDING_REVIEW
```

### **Code Group Auto-Detection**

#### **LLM Behavior**
```
Document text:
"For code 99204, add modifier 25 when performed with procedure"

LLM processing:
1. Extract code "99204" from description
2. Check lookup table: Does 99204 belong to a code group?
3. FOUND: 99204 is in @E&M_MINOR_PROC
4. Populate code_group field with @E&M_MINOR_PROC
5. Expand all codes from @E&M_MINOR_PROC to code field

Rule output:
{
  rule_id: 'AUTO-001',
  description: 'For code 99204, add modifier 25 when performed with procedure',
  code_group: '@E&M_MINOR_PROC',  // ← Auto-populated
  code: '99202,99203,99204,99205,99212,99213,99214,99215',  // ← Expanded
  action: '@ADD(@25)'
}
```

#### **Service Method**
```typescript
const { populateCodeGroupsInRules } = useRuleManagement();

// Rules without code_group populated
const rules = [
  {
    rule_id: 'AUTO-001',
    code: '99204',
    description: 'Add modifier 25 to 99204'
  }
];

// Populate code groups
const updatedRules = populateCodeGroupsInRules(rules);

// Result:
// [
//   {
//     rule_id: 'AUTO-001',
//     code: '99204',
//     code_group: '@E&M_MINOR_PROC',  // ← Added
//     description: 'Add modifier 25 to 99204'
//   }
// ]
```

---

## 📊 Example Scenarios

### **Scenario 1: User Searches for Code**

**User Action**: Types "99204" in search bar

**System Response**:
```
Auto-suggestion dropdown shows:

┌─────────────────────────────────────────────────────────┐
│ Code 99204 in @E&M_MINOR_PROC                 [code]   │
│ Office E&M visits with minor procedures                │
│ 99202, 99203, 99204, 99205, 99212, 99213, ...          │
├─────────────────────────────────────────────────────────┤
│ @E&M_MINOR_PROC (procedure)              [codeGroup]   │
│ Office E&M visits with minor procedures                │
│ 99202, 99203, 99204, 99205, 99212, 99213, ...          │
└─────────────────────────────────────────────────────────┘
```

### **Scenario 2: LLM Creates Rules with New Tags**

**Document**: "For BCBS Advantage plans, add modifier 25 to codes 12345, 12346"

**LLM Output**:
```json
{
  "rules": [
    {
      "rule_id": "AUTO-001",
      "code_group": "@BCBS_ADVANTAGE_CODES",
      "code": "12345,12346",
      "payer_group": "@BCBS_ADVANTAGE",
      "action": "@ADD(@25)"
    }
  ]
}
```

**System Action**:
1. Check if `@BCBS_ADVANTAGE_CODES` exists → NO
2. Create new code group:
   ```json
   {
     "tag": "@BCBS_ADVANTAGE_CODES",
     "type": "procedure",
     "expands_to": ["12345", "12346"],
     "purpose": "Auto-created from rule AUTO-001",
     "status": "PENDING_REVIEW",
     "created_by": "AI"
   }
   ```
3. Check if `@BCBS_ADVANTAGE` exists → NO
4. Create new payer group:
   ```json
   {
     "tag": "@BCBS_ADVANTAGE",
     "name": "BCBS Advantage",
     "type": "other",
     "status": "PENDING_REVIEW",
     "created_by": "AI"
   }
   ```
5. Add both to main lookup table
6. User can review and approve/edit in Main Lookup Table

### **Scenario 3: View SOP Page**

**User Action**: Opens "POS 11 - Office Procedures" SOP

**System Display**:
```
┌─────────────────────────────────────────────────────────┐
│ SOP Lookup Table                                        │
│ POS 11 - Office Procedures                    [Export] │
├─────────────────────────────────────────────────────────┤
│ [Search codes, tags, or descriptions...]               │
│                                                         │
│ ┌──────┬──────┬──────────┬──────────┬────────────┐    │
│ │ Code │Codes │  Payer   │ Provider │   Action   │    │
│ │Groups│      │  Groups  │  Groups  │    Tags    │    │
│ ├──────┼──────┼──────────┼──────────┼────────────┤    │
│ │  3   │ 15   │    2     │    1     │     4      │    │
│ └──────┴──────┴──────────┴──────────┴────────────┘    │
├─────────────────────────────────────────────────────────┤
│ ▼ Code Groups (3)                                       │
│                                                         │
│   Procedure Codes (2)                                   │
│   ┌─────────────────────────────────────────────────┐  │
│   │ @E&M_MINOR_PROC (procedure)          8 codes    │  │
│   │ Office E&M visits with minor procedures         │  │
│   │ 99202 99203 99204 99205 99212 99213 99214 99215 │  │
│   └─────────────────────────────────────────────────┘  │
│                                                         │
│   Modifiers (1)                                         │
│   ┌─────────────────────────────────────────────────┐  │
│   │ @MODIFIER_25 (modifier)              1 code     │  │
│   │ Significant, separately identifiable E&M        │  │
│   │ 25                                               │  │
│   └─────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│ ▼ Individual Codes (15)                                 │
│                                                         │
│   Procedure Codes (12)                                  │
│   ┌─────────────────────────────────────────────────┐  │
│   │ 99202 (procedure)           @E&M_MINOR_PROC     │  │
│   │ Office visit for new patient                    │  │
│   └─────────────────────────────────────────────────┘  │
│   ...                                                   │
└─────────────────────────────────────────────────────────┘
```

### **Scenario 4: Edit Main Lookup Table**

**User Action**: Clicks "Edit" on `@E&M_MINOR_PROC`

**System Display**:
```
┌─────────────────────────────────────────────────────────┐
│ Edit Code Group                                         │
├─────────────────────────────────────────────────────────┤
│ Tag: @E&M_MINOR_PROC                      [disabled]    │
│                                                         │
│ Type: [Procedure ▼]                                     │
│                                                         │
│ Codes (comma-separated):                                │
│ ┌─────────────────────────────────────────────────────┐│
│ │ 99202, 99203, 99204, 99205, 99212, 99213, 99214,   ││
│ │ 99215                                                ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ Purpose:                                                │
│ ┌─────────────────────────────────────────────────────┐│
│ │ Office E&M visits with minor procedures             ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ Status: [Active ▼]                                      │
│                                                         │
│                                    [Cancel]  [Save]     │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 UI Integration

### **Main Lookup Table Page**
```tsx
import { LookupTableManager } from '@/components/LookupTableManager';
import { useRuleManagement } from '@/contexts/RuleManagementContext';

const LookupTablePage = () => {
  const { enhancedLookupTables, updateLookupTables } = useRuleManagement();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Lookup Table Management</h1>
      
      <LookupTableManager
        lookupTables={enhancedLookupTables}
        onUpdate={updateLookupTables}
      />
    </div>
  );
};
```

### **View SOP Page with Lookup Table**
```tsx
import { SOPLookupTable } from '@/components/SOPLookupTable';
import { useRuleManagement } from '@/contexts/RuleManagementContext';

const ViewSOPPage = ({ sopId, sopName, rules }) => {
  const { generateSOPLookupTable } = useRuleManagement();

  const sopLookupTable = useMemo(() => 
    generateSOPLookupTable(sopId, sopName, rules),
    [sopId, sopName, rules]
  );

  return (
    <div>
      {/* SOP Details Section */}
      <Card>
        <CardHeader>
          <CardTitle>{sopName}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* SOP info */}
        </CardContent>
      </Card>

      {/* Rules Section */}
      <Card>
        <CardHeader>
          <CardTitle>Rules ({rules.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Rules table */}
        </CardContent>
      </Card>

      {/* SOP Lookup Table Section */}
      <Card>
        <CardHeader>
          <CardTitle>SOP Lookup Table</CardTitle>
        </CardHeader>
        <CardContent>
          <SOPLookupTable lookupTable={sopLookupTable} />
        </CardContent>
      </Card>
    </div>
  );
};
```

### **Rule Creation with Auto-Population**
```tsx
const handleRuleCreation = async (newRules: AdvancedSOPRule[]) => {
  const { autoPopulateFromRules, populateCodeGroupsInRules } = useRuleManagement();

  // 1. Populate code groups from code values
  const rulesWithCodeGroups = populateCodeGroupsInRules(newRules);

  // 2. Auto-populate lookup table with new tags
  autoPopulateFromRules(rulesWithCodeGroups);

  // 3. Save rules
  await saveRules(rulesWithCodeGroups);

  toast.success('Rules created and lookup table updated!');
};
```

---

## ✅ Benefits

### **For Users**
- ✅ **Easy Search** - Find codes and tags instantly
- ✅ **Auto-Suggestions** - See relevant results as you type
- ✅ **SOP-Specific View** - See only what's relevant to each SOP
- ✅ **Edit Capability** - Update descriptions and codes easily
- ✅ **Export** - Download SOP lookup tables

### **For Data Quality**
- ✅ **Automatic Population** - No manual entry needed
- ✅ **Code Group Detection** - Codes automatically linked to groups
- ✅ **Consistency** - All tags validated against lookup table
- ✅ **Traceability** - Every tag has description and purpose

### **For Compliance**
- ✅ **Complete Documentation** - Every tag documented
- ✅ **Audit Trail** - Track when tags created and by whom
- ✅ **Review Workflow** - New tags marked for review
- ✅ **Export Capability** - Generate reports

---

## 🚀 Summary

**The Lookup Table Integration provides:**

1. ✅ **Main Lookup Table** with full CRUD operations
2. ✅ **SOP-Specific Lookup Tables** for each SOP
3. ✅ **Auto-Suggestion Search** for codes and tags
4. ✅ **Automatic Population** from rules
5. ✅ **Code Group Auto-Detection** from descriptions
6. ✅ **Edit/Delete Functionality** in main table
7. ✅ **Organized by Type** (Procedure, Diagnosis, Modifier)
8. ✅ **Export Capability** for SOP lookup tables
9. ✅ **Real-Time Updates** across all components
10. ✅ **Complete Integration** with rule system

**Every code and tag is now fully documented and searchable!** 🎉
