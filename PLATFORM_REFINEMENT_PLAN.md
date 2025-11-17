# SOP Platform Refinement - Implementation Plan

## ✅ Completed

### 1. AI Provider Service ✅
**File**: `src/services/aiProviderService.ts`

**Features**:
- Multi-provider support (OpenAI, Anthropic, Gemini)
- Centralized AI configuration
- Admin-only API key management
- Auto-generate client prefix with AI
- Extract rules using configured provider
- Fallback prefix generation without AI

**Key Methods**:
- `getConfig()` - Get current AI configuration
- `setConfig()` - Set AI configuration (admin only)
- `extractRules()` - Extract rules using configured provider
- `suggestClientPrefix()` - AI-powered prefix suggestion

### 2. Settings Component ✅
**File**: `src/components/Settings.tsx`

**Features**:
- AI Provider configuration tab
  - Switch between OpenAI/Anthropic/Gemini
  - Model selection
  - API key management
  - Test connection
- Appearance tab
  - Light/Dark theme toggle
- Account tab
  - User profile (placeholder)

---

## 🔨 To Be Implemented

### 3. Remove Rule Extraction Module
**Actions**:
1. Remove `src/pages/RuleExtraction.tsx` from navigation
2. Update Layout.tsx to remove "extraction" module
3. Update MainApp.tsx to remove RuleExtraction route
4. All extraction logic now in CreateNewSOP component

### 4. Enhanced CreateNewSOP Component
**File**: `src/components/CreateNewSOP.tsx` (update existing)

**New Features**:
- Use AIProviderService instead of direct API calls
- Auto-populate client prefix when organization name entered
- Support both document AND CSV uploads in same workflow
- Real-time AI extraction with configured provider
- Auto-populate all 13 SOP fields
- Extract and populate lookup tables with new @tags

**Workflow**:
```
Step 1: SOP Details
- Organization name → AI suggests prefix → User can edit
- Department
- Creator

Step 2: Upload
- Upload documents (PDF, DOCX) OR
- Upload CSV files
- Both trigger AI extraction

Step 3: Processing
- Sequential AI processing
- Extract rules
- Auto-populate fields
- Extract new @tags for lookup tables

Step 4: Review & Complete
- Show extracted rules
- SOP becomes Active
```

### 5. Template System
**New Files**:
- `src/types/template.ts` - Template data models
- `src/services/templateService.ts` - Template CRUD operations
- `src/components/TemplateLibrary.tsx` - Browse templates
- `src/components/CreateFromTemplate.tsx` - Create SOP from template

**Features**:
- Pre-built specialty templates (Urology, Cardiology, etc.)
- Import custom templates
- View/edit template structures
- Create SOP from template
- All 13 rule fields in templates

**Template Structure**:
```typescript
interface SOPTemplate {
  id: string;
  name: string;
  specialty: string;
  description: string;
  rules: AdvancedSOPRule[];
  created_at: string;
  created_by: string;
  is_public: boolean;
}
```

### 6. Enhanced Draft SOP Support
**Updates to**:
- `src/services/sopManagementService.ts`
- `src/pages/SOPDetail.tsx`

**Features**:
- Add "Upload Documents" button in Draft SOP detail view
- Support document/CSV upload from draft
- Trigger AI extraction
- Auto-move to Active when rules extracted
- Show upload progress in draft view

### 7. Lookup Table Enhancements
**File**: `src/pages/LookupTables.tsx` (update existing)

**Features**:
- Add export functionality (CSV, JSON)
- Remove any export buttons from deprecated areas
- Show dynamically extracted @tags
- Mark new tags as "Needs Definition"
- Allow admin to define new tags

### 8. Remove All Static Data
**Files to Update**:
- `src/pages/DynamicDashboard.tsx` - Already dynamic ✅
- `src/pages/SOPManagement.tsx` - Already dynamic ✅
- `src/pages/SOPDetail.tsx` - Already dynamic ✅
- `src/pages/LookupTables.tsx` - Make fully dynamic
- Remove any hardcoded sample data

---

## 📋 Implementation Checklist

### Phase 1: Core Infrastructure ✅
- [x] AI Provider Service with multi-provider support
- [x] Settings component with AI configuration
- [x] Theme support

### Phase 2: SOP Creation Workflow
- [ ] Update CreateNewSOP to use AIProviderService
- [ ] Add auto-populate client prefix with AI
- [ ] Support CSV upload alongside documents
- [ ] Integrate lookup table auto-population
- [ ] Remove Rule Extraction module from navigation

### Phase 3: Template System
- [ ] Create template data models
- [ ] Build template service
- [ ] Create template library component
- [ ] Add "Create from Template" workflow
- [ ] Add template section to Dashboard

### Phase 4: Draft SOP Enhancement
- [ ] Add upload capability to draft SOPs
- [ ] Show upload button in SOPDetail for drafts
- [ ] Trigger AI extraction from draft
- [ ] Auto-transition Draft → Active

### Phase 5: Lookup Tables
- [ ] Add export functionality
- [ ] Show dynamically extracted tags
- [ ] Add tag definition interface
- [ ] Remove exports from other modules

### Phase 6: Final Cleanup
- [ ] Remove all static/sample data
- [ ] Ensure all data from services
- [ ] Test end-to-end workflows
- [ ] Update documentation

---

## 🎯 Key Design Principles

1. **Single Entry Point**: Only "Create New SOP" for SOP creation
2. **AI-Powered**: All extraction uses configured AI provider
3. **No API Keys for Users**: Admin configures in Settings
4. **Unified Workflow**: Documents + CSV in same flow
5. **Auto-Population**: Client prefix, fields, lookup tables
6. **Dynamic Data**: No static content anywhere
7. **Real-time**: All updates reflect immediately

---

## 🔄 Data Flow

### SOP Creation
```
User → Create New SOP → Enter Org Name → AI Suggests Prefix
→ Upload Docs/CSV → AIProviderService.extractRules()
→ Rules Extracted → Fields Auto-Populated → Lookup Tables Updated
→ SOP Active → Dashboard Shows New SOP
```

### Template Usage
```
User → Browse Templates → Select Template → Customize Rules
→ Create SOP → SOP Active with Template Rules
```

### Draft to Active
```
Draft SOP → Upload Documents → AI Extraction → Rules Added
→ Status Changes to Active → Dashboard Updates
```

---

## 📊 Success Criteria

- ✅ No Rule Extraction module visible
- ✅ Settings functional with AI provider config
- ✅ CreateNewSOP uses AIProviderService
- ✅ Client prefix auto-populated with AI
- ✅ CSV and documents in same workflow
- ✅ Templates available and functional
- ✅ Draft SOPs can upload documents
- ✅ Lookup tables export from dedicated module
- ✅ No static data anywhere
- ✅ All features use configured AI provider

---

## 🚀 Next Steps

1. **Immediate**: Update CreateNewSOP to use AIProviderService
2. **Next**: Build template system
3. **Then**: Enhance draft SOP upload
4. **Finally**: Remove static data and test

---

**Status**: Phase 1 Complete (AI Provider + Settings)
**Next**: Phase 2 (SOP Creation Workflow)
