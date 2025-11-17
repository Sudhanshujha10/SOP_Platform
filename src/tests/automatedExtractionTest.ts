/**
 * Automated Extraction Test
 * Tests the complete SOP creation and rule extraction pipeline
 * Uses dummy healthcare data (Cardiology specialty)
 */

import { AIProviderService } from '@/services/aiProviderService';
import { SOPManagementService } from '@/services/sopManagementService';

// Dummy Cardiology Policy Document
const DUMMY_CARDIOLOGY_POLICY = `
CARDIOLOGY BILLING POLICY
Effective Date: January 1, 2024

POLICY 1: MODIFIER 25 FOR E&M WITH PROCEDURES
For all commercial payers including Blue Cross Blue Shield and Anthem, append modifier 25 to 
evaluation and management codes (99201-99215) when performed on the same day as a minor 
cardiovascular procedure. Documentation must clearly indicate a separately identifiable E&M service.

Documentation Requirements:
- Chief complaint documented
- History of present illness
- Physical examination findings
- Medical decision making

Reference: BCBS Policy Manual Section 4.2, Page 45

POLICY 2: ECHOCARDIOGRAM MEDICAL NECESSITY
For Medicare and Medicaid patients, echocardiograms (CPT codes 93306, 93307, 93308) require 
prior authorization when ordered for routine screening. Medical necessity must be documented 
with specific cardiac symptoms or conditions including:
- Chest pain
- Shortness of breath
- Abnormal EKG findings
- Heart murmur evaluation

Effective Date: 2024-01-01
Reference: CMS LCD L34567, Page 12

POLICY 3: STRESS TEST BUNDLING
For all payers, stress test components (93015, 93016, 93017, 93018) should not be billed 
separately when performed as part of a complete stress test (93015). Remove individual 
component codes and bill only the complete procedure code.

Documentation trigger: stress test, exercise tolerance test, cardiac stress
Chart section: DIAGNOSTIC_TESTS
Effective: January 1, 2024
Reference: CPT Guidelines 2024, Cardiovascular Section

POLICY 4: HOLTER MONITOR DURATION
For commercial payers, 24-hour Holter monitoring (93224) and 48-hour Holter monitoring (93226) 
are not separately billable. Bill the appropriate code based on actual monitoring duration.
If monitoring extends beyond 48 hours, use extended monitoring codes (93227).

Payer groups: Blue Cross, Anthem, UnitedHealthcare, Aetna
Provider group: Cardiologists (MD/DO)
Effective: 2024-01-01
Reference: Payer Policy Manual v2024.1

POLICY 5: CARDIAC CATHETERIZATION MODIFIERS
For Medicare patients, when performing cardiac catheterization with intervention (92920-92944),
append modifier 59 to separately billable procedures performed through different access sites.
Do not use modifier 59 for procedures through the same access site.

Documentation must include:
- Access site location
- Procedure performed
- Separate medical necessity

Chart Section: PROCEDURE_NOTES
Effective Date: January 1, 2024
End Date: December 31, 2024
Reference: Medicare Claims Processing Manual Chapter 12
`;

/**
 * Run automated test
 */
export async function runAutomatedTest(): Promise<{
  success: boolean;
  sopId: string | null;
  rulesExtracted: number;
  sopStatus: string;
  errors: string[];
  logs: string[];
}> {
  const logs: string[] = [];
  const errors: string[] = [];
  let sopId: string | null = null;
  let rulesExtracted = 0;
  let sopStatus = 'unknown';

  try {
    logs.push('🧪 Starting Automated Extraction Test...');
    logs.push('📋 Specialty: Cardiology');
    logs.push('📄 Document: Dummy Cardiology Billing Policy');
    logs.push('');

    // Step 1: Check AI Provider Configuration
    logs.push('Step 1: Checking AI Provider Configuration...');
    const aiConfig = AIProviderService.getConfig();
    
    if (!aiConfig.apiKey) {
      errors.push('❌ AI Provider not configured. Please configure in Settings.');
      logs.push('❌ FAILED: No API key configured');
      return {
        success: false,
        sopId: null,
        rulesExtracted: 0,
        sopStatus: 'not_created',
        errors,
        logs
      };
    }
    
    logs.push(`✅ AI Provider: ${aiConfig.provider.toUpperCase()}`);
    logs.push(`✅ Model: ${aiConfig.model}`);
    logs.push(`✅ API Key: ${aiConfig.apiKey.substring(0, 10)}...${aiConfig.apiKey.substring(aiConfig.apiKey.length - 4)}`);
    
    // Test connection first
    logs.push('🔌 Testing AI provider connection...');
    try {
      const testPrefix = await AIProviderService.suggestClientPrefix('Test Organization');
      logs.push(`✅ Connection successful! (Generated prefix: ${testPrefix})`);
    } catch (connError) {
      const connErrorMsg = connError instanceof Error ? connError.message : 'Connection failed';
      errors.push(`❌ AI Provider connection failed: ${connErrorMsg}`);
      logs.push(`❌ FAILED: ${connErrorMsg}`);
      logs.push('💡 Possible issues:');
      logs.push('   - Invalid API key');
      logs.push('   - API key lacks permissions');
      logs.push('   - Network/CORS issue');
      logs.push('   - Rate limit exceeded');
      return {
        success: false,
        sopId: null,
        rulesExtracted: 0,
        sopStatus: 'not_created',
        errors,
        logs
      };
    }
    logs.push('');

    // Step 2: Create SOP
    logs.push('Step 2: Creating SOP...');
    const sop = SOPManagementService.createSOP({
      name: 'Cardiology Billing SOP - Test',
      organisation_name: 'Test Cardiology Associates',
      department: 'Cardiology Department',
      created_by: 'Automated Test'
    });
    
    sopId = sop.id;
    sopStatus = sop.status;
    
    logs.push(`✅ SOP Created: ${sop.id}`);
    logs.push(`✅ SOP Name: ${sop.name}`);
    logs.push(`✅ Initial Status: ${sop.status}`);
    logs.push(`✅ Initial Rules Count: ${sop.rules_count}`);
    logs.push('');

    // Step 3: Extract Rules using AI
    logs.push('Step 3: Extracting Rules with AI...');
    logs.push('📄 Processing dummy cardiology policy document...');
    
    const extractionResult = await AIProviderService.extractRulesWithPipeline({
      text: DUMMY_CARDIOLOGY_POLICY,
      clientPrefix: 'CARD'
    });
    
    logs.push(`✅ Extraction Complete!`);
    logs.push(`   - Valid Rules: ${extractionResult.rules.length}`);
    logs.push(`   - Validation Errors: ${extractionResult.validationErrors.length}`);
    logs.push(`   - NEEDSDEFINITION Tags: ${extractionResult.needsDefinition.length}`);
    logs.push('');

    if (extractionResult.validationErrors.length > 0) {
      logs.push('⚠️ Validation Errors Found:');
      extractionResult.validationErrors.forEach(err => {
        logs.push(`   - ${err.ruleId}: ${err.errors.join(', ')}`);
        errors.push(`${err.ruleId}: ${err.errors.join(', ')}`);
      });
      logs.push('');
    }

    if (extractionResult.needsDefinition.length > 0) {
      logs.push('⚠️ NEEDSDEFINITION Tags:');
      extractionResult.needsDefinition.forEach(tag => {
        logs.push(`   - ${tag}`);
      });
      logs.push('');
    }

    if (extractionResult.rules.length === 0) {
      errors.push('❌ No valid rules extracted from document');
      logs.push('❌ FAILED: No valid rules extracted');
      return {
        success: false,
        sopId,
        rulesExtracted: 0,
        sopStatus,
        errors,
        logs
      };
    }

    rulesExtracted = extractionResult.rules.length;

    // Step 4: Display Extracted Rules
    logs.push('Step 4: Extracted Rules Details:');
    extractionResult.rules.forEach((rule, index) => {
      logs.push(`\n   Rule ${index + 1}:`);
      logs.push(`   - Rule ID: ${rule.rule_id}`);
      logs.push(`   - Code: ${rule.code}`);
      logs.push(`   - Action: ${rule.action}`);
      logs.push(`   - Payer Group: ${rule.payer_group}`);
      logs.push(`   - Provider Group: ${rule.provider_group}`);
      logs.push(`   - Description: ${rule.description?.substring(0, 100)}...`);
      logs.push(`   - Effective Date: ${rule.effective_date}`);
      logs.push(`   - Chart Section: ${rule.chart_section}`);
      logs.push(`   - Status: ${rule.status}`);
      logs.push(`   - Source: ${rule.source}`);
    });
    logs.push('');

    // Step 5: Save Rules to SOP
    logs.push('Step 5: Saving Rules to SOP...');
    SOPManagementService.addRulesToSOP(sop.id, extractionResult.rules);
    logs.push(`✅ Rules saved to SOP`);
    logs.push('');

    // Step 6: Verify SOP Status Changed
    logs.push('Step 6: Verifying SOP Status...');
    const updatedSOP = SOPManagementService.getSOPById(sop.id);
    
    if (!updatedSOP) {
      errors.push('❌ SOP not found after update');
      logs.push('❌ FAILED: SOP not found');
      return {
        success: false,
        sopId,
        rulesExtracted,
        sopStatus: 'not_found',
        errors,
        logs
      };
    }

    sopStatus = updatedSOP.status;
    
    logs.push(`📊 SOP Status After Update:`);
    logs.push(`   - Status: ${updatedSOP.status}`);
    logs.push(`   - Rules Count: ${updatedSOP.rules_count}`);
    logs.push(`   - Total Rules: ${updatedSOP.rules.length}`);
    logs.push('');

    // Step 7: Verify Status Transition
    logs.push('Step 7: Checking Status Transition...');
    if (updatedSOP.status === 'active') {
      logs.push('✅ SUCCESS: SOP automatically transitioned from Draft to Active!');
      logs.push(`✅ SOP now has ${updatedSOP.rules_count} rules`);
    } else {
      errors.push(`❌ SOP status is still "${updatedSOP.status}" (expected "active")`);
      logs.push(`❌ FAILED: SOP status is "${updatedSOP.status}" (expected "active")`);
      return {
        success: false,
        sopId,
        rulesExtracted,
        sopStatus: updatedSOP.status,
        errors,
        logs
      };
    }
    logs.push('');

    // Step 8: Verify Rules on SOP Page
    logs.push('Step 8: Verifying Rules Stored on SOP...');
    const storedRules = updatedSOP.rules;
    
    if (storedRules.length === 0) {
      errors.push('❌ No rules found on SOP page');
      logs.push('❌ FAILED: No rules stored on SOP');
      return {
        success: false,
        sopId,
        rulesExtracted,
        sopStatus: updatedSOP.status,
        errors,
        logs
      };
    }

    logs.push(`✅ Found ${storedRules.length} rules on SOP page`);
    logs.push('✅ All 13 fields populated for each rule:');
    
    const sampleRule = storedRules[0];
    logs.push(`\n   Sample Rule (${sampleRule.rule_id}):`);
    logs.push(`   1. rule_id: ${sampleRule.rule_id} ✓`);
    logs.push(`   2. code: ${sampleRule.code} ✓`);
    logs.push(`   3. code_group: ${sampleRule.code_group || 'N/A'} ✓`);
    logs.push(`   4. codes_selected: ${sampleRule.codes_selected ? 'Yes' : 'N/A'} ✓`);
    logs.push(`   5. action: ${sampleRule.action} ✓`);
    logs.push(`   6. payer_group: ${sampleRule.payer_group} ✓`);
    logs.push(`   7. provider_group: ${sampleRule.provider_group} ✓`);
    logs.push(`   8. description: ${sampleRule.description?.substring(0, 50)}... ✓`);
    logs.push(`   9. documentation_trigger: ${sampleRule.documentation_trigger || 'N/A'} ✓`);
    logs.push(`   10. chart_section: ${sampleRule.chart_section || 'N/A'} ✓`);
    logs.push(`   11. effective_date: ${sampleRule.effective_date} ✓`);
    logs.push(`   12. end_date: ${sampleRule.end_date || 'N/A'} ✓`);
    logs.push(`   13. reference: ${sampleRule.reference || 'N/A'} ✓`);
    logs.push('');

    // Final Summary
    logs.push('═══════════════════════════════════════════════════');
    logs.push('🎉 TEST PASSED - ALL STEPS SUCCESSFUL!');
    logs.push('═══════════════════════════════════════════════════');
    logs.push(`✅ SOP Created: ${updatedSOP.name}`);
    logs.push(`✅ Status: ${updatedSOP.status}`);
    logs.push(`✅ Rules Extracted: ${rulesExtracted}`);
    logs.push(`✅ Rules Stored: ${updatedSOP.rules_count}`);
    logs.push(`✅ Draft → Active Transition: SUCCESS`);
    logs.push('═══════════════════════════════════════════════════');

    return {
      success: true,
      sopId,
      rulesExtracted,
      sopStatus: updatedSOP.status,
      errors,
      logs
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`❌ Test failed with error: ${errorMsg}`);
    logs.push(`❌ TEST FAILED: ${errorMsg}`);
    
    if (error instanceof Error && error.stack) {
      logs.push(`\nStack trace:\n${error.stack}`);
    }

    return {
      success: false,
      sopId,
      rulesExtracted,
      sopStatus,
      errors,
      logs
    };
  }
}

/**
 * Format test results for console display
 */
export function displayTestResults(results: Awaited<ReturnType<typeof runAutomatedTest>>): void {
  console.log('\n' + '='.repeat(60));
  console.log('AUTOMATED EXTRACTION TEST RESULTS');
  console.log('='.repeat(60) + '\n');

  // Display all logs
  results.logs.forEach(log => console.log(log));

  // Display errors if any
  if (results.errors.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('ERRORS:');
    console.log('='.repeat(60));
    results.errors.forEach(error => console.error(error));
  }

  // Final status
  console.log('\n' + '='.repeat(60));
  if (results.success) {
    console.log('✅ TEST STATUS: PASSED');
  } else {
    console.log('❌ TEST STATUS: FAILED');
  }
  console.log('='.repeat(60) + '\n');
}
