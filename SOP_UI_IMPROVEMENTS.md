# SOP Page UI Improvements - Implementation Guide

## 🎯 **Problem**
- Description text is truncated
- Can't see all 13 fields
- No way to view complete rule details

## ✅ **Solution**
Add a Rule Details Modal/Drawer that shows all 13 fields when clicking on any rule.

---

## 📋 **Implementation Steps**

### **Step 1: Create RuleDetailsModal Component**

Create new file: `src/components/RuleDetailsModal.tsx`

```typescript
import React from 'react';
import { X } from 'lucide-react';
import { AdvancedSOPRule } from '@/types/advanced';

interface RuleDetailsModalProps {
  rule: AdvancedSOPRule | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RuleDetailsModal: React.FC<RuleDetailsModalProps> = ({ rule, isOpen, onClose }) => {
  if (!isOpen || !rule) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{rule.rule_id}</h2>
            <p className="text-sm text-gray-600 mt-1">Complete Rule Details</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            
            {/* Field 1: Rule ID */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                1. Rule ID
              </label>
              <p className="mt-1 text-lg font-mono text-gray-900">{rule.rule_id}</p>
            </div>

            {/* Field 2: Code */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                2. Code
              </label>
              <p className="mt-1 text-lg font-mono text-gray-900">{rule.code}</p>
            </div>

            {/* Field 3: Code Group */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                3. Code Group
              </label>
              <p className="mt-1 text-lg font-mono text-gray-900">{rule.code_group || 'N/A'}</p>
            </div>

            {/* Field 4: Codes Selected */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                4. Codes Selected
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {rule.codes_selected && rule.codes_selected.length > 0 ? (
                  rule.codes_selected.map((code, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-mono">
                      {code}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 italic">None</span>
                )}
              </div>
            </div>

            {/* Field 5: Action */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                5. Action
              </label>
              <p className="mt-1 text-lg font-mono text-gray-900">{rule.action}</p>
            </div>

            {/* Field 6: Payer Group */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                6. Payer Group
              </label>
              <p className="mt-1 text-lg font-mono text-gray-900">{rule.payer_group}</p>
            </div>

            {/* Field 7: Provider Group */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                7. Provider Group
              </label>
              <p className="mt-1 text-lg font-mono text-gray-900">{rule.provider_group}</p>
            </div>

            {/* Field 8: Description (Full) */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-blue-200">
              <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                8. Description (Complete)
              </label>
              <p className="mt-2 text-base leading-relaxed text-gray-900">{rule.description}</p>
            </div>

            {/* Field 9: Documentation Trigger */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                9. Documentation Trigger
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {rule.documentation_trigger?.split(';').map((trigger, idx) => (
                  <span key={idx} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                    {trigger.trim()}
                  </span>
                ))}
              </div>
            </div>

            {/* Field 10: Chart Section */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                10. Chart Section
              </label>
              <p className="mt-1 text-lg font-mono text-gray-900">{rule.chart_section}</p>
            </div>

            {/* Field 11: Effective Date */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                11. Effective Date
              </label>
              <p className="mt-1 text-lg font-mono text-gray-900">{rule.effective_date}</p>
            </div>

            {/* Field 12: End Date */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                12. End Date
              </label>
              <p className="mt-1 text-lg font-mono text-gray-900">{rule.end_date || 'N/A'}</p>
            </div>

            {/* Field 13: Reference */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                13. Reference
              </label>
              <p className="mt-1 text-lg font-mono text-gray-900">{rule.reference}</p>
            </div>

            {/* Metadata */}
            <div className="border-t-2 border-gray-200 pt-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
                  <p className="mt-1 text-sm text-gray-900">{rule.status}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Confidence</label>
                  <p className="mt-1 text-sm text-gray-900">{rule.confidence}%</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Source</label>
                  <p className="mt-1 text-sm text-gray-900">{rule.source}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Created By</label>
                  <p className="mt-1 text-sm text-gray-900">{rule.created_by}</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Close
          </button>
          <button
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Edit Rule
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

### **Step 2: Update SOPPage Component**

Find the file that renders the SOP rules table (likely `src/pages/SOPPage.tsx` or similar) and add:

```typescript
import { RuleDetailsModal } from '@/components/RuleDetailsModal';
import { useState } from 'react';

// Inside component:
const [selectedRule, setSelectedRule] = useState<AdvancedSOPRule | null>(null);
const [isModalOpen, setIsModalOpen] = useState(false);

const handleRuleClick = (rule: AdvancedSOPRule) => {
  setSelectedRule(rule);
  setIsModalOpen(true);
};

// In the rules table, make rows clickable:
<tr 
  key={rule.rule_id}
  onClick={() => handleRuleClick(rule)}
  className="hover:bg-blue-50 cursor-pointer transition-colors"
>
  {/* existing table cells */}
</tr>

// Add modal at the end of component:
<RuleDetailsModal
  rule={selectedRule}
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
/>
```

---

### **Step 3: Improve Table Display**

Update the rules table to show truncated description with "..." and click hint:

```typescript
<td className="px-6 py-4">
  <div className="flex items-center justify-between group">
    <p className="text-sm text-gray-900 line-clamp-2 flex-1">
      {rule.description}
    </p>
    <span className="ml-2 text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
      Click to view all
    </span>
  </div>
</td>
```

---

### **Step 4: Add to Organization SOP Page**

Apply the same changes to the organization-specific SOP page:

1. Import `RuleDetailsModal`
2. Add state for `selectedRule` and `isModalOpen`
3. Make table rows clickable
4. Add modal component

---

## 🎨 **UI Improvements Summary**

### **Before**:
- ❌ Description truncated
- ❌ Can't see all fields
- ❌ No way to view complete rule

### **After**:
- ✅ Click any rule to open modal
- ✅ All 13 fields displayed clearly
- ✅ Full description visible
- ✅ Beautiful, organized layout
- ✅ Metadata section
- ✅ Easy to close
- ✅ Works on both SOP pages

---

## 📊 **Modal Features**

1. **All 13 Fields Displayed**:
   - Each field in its own section
   - Clear labels
   - Proper formatting

2. **Special Highlighting**:
   - Description has special styling (blue gradient background)
   - Tags shown as pills
   - Codes shown as badges

3. **Metadata Section**:
   - Status, confidence, source, created_by
   - Separated from main fields

4. **Responsive**:
   - Max width 4xl
   - Scrollable content
   - Works on mobile

5. **User-Friendly**:
   - Click anywhere outside to close
   - X button to close
   - Close button in footer
   - Edit button (ready for future)

---

## 🚀 **Implementation Checklist**

- [ ] Create `RuleDetailsModal.tsx` component
- [ ] Update main SOP page with modal
- [ ] Update organization SOP page with modal
- [ ] Make table rows clickable
- [ ] Add hover effects
- [ ] Test on both pages
- [ ] Test with long descriptions
- [ ] Test with all 13 fields populated
- [ ] Test responsive design

---

## 📝 **Additional Enhancements**

### **Optional: Add Search/Filter in Modal**
```typescript
// Add search bar in modal header
<input
  type="text"
  placeholder="Search in rule..."
  className="px-4 py-2 border rounded-lg"
/>
```

### **Optional: Add Copy Button**
```typescript
// Add copy button for each field
<button onClick={() => navigator.clipboard.writeText(rule.code)}>
  <Copy className="w-4 h-4" />
</button>
```

### **Optional: Add Export Button**
```typescript
// Export rule as JSON
<button onClick={() => downloadJSON(rule)}>
  Export Rule
</button>
```

---

## ✅ **Result**

Users can now:
1. ✅ Click any rule in the table
2. ✅ See all 13 fields in a beautiful modal
3. ✅ Read the complete description
4. ✅ View all metadata
5. ✅ Close easily
6. ✅ Works on both SOP pages

**The SOP page UI is now professional and user-friendly!** 🎉
