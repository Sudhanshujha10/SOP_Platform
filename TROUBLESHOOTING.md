# Troubleshooting Guide - SOP Creation & Rule Extraction

## Issue: SOP Stays in Draft After Document Upload

### Debugging Steps

1. **Open Browser Console** (F12 or Cmd+Option+I)

2. **Upload a document and watch for these logs**:

```
📄 Extracted text from filename.pdf: ...
🤖 Starting AI extraction for filename.pdf...
✅ Extraction complete for filename.pdf: { validRules: X, errors: Y, needsDefinition: Z }
📝 Total rules collected so far: X
💾 Saving X rules to SOP sop_xxxxx...
🔧 addRulesToSOP called with X rules for SOP sop_xxxxx
📊 SOP before update: { status: 'draft', rules_count: 0, ... }
🎉 SOP STATUS CHANGED: draft → active (X rules)
📊 SOP after update: { status: 'active', rules_count: X, ... }
✅ Rules saved successfully!
```

### Common Issues & Solutions

#### Issue 1: No AI Provider Configured
**Symptoms**:
- Error: "AI provider not configured"
- No extraction happens

**Solution**:
1. Click Settings icon (top right)
2. Go to AI Provider tab
3. Select provider (OpenAI/Anthropic/Gemini)
4. Enter API key
5. Test connection
6. Save

#### Issue 2: AI Extraction Returns 0 Rules
**Symptoms**:
```
✅ Extraction complete: { validRules: 0, ... }
⚠️ No rules to save - extraction may have failed
```

**Possible Causes**:
- Document text is empty or unreadable
- AI couldn't find any rules in the text
- All rules failed validation

**Solution**:
- Check if document text was extracted: Look for `📄 Extracted text` log
- If text is empty, file reading failed
- If text exists but 0 rules, AI didn't find any claim-editing rules
- Try a different document with clear billing rules

#### Issue 3: All Rules Fail Validation
**Symptoms**:
```
✅ Extraction complete: { validRules: 0, errors: 5, ... }
❌ Validation errors: ...
```

**Solution**:
- Check validation errors in console
- Common issues:
  - Unknown @tags (marked as NEEDSDEFINITION)
  - Missing required fields
  - Invalid date formats
  - Description doesn't end with period

#### Issue 4: addRulesToSOP Not Called
**Symptoms**:
- No `🔧 addRulesToSOP called` log
- Rules extracted but not saved

**Solution**:
- Check if `allExtractedRules.length > 0`
- Look for errors in extraction process
- Verify AI extraction completed successfully

#### Issue 5: Status Not Changing
**Symptoms**:
- `🔧 addRulesToSOP called` appears
- But no `🎉 SOP STATUS CHANGED` log

**Possible Causes**:
- SOP was already active
- Rules array is empty
- Logic condition not met

**Solution**:
- Check `📊 SOP before update` log
- Verify `status: 'draft'` and `rules_count: 0`
- Ensure rules are actually being added

---

## Step-by-Step Testing

### Test 1: Verify AI Provider
```
1. Open Settings
2. Check AI Provider tab
3. Verify API key is set
4. Click "Test Connection"
5. Should see "Connection Successful"
```

### Test 2: Create SOP
```
1. Click "Create New SOP"
2. Fill in details
3. Click "Create SOP & Continue"
4. Check console for: "SOP created"
5. Verify SOP appears in Draft tab
```

### Test 3: Upload Document
```
1. Select a PDF/DOCX with billing rules
2. Click "Upload & Process"
3. Watch console logs:
   - 📄 Text extracted
   - 🤖 AI extraction started
   - ✅ Extraction complete with X rules
   - 💾 Saving rules
   - 🔧 addRulesToSOP called
   - 🎉 STATUS CHANGED to active
4. Wait for completion
5. Check if SOP moved to Active tab
```

### Test 4: View Rules
```
1. Click "View" on the SOP
2. Should see all extracted rules
3. All 13 fields should be populated
4. Status should show "Active"
```

---

## Quick Fixes

### Clear LocalStorage and Start Fresh
```javascript
// In browser console:
localStorage.clear();
location.reload();
```

### Check Current SOPs
```javascript
// In browser console:
const sops = JSON.parse(localStorage.getItem('billblaze_sops') || '[]');
console.log('All SOPs:', sops);
```

### Manually Activate SOP
```javascript
// In browser console (emergency fix):
const sops = JSON.parse(localStorage.getItem('billblaze_sops') || '[]');
const sop = sops.find(s => s.name === 'YOUR_SOP_NAME');
if (sop) {
  sop.status = 'active';
  localStorage.setItem('billblaze_sops', JSON.stringify(sops));
  location.reload();
}
```

---

## Expected Console Output (Success)

```
📄 Extracted text from policy.pdf: BILLING POLICY FOR MODIFIER 25...
🤖 Starting AI extraction for policy.pdf...
✅ Extraction complete for policy.pdf: {
  validRules: 5,
  errors: 0,
  needsDefinition: 0
}
📝 Total rules collected so far: 5
💾 Saving 5 rules to SOP sop_1234567890_abc123...
🔧 addRulesToSOP called with 5 rules for SOP sop_1234567890_abc123
📊 SOP before update: {
  id: "sop_1234567890_abc123",
  name: "Advanced Urology SOP",
  status: "draft",
  rules_count: 0,
  existing_rules: 0
}
🎉 SOP STATUS CHANGED: draft → active (5 rules)
📊 SOP after update: {
  id: "sop_1234567890_abc123",
  name: "Advanced Urology SOP",
  status: "active",
  rules_count: 5,
  total_rules: 5
}
✅ Rules saved successfully!
```

---

## Still Not Working?

1. **Check AI Provider Configuration**
   - Settings → AI Provider
   - Verify API key is correct
   - Test connection

2. **Check Document Content**
   - Look for `📄 Extracted text` log
   - Ensure text contains billing rules
   - Try a different document

3. **Check Validation**
   - Look for validation errors
   - Check if rules are being rejected
   - Review NEEDSDEFINITION tags

4. **Check Console for Errors**
   - Any red error messages?
   - Network errors?
   - API errors?

5. **Try Sample Text**
   - Create a simple text file with:
   ```
   For BCBS payers, add modifier 25 to E&M codes when performed with minor procedures.
   Effective date: 2024-01-01
   Reference: BCBS Policy Manual p. 14
   ```

---

## Contact Support

If issue persists, provide:
1. Full console logs
2. Document type (PDF/DOCX/CSV)
3. AI provider used
4. Any error messages
5. Screenshot of Dashboard showing Draft SOP

---

**Most Common Fix**: Configure AI Provider in Settings!
