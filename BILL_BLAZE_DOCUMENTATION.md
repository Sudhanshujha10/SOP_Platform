# Bill Blaze - AI-Powered Claim Rule Management Platform

## Overview

Bill Blaze is a comprehensive platform for extracting, normalizing, and managing claim-editing rules from policy documents using OpenAI GPT-4. It automates the conversion of unstructured policy text into structured, machine-readable CSV rules.

## Core Features

### 1. AI-Powered Rule Extraction
- Upload PDF, DOCX, or CSV policy documents
- Automatic extraction of claim-editing rules using OpenAI GPT-4
- Intelligent normalization into standardized format
- Auto-population of all CSV columns

### 2. Comprehensive Lookup Tables
- **Code Groups**: Procedure (CPT/HCPCS), Diagnosis (ICD-10), and Modifier families
- **Payer Groups**: Insurance company classifications
- **Provider Groups**: Provider type classifications
- **Action Tags**: Available rule actions (@ADD, @REMOVE, @SWAP, etc.)
- **Chart Sections**: Clinical documentation section tags

### 3. Rule Validation
- 8-point quality checklist enforcement
- Real-time validation with error/warning reporting
- Ensures compliance with Bill Blaze specification

### 4. CSV Export
- Export rules to properly formatted CSV
- Export lookup tables for reference
- Download CSV templates for manual entry

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- OpenAI API Key ([Get one here](https://platform.openai.com/api-keys))
- OpenAI account with billing enabled

### Installation

```bash
# Clone the repository
cd bill-blaze-main

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Configuration

1. Navigate to **Rule Extraction** → **Setup** tab
2. Enter your OpenAI API Key
3. Click **Validate** to verify the key
4. Set your client prefix (e.g., "AU" for Advanced Urology)

## Workflow

### High-Level Process

```
1. Upload source files (PDF/DOCX/CSV)
   ↓
2. AI extracts claim-editing sentences
   ↓
3. Normalize each rule into single English sentence
   ↓
4. Auto-populate CSV columns with inline tags
   ↓
5. Validate rules against quality checklist
   ↓
6. Export to CSV with proper formatting
```

### Step-by-Step Guide

#### Step 1: Upload Files
1. Go to **Rule Extraction** → **Upload Files** tab
2. Drag and drop or select PDF/DOCX/CSV files
3. Wait for file processing to complete

#### Step 2: Extract Rules
1. Go to **Extract Rules** tab
2. Click **Extract Rules with AI**
3. Wait for AI processing (typically 10-30 seconds per file)
4. Review extraction confidence and warnings

#### Step 3: Review Results
1. Go to **Results** tab
2. Review extracted rules
3. Check validation status (errors/warnings)
4. Click **Export to CSV** to download

## CSV Schema

### SOP Sheet Columns

| Column | Description | Example |
|--------|-------------|---------|
| `rule_id` | Unique identifier | `AU-MOD25-0001` |
| `code` | Target code or @GROUP | `@E&M_MINOR_PROC` or `99213` |
| `action` | Space-separated @ACTION statements | `@ADD(@25)` |
| `payer_group` | Pipe-delimited @PAYER tags | `@BCBS\|@ANTHEM` |
| `provider_group` | @PROVIDER tag | `@PHYSICIAN_MD_DO` |
| `description` | Single sentence with inline tags | See examples below |
| `documentation_trigger` | Semicolon-separated keywords | `separate service;global procedure` |
| `chart_section` | Chart section tag or blank | `ASSESSMENT_PLAN` |
| `effective_date` | YYYY-MM-DD | `2024-01-01` |
| `end_date` | YYYY-MM-DD or blank | `2025-12-31` |
| `reference` | Source file + page | `POS 11 SOP p 14` |

### Description Pattern

**Format**: `For @PAYER_GROUP payers, if <trigger condition> is documented and the @CHART_SECTION states "<keyword phrase>," then @ACTION(@item).`

**Examples**:

1. **Basic Add Rule**:
   ```
   For @ALL payers, if acute renal failure requiring dialysis is documented and the @ASSESSMENT_PLAN states "acute dialysis," then @ADD(@90935).
   ```

2. **Conditional Removal**:
   ```
   For @MEDICARE payers, if bilateral procedure is performed on same date and the @PROCEDURE_SECTION states "bilateral," then @COND_REMOVE(@50).
   ```

3. **Multiple Actions**:
   ```
   For @BCBS payers, if office visit with complex medication management is documented and the @ASSESSMENT_PLAN states "complex management," then @ADD(@99213) @REMOVE(@G2211).
   ```

4. **Code Swap**:
   ```
   For @ANTHEM payers, if cystoscopy converts to ureteroscopy and the @PROCEDURE_SECTION states "scope conversion," then @SWAP(@52000→@52356).
   ```

## Lookup Tables Reference

### Code Groups (Procedures)

| Tag | Purpose | Codes |
|-----|---------|-------|
| `@E&M_MINOR_PROC` | Office E&M visits with minor procedures | 99202-99205, 99212-99215 |
| `@URODYNAMICS_PANEL` | Urodynamic testing procedures | 51728, 51729, 51741, 51797, 51798 |
| `@CRIT_CARE` | Critical care services | 99291, 99292 |
| `@ENDOSCOPY_PROCEDURES` | Cystoscopy and ureteroscopy | 52000-52356 |
| `@BPH_PROCEDURES` | BPH treatment procedures | 52450, 52500, 52601, etc. |

### Code Groups (Diagnoses)

| Tag | Purpose | Codes |
|-----|---------|-------|
| `@DX_SECONDARY` | Secondary diagnosis Z-codes | Z85.46, Z85.47, Z86.010, etc. |
| `@DX_PRIMARY_ENCOUNTER` | Primary encounter diagnoses | Z46.6, Z12.5, Z30.09, etc. |
| `@BPH_DIAGNOSES` | BPH diagnoses | N40.0, N40.1, N40.2, N40.3 |

### Payer Groups

| Tag | Name | Type |
|-----|------|------|
| `@ALL` | All Payers | Other |
| `@BCBS` | Blue Cross Blue Shield | Commercial |
| `@ANTHEM` | Anthem | Commercial |
| `@MEDICARE` | Medicare | Medicare |
| `@MEDICARE_ADVANTAGE` | Medicare Advantage | Medicare |
| `@COMMERCIAL_PPO` | Commercial PPO Plans | Commercial |

### Provider Groups

| Tag | Description |
|-----|-------------|
| `@PHYSICIAN_MD_DO` | Licensed physicians with MD or DO credentials |
| `@SPLIT_SHARED_FS` | Split or shared E&M services in facility settings |
| `@NP_PA` | Advanced practice providers |

### Action Tags

| Tag | Syntax | Description |
|-----|--------|-------------|
| `@ADD` | `@ADD(@code)` | Add a code, modifier, or diagnosis |
| `@REMOVE` | `@REMOVE(@code)` | Remove a code, modifier, or diagnosis |
| `@COND_ADD` | `@COND_ADD(@code)` | Conditionally add if criteria met |
| `@COND_REMOVE` | `@COND_REMOVE(@code)` | Conditionally remove if criteria met |
| `@SWAP` | `@SWAP(@code1→@code2)` | Replace one code with another |
| `@ALWAYS_LINK_PRIMARY` | `@ALWAYS_LINK_PRIMARY(@dx)` | Always link diagnosis as primary |
| `@ALWAYS_LINK_SECONDARY` | `@ALWAYS_LINK_SECONDARY(@dx)` | Always link diagnosis as secondary |
| `@NEVER_LINK` | `@NEVER_LINK(@dx)` | Never link this diagnosis |

### Chart Sections

| Tag | Description |
|-----|-------------|
| `ASSESSMENT_PLAN` | Assessment and plan section |
| `PROCEDURE_SECTION` | Procedure documentation |
| `TIME_ATTEST_SECTION` | Time-based service documentation |
| `DIAGNOSIS` | Primary diagnosis documentation |
| `HPI` | History of Present Illness |
| `PHYSICAL_EXAM` | Physical exam findings |

## Quality Checklist

Every rule is validated against these 8 criteria:

- [ ] Description contains exactly one sentence ending with period
- [ ] All tags (@...) valid and spelled per lookup
- [ ] Code field contains ONLY code or @GROUP (no actions)
- [ ] Action field contains ONLY @ACTION(@code) statements
- [ ] Trigger keywords duplicated in documentation_trigger
- [ ] Correct chart_section tag present (or blank for whole-note search)
- [ ] No dangling commas in CSV export
- [ ] Reference cites file + page (or bulletin #)
- [ ] Client prefix correct in rule_id ([CLIENT]- not AU-)

## Client Customization

Replace `[CLIENT]` throughout with actual client abbreviation:

- **AU** - Advanced Urology
- **HM** - Hospital Medicine
- **CC** - Critical Care
- **SCP** - Specialty Care Physicians

Example rule_id progression: `HM-SEPSIS-0001`, `HM-SEPSIS-0002`, `SCP-CC-0054`

## API Integration

### OpenAI API

The platform uses OpenAI's GPT-4 Turbo model for rule extraction. The API key is:
- Stored locally in browser (not sent to any server)
- Used only for direct communication with OpenAI's API
- Required for AI extraction features
- Requires active billing on your OpenAI account

**Get your API key**: https://platform.openai.com/api-keys

### API Usage

```typescript
import { createOpenAIService } from '@/services/openaiService';
import { lookupTables } from '@/data/lookupTables';

const openaiService = createOpenAIService(apiKey);

const result = await openaiService.extractRules({
  fileId: 'file_123',
  text: 'Policy document text...',
  clientPrefix: 'AU',
  lookupTables
});

console.log(result.rules); // Extracted SOPRule[]
console.log(result.confidence); // 0-100
console.log(result.warnings); // string[]
```

### Cost Estimation

OpenAI GPT-4 Turbo pricing (approximate):
- **Input tokens**: ~$0.01 per 1K tokens
- **Output tokens**: ~$0.03 per 1K tokens

**Typical costs per document**:
- Small (1-2 pages): $0.05 - $0.10
- Medium (5-10 pages): $0.20 - $0.50
- Large (20+ pages): $0.50 - $1.50

## File Structure

```
src/
├── components/
│   ├── FileUpload.tsx          # File upload component
│   ├── Layout.tsx              # Main layout with navigation
│   └── ui/                     # shadcn/ui components
├── data/
│   └── lookupTables.ts         # All lookup table data
├── pages/
│   ├── Dashboard.tsx           # Dashboard overview
│   ├── RuleExtraction.tsx      # AI extraction interface
│   ├── SOPs.tsx                # SOP rules management
│   └── LookupTables.tsx        # Lookup table management
├── services/
│   ├── openaiService.ts        # OpenAI GPT-4 integration
│   ├── fileProcessingService.ts # File upload/processing
│   ├── ruleValidationService.ts # Rule validation
│   └── csvExportService.ts     # CSV import/export
└── types/
    └── sop.ts                  # TypeScript type definitions
```

## Troubleshooting

### Common Issues

**1. API Key Invalid**
- Verify you copied the complete API key (starts with `sk-`)
- Check that billing is enabled on your OpenAI account
- Ensure you have sufficient credits in your account
- Verify the key has proper permissions

**2. File Upload Fails**
- Check file size (max 50MB)
- Verify file type (PDF, DOCX, or CSV only)
- Try a different browser if issues persist

**3. No Rules Extracted**
- Ensure source document contains claim-editing language
- Look for phrases like "must add modifier", "do not bill", "requires diagnosis"
- Check extraction warnings for guidance

**4. Validation Errors**
- Review the quality checklist
- Check that all @TAGS are spelled correctly
- Ensure description is a single sentence ending with period

## Best Practices

### For Best Extraction Results

1. **Source Documents**: Use clear, well-formatted policy documents
2. **File Quality**: Ensure PDFs are text-based (not scanned images)
3. **Context**: Include complete policy sections, not fragments
4. **Review**: Always review AI-extracted rules before export

### For Rule Management

1. **Naming**: Use consistent client prefixes
2. **Versioning**: Track effective dates and end dates
3. **References**: Always cite source document and page
4. **Testing**: Validate rules before deploying to production

## Support & Resources

- **Documentation**: This file
- **Lookup Tables**: Export from the Lookup Tables page
- **CSV Template**: Download from Rule Extraction page
- **OpenAI Platform**: https://platform.openai.com
- **OpenAI API Docs**: https://platform.openai.com/docs

## License

This project uses the following technologies:
- React + TypeScript
- Vite
- shadcn/ui + Tailwind CSS
- OpenAI GPT-4 API

---

**Bill Blaze** - Transforming unstructured policy documents into structured, actionable claim-editing rules.
