# ✅ Rule Approval Workflow - Complete Implementation

## 🎯 Overview

Comprehensive rule management system with approval workflow, editing capabilities, conflict resolution, and dynamic lookup table synchronization.

---

## 📋 Features Implemented

### **1. Rule Status Management** ✅

**Three Status States**:
- **Pending** - Initial state for all LLM-generated rules
- **Active** - Approved rules that are in use
- **Rejected** - Rules that have been rejected by user

**Status Workflow**:
```
LLM Generates Rule → Pending → User Reviews → Approve/Reject/Edit
                                                    ↓
                                              Active/Rejected
```

### **2. Rule Actions** ✅

**For Pending Rules**:
- ✅ **Approve** - Changes status to 'active', syncs new tags to lookup tables
- ✏️ **Edit** - Opens modal to modify any field, then approve
- ❌ **Reject** - Changes status to 'rejected', moves to bottom of list

**For Active Rules**:
- ✏️ **Edit** - Modify any field, updates `updated_at` timestamp

**For Rejected Rules**:
- 🗑️ **Delete** - Permanently removes rule, cleans up unused tags

---

## 🔧 Components

### **1. RuleApprovalTable** (`src/components/RuleApprovalTable.tsx`)

Main table component with all rule management features.

**Features**:
- ✅ Approve/Reject/Edit/Delete actions per rule
- ✅ Search with autocomplete suggestions
- ✅ Filter by status (Pending, Active, Rejected)
- ✅ Filter by conflict severity (Low, Medium, High)
- ✅ Status badges with color coding
- ✅ Conflict indicators
- ✅ New tags button with count
- ✅ Sorted display (Pending → Active → Rejected)

**Search Suggestions**:
- Rule ID
- Code
- Description snippet
- Tags (payer, provider, code group, action)

**Usage**:
```tsx
<RuleApprovalTable
  rules={sopRules}
  onApprove={(ruleId) => RuleApprovalService.approveRule(sopId, ruleId)}
  onReject={(ruleId) => RuleApprovalService.rejectRule(sopId, ruleId)}
  onEdit={(ruleId, changes) => RuleApprovalService.editRule(sopId, ruleId, changes)}
  onDelete={(ruleId) => RuleApprovalService.deleteRejectedRules(sopId)}
  onViewConflict={(ruleId) => setConflictRuleId(ruleId)}
  onShowNewTags={() => setShowNewTags(true)}
/>
```

---

### **2. RuleEditModal** (`src/components/RuleEditModal.tsx`)

Modal for editing rule fields with validation.

**Editable Fields**:
- Rule ID
- Description (with format hint)
- Code(s) - comma-separated
- Code Group - dropdown from lookup table
- Action - dropdown from lookup table
- Payer Group - dropdown from lookup table
- Provider Group - dropdown from lookup table
- Documentation Trigger - semicolon-separated keywords
- Chart Section - dropdown from lookup table
- Effective Date
- End Date
- Reference

**Validation**:
- Required fields: rule_id, description, action, payer_group, provider_group
- Real-time error display
- Format hints for complex fields

**Usage**:
```tsx
<RuleEditModal
  rule={editingRule}
  isOpen={!!editingRule}
  onClose={() => setEditingRule(null)}
  onSave={(updatedRule) => handleEditSave(updatedRule)}
/>
```

---

### **3. ConflictResolutionModal** (`src/components/ConflictResolutionModal.tsx`)

Modal for resolving rule conflicts.

**Conflict Types**:
- **Overlapping** - Same code, same payer, different actions
- **Duplicate** - Identical rules
- **Contradictory** - ADD vs REMOVE for same code

**Severity Levels**:
- **High** - Critical conflicts (contradictory actions)
- **Medium** - Duplicates
- **Low** - Minor overlaps

**Resolution Actions**:
- ✅ **Keep Current** - Reject the conflicting rule
- ✅ **Keep Other** - Reject the current rule
- 🗑️ **Delete Both** - Reject both rules
- 🔀 **Merge** - Combine into one rule (future enhancement)

**Usage**:
```tsx
<ConflictResolutionModal
  rule={conflictRule}
  isOpen={!!conflictRule}
  onClose={() => setConflictRule(null)}
  onResolve={(conflictId, action) => handleConflictResolve(conflictId, action)}
  allRules={sopRules}
/>
```

---

### **4. NewTagsViewer** (`src/components/NewTagsViewer.tsx`)

Modal for viewing and approving new tags created by AI.

**Features**:
- Grouped by tag type (Code Groups, Payer Groups, etc.)
- Shows tag details (purpose, expands_to, used_in_rules)
- Approve/Reject actions for pending tags
- Status badges (Pending, Approved, Rejected)

**Tag Types**:
- Code Groups
- Payer Groups
- Provider Groups
- Actions
- Chart Sections

**Usage**:
```tsx
<NewTagsViewer
  newTags={RuleApprovalService.getNewTags(sopId)}
  isOpen={showNewTags}
  onClose={() => setShowNewTags(false)}
  onApproveTag={(tag) => handleApproveTag(tag)}
  onRejectTag={(tag) => handleRejectTag(tag)}
/>
```

---

### **5. SOPLookupTableViewer** (`src/components/SOPLookupTableViewer.tsx`)

Modal for viewing all lookup tables.

**Features**:
- Shows all 5 lookup table groups
- Expandable/collapsible groups
- Search across all tags
- Color-coded by type
- Shows tag details (purpose, expands_to, payers, providers)

**Lookup Table Groups**:
1. **Code Groups** - CPT/ICD code groupings
2. **Payer Groups** - Insurance payer groupings
3. **Provider Groups** - Provider type groupings
4. **Action Tags** - Billing actions (ADD, REMOVE, etc.)
5. **Chart Sections** - Documentation sections

**Usage**:
```tsx
<SOPLookupTableViewer
  isOpen={showLookupTable}
  onClose={() => setShowLookupTable(false)}
/>
```

---

## 🔄 Services

### **RuleApprovalService** (`src/services/ruleApprovalService.ts`)

Core service for rule management.

**Methods**:

#### **approveRule(sopId, ruleId)**
- Changes rule status to 'active'
- Updates `updated_at` timestamp
- Syncs new tags to lookup tables
- Updates SOP

#### **rejectRule(sopId, ruleId, reason?)**
- Changes rule status to 'rejected'
- Moves rule to end of array
- Updates `updated_at` timestamp
- Updates SOP

#### **editRule(sopId, ruleId, changes)**
- Applies changes to rule
- Updates `updated_at` timestamp
- Re-analyzes conflicts
- Syncs lookup tables
- Updates SOP

#### **deleteRejectedRules(sopId)**
- Deletes all rejected rules
- Cleans up unused tags
- Returns count of deleted rules

#### **detectConflicts(sopId)**
- Analyzes all active/pending rules
- Detects overlapping, duplicate, contradictory rules
- Assigns severity levels
- Updates rules with conflict data
- Returns array of conflicts

#### **resolveConflict(sopId, resolution)**
- Executes conflict resolution action
- Marks conflict as resolved
- Re-analyzes remaining conflicts

#### **getNewTags(sopId)**
- Extracts all new tags from rules
- Groups by tag type
- Returns array of NewTag objects

**Private Methods**:
- `syncNewTagsToLookupTables()` - Adds new tags to lookup tables
- `syncLookupTablesAfterEdit()` - Updates lookup tables after edit
- `cleanupUnusedTags()` - Removes tags no longer in use
- `cleanupUnusedTag()` - Removes specific unused tag

---

## 📊 Data Flow

### **1. Rule Creation Flow**

```
Document Upload
    ↓
LLM Extraction
    ↓
Rules Created (status: 'pending')
    ↓
RuleApprovalTable displays rules
    ↓
User reviews and takes action
```

### **2. Approval Flow**

```
User clicks Approve
    ↓
RuleApprovalService.approveRule()
    ↓
Status → 'active'
    ↓
New tags synced to lookup tables
    ↓
updated_at timestamp set
    ↓
SOP updated
    ↓
UI refreshes
```

### **3. Edit Flow**

```
User clicks Edit
    ↓
RuleEditModal opens
    ↓
User modifies fields
    ↓
Validation runs
    ↓
User clicks Save
    ↓
RuleApprovalService.editRule()
    ↓
Changes applied
    ↓
Conflicts re-analyzed
    ↓
Lookup tables synced
    ↓
updated_at timestamp set
    ↓
SOP updated
    ↓
UI refreshes
```

### **4. Conflict Resolution Flow**

```
Conflicts detected
    ↓
User clicks conflict badge
    ↓
ConflictResolutionModal opens
    ↓
Shows conflicting rules side-by-side
    ↓
User selects resolution action
    ↓
RuleApprovalService.resolveConflict()
    ↓
Action executed (keep/delete/merge)
    ↓
Conflicts re-analyzed
    ↓
SOP updated
    ↓
UI refreshes
```

### **5. Lookup Table Sync Flow**

```
Rule approved/edited
    ↓
Check for new tags
    ↓
For each new tag:
    ↓
    Check if exists in lookup table
    ↓
    If not exists → Add to lookup table
    ↓
    If exists → Skip
    ↓
Lookup table updated
    ↓
Available for all SOPs
```

---

## 🎨 UI/UX Features

### **Status Badges**
- **Pending** - Yellow badge
- **Active** - Green badge
- **Rejected** - Red badge

### **Conflict Badges**
- **Low** - Blue badge with count
- **Medium** - Orange badge with count
- **High** - Red badge with count

### **Action Buttons**
- **Approve** - Green check icon
- **Edit** - Blue pencil icon
- **Reject** - Red X icon
- **Delete** - Red trash icon
- **View Conflict** - Orange warning icon

### **Search Suggestions**
- Dropdown with autocomplete
- Grouped by type (Rule ID, Code, Description, Tag)
- Click to select

### **Filters**
- Expandable filter panel
- Multi-select for status
- Multi-select for conflict severity
- Clear all filters button

---

## 🧪 Testing Scenarios

### **Scenario 1: Approve Pending Rule**

**Steps**:
1. Upload document → Rules created with status 'pending'
2. Click approve button on a rule
3. Verify status changes to 'active'
4. Verify new tags added to lookup tables
5. Verify `updated_at` timestamp updated

**Expected**:
- ✅ Rule status = 'active'
- ✅ New tags in lookup tables
- ✅ Timestamp updated

---

### **Scenario 2: Edit Rule**

**Steps**:
1. Click edit button on a rule
2. Modify description field
3. Click Save
4. Verify changes applied
5. Verify `updated_at` timestamp updated
6. Verify conflicts re-analyzed

**Expected**:
- ✅ Description updated
- ✅ Timestamp updated
- ✅ Conflicts re-checked

---

### **Scenario 3: Resolve Conflict**

**Steps**:
1. Create two overlapping rules
2. Click conflict badge
3. Review conflicting rules
4. Click "Keep Current"
5. Verify other rule rejected
6. Verify conflict resolved

**Expected**:
- ✅ One rule active
- ✅ Other rule rejected
- ✅ Conflict badge removed

---

### **Scenario 4: Delete Rejected Rules**

**Steps**:
1. Reject multiple rules
2. Verify they move to bottom
3. Click delete on rejected rule
4. Verify rule removed
5. Verify unused tags cleaned up

**Expected**:
- ✅ Rule deleted
- ✅ Unused tags removed from lookup tables

---

### **Scenario 5: Search and Filter**

**Steps**:
1. Type code in search bar
2. Verify suggestions appear
3. Click suggestion
4. Verify filtered results
5. Apply status filter
6. Verify combined filters work

**Expected**:
- ✅ Search suggestions shown
- ✅ Results filtered correctly
- ✅ Multiple filters combine properly

---

## 📝 Integration Example

```tsx
import React, { useState } from 'react';
import { RuleApprovalTable } from '@/components/RuleApprovalTable';
import { ConflictResolutionModal } from '@/components/ConflictResolutionModal';
import { NewTagsViewer } from '@/components/NewTagsViewer';
import { SOPLookupTableViewer } from '@/components/SOPLookupTableViewer';
import { RuleApprovalService } from '@/services/ruleApprovalService';

export const SOPDetailPage = ({ sopId }) => {
  const [sop, setSop] = useState(SOPManagementService.getSOPById(sopId));
  const [conflictRule, setConflictRule] = useState(null);
  const [showNewTags, setShowNewTags] = useState(false);
  const [showLookupTable, setShowLookupTable] = useState(false);

  const handleApprove = (ruleId) => {
    RuleApprovalService.approveRule(sopId, ruleId);
    setSop(SOPManagementService.getSOPById(sopId));
  };

  const handleReject = (ruleId) => {
    RuleApprovalService.rejectRule(sopId, ruleId);
    setSop(SOPManagementService.getSOPById(sopId));
  };

  const handleEdit = (ruleId, changes) => {
    RuleApprovalService.editRule(sopId, ruleId, changes);
    setSop(SOPManagementService.getSOPById(sopId));
  };

  const handleDelete = (ruleId) => {
    RuleApprovalService.deleteRejectedRules(sopId);
    setSop(SOPManagementService.getSOPById(sopId));
  };

  const handleConflictResolve = (conflictId, action) => {
    RuleApprovalService.resolveConflict(sopId, { conflictId, action, timestamp: new Date().toISOString() });
    setSop(SOPManagementService.getSOPById(sopId));
    setConflictRule(null);
  };

  return (
    <div>
      {/* Header with Lookup Table Button */}
      <div className="flex items-center justify-between mb-6">
        <h1>SOP: {sop.name}</h1>
        <button onClick={() => setShowLookupTable(true)}>
          View Lookup Tables
        </button>
      </div>

      {/* Rule Approval Table */}
      <RuleApprovalTable
        rules={sop.rules}
        onApprove={handleApprove}
        onReject={handleReject}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onViewConflict={(ruleId) => setConflictRule(sop.rules.find(r => r.rule_id === ruleId))}
        onShowNewTags={() => setShowNewTags(true)}
      />

      {/* Conflict Resolution Modal */}
      {conflictRule && (
        <ConflictResolutionModal
          rule={conflictRule}
          isOpen={!!conflictRule}
          onClose={() => setConflictRule(null)}
          onResolve={handleConflictResolve}
          allRules={sop.rules}
        />
      )}

      {/* New Tags Viewer */}
      <NewTagsViewer
        newTags={RuleApprovalService.getNewTags(sopId)}
        isOpen={showNewTags}
        onClose={() => setShowNewTags(false)}
        onApproveTag={(tag) => {/* Approve tag logic */}}
        onRejectTag={(tag) => {/* Reject tag logic */}}
      />

      {/* Lookup Table Viewer */}
      <SOPLookupTableViewer
        isOpen={showLookupTable}
        onClose={() => setShowLookupTable(false)}
      />
    </div>
  );
};
```

---

## ✅ Summary

**All Features Implemented**:

1. ✅ **Rule Status Management** - Pending, Active, Rejected
2. ✅ **Approve/Edit/Reject Actions** - Full workflow
3. ✅ **Rule Editing Modal** - All fields editable with validation
4. ✅ **Conflict Detection** - Automatic analysis
5. ✅ **Conflict Resolution** - Side-by-side comparison with actions
6. ✅ **Search with Autocomplete** - Suggestions for all fields
7. ✅ **Filters** - Status and conflict severity
8. ✅ **New Tags Viewer** - Review and approve AI-generated tags
9. ✅ **Lookup Table Sync** - Automatic synchronization
10. ✅ **Lookup Table Viewer** - Browse all available tags
11. ✅ **Delete Rejected Rules** - Cleanup with tag removal
12. ✅ **Updated Timestamps** - Track all changes
13. ✅ **Conflict Re-analysis** - After edits and resolutions

**Ready for Integration!** 🚀
