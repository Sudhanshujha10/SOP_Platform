# Automated Extraction Test - User Guide

## 🧪 What Is This?

An automated test that verifies the complete SOP creation and rule extraction pipeline using real AI and dummy healthcare data (Cardiology specialty).

## 🎯 What It Tests

1. ✅ AI Provider configuration
2. ✅ SOP creation
3. ✅ Document text extraction
4. ✅ AI rule extraction (2-step pipeline)
5. ✅ Rule validation
6. ✅ Rule storage
7. ✅ **Automatic Draft → Active transition**
8. ✅ All 13 fields populated
9. ✅ Rules visible on SOP page

## 📋 Prerequisites

**IMPORTANT**: You MUST configure the AI Provider first!

1. Click **Settings** icon (top right)
2. Go to **AI Provider** tab
3. Select provider (OpenAI/Anthropic/Gemini)
4. Enter your API key
5. Click **Test Connection**
6. Click **Save Configuration**

## 🚀 How to Run

### Step 1: Navigate to Test Runner
1. Open the app
2. Click **"Test Runner"** in the sidebar navigation
3. You'll see the Automated Extraction Test page

### Step 2: Run the Test
1. Click the **"Run Automated Test"** button
2. Wait for the test to complete (30-60 seconds)
3. Watch the progress in real-time

### Step 3: Review Results
The test will show:
- ✅ **PASSED** or ❌ **FAILED** badge
- Summary with SOP ID, status, rules count
- Detailed logs of each step
- Any errors encountered

## 📊 Test Data

The test uses a dummy **Cardiology Billing Policy** document containing 5 policies:

1. **Modifier 25 for E&M with Procedures**
   - For BCBS/Anthem payers
   - Add modifier 25 to E&M codes with minor procedures

2. **Echocardiogram Medical Necessity**
   - For Medicare/Medicaid
   - Prior authorization requirements

3. **Stress Test Bundling**
   - For all payers
   - Bundle component codes

4. **Holter Monitor Duration**
   - For commercial payers
   - Billing based on monitoring duration

5. **Cardiac Catheterization Modifiers**
   - For Medicare
   - Modifier 59 usage rules

## ✅ Expected Results

### Success Scenario
```
✅ TEST STATUS: PASSED

Summary:
- SOP ID: sop_1234567890_abc123
- SOP Status: active
- Rules Extracted: 5
- Errors: 0

The test SOP will appear in Dashboard under "Active SOPs"
```

### What Gets Created
- **SOP Name**: "Cardiology Billing SOP - Test"
- **Organization**: "Test Cardiology Associates"
- **Department**: "Cardiology Department"
- **Status**: Active (automatically transitioned from Draft)
- **Rules**: 5 fully populated rules

### Sample Rule Output
```
Rule 1:
- Rule ID: CARD-MOD-0001
- Code: @E&M_MINOR_PROC
- Action: @ADD(@25)
- Payer Group: @BCBS|@ANTHEM
- Provider Group: @PHYSICIAN_MD_DO
- Description: For @BCBS|@ANTHEM payers, add @25 modifier...
- Effective Date: 2024-01-01
- Chart Section: PROCEDURE_NOTES
- Status: active
- Source: ai
```

## ❌ Common Failures

### Failure 1: AI Provider Not Configured
```
❌ TEST STATUS: FAILED
Error: AI Provider not configured
```

**Fix**: Configure AI Provider in Settings (see Prerequisites)

### Failure 2: Invalid API Key
```
❌ TEST STATUS: FAILED
Error: OpenAI API error: 401 Unauthorized
```

**Fix**: Check API key is correct and has proper permissions

### Failure 3: No Rules Extracted
```
❌ TEST STATUS: FAILED
Valid Rules: 0
```

**Fix**: Check AI provider is working, may need to retry

### Failure 4: Validation Errors
```
⚠️ TEST STATUS: PASSED (with warnings)
Valid Rules: 3
Validation Errors: 2
```

**Note**: Some rules may fail validation but test still passes if at least 1 rule is valid

## 📝 Detailed Logs

The test provides detailed logs showing:

```
🧪 Starting Automated Extraction Test...
📋 Specialty: Cardiology
📄 Document: Dummy Cardiology Billing Policy

Step 1: Checking AI Provider Configuration...
✅ AI Provider: OPENAI
✅ Model: gpt-4-turbo-preview

Step 2: Creating SOP...
✅ SOP Created: sop_1234567890_abc123
✅ SOP Name: Cardiology Billing SOP - Test
✅ Initial Status: draft
✅ Initial Rules Count: 0

Step 3: Extracting Rules with AI...
📄 Processing dummy cardiology policy document...
✅ Extraction Complete!
   - Valid Rules: 5
   - Validation Errors: 0
   - NEEDSDEFINITION Tags: 0

Step 4: Extracted Rules Details:
   [Lists all 5 rules with full details]

Step 5: Saving Rules to SOP...
✅ Rules saved to SOP

Step 6: Verifying SOP Status...
📊 SOP Status After Update:
   - Status: active
   - Rules Count: 5
   - Total Rules: 5

Step 7: Checking Status Transition...
✅ SUCCESS: SOP automatically transitioned from Draft to Active!
✅ SOP now has 5 rules

Step 8: Verifying Rules Stored on SOP...
✅ Found 5 rules on SOP page
✅ All 13 fields populated for each rule

═══════════════════════════════════════════════════
🎉 TEST PASSED - ALL STEPS SUCCESSFUL!
═══════════════════════════════════════════════════
```

## 🔍 Viewing Test Results

### In the UI
- Results displayed in the Test Runner page
- Color-coded success/failure indicators
- Detailed logs in terminal-style display

### In Browser Console
- Open DevTools (F12)
- Go to Console tab
- See complete logs with emojis
- Copy logs for debugging

### In Dashboard
- Navigate to Dashboard
- Look for "Cardiology Billing SOP - Test" in Active SOPs
- Click "View" to see all extracted rules
- Verify all 13 fields are populated

## 🧹 Cleanup

After testing, you may want to delete the test SOP:

1. Go to Dashboard
2. Find "Cardiology Billing SOP - Test"
3. Click the menu (⋮)
4. Select "Delete"

Or clear all data:
```javascript
// In browser console:
localStorage.clear();
location.reload();
```

## 🎓 What This Proves

When the test passes, it confirms:

✅ AI provider is correctly configured
✅ Document text can be extracted
✅ AI can identify claim-editing rules
✅ Rules are normalized to proper schema
✅ All 13 fields are auto-populated
✅ Validation is working
✅ Rules are saved to database/storage
✅ **SOP automatically transitions from Draft to Active**
✅ Rules are visible on SOP page
✅ Complete end-to-end pipeline is functional

## 🐛 Troubleshooting

### Test Takes Too Long
- AI processing can take 30-60 seconds
- Check network connection
- Verify AI provider is responding

### Test Fails Intermittently
- AI responses can vary
- Retry the test
- Check API rate limits

### Can't Find Test SOP in Dashboard
- Refresh the page
- Check "Active SOPs" tab
- Look for "Cardiology Billing SOP - Test"

## 📞 Support

If test fails consistently:
1. Copy full console logs
2. Note which step failed
3. Check error messages
4. Verify AI provider configuration
5. Try with different AI provider

---

**Ready to test? Click "Run Automated Test" and watch the magic happen!** 🚀
