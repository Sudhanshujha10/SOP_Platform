# API Error Diagnostics

## Current Issue

The test is failing with: `OpenAI API error: ` (empty error message)

This typically indicates one of these issues:

---

## 🔍 Possible Causes

### 1. Invalid API Key ⚠️
**Symptoms**: 401 Unauthorized error

**Check**:
- API key format should be: `sk-proj-...` or `sk-...`
- Key should be from https://platform.openai.com/api-keys
- Key should have proper permissions

**Fix**:
1. Go to https://platform.openai.com/api-keys
2. Generate new API key
3. Copy the FULL key (starts with `sk-`)
4. Paste in Settings → AI Provider
5. Test connection

### 2. Model Not Available ⚠️
**Symptoms**: Model not found error

**Issue**: `gpt-3.5-turbo` (base) doesn't support JSON mode

**Fix**:
In Settings → AI Provider, change model to:
- `gpt-4-turbo-preview` (recommended)
- `gpt-4`
- `gpt-3.5-turbo-1106` (supports JSON mode)
- `gpt-3.5-turbo-0125` (supports JSON mode)

### 3. CORS Issue ⚠️
**Symptoms**: Network error, empty response

**Issue**: Browser blocking cross-origin requests

**Fix**: This is normal for browser-based apps. Options:
- Use a backend proxy
- Deploy backend API
- For testing: Use browser extension to disable CORS

### 4. Rate Limit ⚠️
**Symptoms**: 429 Too Many Requests

**Fix**:
- Wait a few minutes
- Check OpenAI usage limits
- Upgrade OpenAI plan if needed

### 5. Insufficient Credits ⚠️
**Symptoms**: 402 Payment Required or quota exceeded

**Fix**:
- Check OpenAI account balance
- Add payment method
- Add credits to account

---

## 🔧 Immediate Fixes

### Fix 1: Update Model in Settings
```
1. Click Settings
2. AI Provider tab
3. Change model from "gpt-3.5-turbo" to "gpt-4-turbo-preview"
4. Save
5. Run test again
```

### Fix 2: Verify API Key
```
1. Go to https://platform.openai.com/api-keys
2. Check if key is active
3. Generate new key if needed
4. Update in Settings
5. Test connection
```

### Fix 3: Check Browser Console
```
1. Open DevTools (F12)
2. Go to Console tab
3. Look for detailed error message
4. Check Network tab for failed requests
5. Look for red errors
```

---

## 📊 Enhanced Error Logging

I've added better error logging. Now you'll see:

```
OpenAI API Error Details: {
  status: 401,
  statusText: "Unauthorized",
  error: {
    error: {
      message: "Incorrect API key provided",
      type: "invalid_request_error",
      code: "invalid_api_key"
    }
  }
}
```

---

## 🧪 Quick Test

### Test API Key Manually
Open browser console and run:

```javascript
// Test OpenAI API key
fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY_HERE'
  },
  body: JSON.stringify({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Say hello' }],
    max_tokens: 10
  })
})
.then(r => r.json())
.then(d => console.log('✅ API Key works!', d))
.catch(e => console.error('❌ API Key failed:', e));
```

---

## ✅ Expected Behavior After Fix

Once fixed, you should see:

```
Step 1: Checking AI Provider Configuration...
✅ AI Provider: OPENAI
✅ Model: gpt-4-turbo-preview
✅ API Key: sk-proj-ab...xyz
🔌 Testing AI provider connection...
✅ Connection successful! (Generated prefix: TO)

Step 2: Creating SOP...
✅ SOP Created: sop_xxxxx

Step 3: Extracting Rules with AI...
🔌 Calling OpenAI API: { model: "gpt-4-turbo-preview", jsonMode: true }
✅ Extraction Complete!
   - Valid Rules: 5

[... rest of successful test ...]

🎉 TEST PASSED - ALL STEPS SUCCESSFUL!
```

---

## 🎯 Action Items

**Right Now**:
1. Open Settings
2. Change model to `gpt-4-turbo-preview` or `gpt-4`
3. Verify API key is correct
4. Test connection
5. Save
6. Run test again

**If Still Failing**:
- Check browser console for detailed error
- Verify OpenAI account has credits
- Try generating new API key
- Check network connectivity

---

## 📞 Next Steps

After fixing the API configuration:
1. Run the test again
2. Should see connection test pass
3. Should see rules extracted
4. Should see SOP transition to Active
5. Should see all 13 fields populated

---

**Most likely fix: Change model to `gpt-4-turbo-preview` in Settings!**
