# SOP Management Platform 🔥

**AI-Powered Claim Rule Management Platform**

Transform unstructured policy documents into structured, machine-readable claim-editing rules using OpenAI GPT-4.

![Bill Blaze](https://img.shields.io/badge/AI-Powered-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)
![React](https://img.shields.io/badge/React-18.3-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

**See [QUICK_START.md](./QUICK_START.md) for detailed setup instructions.**

## ✨ Features

### 🤖 AI-Powered Rule Extraction
- Upload PDF, DOCX, or CSV policy documents
- Automatic extraction using OpenAI GPT-4
- Intelligent normalization into standardized format
- Auto-population of all CSV columns

### 📋 Comprehensive Rule Management
- 8-point quality checklist validation
- Real-time error and warning reporting
- CSV export with proper formatting
- Template download for manual entry

### 📊 Lookup Table Management
- **100+ Code Groups**: CPT/HCPCS, ICD-10, Modifiers
- **13 Payer Groups**: BCBS, Anthem, Medicare, etc.
- **10 Action Tags**: @ADD, @REMOVE, @SWAP, etc.
- **11 Chart Sections**: Clinical documentation tags

### 🎯 Enterprise-Ready
- Client-specific prefixes (AU, HM, CC, etc.)
- Version control with effective dates
- Rule precedence and conflict resolution
- Batch processing support

## 📖 Documentation

- **[Quick Start Guide](./QUICK_START.md)** - Get started in 5 minutes
- **[Full Documentation](./BILL_BLAZE_DOCUMENTATION.md)** - Complete platform guide
- **[CSV Schema](#csv-schema)** - Data format specification
- **[API Reference](#api-integration)** - Google Gemini integration

## 🏗️ Architecture

```
Bill Blaze Platform
│
├── Rule Extraction (AI-Powered)
│   ├── File Upload (PDF/DOCX/CSV)
│   ├── Gemini AI Processing
│   ├── Rule Normalization
│   └── CSV Export
│
├── Rule Management
│   ├── Validation Engine
│   ├── Quality Checklist
│   └── Version Control
│
└── Lookup Tables
    ├── Code Groups
    ├── Payer Groups
    ├── Provider Groups
    └── Action Tags
```

## 📝 CSV Schema

### Rule Format

```csv
rule_id,code,action,payer_group,provider_group,description,documentation_trigger,chart_section,effective_date,end_date,reference
```

### Example Rule

```csv
AU-MOD25-0001,@E&M_MINOR_PROC,@ADD(@25),@BCBS|@ANTHEM,@PHYSICIAN_MD_DO,"For @BCBS|@ANTHEM payers, if office E&M is billed with 0-/10-day global procedure and the @ASSESSMENT_PLAN states ""separate service,"" then @ADD(@25).",separate service;global procedure,ASSESSMENT_PLAN,2024-01-01,,Policy Doc p. 1
```

## 🔧 Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Framework**: shadcn/ui + Tailwind CSS
- **AI Engine**: OpenAI GPT-4 Turbo
- **State Management**: React Query
- **Routing**: React Router
- **Icons**: Lucide React

## 🎯 Use Cases

### Healthcare Organizations
- Automate SOP creation from policy documents
- Maintain client-specific rule libraries
- Ensure compliance with payer requirements

### Medical Billing Companies
- Extract rules from multiple payer policies
- Standardize billing procedures
- Reduce manual rule entry errors

### Revenue Cycle Management
- Build comprehensive rule databases
- Track policy changes over time
- Export rules to billing systems

## 🔐 Security & Privacy

- **API Key Storage**: Local browser storage only
- **No Server Communication**: Direct Google API calls
- **Data Privacy**: Your documents never leave your browser
- **Secure**: HTTPS-only communication

## 📊 Quality Assurance

Every rule is validated against:
- ✅ Single sentence format
- ✅ Valid @TAG spelling
- ✅ Correct code field format
- ✅ Valid action syntax
- ✅ Trigger keywords present
- ✅ Chart section validation
- ✅ Reference citation
- ✅ Client prefix format

## 🤝 Contributing

This is a specialized healthcare billing platform. For feature requests or bug reports, please open an issue.

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- **OpenAI** - Powering intelligent rule extraction with GPT-4
- **shadcn/ui** - Beautiful UI components
- **Lucide** - Icon library

## 📞 Support

- **Documentation**: See [BILL_BLAZE_DOCUMENTATION.md](./BILL_BLAZE_DOCUMENTATION.md)
- **Quick Start**: See [QUICK_START.md](./QUICK_START.md)
- **API Key**: Get from [OpenAI Platform](https://platform.openai.com/api-keys)

---

**Built with ❤️ for healthcare billing professionals**

Transform your policy documents into actionable rules today! 🚀
