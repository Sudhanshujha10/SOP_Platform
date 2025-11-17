# Full Integration Guide - SOP Rule Management System

## Quick Start Integration

### Step 1: Wrap Your App with RuleManagementProvider

Update your main app file (e.g., `App.tsx` or `_app.tsx`):

```typescript
import { RuleManagementProvider } from '@/contexts/RuleManagementContext';

function App() {
  return (
    <RuleManagementProvider>
      {/* Your existing app components */}
      <YourAppContent />
    </RuleManagementProvider>
  );
}
```

### Step 2: Replace Existing Rules Table

In your SOP detail page or rules listing page:

**Before:**
```typescript
import { ProperRulesTable } from '@/components/ProperRulesTable';

<ProperRulesTable rules={rules} searchTerm={searchTerm} />
```

**After:**
```typescript
import { IntegratedRulesView } from '@/components/IntegratedRulesView';

<IntegratedRulesView 
  rules={rules} 
  searchTerm={searchTerm}
  onRulesUpdate={(updatedRules) => setRules(updatedRules)}
/>
```

That's it! You now have:
- ✅ Automatic tag validation
- ✅ Rule status indicators
- ✅ Filter system (Valid/Needs Review/Invalid/New Tags)
- ✅ Document upload with AI processing
- ✅ Tag management interface

---

## Component Overview

### 1. IntegratedRulesView (Main Component)
**Location**: `/src/components/IntegratedRulesView.tsx`

**Features**:
- Validates all rules automatically
- Provides filter buttons
- Shows document upload button
- Shows tag management button
- Displays rule counts

**Props**:
```typescript
{
  rules: AdvancedSOPRule[];
  searchTerm?: string;
  onRulesUpdate?: (rules: AdvancedSOPRule[]) => void;
}
```

### 2. RuleFilters
**Location**: `/src/components/RuleFilters.tsx`

**Features**:
- Filter buttons with counts
- Color-coded by status
- Shows active filter

### 3. DocumentUploadDialog
**Location**: `/src/components/DocumentUploadDialog.tsx`

**Features**:
- File upload interface
- Processing type selection (new/update/bulk)
- Real-time processing status
- Summary of extracted rules
- Error and warning display
- New tags display

### 4. TagManagementPanel
**Location**: `/src/components/TagManagementPanel.tsx`

**Features**:
- View all tags by type
- Filter by status
- Approve NEEDS_DEFINITION tags
- Delete unused tags
- View usage statistics

### 5. RuleStatusIndicator
**Location**: `/src/components/RuleStatusIndicator.tsx`

**Features**:
- Visual status badges
- Error/warning display
- Missing tags list
- New tags to create list

---

## Usage Examples

### Example 1: Basic Integration in SOP Detail Page

```typescript
// pages/SOPDetail.tsx
import { IntegratedRulesView } from '@/components/IntegratedRulesView';
import { useState } from 'react';

export const SOPDetail = ({ sopId }) => {
  const [rules, setRules] = useState<AdvancedSOPRule[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Load rules from API
  useEffect(() => {
    loadRules(sopId).then(setRules);
  }, [sopId]);

  return (
    <div>
      <h1>SOP Rules</h1>
      
      {/* Search bar */}
      <input 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search rules..."
      />

      {/* Integrated rules view with all features */}
      <IntegratedRulesView
        rules={rules}
        searchTerm={searchTerm}
        onRulesUpdate={setRules}
      />
    </div>
  );
};
```

### Example 2: Using Services Directly

```typescript
import { useRuleManagement } from '@/contexts/RuleManagementContext';

export const MyComponent = () => {
  const { tagValidationService, documentProcessingService } = useRuleManagement();

  const validateRule = (rule: Partial<AdvancedSOPRule>) => {
    const validation = tagValidationService.validateRule(rule);
    
    if (validation.status === 'INVALID') {
      alert('Invalid rule: ' + validation.errors.join(', '));
      return false;
    }
    
    if (validation.status === 'NEEDS_REVIEW') {
      console.log('New tags to create:', validation.newTagsToCreate);
    }
    
    return true;
  };

  const processDocument = async (file: File) => {
    const content = await file.text();
    const result = await documentProcessingService.processDocument(
      content,
      file.name,
      'bulk'
    );
    
    console.log('Extracted rules:', result.extractedRules);
    console.log('New tags:', result.newTagsCreated);
    console.log('Summary:', result.summary);
  };

  return <div>...</div>;
};
```

### Example 3: Custom Tag Validation

```typescript
import { useRuleManagement } from '@/contexts/RuleManagementContext';

export const RuleForm = () => {
  const { tagValidationService } = useRuleManagement();
  const [description, setDescription] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    
    // Extract and validate tags in real-time
    const tags = tagValidationService.extractTagsFromDescription(value);
    const errors: string[] = [];
    
    tags.forEach(tag => {
      const validation = tagValidationService.validateTag(tag);
      if (!validation.exists) {
        errors.push(`Unknown tag: ${tag}`);
      }
    });
    
    setValidationErrors(errors);
  };

  return (
    <div>
      <textarea 
        value={description}
        onChange={(e) => handleDescriptionChange(e.target.value)}
      />
      
      {validationErrors.length > 0 && (
        <div className="text-red-600">
          {validationErrors.map((error, idx) => (
            <div key={idx}>{error}</div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### Example 4: Bulk Import with Validation

```typescript
import { useRuleManagement } from '@/contexts/RuleManagementContext';

export const BulkImport = () => {
  const { documentProcessingService } = useRuleManagement();

  const handleCSVImport = async (csvData: string) => {
    // Parse CSV to rules
    const rules = parseCSVToRules(csvData);
    
    // Validate bulk import
    const validation = await documentProcessingService.validateBulkImport(rules);
    
    console.log('Valid rules:', validation.validRules.length);
    console.log('Invalid rules:', validation.invalidRules.length);
    console.log('New tags needed:', validation.newTags.length);
    
    // Show validation results to user
    if (validation.invalidRules.length > 0) {
      alert(`${validation.invalidRules.length} rules have errors`);
    }
    
    // Import valid rules
    await importRules(validation.validRules);
  };

  return <div>...</div>;
};
```

---

## Customization

### Custom Filter Logic

You can extend the filter system by modifying `IntegratedRulesView.tsx`:

```typescript
// Add custom filter
const filteredRules = useMemo(() => {
  return rulesWithValidation.filter(({ rule, validation }) => {
    // Your custom filter logic
    if (activeFilter === 'my_custom_filter') {
      return rule.payer_group === '@BCBS';
    }
    
    // Existing filters...
    return true;
  }).map(({ rule }) => rule);
}, [rulesWithValidation, activeFilter]);
```

### Custom Status Colors

Modify `RuleStatusIndicator.tsx` to change colors:

```typescript
const getStatusConfig = () => {
  switch (validation.status) {
    case 'VALID':
      return {
        color: 'bg-green-100 text-green-800', // Change these
        label: 'Valid',
        iconColor: 'text-green-600'
      };
    // ...
  }
};
```

### Custom Tag Type Detection

Modify `TagValidationService.suggestTagType()` to improve auto-detection:

```typescript
private suggestTagType(tag: string): string {
  const cleanTag = tag.toUpperCase();
  
  // Add your custom patterns
  if (cleanTag.includes('MY_PATTERN')) {
    return 'myCustomType';
  }
  
  // Existing patterns...
  return 'codeGroup';
}
```

---

## API Integration

### Connecting to Your Backend

#### Save Rules with Validation

```typescript
const saveRule = async (rule: Partial<AdvancedSOPRule>) => {
  const { tagValidationService } = useRuleManagement();
  
  // Validate before saving
  const validation = tagValidationService.validateRule(rule);
  
  if (validation.status === 'INVALID') {
    throw new Error('Cannot save invalid rule');
  }
  
  // Save to backend
  const response = await fetch('/api/rules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rule,
      validation: {
        status: validation.status,
        warnings: validation.warnings,
        newTags: validation.newTagsToCreate
      }
    })
  });
  
  return response.json();
};
```

#### Sync Lookup Tables with Backend

```typescript
const syncLookupTables = async () => {
  const { enhancedLookupTables, updateLookupTables } = useRuleManagement();
  
  // Save to backend
  await fetch('/api/lookup-tables', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(enhancedLookupTables)
  });
  
  // Load from backend
  const response = await fetch('/api/lookup-tables');
  const tables = await response.json();
  updateLookupTables(tables);
};
```

---

## Testing

### Unit Tests

```typescript
import { TagValidationService } from '@/services/tagValidationService';
import { convertToEnhancedLookupTables } from '@/utils/lookupTableConverter';
import { lookupTables } from '@/data/lookupTables';

describe('TagValidationService', () => {
  let service: TagValidationService;

  beforeEach(() => {
    const enhancedTables = convertToEnhancedLookupTables(lookupTables);
    service = new TagValidationService(enhancedTables);
  });

  test('should validate existing tag', () => {
    const result = service.validateTag('@BCBS');
    expect(result.exists).toBe(true);
    expect(result.type).toBe('payerGroup');
  });

  test('should detect missing tag', () => {
    const result = service.validateTag('@UNKNOWN_TAG');
    expect(result.exists).toBe(false);
    expect(result.needsCreation).toBe(true);
  });

  test('should extract tags from description', () => {
    const description = 'For @BCBS payers, @ADD(@25) modifier';
    const tags = service.extractTagsFromDescription(description);
    expect(tags).toContain('@BCBS');
    expect(tags).toContain('@ADD');
  });
});
```

### Integration Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { IntegratedRulesView } from '@/components/IntegratedRulesView';
import { RuleManagementProvider } from '@/contexts/RuleManagementContext';

test('should filter rules by status', () => {
  const rules = [/* test rules */];
  
  render(
    <RuleManagementProvider>
      <IntegratedRulesView rules={rules} />
    </RuleManagementProvider>
  );
  
  // Click "Needs Review" filter
  fireEvent.click(screen.getByText('Needs Review'));
  
  // Verify filtered results
  expect(screen.getByText(/Showing \d+ of/)).toBeInTheDocument();
});
```

---

## Troubleshooting

### Issue: Tags not being detected

**Solution**: Check the regex pattern in `TagValidationService.extractTagsFromDescription()`:

```typescript
const tagPattern = /@[A-Z_][A-Z0-9_]*(?:\([^)]*\))?(?:\|@[A-Z_][A-Z0-9_]*(?:\([^)]*\))?)*(?:→@[A-Z0-9_-]*)?/g;
```

### Issue: Lookup tables not updating

**Solution**: Ensure you're calling `updateLookupTables()` after modifications:

```typescript
const { enhancedLookupTables, updateLookupTables } = useRuleManagement();

// Modify tables
const updatedTables = { ...enhancedLookupTables };
updatedTables.codeGroups.push(newCodeGroup);

// Update context
updateLookupTables(updatedTables);
```

### Issue: Document processing not working

**Solution**: Implement the AI/LLM integration in `DocumentProcessingService.extractRuleCandidates()`. The current implementation is a placeholder.

---

## Next Steps

1. **Implement AI/LLM Integration**: Replace placeholder in `extractRuleCandidates()`
2. **Add Database Persistence**: Save lookup tables and validations to database
3. **Add User Permissions**: Control who can approve tags and upload documents
4. **Add Audit Logging**: Track all tag creations and rule changes
5. **Add Analytics Dashboard**: Show tag usage statistics and trends
6. **Add Export Functionality**: Export rules and lookup tables to CSV/Excel
7. **Add Batch Operations**: Bulk approve tags, bulk update rules

---

## Support

For questions or issues:
1. Check the inline code documentation
2. Review `SOP_RULE_MANAGEMENT_SYSTEM.md` for architecture details
3. Contact the development team

---

## Changelog

### v1.0.0 (Current)
- Initial release
- Tag validation service
- Document processing service
- Visual status system
- Filter system
- Tag management UI
- Document upload interface
