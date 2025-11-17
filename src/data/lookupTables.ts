import { LookupTables, CodeGroup, PayerGroup, ProviderGroup, ActionTag, ChartSection } from '@/types/sop';

// Code Groups - Procedure, Diagnosis, and Modifier families
export const codeGroups: CodeGroup[] = [
  // Procedure Groups (CPT/HCPCS)
  {
    tag: '@E&M_MINOR_PROC',
    type: 'procedure',
    expands_to: ['99202', '99203', '99204', '99205', '99212', '99213', '99214', '99215'],
    purpose: 'Office E&M visits with minor procedures'
  },
  {
    tag: '@E&M_OFFICE_VISITS',
    type: 'procedure',
    expands_to: ['99202', '99203', '99204', '99205', '99211', '99212', '99213', '99214', '99215'],
    purpose: 'All office E&M visit codes'
  },
  {
    tag: '@URODYNAMICS_PANEL',
    type: 'procedure',
    expands_to: ['51728', '51729', '51741', '51797', '51798'],
    purpose: 'Urodynamic testing procedures'
  },
  {
    tag: '@BOTOX_BLADDER',
    type: 'procedure',
    expands_to: ['52287', 'J0585'],
    purpose: 'Botox injection for bladder dysfunction'
  },
  {
    tag: '@HYDRODISTENSION',
    type: 'procedure',
    expands_to: ['52260', '52265'],
    purpose: 'Bladder hydrodistension procedures'
  },
  {
    tag: '@PROVENGE_INFUSION',
    type: 'procedure',
    expands_to: ['Q2043', '96365', '96366'],
    purpose: 'Provenge immunotherapy infusion'
  },
  {
    tag: '@CRIT_CARE',
    type: 'procedure',
    expands_to: ['99291', '99292'],
    purpose: 'Critical care services'
  },
  {
    tag: '@ENDOSCOPY_PROCEDURES',
    type: 'procedure',
    expands_to: ['52000', '52001', '52005', '52007', '52010', '52204', '52214', '52224', '52234', '52235', '52240', '52250', '52260', '52265', '52270', '52275', '52276', '52277', '52281', '52282', '52283', '52285', '52287', '52290', '52300', '52301', '52305', '52310', '52315', '52320', '52325', '52327', '52330', '52332', '52334', '52341', '52342', '52343', '52344', '52345', '52346', '52351', '52352', '52353', '52354', '52355', '52356'],
    purpose: 'Cystoscopy and ureteroscopy procedures'
  },
  {
    tag: '@BPH_PROCEDURES',
    type: 'procedure',
    expands_to: ['52450', '52500', '52601', '52630', '52647', '52648', '52649', '53850', '53852', '53854', '53855'],
    purpose: 'Benign prostatic hyperplasia treatment procedures'
  },
  {
    tag: '@COLONOSCOPY_SCREENING',
    type: 'procedure',
    expands_to: ['G0105', 'G0121', '45378', '45380', '45381', '45384', '45385'],
    purpose: 'Screening colonoscopy procedures'
  },
  {
    tag: '@PREVENTIVE_CARE',
    type: 'procedure',
    expands_to: ['99381', '99382', '99383', '99384', '99385', '99386', '99387', '99391', '99392', '99393', '99394', '99395', '99396', '99397'],
    purpose: 'Preventive medicine services'
  },
  {
    tag: '@DRUG_ADMIN',
    type: 'procedure',
    expands_to: ['96365', '96366', '96367', '96368', '96369', '96370', '96371', '96372', '96373', '96374', '96375', '96376', '96377'],
    purpose: 'Drug administration and infusion codes'
  },
  {
    tag: '@SURGICAL_PROC',
    type: 'procedure',
    expands_to: ['50020', '50040', '50045', '50060', '50065', '50070', '50075', '50080', '50081', '50100', '50120', '50125', '50130', '50135', '50205', '50220', '50225', '50230', '50234', '50236', '50240', '50250', '50280', '50290'],
    purpose: 'Major surgical procedures with global periods'
  },
  {
    tag: '@NCCI_CLASH_GROUP',
    type: 'procedure',
    expands_to: ['52000', '52005', '52204', '52214', '52224', '52234', '52235', '52240'],
    purpose: 'Codes with known NCCI edits'
  },

  // Diagnosis Groups
  {
    tag: '@DX_SECONDARY',
    type: 'diagnosis',
    expands_to: ['Z85.46', 'Z85.47', 'Z85.50', 'Z85.51', 'Z85.52', 'Z85.53', 'Z85.54', 'Z86.010', 'Z86.011', 'Z86.016', 'Z87.440', 'Z87.441', 'Z87.442'],
    purpose: 'Secondary diagnosis codes - history/status Z-codes'
  },
  {
    tag: '@DX_PRIMARY_ENCOUNTER',
    type: 'diagnosis',
    expands_to: ['Z46.6', 'Z12.5', 'Z30.09', 'Z30.2', 'Z30.430', 'Z30.431', 'Z30.432', 'Z30.433'],
    purpose: 'Primary encounter diagnosis codes'
  },
  {
    tag: '@DX_TRIAD_PROLIA',
    type: 'diagnosis',
    expands_to: ['C61', 'M81.0', 'Z79.83'],
    purpose: 'Prolia therapy diagnosis triad'
  },
  {
    tag: '@DX_PROVENGE_PAIR',
    type: 'diagnosis',
    expands_to: ['C61', 'Z51.11'],
    purpose: 'Provenge therapy diagnosis pair'
  },
  {
    tag: '@BPH_DIAGNOSES',
    type: 'diagnosis',
    expands_to: ['N40.0', 'N40.1', 'N40.2', 'N40.3'],
    purpose: 'Benign prostatic hyperplasia diagnoses'
  },

  // Modifier Groups
  {
    tag: '@MODIFIER_25',
    type: 'modifier',
    expands_to: ['25'],
    purpose: 'Significant, separately identifiable E&M service'
  },
  {
    tag: '@MODIFIER_50',
    type: 'modifier',
    expands_to: ['50'],
    purpose: 'Bilateral procedure'
  },
  {
    tag: '@MODIFIER_59',
    type: 'modifier',
    expands_to: ['59'],
    purpose: 'Distinct procedural service'
  },
  {
    tag: '@MODIFIER_XU',
    type: 'modifier',
    expands_to: ['XU'],
    purpose: 'Unusual non-overlapping service'
  },
  {
    tag: '@MODIFIER_JW_JZ',
    type: 'modifier',
    expands_to: ['JW', 'JZ'],
    purpose: 'Drug wastage modifiers'
  }
];

// Payer Groups
export const payerGroups: PayerGroup[] = [
  { tag: '@ALL', name: 'All Payers', type: 'other' },
  { tag: '@BCBS', name: 'Blue Cross Blue Shield', type: 'commercial' },
  { tag: '@ANTHEM', name: 'Anthem', type: 'commercial' },
  { tag: '@AETNA', name: 'Aetna', type: 'commercial' },
  { tag: '@CIGNA', name: 'Cigna', type: 'commercial' },
  { tag: '@UHC', name: 'UnitedHealthcare', type: 'commercial' },
  { tag: '@UHC_COMMERCIAL', name: 'UnitedHealthcare Commercial', type: 'commercial' },
  { tag: '@HUMANA', name: 'Humana', type: 'commercial' },
  { tag: '@COMMERCIAL_PPO', name: 'Commercial PPO Plans', type: 'commercial' },
  { tag: '@MEDICARE', name: 'Medicare', type: 'medicare' },
  { tag: '@MEDICARE_ADVANTAGE', name: 'Medicare Advantage', type: 'medicare' },
  { tag: '@MEDICAID', name: 'Medicaid', type: 'medicaid' },
  { tag: '@KAISER', name: 'Kaiser Permanente', type: 'other' }
];

// Provider Groups
export const providerGroups: ProviderGroup[] = [
  {
    tag: '@PHYSICIAN_MD_DO',
    name: 'Physicians (MD/DO)',
    description: 'Licensed physicians with MD or DO credentials'
  },
  {
    tag: '@SPLIT_SHARED_FS',
    name: 'Split/Shared Facility Services',
    description: 'Split or shared E&M services in facility settings'
  },
  {
    tag: '@NP_PA',
    name: 'Nurse Practitioners / Physician Assistants',
    description: 'Advanced practice providers'
  },
  {
    tag: '@ALL_PROVIDERS',
    name: 'All Providers',
    description: 'Applies to all provider types'
  }
];

// Action Tags
export const actionTags: ActionTag[] = [
  {
    tag: '@ADD',
    syntax: '@ADD(@code)',
    description: 'Add a code, modifier, or diagnosis to the claim',
    category: 'code'
  },
  {
    tag: '@REMOVE',
    syntax: '@REMOVE(@code)',
    description: 'Remove a code, modifier, or diagnosis from the claim',
    category: 'code'
  },
  {
    tag: '@COND_ADD',
    syntax: '@COND_ADD(@code)',
    description: 'Conditionally add a code if specific criteria are met',
    category: 'conditional'
  },
  {
    tag: '@COND_REMOVE',
    syntax: '@COND_REMOVE(@code)',
    description: 'Conditionally remove a code if specific criteria are met',
    category: 'conditional'
  },
  {
    tag: '@SWAP',
    syntax: '@SWAP(@code1→@code2)',
    description: 'Replace one code with another',
    category: 'code'
  },
  {
    tag: '@LINK_IF_MODIFIER',
    syntax: '@LINK_IF_MODIFIER(@modifier, @diagnosis)',
    description: 'Link diagnosis if specific modifier is present',
    category: 'diagnosis'
  },
  {
    tag: '@ALWAYS_LINK_PRIMARY',
    syntax: '@ALWAYS_LINK_PRIMARY(@diagnosis)',
    description: 'Always link diagnosis as primary',
    category: 'diagnosis'
  },
  {
    tag: '@ALWAYS_LINK_SECONDARY',
    syntax: '@ALWAYS_LINK_SECONDARY(@diagnosis)',
    description: 'Always link diagnosis as secondary',
    category: 'diagnosis'
  },
  {
    tag: '@ALWAYS_LINK_TERTIARY',
    syntax: '@ALWAYS_LINK_TERTIARY(@diagnosis)',
    description: 'Always link diagnosis as tertiary',
    category: 'diagnosis'
  },
  {
    tag: '@NEVER_LINK',
    syntax: '@NEVER_LINK(@diagnosis)',
    description: 'Never link this diagnosis to the procedure',
    category: 'diagnosis'
  }
];

// Chart Sections
export const chartSections: ChartSection[] = [
  {
    tag: 'ASSESSMENT_PLAN',
    name: 'Assessment & Plan',
    description: 'Assessment and plan section of clinical documentation'
  },
  {
    tag: 'PROCEDURE_SECTION',
    name: 'Procedure Notes',
    description: 'Procedure documentation and operative notes'
  },
  {
    tag: 'TIME_ATTEST_SECTION',
    name: 'Time Attestation',
    description: 'Time-based service documentation'
  },
  {
    tag: 'DIAGNOSIS',
    name: 'Diagnosis Section',
    description: 'Primary diagnosis documentation'
  },
  {
    tag: 'TELEHEALTH',
    name: 'Telehealth Documentation',
    description: 'Telemedicine visit documentation'
  },
  {
    tag: 'PREVENTIVE_CARE',
    name: 'Preventive Care',
    description: 'Preventive medicine documentation'
  },
  {
    tag: 'SURGICAL_NOTES',
    name: 'Surgical Notes',
    description: 'Surgical procedure documentation'
  },
  {
    tag: 'HPI',
    name: 'History of Present Illness',
    description: 'HPI section of clinical note'
  },
  {
    tag: 'ROS',
    name: 'Review of Systems',
    description: 'Review of systems documentation'
  },
  {
    tag: 'PHYSICAL_EXAM',
    name: 'Physical Examination',
    description: 'Physical exam findings'
  },
  {
    tag: 'MEDICATION_MANAGEMENT',
    name: 'Medication Management',
    description: 'Medication reconciliation and management'
  }
];

// Combined lookup tables
export const lookupTables: LookupTables = {
  codeGroups,
  payerGroups,
  providerGroups,
  actionTags,
  chartSections
};
