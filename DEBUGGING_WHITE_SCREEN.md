# 🔍 Debugging White Screen Issues

## 🐛 Current Issue

When clicking "Lookup Tables" or "New Tags" buttons, the screen goes white.

---

## ✅ Fixes Applied

### **1. Added Debug Logging**
- Console logs now show when components render
- Logs show the data being passed to components

### **2. Added Error Handling**
- Loading states for null data
- Error states for invalid data
- Try-catch for rendering errors

### **3. Fixed Button Types**
- All buttons now have `type="button"`
- All clicks have `preventDefault()` and `stopPropagation()`

---

## 🔍 How to Debug

### **Step 1: Open Browser Console**

1. Open the app in browser: `http://localhost:8080`
2. Open Developer Tools (F12 or Cmd+Option+I)
3. Go to Console tab
4. Clear console

### **Step 2: Navigate to SOP Detail**

1. Click on any SOP
2. Click "View SOP"
3. Watch console for any errors

### **Step 3: Click Lookup Tables**

1. Click "Lookup Tables" button
2. Watch console for:
   - `SOPLookupTableViewer - sopLookupTable: ...`
   - `SOPLookupTableViewer - sopName: ...`
   - Any error messages

### **Step 4: Check What Appears**

**If you see**:
- ✅ **Modal with content** → Working!
- ⚠️ **"Loading lookup table..."** → Data is null
- ❌ **"Error: Invalid lookup table data structure"** → Data structure is wrong
- ❌ **White screen** → JavaScript error (check console)

---

## 🔍 Common Issues & Solutions

### **Issue 1: White Screen with Console Error**

**Symptoms**:
- White screen appears
- Console shows error like "Cannot read property 'map' of undefined"

**Solution**:
- Data structure is invalid
- Check console logs for `sopLookupTable` value
- Verify it has: `codeGroups`, `payerGroups`, etc.

### **Issue 2: "Loading lookup table..." Forever**

**Symptoms**:
- Modal shows "Loading lookup table..."
- Never loads content

**Solution**:
- `sopLookupTable` is null
- Check if `generateSOPLookupTable()` is working
- Check if SOP has rules

### **Issue 3: Modal Doesn't Open**

**Symptoms**:
- Click button, nothing happens
- No modal, no white screen

**Solution**:
- Check if `showLookupTableViewer` state is being set
- Check if button click handler is working
- Check console for errors

### **Issue 4: Modal Opens Then Closes**

**Symptoms**:
- Modal flashes briefly then closes
- Or redirects to blank page

**Solution**:
- Button is missing `type="button"`
- Button click is causing navigation
- Check if all buttons have proper event handlers

---

## 🔍 What to Check in Console

### **Expected Logs**:

```javascript
// When clicking Lookup Tables:
SOPLookupTableViewer - sopLookupTable: {
  sop_id: "sop-123",
  sop_name: "Medicare SOP",
  codeGroups: [...],
  payerGroups: [...],
  providerGroups: [...],
  actionTags: [...],
  chartSections: [...]
}
SOPLookupTableViewer - sopName: "Medicare SOP"
```

### **Problem Logs**:

```javascript
// If you see this:
SOPLookupTableViewer - sopLookupTable: null
// → Data is not being generated

// If you see this:
SOPLookupTableViewer - sopLookupTable: {}
// → Data structure is empty

// If you see this:
Error: Cannot read property 'map' of undefined
// → Component is trying to map over undefined data
```

---

## 🔧 Quick Fixes to Try

### **Fix 1: Clear Browser Cache**

```bash
# In browser:
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"
```

### **Fix 2: Restart Dev Server**

```bash
# Kill and restart:
lsof -ti:8080 | xargs kill -9
npm run dev
```

### **Fix 3: Check if SOP Has Rules**

```javascript
// In browser console:
const sop = /* get current SOP */;
console.log('SOP rules:', sop.rules);
console.log('Rules count:', sop.rules?.length);
```

### **Fix 4: Manually Test generateSOPLookupTable**

```javascript
// In browser console:
import { lookupTableService } from './services/lookupTableService';
const sopId = 'sop-123';
const sopName = 'Test SOP';
const rules = [/* your rules */];
const table = lookupTableService.generateSOPLookupTable(sopId, sopName, rules);
console.log('Generated table:', table);
```

---

## 📋 Checklist for Debugging

### **Before Opening Modal**:
- [ ] SOP is loaded (`sop` is not null)
- [ ] SOP has rules (`sop.rules.length > 0`)
- [ ] `sopLookupTable` is generated (check useMemo)
- [ ] Button click handler is attached

### **When Clicking Button**:
- [ ] Console shows "SOPLookupTableViewer - sopLookupTable: ..."
- [ ] Console shows "SOPLookupTableViewer - sopName: ..."
- [ ] No JavaScript errors in console
- [ ] Modal state changes to true

### **When Modal Opens**:
- [ ] Modal renders (not white screen)
- [ ] Data is displayed (not "Loading...")
- [ ] Groups are clickable
- [ ] No console errors

---

## 🎯 Next Steps

### **If Still White Screen**:

1. **Check Console Logs**:
   - What does `sopLookupTable` show?
   - Are there any errors?

2. **Check Network Tab**:
   - Are there any failed requests?
   - Are there any 404 errors?

3. **Check React DevTools**:
   - Is `SOPLookupTableViewer` component mounted?
   - What are its props?

4. **Check Sources Tab**:
   - Set breakpoint in `SOPLookupTableViewer`
   - Step through code to see where it fails

### **Share This Info**:

When reporting the issue, please share:
1. Console logs (especially the `sopLookupTable` log)
2. Any error messages
3. Screenshot of white screen
4. Browser and version

---

## 🚀 Testing After Fix

### **Test Lookup Tables**:
```
1. Navigate to SOP detail
2. Open console
3. Click "Lookup Tables"
4. Check console logs
5. Verify modal opens
6. Click groups to expand
7. Test search
8. Test export CSV
```

### **Test New Tags**:
```
1. Navigate to SOP detail
2. Open console
3. Click "New Tags"
4. Check console logs
5. Verify modal opens
6. Click groups to expand
7. Test approve/reject
```

---

## 📝 Current Status

### **What's Been Fixed**:
- ✅ Added `type="button"` to all buttons
- ✅ Added `preventDefault()` and `stopPropagation()`
- ✅ Added loading states
- ✅ Added error states
- ✅ Added debug logging
- ✅ Added data validation

### **What to Check Next**:
- ⏳ Console logs when clicking buttons
- ⏳ Actual data structure of `sopLookupTable`
- ⏳ Any JavaScript errors
- ⏳ React component mounting

---

## 💡 Tips

1. **Always check console first** - Most issues show errors there
2. **Use React DevTools** - See component props and state
3. **Check Network tab** - See if data is loading
4. **Use breakpoints** - Step through code to find issues
5. **Clear cache** - Old code might be cached

**The debugging tools are now in place. Please check the console and share what you see!** 🔍
