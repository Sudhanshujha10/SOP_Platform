# Backend Proxy Setup - Fix CORS Issues

## 🎯 **Problem Solved**

**Issue**: Frontend making direct API calls to AI providers causes CORS preflight errors.

**Solution**: Backend proxy server that handles all AI API calls.

---

## ✅ **What's Been Created**

### **1. Backend Server** ✅
**File**: `backend/server.js`

**Features**:
- Express.js server
- CORS enabled
- Proxy endpoints for all AI operations
- Supports OpenAI, Anthropic, Gemini
- Error handling and logging

**Endpoints**:
- `POST /api/ai/generate-prefix` - Generate client prefix
- `POST /api/ai/convert-to-json` - Convert document to JSON
- `POST /api/ai/extract-candidates` - Extract rule candidates
- `POST /api/ai/normalize-rule` - Normalize single rule
- `POST /api/ai/test` - Test AI provider connection
- `POST /api/config/keys` - Configure API keys
- `GET /api/health` - Health check

### **2. Backend Package** ✅
**File**: `backend/package.json`

**Dependencies**:
- express - Web server
- cors - CORS handling
- node-fetch - HTTP requests
- dotenv - Environment variables

### **3. Environment Template** ✅
**File**: `backend/.env.example`

**Configuration**:
- PORT - Server port (default: 3001)
- API keys for each provider

---

## 🚀 **Setup Instructions**

### **Step 1: Install Backend Dependencies**
```bash
cd backend
npm install
```

### **Step 2: Configure Environment**
```bash
# Copy example env file
cp .env.example .env

# Edit .env and add your API keys (optional)
nano .env
```

Example `.env`:
```bash
PORT=3001
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-proj-xxxxx
GEMINI_API_KEY=xxxxx
```

### **Step 3: Start Backend Server**
```bash
# Development mode (auto-restart on changes)
npm run dev

# OR production mode
npm start
```

You should see:
```
🚀 Bill Blaze API Server running on port 3001
📡 Health check: http://localhost:3001/api/health
```

### **Step 4: Configure Frontend**
```bash
# In root directory, create/update .env
cd ..
echo "VITE_BACKEND_API_URL=http://localhost:3001/api" > .env
```

### **Step 5: Start Frontend**
```bash
# In root directory
npm run dev
```

---

## 🔄 **How It Works**

### **Old Flow (CORS Errors)**:
```
Frontend → Direct API Call → Anthropic/OpenAI/Gemini
                ↑
           CORS Error ❌
```

### **New Flow (No CORS)**:
```
Frontend → Backend Proxy → Anthropic/OpenAI/Gemini
              ↑
         No CORS ✅
```

---

## 📊 **API Endpoints Detailed**

### **1. Generate Prefix**
```http
POST /api/ai/generate-prefix
Content-Type: application/json

{
  "provider": "anthropic",
  "model": "claude-3-haiku-20240307",
  "organisationName": "Advanced Urology Associates",
  "apiKey": "sk-ant-xxxxx"
}

Response:
{
  "success": true,
  "prefix": "AUA"
}
```

### **2. Convert to JSON**
```http
POST /api/ai/convert-to-json
Content-Type: application/json

{
  "provider": "anthropic",
  "model": "claude-3-haiku-20240307",
  "text": "BILLING POLICY...",
  "apiKey": "sk-ant-xxxxx"
}

Response:
{
  "success": true,
  "data": {
    "document_title": "...",
    "sections": [...],
    "all_codes": [...],
    "all_payers": [...]
  }
}
```

### **3. Extract Candidates**
```http
POST /api/ai/extract-candidates
Content-Type: application/json

{
  "provider": "anthropic",
  "model": "claude-3-haiku-20240307",
  "structuredJSON": {...},
  "apiKey": "sk-ant-xxxxx"
}

Response:
{
  "success": true,
  "data": [
    {
      "codes": "99201-99215",
      "payers": "BCBS, Anthem",
      "action_description": "Add modifier 25",
      ...
    }
  ]
}
```

### **4. Normalize Rule**
```http
POST /api/ai/normalize-rule
Content-Type: application/json

{
  "provider": "anthropic",
  "model": "claude-3-haiku-20240307",
  "candidate": {...},
  "clientPrefix": "AUA",
  "lookupTables": {...},
  "ruleIndex": 0,
  "apiKey": "sk-ant-xxxxx"
}

Response:
{
  "success": true,
  "data": {
    "rule_id": "AUA-MOD-0001",
    "code": "@E&M_MINOR_PROC",
    ...all 13 fields...
  }
}
```

---

## 🧪 **Testing the Backend**

### **Test 1: Health Check**
```bash
curl http://localhost:3001/api/health
```

Expected:
```json
{
  "status": "ok",
  "message": "Bill Blaze API Server is running"
}
```

### **Test 2: Test AI Connection**
```bash
curl -X POST http://localhost:3001/api/ai/test \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "anthropic",
    "apiKey": "sk-ant-xxxxx"
  }'
```

Expected:
```json
{
  "success": true,
  "message": "Connection successful",
  "result": "test successful"
}
```

### **Test 3: Generate Prefix**
```bash
curl -X POST http://localhost:3001/api/ai/generate-prefix \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "anthropic",
    "model": "claude-3-haiku-20240307",
    "organisationName": "Advanced Urology Associates",
    "apiKey": "sk-ant-xxxxx"
  }'
```

Expected:
```json
{
  "success": true,
  "prefix": "AUA"
}
```

---

## 🔧 **Frontend Updates Needed**

The frontend `AIProviderService` needs to be updated to call these backend endpoints instead of making direct API calls. This will be done in the next step.

---

## 📋 **Benefits**

### **1. No CORS Issues** ✅
- Backend makes all external API calls
- Frontend only calls backend
- No browser CORS restrictions

### **2. Secure API Keys** ✅
- Keys stored on backend only
- Never exposed to browser
- Can use environment variables

### **3. Better Error Handling** ✅
- Backend catches and formats errors
- Provides meaningful messages
- Logs for debugging

### **4. Rate Limit Management** ✅
- Backend can implement retry logic
- Can queue requests
- Can switch providers automatically

### **5. Centralized Logic** ✅
- All AI logic in one place
- Easier to maintain
- Consistent behavior

---

## 🎯 **Next Steps**

### **1. Install Backend Dependencies**
```bash
cd backend
npm install
```

### **2. Start Backend Server**
```bash
npm run dev
```

### **3. Update Frontend** (Next step)
- Modify `AIProviderService` to call backend
- Remove direct API calls
- Use backend proxy endpoints

### **4. Test Complete Flow**
- Create SOP
- Upload document
- Verify no CORS errors
- Check rules extracted
- Confirm SOP becomes Active

---

## 📊 **Architecture**

```
┌─────────────┐
│   Browser   │
│  (Frontend) │
└──────┬──────┘
       │ HTTP (No CORS)
       ↓
┌─────────────┐
│   Backend   │
│   Proxy     │
└──────┬──────┘
       │ HTTPS
       ↓
┌─────────────┐
│ AI Provider │
│  (Anthropic │
│   OpenAI    │
│   Gemini)   │
└─────────────┘
```

---

**Backend server is ready! Next: Update frontend to use it.** 🚀
