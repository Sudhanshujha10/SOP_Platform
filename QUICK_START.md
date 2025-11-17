# Bill Blaze - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Start the Development Server

```bash
npm run dev
```

The app will open at `http://localhost:5173`

### Step 3: Get Your OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Click "Create new secret key"
3. Copy the generated key

### Step 4: Configure Bill Blaze

1. Open the app and navigate to **Rule Extraction**
2. Click the **Setup** tab
3. Paste your OpenAI API key
4. Click **Validate**
5. Enter your client prefix (e.g., "AU" for Advanced Urology)

### Step 5: Extract Your First Rule

1. Go to the **Upload Files** tab
2. Upload a PDF or DOCX policy document
3. Go to the **Extract Rules** tab
4. Click **Extract Rules with AI**
5. Wait for processing (10-30 seconds)
6. Go to **Results** tab to see extracted rules
7. Click **Export to CSV** to download

## 📋 What You Can Do

### ✅ AI-Powered Extraction
- Upload policy documents (PDF, DOCX, CSV)
- Automatically extract claim-editing rules
- Normalize into standardized format
- Auto-populate CSV columns

### ✅ Rule Management
- View and validate extracted rules
- Check quality with 8-point checklist
- Export to properly formatted CSV
- Download templates for manual entry

### ✅ Lookup Tables
- Browse code groups (CPT/HCPCS/ICD-10)
- View payer and provider classifications
- Explore action tags and chart sections
- Export lookup tables to CSV

## 📝 Example Use Cases

### Use Case 1: Extract Modifier 25 Rules
Upload a payer policy document about modifier 25 requirements. Bill Blaze will:
- Identify all modifier 25 rules
- Normalize them into the standard format
- Tag with appropriate @CODE_GROUPS
- Export ready-to-use CSV

### Use Case 2: Build Client-Specific SOP
1. Set client prefix to "HM" (Hospital Medicine)
2. Upload multiple policy documents
3. Extract all rules
4. Export as `HM_sop_rules.csv`
5. Import into your billing system

### Use Case 3: Maintain Lookup Tables
- View all predefined code groups
- Export lookup tables for reference
- Share with billing team
- Use as training material

## 🎯 Key Features

| Feature | Description |
|---------|-------------|
| **AI Extraction** | OpenAI GPT-4 automatically extracts rules |
| **Smart Tagging** | Auto-applies @TAGS from lookup tables |
| **Validation** | 8-point quality checklist ensures accuracy |
| **CSV Export** | Properly formatted, ready for import |
| **Lookup Management** | 100+ predefined code groups and tags |

## 📊 CSV Schema Overview

Every extracted rule includes:

```csv
rule_id,code,action,payer_group,provider_group,description,documentation_trigger,chart_section,effective_date,end_date,reference
AU-MOD25-0001,@E&M_MINOR_PROC,@ADD(@25),@BCBS|@ANTHEM,@PHYSICIAN_MD_DO,"For @BCBS|@ANTHEM payers, if office E&M is billed with 0-/10-day global procedure and the @ASSESSMENT_PLAN states ""separate service,"" then @ADD(@25).",separate service;global procedure,ASSESSMENT_PLAN,2024-01-01,,Policy Doc p. 1
```

## 🔧 Troubleshooting

### API Key Not Working?
- Ensure you copied the complete key
- Check you have credits in your OpenAI account
- Verify the key has proper permissions

### No Rules Extracted?
- Check if document contains claim-editing language
- Look for phrases like "must add modifier", "do not bill"
- Try a different section of the document

### Validation Errors?
- Review the 8-point quality checklist
- Check that @TAGS are spelled correctly
- Ensure description is one sentence ending with period

## 📚 Next Steps

1. **Read Full Documentation**: See `BILL_BLAZE_DOCUMENTATION.md`
2. **Explore Lookup Tables**: Navigate to Lookup Tables page
3. **Download Templates**: Get CSV templates from Rule Extraction page
4. **Start Extracting**: Upload your first policy document

## 💡 Pro Tips

- **Batch Processing**: Upload multiple files at once
- **Review Before Export**: Always check validation status
- **Use Templates**: Download CSV template for manual rules
- **Export Lookups**: Share lookup tables with your team
- **Client Prefixes**: Use consistent abbreviations (AU, HM, CC, etc.)

## 🎓 Learning Resources

- **Description Pattern**: See examples in documentation
- **Lookup Tags**: Browse in Lookup Tables page
- **Quality Checklist**: Review in validation results
- **CSV Format**: Download template for reference

---

**Ready to transform your policy documents into structured rules?** Start with the Rule Extraction page! 🚀
