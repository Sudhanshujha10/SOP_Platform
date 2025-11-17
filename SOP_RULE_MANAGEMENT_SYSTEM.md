# SOP Rule Management System - Complete Implementation Guide

## Overview
This document describes the comprehensive SOP rule management system with automatic lookup table integration, dynamic tag creation, and AI-powered document processing.

## System Architecture

### Core Components

#### 1. Enhanced Lookup Table System (`/src/types/lookupTable.ts`)
- **Purpose**: Auto-expanding lookup tables with status tracking
- **Features**:
  - Tag status tracking (ACTIVE, NEEDS_DEFINITION, PENDING_REVIEW, DEPRECATED)
  - Usage count tracking for each tag
  - Confidence scores for AI-created tags
  - Source document tracking
  - Created by tracking (SYSTEM, AI, USER)

**Key Types**:
```typescript
- EnhancedCodeGroup: Procedure/diagnosis/modifier groups with expansion
- EnhancedPayerGroup: Insurance payer groups
- EnhancedProviderGroup: Provider type groups
- EnhancedActionTag: Rule action types
- EnhancedChartSection: Chart documentation sections
```

#### 2. Tag Validation Service (`/src/services/tagValidationService.ts`)
- **Purpose**: Validate tags against lookup tables and auto-create missing tags
- **Key Methods**:
  - `extractTagsFromDescription()`: Extract all @tags from rule description
  - `extractAllTagsFromRule()`: Extract tags from all rule fields
  - `validateTag()`: Check if tag exists in lookup tables
  - `validateRule()`: Comprehensive rule validation
  - `autoPopulateCodesFromTag()`: Expand tag to actual codes
  - `createNewTag()`: Auto-create missing tags
  - `incrementTagUsage()`: Track tag usage
  - `canDeleteTag()`: Prevent deletion of tags in use

#### 3. Document Processing Service (`/src/services/documentProcessingService.ts`)
- **Purpose**: AI-powered document processing and rule extraction
- **Key Methods**:
  - `processDocument()`: Main document processing workflow
  - `extractRuleCandidates()`: AI extraction of rule candidates
  - `autoPopulateCodesFromTags()`: Auto-expand code group tags
  - `generateRuleId()`: Generate unique rule IDs
  - `validateBulkImport()`: Validate bulk rule imports

#### 4. Rule Status Indicator Component (`/src/components/RuleStatusIndicator.tsx`)
- **Purpose**: Visual status system with color-coded badges
- **Components**:
  - `RuleStatusIndicator`: Shows rule validation status
  - `TagStatusBadge`: Shows individual tag status

## Workflow

### 1. Document Upload Workflow

```
User uploads document
    ↓
DocumentProcessingService.processDocument()
    ↓
Extract rule candidates (AI/LLM)
    ↓
For each rule:
    ↓
    TagValidationService.validateRule()
        ↓
        Extract all tags from rule
        ↓
        Validate each tag against lookup tables
        ↓
        If tag missing:
            ↓
            Suggest tag type (payer/procedure/action/etc)
            ↓
            Create TagCreationRequest
            ↓
            If confidence > 0.8:
                Auto-create tag with NEEDS_DEFINITION status
            Else:
                Flag for manual review
    ↓
    Auto-populate codes from code group tags
    ↓
    Increment usage count for existing tags
    ↓
    Return validation result
    ↓
Display rules with status indicators
```

### 2. Tag Auto-Creation Logic

**When a tag is not found in lookup tables**:

1. **Analyze tag name** to suggest type:
   - Contains BCBS/AETNA/CIGNA/etc → `payerGroup`
   - Contains PHYSICIAN/PROVIDER/MD/DO → `providerGroup`
   - Starts with ADD/REMOVE/SWAP/LINK → `actionTag`
   - Contains SECTION/HPI/ASSESSMENT → `chartSection`
   - Default → `codeGroup`

2. **Create tag entry** with:
   - Status: `NEEDS_DEFINITION`
   - Created by: `AI`
   - Confidence score
   - Source document reference
   - Usage count: 0

3. **Flag for review** if confidence < 0.8

### 3. Code Auto-Population

**When a rule uses a code group tag**:

```typescript
Rule: { code: "@URODYNAMICS_PANEL" }
    ↓
TagValidationService.autoPopulateCodesFromTag("@URODYNAMICS_PANEL")
    ↓
Lookup in codeGroups table
    ↓
Found: { expands_to: ['51728', '51729', '51741', '51797', '51798'] }
    ↓
Rule updated: { code: "51728,51729,51741,51797,51798" }
```

### 4. Visual Status System

**Color Coding**:
- ✅ **Green (Valid)**: All tags defined, rule approved
- ⚠️ **Orange (Needs Review)**: Missing definitions, new tags, low confidence
- ❌ **Red (Invalid)**: Invalid tags, conflicting rules, missing requirements
- 🕐 **Gray (Pending)**: Awaiting processing

**Badge Colors by Type**:
- **Blue**: Payer groups
- **Teal**: Code groups (procedures/diagnoses)
- **Purple**: Provider groups
- **Green**: ADD actions
- **Red**: REMOVE actions
- **Orange**: Chart sections
- **Gray**: Other/conditional actions

## Integration Guide

### Step 1: Initialize Services

```typescript
import { TagValidationService } from '@/services/tagValidationService';
import { DocumentProcessingService } from '@/services/documentProcessingService';
import { lookupTables } from '@/data/lookupTables';

// Convert existing lookup tables to enhanced format
const enhancedLookupTables = convertToEnhancedFormat(lookupTables);

// Initialize services
const tagValidationService = new TagValidationService(enhancedLookupTables);
const documentProcessingService = new DocumentProcessingService(tagValidationService);
```

### Step 2: Process Document Upload

```typescript
const handleDocumentUpload = async (file: File) => {
  const content = await file.text();
  
  const result = await documentProcessingService.processDocument(
    content,
    file.name,
    'bulk' // or 'new' or 'update'
  );

  // Display results
  console.log('Extracted Rules:', result.extractedRules);
  console.log('New Tags:', result.newTagsCreated);
  console.log('Summary:', result.summary);
  
  // Show rules with status indicators
  result.extractedRules.forEach(extracted => {
    renderRuleWithStatus(extracted.rule, extracted.validation);
  });
};
```

### Step 3: Validate Rule Before Saving

```typescript
const handleSaveRule = (rule: Partial<AdvancedSOPRule>) => {
  const validation = tagValidationService.validateRule(rule);
  
  if (validation.status === 'INVALID') {
    alert('Cannot save invalid rule: ' + validation.errors.join(', '));
    return;
  }
  
  if (validation.status === 'NEEDS_REVIEW') {
    // Show review dialog with new tags
    showReviewDialog(rule, validation);
    return;
  }
  
  // Save rule
  saveRule(rule);
};
```

### Step 4: Display Rules with Status

```typescript
import { RuleStatusIndicator, TagStatusBadge } from '@/components/RuleStatusIndicator';

const RuleRow = ({ rule, validation }) => (
  <tr>
    <td>{rule.rule_id}</td>
    <td>
      {rule.description}
      <RuleStatusIndicator validation={validation} showDetails />
    </td>
    <td>
      {rule.payer_group && (
        <TagStatusBadge 
          tag={rule.payer_group}
          status="ACTIVE"
          type="payerGroup"
        />
      )}
    </td>
  </tr>
);
```

## Data Consistency Rules

### 1. Tag Reference Integrity
- Every tag used in a rule MUST exist in lookup tables
- System prevents saving rules with invalid tags
- Auto-creation ensures no dangling references

### 2. Usage Tracking
- Every time a tag is used, increment `usage_count`
- Update `last_used` timestamp
- Prevents deletion of tags in use

### 3. Code Expansion
- Code group tags automatically expand to actual codes
- Codes are populated in rule's `code` field
- Original tag is preserved in description

### 4. Status Workflow
```
New Tag Created (AI)
    ↓
Status: NEEDS_DEFINITION
    ↓
User Reviews & Defines
    ↓
Status: PENDING_REVIEW
    ↓
Admin Approves
    ↓
Status: ACTIVE
```

## Filter System (To Be Implemented)

**Filter Options**:
- Show All Rules
- Valid Rules Only
- Needs Review
- Invalid Rules
- New Tags Detected
- High Confidence (>0.8)
- Low Confidence (<0.8)
- By Payer Group
- By Provider Group
- By Action Type
- By Status

## API Integration Points

### For AI/LLM Service

The `DocumentProcessingService.extractRuleCandidates()` method is a placeholder for your AI integration:

```typescript
// Expected AI/LLM Input
{
  documentContent: string,
  documentName: string,
  processingType: 'new' | 'update' | 'bulk'
}

// Expected AI/LLM Output
{
  rule: {
    rule_id?: string,
    description: string, // With inline @tags
    code: string, // @CODE_GROUP or actual codes
    payer_group: string | string[], // @PAYER tags
    provider_group: string | string[], // @PROVIDER tags
    action: string | string[], // @ACTION tags
    modifiers?: string,
    documentation_trigger?: string,
    chart_section?: string,
    effective_date?: string,
    end_date?: string,
    reference?: string
  },
  confidence: number, // 0.0 to 1.0
  source_text: string // Original text from document
}[]
```

## Database Schema Updates Needed

### Enhanced Lookup Tables
```sql
-- Add to existing lookup tables
ALTER TABLE code_groups ADD COLUMN status VARCHAR(20) DEFAULT 'ACTIVE';
ALTER TABLE code_groups ADD COLUMN created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE code_groups ADD COLUMN created_by VARCHAR(10);
ALTER TABLE code_groups ADD COLUMN confidence_score FLOAT;
ALTER TABLE code_groups ADD COLUMN source_document VARCHAR(255);
ALTER TABLE code_groups ADD COLUMN usage_count INT DEFAULT 0;
ALTER TABLE code_groups ADD COLUMN last_used TIMESTAMP;

-- Repeat for payer_groups, provider_groups, action_tags, chart_sections
```

### Rule Validation Tracking
```sql
CREATE TABLE rule_validations (
  id SERIAL PRIMARY KEY,
  rule_id VARCHAR(50) REFERENCES sop_rules(rule_id),
  validation_status VARCHAR(20), -- VALID, NEEDS_REVIEW, INVALID
  validation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  errors JSONB,
  warnings JSONB,
  missing_tags JSONB,
  new_tags_created JSONB
);
```

## Next Steps

1. **Integrate AI/LLM Service**: Replace placeholder in `extractRuleCandidates()`
2. **Add Filter UI**: Implement filter buttons in rules table
3. **Create Tag Management UI**: Admin interface for reviewing/approving new tags
4. **Add Bulk Import UI**: Interface for uploading and processing documents
5. **Implement Tag Definition Workflow**: UI for defining NEEDS_DEFINITION tags
6. **Add Usage Analytics**: Dashboard showing tag usage statistics
7. **Implement Tag Deprecation**: Workflow for deprecating old tags

## Testing Checklist

- [ ] Upload document with known tags → All tags recognized
- [ ] Upload document with new tags → Tags auto-created with NEEDS_DEFINITION
- [ ] Save rule with missing tag → Validation error shown
- [ ] Save rule with code group tag → Codes auto-populated
- [ ] Delete tag in use → Prevented with error message
- [ ] Bulk import 100 rules → All processed correctly
- [ ] Filter by status → Correct rules shown
- [ ] Tag usage count → Increments correctly
- [ ] Visual status indicators → Colors match status
- [ ] Badge tooltips → Show correct information

## Support

For questions or issues with the SOP Rule Management System, please contact the development team or refer to the inline code documentation.
