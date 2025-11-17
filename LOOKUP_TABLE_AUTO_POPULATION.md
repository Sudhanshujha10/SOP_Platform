# ✅ Lookup Table Auto-Population - Complete Implementation

## Overview

Automatic lookup table population system that discovers and adds new code groups and codes from uploaded documents. Ensures the lookup table stays synchronized with codes found in SOP documents.

---

## 🎯 Problem Solved

**Issue**: Code groups used in rules but not in lookup table cause validation errors and incomplete code expansion.

**Solution**: Automatically discover code groups and codes from documents, suggest additions to lookup table, and allow review/approval before adding.

---

## 📁 Files Created

### 1. **lookupTableAutoPopulationService.ts**
**Location**: `/src/services/lookupTableAutoPopulationService.ts`

**Purpose**: Core service for discovering and auto-populating lookup table

**Key Features**:
- Discovers code groups from document text and rules
- Discovers individual codes not in lookup table
- Generates suggestions for review
- Auto-applies approved suggestions
- Updates lookup tables

**Key Methods**:
```typescript
// Discover code groups from document and rules
discoverCodeGroups(documentText: string, documentName: string, rules: AdvancedSOPRule[]): DiscoveredCodeGroup[]

// Discover individual codes not in lookup table
discoverNewCodes(documentText: string, rules: AdvancedSOPRule[]): DiscoveredCode[]

// Auto-populate lookup table with discovered items
autoPopulateLookupTable(
  documentText: string,
  documentName: string,
  rules: AdvancedSOPRule[],
  options?: { autoApprove?: boolean; minConfidence?: number }
): AutoPopulationResult

// Apply a single suggestion
applySuggestion(suggestion: AutoPopulationSuggestion): { success: boolean; message: string }

// Apply multiple suggestions
applySuggestions(suggestions: AutoPopulationSuggestion[]): { applied: number; failed: number; messages: string[] }
```

### 2. **LookupTableSuggestions.tsx**
**Location**: `/src/components/LookupTableSuggestions.tsx`

**Purpose**: UI component for reviewing and approving suggestions

**Features**:
- Visual display of all suggestions
- Approve/reject individual suggestions
- Approve/reject all at once
- Color-coded priority levels
- Expandable details for each suggestion

### 3. **Updated RuleManagementContext.tsx**
**Location**: `/src/contexts/RuleManagementContext.tsx`

**Added**:
- `lookupTableAutoPopulationService` instance
- `autoPopulateLookupTable()` function
- `applySuggestion()` function
- `applySuggestions()` function

---

## 🔄 How It Works

### Step 1: Document Upload & Rule Extraction
```
User uploads SOP document
    ↓
LLM extracts rules
    ↓
Some rules use code groups not in lookup table
```

### Step 2: Auto-Discovery
```typescript
const { autoPopulateLookupTable } = useRuleManagement();

// After rules are extracted
const result = autoPopulateLookupTable(documentText, documentName, extractedRules);

// Result contains:
// - newCodeGroups: Discovered code groups
// - updatedCodeGroups: Existing groups with new codes
// - suggestions: Items needing review
// - warnings: Issues found
```

### Step 3: Discovery Process

#### A. Discover from Rules
```
For each rule:
  If rule.code_group exists:
    Check if code_group in lookup table
    If NOT in lookup table:
      Create DiscoveredCodeGroup:
        - tag: rule.code_group
        - codes: rule.code (split by comma)
        - purpose: inferred from rule.description
        - confidence: 0.8
        - source: 'rule'
```

#### B. Discover from Document Patterns
```
Scan document for patterns like:
  "The URODYNAMICS_PANEL includes:"
  - 51728: Complex cystometrogram
  - 51729: Complex cystometrogram with voiding pressure
  - 51741: Complex uroflowmetry
  - 51797: Voiding pressure studies
  - 51798: Measurement of post-voiding residual urine

Extract:
  - tag: @URODYNAMICS_PANEL
  - codes: [51728, 51729, 51741, 51797, 51798]
  - purpose: "urodynamics panel"
  - confidence: 0.85
  - source: 'document'
```

#### C. Discover Individual Codes
```
For each code in rules:
  If code NOT in lookup table:
    Try to find which code group it should belong to
    Create DiscoveredCode:
      - code: "51797"
      - suggestedCodeGroup: "@URODYNAMICS_PANEL"
      - confidence: 0.7
```

### Step 4: Generate Suggestions
```
For each discovered item:
  If confidence >= minConfidence (default 0.7):
    If code group doesn't exist:
      Create "new_code_group" suggestion
    Else if code group exists but missing codes:
      Create "expand_code_group" suggestion
    Else if individual code without group:
      Create "new_code" suggestion
```

### Step 5: Review & Approve
```tsx
<LookupTableSuggestions
  suggestions={result.suggestions}
  onApprove={(suggestion) => {
    const result = applySuggestion(suggestion);
    if (result.success) {
      toast.success(result.message);
    }
  }}
  onReject={(suggestion) => {
    // Remove from suggestions
  }}
  onApproveAll={() => {
    const result = applySuggestions(result.suggestions);
    toast.success(`Applied ${result.applied} suggestions`);
  }}
/>
```

### Step 6: Apply to Lookup Table
```
When approved:
  If new_code_group:
    Add to lookupTables.codeGroups
  If expand_code_group:
    Find existing group
    Add new codes to expands_to array
  If new_code:
    Find target code group
    Add code to expands_to array
    
Update context:
  setEnhancedLookupTables(updatedTables)
```

---

## 📊 Example Scenario

### Input Document
```
POS 11 SOP - Urodynamics Procedures

The URODYNAMICS_PANEL includes:
- 51728: Complex cystometrogram
- 51729: Complex cystometrogram with voiding pressure
- 51741: Complex uroflowmetry
- 51797: Voiding pressure studies
- 51798: Measurement of post-voiding residual urine

For ALL payers, if 51728 or 51729 is documented, then ALWAYS_LINK_SECONDARY(51797)
```

### LLM Creates Rule
```json
{
  "rule_id": "AUTO-001",
  "code_group": "@URODYNAMICS_PANEL",
  "code": "51728,51729,51741,51797,51798",
  "payer_group": "@ALL",
  "action": "@ALWAYS_LINK_SECONDARY(51797)"
}
```

### Auto-Discovery Finds
```
❌ Code Group @URODYNAMICS_PANEL not in lookup table

Discovered:
  Tag: @URODYNAMICS_PANEL
  Codes: [51728, 51729, 51741, 51797, 51798]
  Purpose: "urodynamics panel"
  Confidence: 0.85
  Source: document + rule
```

### Suggestion Generated
```
Type: new_code_group
Priority: high
Message: "New code group discovered: @URODYNAMICS_PANEL with 5 codes"
Action: Add to lookup table

Data:
  tag: "@URODYNAMICS_PANEL"
  type: "procedure"
  expands_to: ["51728", "51729", "51741", "51797", "51798"]
  purpose: "Urodynamic testing procedures"
  status: "PENDING_REVIEW"
  created_by: "AI"
  confidence_score: 0.85
  source_document: "POS 11 SOP"
```

### User Reviews & Approves
```
User clicks "Approve" button
    ↓
applySuggestion() called
    ↓
New code group added to lookup table
    ↓
Lookup tables updated in context
    ↓
All services refreshed with new lookup table
    ↓
✅ Success: "Added code group @URODYNAMICS_PANEL"
```

### Result
```
Lookup Table now contains:
  @URODYNAMICS_PANEL:
    expands_to: [51728, 51729, 51741, 51797, 51798]
    purpose: "Urodynamic testing procedures"
    status: "ACTIVE"
    created_by: "AI"
    confidence_score: 0.85

Future rules using @URODYNAMICS_PANEL:
  ✅ Will pass validation
  ✅ Will expand to all 5 codes
  ✅ No more "code group not found" errors
```

---

## 🎨 UI Components

### Suggestion Card - New Code Group
```
┌────────────────────────────────────────────────────────────┐
│ ▼ 📝 New Code Group Discovered          [high]            │
│                                    [Approve] [Reject]      │
├────────────────────────────────────────────────────────────┤
│ New code group discovered: @URODYNAMICS_PANEL with 5 codes│
│                                                             │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Tag: [@URODYNAMICS_PANEL]   Type: [procedure]       │   │
│ │                                                       │   │
│ │ Purpose: Urodynamic testing procedures               │   │
│ │                                                       │   │
│ │ Codes (5):                                           │   │
│ │ [51728] [51729] [51741] [51797] [51798]             │   │
│ │                                                       │   │
│ │ Source: document | Confidence: 85% | Document: POS 11│   │
│ └──────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

### Suggestion Card - Expand Code Group
```
┌────────────────────────────────────────────────────────────┐
│ ▼ ✏️ Expand Existing Code Group         [high]            │
│                                    [Approve] [Reject]      │
├────────────────────────────────────────────────────────────┤
│ Add 2 new codes to @URODYNAMICS_PANEL: 51799, 51800       │
│                                                             │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Code Group: [@URODYNAMICS_PANEL]                     │   │
│ │                                                       │   │
│ │ New Codes to Add (2):                                │   │
│ │ [+ 51799] [+ 51800]                                  │   │
│ └──────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

### Summary Header
```
┌────────────────────────────────────────────────────────────┐
│ Lookup Table Suggestions                                   │
│ Review and approve auto-discovered code groups and codes   │
│                          [Approve All (3)] [Reject All]    │
├────────────────────────────────────────────────────────────┤
│ [2] High Priority  [1] Medium Priority  [0] Low Priority   │
└────────────────────────────────────────────────────────────┘
```

---

## 🔧 Integration

### Step 1: Use in Document Upload Flow

```typescript
import { useRuleManagement } from '@/contexts/RuleManagementContext';
import { LookupTableSuggestions } from '@/components/LookupTableSuggestions';

const DocumentUpload = () => {
  const { autoPopulateLookupTable, applySuggestion, applySuggestions } = useRuleManagement();
  const [suggestions, setSuggestions] = useState<AutoPopulationSuggestion[]>([]);

  const handleDocumentProcessed = async (
    documentText: string,
    documentName: string,
    extractedRules: AdvancedSOPRule[]
  ) => {
    // Auto-discover code groups and codes
    const result = autoPopulateLookupTable(documentText, documentName, extractedRules);
    
    // Show suggestions to user
    if (result.suggestions.length > 0) {
      setSuggestions(result.suggestions);
      setShowSuggestionsDialog(true);
    }
    
    // Show warnings
    if (result.warnings.length > 0) {
      result.warnings.forEach(warning => toast.warning(warning));
    }
    
    // Log results
    console.log(`Discovered ${result.newCodeGroups.length} new code groups`);
    console.log(`Updated ${result.updatedCodeGroups.length} existing code groups`);
    console.log(`Found ${result.newCodes.length} new codes`);
  };

  return (
    <div>
      {/* Document upload UI */}
      
      {/* Suggestions dialog */}
      {showSuggestionsDialog && (
        <Dialog open={showSuggestionsDialog} onOpenChange={setShowSuggestionsDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <LookupTableSuggestions
              suggestions={suggestions}
              onApprove={(suggestion) => {
                const result = applySuggestion(suggestion);
                if (result.success) {
                  toast.success(result.message);
                  // Remove from suggestions
                  setSuggestions(prev => prev.filter(s => s !== suggestion));
                } else {
                  toast.error(result.message);
                }
              }}
              onReject={(suggestion) => {
                setSuggestions(prev => prev.filter(s => s !== suggestion));
              }}
              onApproveAll={() => {
                const result = applySuggestions(suggestions);
                toast.success(`Applied ${result.applied} suggestions`);
                if (result.failed > 0) {
                  toast.error(`Failed to apply ${result.failed} suggestions`);
                }
                setSuggestions([]);
                setShowSuggestionsDialog(false);
              }}
              onRejectAll={() => {
                setSuggestions([]);
                setShowSuggestionsDialog(false);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
```

### Step 2: Auto-Approve Mode (Optional)

```typescript
// Auto-approve high-confidence suggestions
const result = autoPopulateLookupTable(
  documentText,
  documentName,
  extractedRules,
  {
    autoApprove: true,  // Automatically add to lookup table
    minConfidence: 0.85  // Only auto-approve if confidence >= 85%
  }
);

// Only show suggestions that need manual review
setSuggestions(result.suggestions.filter(s => !s.autoApply));
```

---

## 📋 Discovery Patterns

### Pattern 1: From Rules
```
Rule has:
  code_group: "@NEW_GROUP"
  code: "12345,12346,12347"
  description: "For surgical procedures..."

Discovered:
  tag: "@NEW_GROUP"
  codes: ["12345", "12346", "12347"]
  purpose: "surgical procedures" (inferred from description)
  confidence: 0.8
  source: 'rule'
```

### Pattern 2: From Document Text
```
Document contains:
  "The SURGICAL_PANEL includes:"
  "- 12345: Procedure A"
  "- 12346: Procedure B"
  "- 12347: Procedure C"

Discovered:
  tag: "@SURGICAL_PANEL"
  codes: ["12345", "12346", "12347"]
  purpose: "surgical panel"
  confidence: 0.85
  source: 'document'
```

### Pattern 3: Individual Codes
```
Rule has:
  code: "12345,12346"
  code_group: "@EXISTING_GROUP"

Lookup table has:
  @EXISTING_GROUP: [12345]

Discovered:
  code: "12346"
  suggestedCodeGroup: "@EXISTING_GROUP"
  confidence: 0.7
```

---

## ✅ Benefits

### For Data Quality
1. ✅ **No Missing Code Groups** - All used groups are in lookup table
2. ✅ **Complete Code Expansion** - All codes properly mapped
3. ✅ **Consistent Tagging** - Same code groups used across documents
4. ✅ **Audit Trail** - Track when/how code groups were added

### For Users
1. ✅ **Automatic Discovery** - No manual lookup table maintenance
2. ✅ **Review Before Apply** - Control over what gets added
3. ✅ **Clear Suggestions** - Easy to understand what's being added
4. ✅ **Batch Operations** - Approve/reject multiple at once

### For Compliance
1. ✅ **Source Tracking** - Know which document introduced each group
2. ✅ **Confidence Scores** - Understand reliability of auto-discoveries
3. ✅ **Manual Override** - Can reject low-confidence suggestions
4. ✅ **Complete History** - Track all lookup table changes

---

## 🚀 Summary

**The Auto-Population System provides:**

1. ✅ **Automatic discovery** of code groups from documents and rules
2. ✅ **Pattern recognition** for common document structures
3. ✅ **Confidence scoring** for each discovery
4. ✅ **Review interface** for approving/rejecting suggestions
5. ✅ **Batch operations** for efficiency
6. ✅ **Automatic lookup table updates** when approved
7. ✅ **Source tracking** for audit trail

**Result**: Lookup table stays synchronized with codes found in documents! 🎉
