# Update Documents - User Guide 📚

## 🎯 **What is Update Documents?**

The "Update Documents" feature allows you to add new supporting documents to any existing SOP (Active or Draft). The AI will automatically extract rules from these documents and add only the new rules to your SOP, preventing duplicates.

---

## 📖 **How to Use**

### **Step 1: Open Your SOP**
1. Go to **Dashboard**
2. Click on any SOP to view it
3. You'll see the SOP details and rules

### **Step 2: Click "Update Documents"**
1. Look for the blue **"Update Documents"** button in the top-right corner
2. It's next to the "Export Rules" button
3. Click it to open the upload modal

### **Step 3: Select Documents**
1. **Click to browse** or **drag and drop** files into the upload area
2. You can select multiple files at once
3. Supported formats:
   - PDF (`.pdf`)
   - Word (`.doc`, `.docx`)
   - Excel (`.xls`, `.xlsx`)
   - CSV (`.csv`)
4. Maximum file size: **50MB per file**

### **Step 4: Review Selected Files**
1. All selected files will be listed
2. You'll see:
   - File name
   - File size
   - File type icon
3. Click the **✕** button to remove any file you don't want

### **Step 5: Upload & Process**
1. Click the **"Upload & Process"** button
2. You'll see a confirmation message
3. The modal will close automatically

### **Step 6: Monitor Progress**
1. Go to the **Dashboard**
2. Scroll to the **"AI Processing Queue"** section
3. You'll see your documents being processed with:
   - Current status (Queued, Processing, Completed)
   - Progress percentage (0% → 100%)
   - Estimated time remaining

### **Step 7: View Results**
1. When processing is complete, return to your SOP
2. The page will automatically refresh
3. New rules will appear in the rule list
4. You'll see a notification showing how many rules were added

---

## 💡 **Key Features**

### **Automatic De-duplication**
- The AI checks every extracted rule against existing rules
- Only **truly new rules** are added
- Duplicate rules are automatically skipped
- Your existing rules remain unchanged

### **Multiple File Upload**
- Upload several documents at once
- They'll be processed one after another
- Each document's progress is tracked separately

### **Real-time Progress**
- Watch documents being processed in real-time
- See exact percentage completion
- Know how much time is remaining

### **Safe Updates**
- Existing rules are never modified
- Only new rules are added
- No data loss or corruption
- All changes are logged

---

## ⚠️ **Important Notes**

### **File Requirements**
- ✅ **Supported**: PDF, DOCX, DOC, CSV, XLS, XLSX
- ❌ **Not Supported**: TXT, JPG, PNG, ZIP, etc.
- ⚠️ **Size Limit**: 50MB per file

### **Processing Time**
- Small files (< 1MB): ~1-2 minutes
- Medium files (1-10MB): ~3-5 minutes
- Large files (10-50MB): ~5-10 minutes
- Time varies based on document complexity

### **What Gets Added**
- ✅ **New rules** that don't exist in the SOP
- ❌ **Duplicate rules** are skipped
- The AI compares:
  - Code
  - Action
  - Payer Group
  - Provider Group
  - Description

---

## 🔍 **Example Scenarios**

### **Scenario 1: Quarterly Policy Update**
**Situation**: You have a "UHC Billing Guidelines" SOP with Q1 rules. Q2 guidelines are released.

**Steps**:
1. Open "UHC Billing Guidelines" SOP
2. Click "Update Documents"
3. Upload "UHC_Q2_2024_Guidelines.pdf"
4. Wait for processing
5. New Q2 rules added, Q1 rules unchanged

**Result**: SOP now has both Q1 and Q2 rules

### **Scenario 2: Adding Multiple Payers**
**Situation**: SOP has Anthem rules. You want to add BCBS and UHC rules.

**Steps**:
1. Open SOP
2. Click "Update Documents"
3. Upload both "BCBS_Policy.pdf" and "UHC_Policy.pdf"
4. Wait for both to process
5. All new rules from both payers added

**Result**: SOP now covers Anthem, BCBS, and UHC

### **Scenario 3: Avoiding Duplicates**
**Situation**: You accidentally upload the same document twice.

**Steps**:
1. Upload document first time → 20 rules added
2. Upload same document again
3. AI detects all 20 rules already exist
4. No duplicates added

**Result**: SOP still has only 20 rules (no duplicates)

---

## ❓ **Frequently Asked Questions**

### **Q: Can I update Draft SOPs?**
**A**: Yes! The feature works for both Active and Draft SOPs.

### **Q: What happens to existing rules?**
**A**: They remain completely unchanged. Only new rules are added.

### **Q: Can I upload multiple files at once?**
**A**: Yes! Select as many files as you need. They'll be processed sequentially.

### **Q: How do I know if rules are duplicates?**
**A**: The AI automatically checks. You'll see in the console logs how many duplicates were skipped.

### **Q: What if processing fails?**
**A**: The document will show an error status in the queue. Your SOP remains unchanged. You can try uploading again.

### **Q: Can I cancel processing?**
**A**: Currently, once started, processing will complete. The document will be marked as complete or error.

### **Q: Where can I see processing progress?**
**A**: Go to Dashboard → AI Processing Queue section. All documents show real-time progress.

### **Q: Will I be notified when processing is done?**
**A**: Yes! You'll see a toast notification, and the SOP page will auto-refresh.

### **Q: Can I continue working while documents process?**
**A**: Absolutely! Processing happens in the background. You can navigate anywhere in the app.

### **Q: What if I upload the wrong document?**
**A**: You can remove it before clicking "Upload & Process". Once processing starts, it will complete, but you can manually delete the extracted rules if needed.

---

## 🎯 **Best Practices**

### **Before Uploading**
1. ✅ Review document to ensure it's the correct version
2. ✅ Check file size (under 50MB)
3. ✅ Verify file format is supported
4. ✅ Remove any files you don't want to upload

### **During Processing**
1. ✅ Monitor progress in AI Processing Queue
2. ✅ Wait for completion before reviewing results
3. ✅ Don't close the browser (processing continues in background)

### **After Processing**
1. ✅ Review new rules added to SOP
2. ✅ Verify rules are correct and complete
3. ✅ Check console logs for de-duplication details
4. ✅ Export updated SOP if needed

---

## 🆘 **Troubleshooting**

### **Problem: "Invalid file type" error**
**Solution**: Only upload PDF, DOCX, DOC, CSV, XLS, or XLSX files.

### **Problem: "File too large" error**
**Solution**: File must be under 50MB. Compress or split the file.

### **Problem: Processing stuck at 0%**
**Solution**: Wait a few seconds. If still stuck, refresh the page and check the queue.

### **Problem: No new rules added**
**Solution**: All extracted rules may be duplicates. Check console logs for details.

### **Problem: Processing shows error**
**Solution**: Check error message. Common causes:
- Invalid document format
- Corrupted file
- Network issues
- API errors

Try uploading again or contact support.

---

## 📞 **Need Help?**

If you encounter issues:
1. Check this guide first
2. Review console logs (F12 → Console tab)
3. Try uploading again
4. Contact support with:
   - SOP name
   - Document name
   - Error message (if any)
   - Screenshot of the issue

---

**Happy Updating!** 🚀

---

**Quick Reference**:
- **Button Location**: SOP page, top-right, next to "Export Rules"
- **Supported Formats**: PDF, DOCX, DOC, CSV, XLS, XLSX
- **Max File Size**: 50MB
- **Processing Time**: 1-10 minutes depending on file size
- **De-duplication**: Automatic
- **Progress Tracking**: Dashboard → AI Processing Queue
