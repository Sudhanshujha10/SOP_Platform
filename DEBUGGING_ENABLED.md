# Debugging Enabled - SOP Creation & Rule Extraction

## 🔍 What's Been Added

I've added comprehensive console logging throughout the entire extraction pipeline to help identify exactly where the issue is occurring.

---

## 📊 Console Logs Added

### 1. Document Processing
```javascript
📄 Extracted text from filename.pdf: [first 200 chars]...
```
- Shows if file was read successfully
- Displays beginning of extracted text

### 2. AI Extraction Start
```javascript
🤖 Starting AI extraction for filename.pdf...
```
- Confirms AI pipeline is starting

### 3. Extraction Results
```javascript
✅ Extraction complete for filename.pdf: {
  validRules: 5,
  errors: 0,
  needsDefinition: 0
}
```
- Shows how many valid rules were extracted
- Shows validation errors count
- Shows NEEDSDEFINITION tags count

### 4. Validation Errors (if any)
```javascript
❌ Validation errors in filename.pdf: [detailed errors]
```
- Lists all validation failures
- Shows which rules failed and why

### 5. NEEDSDEFINITION Warnings (if any)
```javascript
⚠️ NEEDSDEFINITION tags in filename.pdf: [@TAG1, @TAG2]
```
- Lists unknown tags that need definition

### 6. Rules Collection
```javascript
📝 Total rules collected so far: 5
```
- Running total across all documents

### 7. Saving Rules
```javascript
💾 Saving 5 rules to SOP sop_xxxxx...
```
- Confirms save operation starting

### 8. addRulesToSOP Called
```javascript
🔧 addRulesToSOP called with 5 rules for SOP sop_xxxxx
```
- Confirms method was invoked

### 9. SOP Before Update
```javascript
📊 SOP before update: {
  id: "sop_xxxxx",
  name: "Advanced Urology SOP",
  status: "draft",
  rules_count: 0,
  existing_rules: 0
}
```
- Shows SOP state before changes

### 10. Status Change (if happens)
```javascript
🎉 SOP STATUS CHANGED: draft → active (5 rules)
```
- **THIS IS THE KEY LOG** - confirms transition happened

### 11. SOP After Update
```javascript
📊 SOP after update: {
  id: "sop_xxxxx",
  name: "Advanced Urology SOP",
  status: "active",
  rules_count: 5,
  total_rules: 5
}
```
- Shows final SOP state

### 12. Save Confirmation
```javascript
✅ Rules saved successfully!
```
- Confirms operation completed

### 13. No Rules Warning
```javascript
⚠️ No rules to save - extraction may have failed
```
- Shows if extraction returned 0 rules

---

## 🧪 How to Debug

### Step 1: Open Browser Console
- Chrome/Edge: Press F12 or Cmd+Option+I (Mac) or Ctrl+Shift+I (Windows)
- Firefox: Press F12 or Cmd+Option+K (Mac) or Ctrl+Shift+K (Windows)
- Safari: Enable Developer Menu first, then Cmd+Option+C

### Step 2: Clear Console
- Click the 🚫 icon or type `clear()` and press Enter

### Step 3: Create SOP and Upload Document
- Follow normal workflow
- Watch console logs appear in real-time

### Step 4: Identify Where It Stops
Look for the LAST log message that appears:

**If you see**:
- ❌ No `📄 Extracted text` → File reading failed
- ❌ No `🤖 Starting AI extraction` → Extraction not triggered
- ❌ No `✅ Extraction complete` → AI call failed
- ❌ `validRules: 0` → No rules extracted or all failed validation
- ❌ No `💾 Saving rules` → Rules array is empty
- ❌ No `🔧 addRulesToSOP called` → Save method not invoked
- ❌ No `🎉 SOP STATUS CHANGED` → Status transition didn't happen
- ✅ All logs present → Everything worked!

---

## 🎯 Most Likely Issues

### Issue 1: AI Provider Not Configured
**Symptoms**: Error message about AI provider

**Fix**:
1. Click Settings icon (top right)
2. Go to AI Provider tab
3. Select OpenAI/Anthropic/Gemini
4. Enter API key
5. Test connection
6. Save

### Issue 2: Invalid API Key
**Symptoms**: API error in console

**Fix**:
- Verify API key is correct
- Check if key has proper permissions
- Try generating a new key

### Issue 3: Document Text Empty
**Symptoms**: `📄 Extracted text: ...` shows empty or garbled text

**Fix**:
- Try different document format
- Ensure document has readable text
- Check if PDF is scanned image (needs OCR)

### Issue 4: No Rules Found
**Symptoms**: `validRules: 0` in extraction results

**Fix**:
- Document may not contain claim-editing rules
- Try document with clear billing policies
- Check if text mentions codes, payers, modifiers

### Issue 5: All Rules Fail Validation
**Symptoms**: `validRules: 0, errors: 5`

**Fix**:
- Check validation errors in console
- May need to add tags to lookup tables
- Rules may be missing required fields

---

## 📋 Quick Checklist

Before uploading document:
- [ ] AI Provider configured in Settings
- [ ] API key tested and working
- [ ] Document contains billing/claim rules
- [ ] Document is readable (not scanned image)
- [ ] Browser console is open to see logs

After uploading:
- [ ] See `📄 Extracted text` log
- [ ] See `🤖 Starting AI extraction` log
- [ ] See `✅ Extraction complete` with validRules > 0
- [ ] See `💾 Saving X rules` log
- [ ] See `🔧 addRulesToSOP called` log
- [ ] See `🎉 SOP STATUS CHANGED` log
- [ ] See `✅ Rules saved successfully` log

---

## 🔧 Emergency Fixes

### Clear Everything and Start Fresh
```javascript
// In browser console:
localStorage.clear();
location.reload();
```

### Check What's Stored
```javascript
// In browser console:
const sops = JSON.parse(localStorage.getItem('billblaze_sops') || '[]');
console.table(sops.map(s => ({
  name: s.name,
  status: s.status,
  rules: s.rules.length
})));
```

### Manually Activate SOP
```javascript
// In browser console (last resort):
const sops = JSON.parse(localStorage.getItem('billblaze_sops') || '[]');
const sop = sops[0]; // or find by name
sop.status = 'active';
sop.rules_count = sop.rules.length;
localStorage.setItem('billblaze_sops', JSON.stringify(sops));
location.reload();
```

---

## 📞 Report Issue

If still not working, copy ALL console logs and include:

1. **Full console output** (from start to finish)
2. **AI provider** being used (OpenAI/Anthropic/Gemini)
3. **Document type** (PDF/DOCX/CSV)
4. **Where logs stop** (last log message seen)
5. **Any error messages** (in red)

---

## ✅ Success Looks Like

```
📄 Extracted text from policy.pdf: BILLING POLICY...
🤖 Starting AI extraction for policy.pdf...
✅ Extraction complete for policy.pdf: { validRules: 5, errors: 0, needsDefinition: 0 }
📝 Total rules collected so far: 5
💾 Saving 5 rules to SOP sop_1234567890_abc123...
🔧 addRulesToSOP called with 5 rules for SOP sop_1234567890_abc123
📊 SOP before update: { status: "draft", rules_count: 0 }
🎉 SOP STATUS CHANGED: draft → active (5 rules)
📊 SOP after update: { status: "active", rules_count: 5 }
✅ Rules saved successfully!
```

**Then**: SOP appears in Active tab with 5 rules!

---

**Now try uploading a document and watch the console logs!** 🚀
