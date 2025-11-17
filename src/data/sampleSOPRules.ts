import { AdvancedSOPRule } from '@/types/advanced';

// Sample SOP rules to demonstrate the lookup table functionality
export const sampleAdvanceUrologySOPRules: AdvancedSOPRule[] = [
  {
    rule_id: "ADV-URO-001",
    description: "For @ALL payers, if complex cystometrogram with voiding pressure studies or urethral pressure profile studies is performed, then @ALWAYS_LINK_PRIMARY(@BPH_DIAGNOSES)",
    code_group: "@URODYNAMICS_PANEL",
    code: "51728,51729,51741",
    payer_group: "@ALL",
    provider_group: "@PHYSICIAN_MD_DO",
    action: "@ALWAYS_LINK_PRIMARY(@BPH_DIAGNOSES)",
    chart_section: "PROCEDURE_SECTION",
    source: "manual",
    confidence: 0.95,
    status: "approved",
    validation_status: "valid",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    rule_id: "ADV-URO-002", 
    description: "For @MEDICARE payers, @ADD modifier 25 when E&M service is performed with @BOTOX_BLADDER procedure",
    code_group: "@E&M_OFFICE_VISITS,@BOTOX_BLADDER",
    code: "99213,99214,52287,J0585",
    payer_group: "@MEDICARE",
    provider_group: "@PHYSICIAN_MD_DO",
    action: "@ADD(@MODIFIER_25)",
    chart_section: "ASSESSMENT_PLAN",
    source: "manual",
    confidence: 0.92,
    status: "approved",
    validation_status: "valid",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    rule_id: "ADV-URO-003",
    description: "For @COMMERCIAL_PPO payers, when @HYDRODISTENSION is performed, @LINK_IF_MODIFIER(50, @DX_PRIMARY_ENCOUNTER)",
    code_group: "@HYDRODISTENSION",
    code: "52260,52265",
    payer_group: "@COMMERCIAL_PPO",
    provider_group: "@ALL_PROVIDERS",
    action: "@LINK_IF_MODIFIER(@MODIFIER_50, @DX_PRIMARY_ENCOUNTER)",
    chart_section: "PROCEDURE_SECTION",
    source: "manual",
    confidence: 0.88,
    status: "approved",
    validation_status: "valid",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    rule_id: "ADV-URO-004",
    description: "For @UHC payers, @REMOVE diagnosis codes @DX_SECONDARY when primary procedure is @PREVENTIVE_CARE",
    code_group: "@PREVENTIVE_CARE",
    code: "99381,99382,99383,99384",
    payer_group: "@UHC",
    provider_group: "@NP_PA",
    action: "@REMOVE(@DX_SECONDARY)",
    chart_section: "PREVENTIVE_CARE",
    source: "manual",
    confidence: 0.90,
    status: "approved",
    validation_status: "valid",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    rule_id: "ADV-URO-005",
    description: "For @BCBS payers, when @ENDOSCOPY_PROCEDURES are performed, check for @NCCI_CLASH_GROUP conflicts and @SWAP conflicting codes",
    code_group: "@ENDOSCOPY_PROCEDURES,@NCCI_CLASH_GROUP",
    code: "52000,52005,52204,52214,52224",
    payer_group: "@BCBS",
    provider_group: "@PHYSICIAN_MD_DO",
    action: "@SWAP(@NCCI_CLASH_GROUP→@ENDOSCOPY_PROCEDURES)",
    chart_section: "SURGICAL_NOTES",
    source: "manual",
    confidence: 0.85,
    status: "approved",
    validation_status: "valid",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  // Add a conflicting rule to test conflict resolution
  {
    rule_id: "ADV-URO-006",
    description: "For @MEDICARE payers, @REMOVE modifier 25 when E&M service is performed with @BOTOX_BLADDER procedure",
    code_group: "@E&M_OFFICE_VISITS,@BOTOX_BLADDER",
    code: "99213,99214,52287,J0585",
    payer_group: "@MEDICARE",
    provider_group: "@PHYSICIAN_MD_DO",
    action: "@REMOVE(@MODIFIER_25)", // This conflicts with ADV-URO-002 which has @ADD(@MODIFIER_25)
    chart_section: "ASSESSMENT_PLAN",
    source: "manual",
    confidence: 0.88,
    status: "pending",
    validation_status: "valid",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Function to simulate adding these rules to an SOP
export const populateAdvanceUrologySOPWithSampleRules = () => {
  console.log('🔄 Populating Advance Urology SOP with sample rules...');
  return sampleAdvanceUrologySOPRules;
};
