# Complete Extraction Pipeline Implementation Guide

## 🎯 Problem Statement

After uploading documents during SOP creation, rules are not being extracted, normalized, and shown on the SOP page, nor is the SOP status moving from Draft to Active.

## ✅ What's Been Implemented

### 1. Strict Validation Service ✅
**File**: `src/services/strictValidationService.ts`

**Features**:
- ✅ Validates all 13 required fields
- ✅ Enforces Rule ID format (PREFIX-CATEGORY-####)
- ✅ Validates description pattern (single sentence, ends with period, contains @tags)
- ✅ Validates code groups against lookup tables
- ✅ Validates payer groups against lookup tables
- ✅ Validates provider groups against lookup tables
- ✅ Validates action tags against lookup tables
- ✅ Validates chart sections against lookup tables
- ✅ Enforces codes_selected for SWAP/CONDITIONAL rules
- ✅ Validates date formats (YYYY-MM-DD)
- ✅ Detects NEEDSDEFINITION tags
- ✅ Batch validation support

**Usage**:
```typescript
import { StrictValidationService } from '@/services/strictValidationService';

const validation = StrictValidationService.validateRule(rule);
if (validation.isValid) {
  // Rule passes all checks
} else {
  // validation.errors contains all issues
  // validation.needsDefinition contains unknown tags
}
```

### 2. Enhanced AI Provider Service (Partial) ✅
**File**: `src/services/aiProviderService.ts`

**Updates**:
- ✅ Added `needsDefinition` to ExtractionResult
- ✅ Added `validationErrors` to ExtractionResult

## 🔨 What Needs to Be Completed

### Step 1: Complete AI Provider Service Two-Step Pipeline

**File to Update**: `src/services/aiProviderService.ts`

**Add these methods**:

```typescript
/**
 * Two-step extraction pipeline
 * Step 1: Extract rule candidates
 * Step 2: Normalize and map to schema
 */
static async extractRulesWithPipeline(request: ExtractionRequest): Promise<ExtractionResult> {
  // Step 1: Extract candidates
  const candidates = await this.extractCandidates(request);
  
  // Step 2: Normalize each candidate
  const normalizedRules = await this.normalizeRules(candidates, request.clientPrefix);
  
  // Step 3: Validate all rules
  const validation = StrictValidationService.validateBatch(normalizedRules);
  
  return {
    rules: validation.validRules,
    confidence: 85,
    warnings: validation.invalidRules.map(r => 
      `Rule ${r.rule.rule_id}: ${r.validation.errors.map(e => e.message).join(', ')}`
    ),
    suggestions: [],
    needsDefinition: validation.allNeedsDefinition,
    validationErrors: validation.invalidRules.map(r => ({
      ruleId: r.rule.rule_id || 'unknown',
      errors: r.validation.errors.map(e => e.message)
    }))
  };
}

/**
 * Step 1: Extract rule candidates from text
 */
private static async extractCandidates(request: ExtractionRequest): Promise<any[]> {
  const config = this.getConfig();
  
  const prompt = `Extract all claim-editing rule candidates from this policy document.
  
For each rule, identify:
- What procedure/diagnosis codes it applies to
- What payer(s) it applies to
- What action to take (add modifier, remove code, etc.)
- Any conditions or triggers
- Effective dates
- Source reference

Return JSON array of rule candidates with these fields:
- codes: procedure/diagnosis codes mentioned
- payers: insurance companies mentioned
- action_description: what to do
- conditions: when this applies
- effective_date: when it starts
- reference: page/section reference

POLICY TEXT:
${request.text}

Return ONLY valid JSON array.`;

  // Call AI provider (OpenAI/Anthropic/Gemini)
  const response = await this.callAIProvider(prompt, config);
  return JSON.parse(response);
}

/**
 * Step 2: Normalize candidates to schema
 */
private static async normalizeRules(
  candidates: any[], 
  clientPrefix: string
): Promise<Partial<AdvancedSOPRule>[]> {
  const config = this.getConfig();
  const rules: Partial<AdvancedSOPRule>[] = [];
  
  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    
    const prompt = `Normalize this rule candidate to the SOP schema using ONLY values from the lookup tables.

LOOKUP TABLES:
${JSON.stringify(lookupTables, null, 2)}

RULE CANDIDATE:
${JSON.stringify(candidate, null, 2)}

Map to this EXACT schema:
{
  "rule_id": "${clientPrefix}-CATEGORY-${String(i + 1).padStart(4, '0')}",
  "code": "@CODE_GROUP or specific codes",
  "code_group": "@CODE_GROUP if applicable",
  "codes_selected": ["code1", "code2"] if SWAP/CONDITIONAL,
  "action": "@ACTION(@modifier)",
  "payer_group": "@PAYER|@PAYER",
  "provider_group": "@PROVIDER",
  "description": "Single sentence with inline @tags ending with period.",
  "documentation_trigger": "keyword1;keyword2",
  "chart_section": "SECTION_NAME",
  "effective_date": "YYYY-MM-DD",
  "end_date": "",
  "reference": "Document p. X",
  "modifiers": ["@25", "@52"] if applicable
}

RULES:
1. Use ONLY tags from lookup tables
2. If a value doesn't exist in lookups, use "NEEDSDEFINITION_TAGNAME"
3. Description must be ONE sentence ending with period
4. Include inline @tags in description
5. codes_selected required for @SWAP/@COND_ADD/@COND_REMOVE
6. Date format: YYYY-MM-DD

Return ONLY valid JSON object.`;

    const response = await this.callAIProvider(prompt, config);
    const normalized = JSON.parse(response);
    rules.push(normalized);
  }
  
  return rules;
}

/**
 * Call configured AI provider
 */
private static async callAIProvider(prompt: string, config: AIConfig): Promise<string> {
  switch (config.provider) {
    case 'openai':
      return await this.callOpenAI(prompt, config);
    case 'anthropic':
      return await this.callAnthropic(prompt, config);
    case 'gemini':
      return await this.callGemini(prompt, config);
    default:
      throw new Error('No AI provider configured');
  }
}

// Implement callOpenAI, callAnthropic, callGemini methods
```

### Step 2: Update EnhancedCreateNewSOP Component

**File to Update**: `src/components/EnhancedCreateNewSOP.tsx`

**Replace the extraction logic** in `handleUploadAndProcess`:

```typescript
const handleUploadAndProcess = async () => {
  if (!createdSOP || selectedFiles.length === 0) {
    toast({
      title: 'No Files Selected',
      description: 'Please select at least one document or CSV to upload',
      variant: 'destructive'
    });
    return;
  }

  setIsProcessing(true);
  setProcessingProgress(0);

  try {
    const allExtractedRules: AdvancedSOPRule[] = [];
    const allErrors: string[] = [];
    const allNeedsDefinition = new Set<string>();

    // Process each file sequentially
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      setCurrentFile(file.name);
      setProcessingProgress(Math.floor((i / selectedFiles.length) * 100));

      // Add document to SOP
      const document = SOPManagementService.addDocumentToSOP(
        createdSOP.id, 
        file, 
        createdBy
      );

      // Update document status to processing
      SOPManagementService.updateDocumentStatus(
        createdSOP.id, 
        document.id, 
        'processing'
      );

      try {
        // Extract text from file
        const text = await extractTextFromFile(file);

        // TWO-STEP PIPELINE: Extract then Normalize
        const result = await AIProviderService.extractRulesWithPipeline({
          text,
          clientPrefix
        });

        // Check for validation errors
        if (result.validationErrors.length > 0) {
          const errorMsg = result.validationErrors
            .map(e => `${e.ruleId}: ${e.errors.join(', ')}`)
            .join('\n');
          allErrors.push(`${file.name}: ${errorMsg}`);
        }

        // Check for NEEDSDEFINITION tags
        if (result.needsDefinition.length > 0) {
          result.needsDefinition.forEach(tag => allNeedsDefinition.add(tag));
        }

        // Add valid rules to collection
        allExtractedRules.push(...result.rules);

        // Update document status to completed
        SOPManagementService.updateDocumentStatus(
          createdSOP.id,
          document.id,
          'completed',
          result.rules.length
        );

      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        allErrors.push(`${file.name}: ${error instanceof Error ? error.message : 'Processing failed'}`);
        
        SOPManagementService.updateDocumentStatus(
          createdSOP.id,
          document.id,
          'error',
          0,
          error instanceof Error ? error.message : 'Processing failed'
        );
      }
    }

    // Add all extracted rules to SOP
    if (allExtractedRules.length > 0) {
      SOPManagementService.addRulesToSOP(createdSOP.id, allExtractedRules);
    }

    setProcessingProgress(100);
    setIsProcessing(false);

    // Show results
    if (allErrors.length > 0) {
      toast({
        title: 'Processing Completed with Errors',
        description: `${allExtractedRules.length} rules extracted, but some had validation errors. Check logs.`,
        variant: 'destructive'
      });
    } else if (allNeedsDefinition.size > 0) {
      toast({
        title: 'Processing Complete - Action Required',
        description: `${allExtractedRules.length} rules extracted. ${allNeedsDefinition.size} tags need definition: ${Array.from(allNeedsDefinition).join(', ')}`,
      });
    } else {
      toast({
        title: 'Processing Complete',
        description: `${allExtractedRules.length} rules extracted and validated from ${selectedFiles.length} documents`,
      });
    }

    // Get updated SOP
    const updatedSOP = SOPManagementService.getSOPById(createdSOP.id);

    if (updatedSOP) {
      // SOP should now be Active (handled by SOPManagementService)
      onSuccess(updatedSOP);
    }

  } catch (error) {
    setIsProcessing(false);
    toast({
      title: 'Processing Error',
      description: error instanceof Error ? error.message : 'Failed to process documents',
      variant: 'destructive'
    });
  }
};
```

### Step 3: Update SOPManagementService for Draft→Active Transition

**File to Update**: `src/services/sopManagementService.ts`

**Update the `addRulesToSOP` method**:

```typescript
/**
 * Add rules to SOP
 */
static addRulesToSOP(sopId: string, rules: AdvancedSOPRule[]): void {
  const sop = this.getSOPById(sopId);
  if (!sop) return;

  sop.rules.push(...rules);
  sop.rules_count = sop.rules.length;

  // AUTOMATIC DRAFT → ACTIVE TRANSITION
  // If SOP was draft and now has validated rules, make it active
  if (sop.status === 'draft' && sop.rules.length > 0) {
    sop.status = 'active';
    
    // Log activity
    this.addActivity({
      id: `activity_${Date.now()}`,
      type: 'sop_created',
      sop_id: sopId,
      sop_name: sop.name,
      description: `SOP activated with ${sop.rules.length} rules`,
      user: 'System',
      timestamp: new Date().toISOString(),
      status: 'active'
    });
  }

  this.updateSOP(sopId, {
    rules: sop.rules,
    rules_count: sop.rules_count,
    status: sop.status
  });

  // Add to recent activity
  this.addActivity({
    id: `activity_${Date.now()}`,
    type: 'rule_created',
    sop_id: sopId,
    sop_name: sop.name,
    description: `Added ${rules.length} rules to ${sop.name}`,
    user: 'AI Processing',
    timestamp: new Date().toISOString(),
    status: 'active'
  });
}
```

### Step 4: Add Real-time SOP Page Updates

**File to Update**: `src/pages/SOPDetail.tsx`

**Add auto-refresh**:

```typescript
useEffect(() => {
  loadSOP();
  
  // Auto-refresh every 2 seconds to show real-time updates
  const interval = setInterval(loadSOP, 2000);
  return () => clearInterval(interval);
}, [sopId]);
```

### Step 5: Handle NEEDSDEFINITION Tags

**Create new component**: `src/components/NeedsDefinitionAlert.tsx`

```typescript
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NeedsDefinitionAlertProps {
  tags: string[];
  onDefine: (tag: string) => void;
}

export const NeedsDefinitionAlert = ({ tags, onDefine }: NeedsDefinitionAlertProps) => {
  if (tags.length === 0) return null;

  return (
    <Alert className="bg-orange-50 border-orange-200">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="text-orange-800">
        <strong>Action Required:</strong> {tags.length} tags need definition:
        <div className="mt-2 space-y-1">
          {tags.map(tag => (
            <div key={tag} className="flex items-center justify-between">
              <code className="text-sm">{tag}</code>
              <Button size="sm" variant="outline" onClick={() => onDefine(tag)}>
                Define
              </Button>
            </div>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
};
```

## 📋 Complete Implementation Checklist

### Phase 1: Validation ✅
- [x] Create StrictValidationService
- [x] Implement all 12 validation rules
- [x] Add NEEDSDEFINITION detection
- [x] Add batch validation

### Phase 2: AI Pipeline (In Progress)
- [ ] Add extractRulesWithPipeline method
- [ ] Implement extractCandidates (Step 1)
- [ ] Implement normalizeRules (Step 2)
- [ ] Add callAIProvider helper
- [ ] Update ExtractionResult interface

### Phase 3: SOP Creation (In Progress)
- [ ] Update handleUploadAndProcess
- [ ] Add two-step pipeline call
- [ ] Add validation error handling
- [ ] Add NEEDSDEFINITION handling
- [ ] Add comprehensive error messages

### Phase 4: Status Transition
- [ ] Update addRulesToSOP
- [ ] Add Draft→Active logic
- [ ] Add activity logging
- [ ] Test transition

### Phase 5: Real-time Updates
- [ ] Add auto-refresh to SOPDetail
- [ ] Add loading states
- [ ] Add optimistic updates
- [ ] Test real-time display

### Phase 6: Error Handling
- [ ] Create NeedsDefinitionAlert component
- [ ] Add validation error display
- [ ] Add user-friendly error messages
- [ ] Add developer logs

## 🎯 Expected Behavior

### Success Flow
```
1. User uploads documents
   ↓
2. AI extracts candidates
   ↓
3. AI normalizes to schema
   ↓
4. Strict validation runs
   ↓
5. Valid rules added to SOP
   ↓
6. SOP status: Draft → Active
   ↓
7. User sees rules on SOP page
   ↓
8. Real-time updates every 2s
```

### Error Flow
```
1. User uploads documents
   ↓
2. AI extracts candidates
   ↓
3. AI normalizes to schema
   ↓
4. Validation finds errors
   ↓
5. Show error message to user
   ↓
6. Log errors for debugging
   ↓
7. SOP stays in Draft
   ↓
8. User can retry or fix
```

### NEEDSDEFINITION Flow
```
1. AI finds unknown tag
   ↓
2. Creates NEEDSDEFINITION_TAG
   ↓
3. Rule marked as needs_definition
   ↓
4. Alert shown to user
   ↓
5. User defines tag in lookup tables
   ↓
6. Re-process or manually update
```

## 🚀 Next Steps

1. **Complete AI Pipeline** - Implement two-step extraction
2. **Update SOP Creation** - Use new pipeline
3. **Test End-to-End** - Upload → Extract → Validate → Display
4. **Add Error Handling** - User-friendly messages
5. **Add NEEDSDEFINITION UI** - Allow tag definition

## 📝 Testing Checklist

- [ ] Upload single document → Rules extracted
- [ ] Upload multiple documents → All processed
- [ ] Invalid rules → Error shown, SOP stays Draft
- [ ] Valid rules → SOP becomes Active
- [ ] NEEDSDEFINITION tags → Alert shown
- [ ] Real-time updates → Rules appear immediately
- [ ] Validation errors → User-friendly message
- [ ] All 13 fields → Populated correctly

---

**Status**: Validation service complete, AI pipeline in progress
**Priority**: Complete AI two-step pipeline next
