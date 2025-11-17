import { DocumentQueueItem, ProcessingQueue } from '@/types/advanced';
import { SOPManagementService } from './sopManagementService';
import { AIProviderService } from './aiProviderService';
import { lookupTables } from '@/data/lookupTables';

export interface ProcessingQueueItem extends DocumentQueueItem {
  sopId: string;
  sopName: string;
  clientPrefix: string;
  createdBy: string;
  mode?: 'CREATE' | 'UPDATE';
}

class GlobalProcessingQueueService {
  private queue: ProcessingQueueItem[] = [];
  private listeners: ((queue: ProcessingQueueItem[]) => void)[] = [];
  private isProcessing = false;
  private currentProcessingId: string | null = null;
  private refreshInterval: NodeJS.Timeout | null = null;

  // Subscribe to queue updates
  subscribe(callback: (queue: ProcessingQueueItem[]) => void) {
    console.log(`📡 New subscriber added. Total listeners: ${this.listeners.length + 1}`);
    this.listeners.push(callback);
    
    // Immediately call with current queue (CRITICAL - this loads existing items)
    console.log(`📡 Sending initial queue state to new subscriber: ${this.queue.length} items`);
    callback([...this.queue]);
    
    // Start auto-refresh if this is the first subscriber
    if (this.listeners.length === 1) {
      console.log(`📡 Starting auto-refresh (first subscriber)`);
      this.startAutoRefresh();
    }
    
    // Return unsubscribe function
    return () => {
      console.log(`📡 Subscriber removed. Remaining listeners: ${this.listeners.length - 1}`);
      this.listeners = this.listeners.filter(listener => listener !== callback);
      
      // Stop auto-refresh if no more subscribers
      if (this.listeners.length === 0) {
        console.log(`📡 Stopping auto-refresh (no more subscribers)`);
        this.stopAutoRefresh();
      }
    };
  }

  // Notify all listeners of queue changes
  private notifyListeners() {
    console.log(`🔔 notifyListeners: ${this.listeners.length} listeners, ${this.queue.length} items in queue`);
    this.listeners.forEach((callback, index) => {
      console.log(`   → Calling listener ${index + 1}`);
      callback([...this.queue]);
    });
  }

  // Add documents to processing queue
  addToQueue(
    files: File[], 
    sopId: string, 
    sopName: string, 
    clientPrefix: string, 
    createdBy: string,
    mode: 'CREATE' | 'UPDATE' = 'CREATE' // New parameter for update mode
  ): string[] {
    console.log(`📤 GlobalProcessingQueue.addToQueue called with ${files.length} files for SOP ${sopId} (mode: ${mode})`);
    
    const newItems: ProcessingQueueItem[] = files.map(file => ({
      id: `${sopId}-${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      fileName: file.name,
      fileType: this.getFileType(file.name),
      fileSize: file.size,
      status: 'queued',
      progress: 0,
      rulesExtracted: 0,
      estimatedTimeRemaining: this.estimateProcessingTime(file.size),
      sopId,
      sopName,
      clientPrefix,
      createdBy,
      mode // Store mode for later use in processing
    }));

    this.queue.push(...newItems);
    console.log(`📋 Queue now has ${this.queue.length} items total`);
    
    this.notifyListeners();
    console.log(`🔔 Notified ${this.listeners.length} listeners`);

    // Auto-start processing if not already running
    if (!this.isProcessing) {
      console.log(`🚀 Starting processing (was not already running)`);
      this.startProcessing();
    } else {
      console.log(`⏳ Processing already running, items added to queue`);
    }

    return newItems.map(item => item.id);
  }

  // Start processing queue
  async startProcessing() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    while (this.queue.some(item => item.status === 'queued')) {
      const nextItem = this.queue.find(item => item.status === 'queued');
      if (!nextItem) break;

      this.currentProcessingId = nextItem.id;
      await this.processDocument(nextItem);
    }

    this.isProcessing = false;
    this.currentProcessingId = null;
  }

  // Process a single document
  private async processDocument(item: ProcessingQueueItem) {
    try {
      // Update status to processing
      item.status = 'processing';
      item.startedAt = new Date().toISOString();
      this.notifyListeners();

      // Add document to SOP first
      const document = SOPManagementService.addDocumentToSOP(item.sopId, item.file, item.createdBy);
      
      // Update document status to processing
      SOPManagementService.updateDocumentStatus(item.sopId, document.id, 'processing');

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        if (item.status === 'processing' && item.progress < 90) {
          item.progress += Math.random() * 15;
          item.progress = Math.min(item.progress, 90);
          item.estimatedTimeRemaining = Math.max(0, item.estimatedTimeRemaining - 5);
          this.notifyListeners();
        }
      }, 2000);

      // Get real AI configuration
      const aiConfig = AIProviderService.getConfig();
      const uploadDate = new Date().toISOString().split('T')[0];
      
      console.log(`🚀 Starting DIRECT extraction for ${item.fileName}...`);
      
      const formData = new FormData();
      formData.append('file', item.file);
      formData.append('provider', aiConfig.provider);
      formData.append('model', aiConfig.model || 'claude-3-haiku-20240307');
      formData.append('apiKey', aiConfig.apiKey);
      formData.append('clientPrefix', item.clientPrefix);
      formData.append('uploadDate', uploadDate);
      
      // Send lookup tables to backend for AI prompt
      formData.append('lookupTables', JSON.stringify({
        codeGroups: lookupTables.codeGroups,
        payerGroups: lookupTables.payerGroups,
        providerGroups: lookupTables.providerGroups,
        actionTags: lookupTables.actionTags,
        chartSections: lookupTables.chartSections
      }));
      
      console.log(`📋 Sending lookup tables: ${lookupTables.codeGroups.length} code groups, ${lookupTables.payerGroups.length} payer groups`);
      
      const response = await fetch('http://localhost:3001/api/documents/extract-direct', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to extract rules from document');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Extraction failed');
      }

      const { rules, newTags, fileName } = result.data;

      console.log(`✅ Direct extraction complete for ${fileName}:`, {
        rulesExtracted: rules.length,
        newTagsCreated: Object.values(newTags || {}).flat().length
      });

      // Log new tags if any
      if (newTags && Object.values(newTags).flat().length > 0) {
        console.log('🆕 New tags created:');
        if (newTags.code_groups?.length) console.log('   - Code groups:', newTags.code_groups.join(', '));
        if (newTags.payer_groups?.length) console.log('   - Payer groups:', newTags.payer_groups.join(', '));
        if (newTags.provider_groups?.length) console.log('   - Provider groups:', newTags.provider_groups.join(', '));
        if (newTags.actions?.length) console.log('   - Actions:', newTags.actions.join(', '));
        if (newTags.chart_sections?.length) console.log('   - Chart sections:', newTags.chart_sections.join(', '));
      }

      // Update document status to completed
      SOPManagementService.updateDocumentStatus(
        item.sopId,
        document.id,
        'completed',
        rules.length
      );

      // Add extracted rules to SOP (with de-duplication for UPDATE mode)
      console.log(`💾 Saving ${rules.length} rules to SOP ${item.sopId}...`);
      if (rules.length > 0) {
        if (item.mode === 'UPDATE') {
          // De-duplicate: only add rules that don't already exist
          const existingSOP = SOPManagementService.getSOPById(item.sopId);
          const existingRules = existingSOP?.rules || [];
          
          console.log(`🔍 De-duplication check: ${rules.length} extracted rules vs ${existingRules.length} existing rules`);
          
          const newRules = rules.filter(newRule => {
            // Check if EXACT rule already exists by comparing ALL key fields
            const isDuplicate = existingRules.some(existingRule => {
              // Must match ALL of these fields to be considered duplicate:
              const codeMatch = existingRule.code === newRule.code;
              const actionMatch = existingRule.action === newRule.action;
              const payerMatch = JSON.stringify(existingRule.payer_group) === JSON.stringify(newRule.payer_group);
              const providerMatch = JSON.stringify(existingRule.provider_group) === JSON.stringify(newRule.provider_group);
              const descriptionMatch = existingRule.description === newRule.description;
              const chartSectionMatch = existingRule.chart_section === newRule.chart_section;
              const docTriggerMatch = existingRule.documentation_trigger === newRule.documentation_trigger;
              
              const isExactDuplicate = codeMatch && actionMatch && payerMatch && providerMatch && 
                                       descriptionMatch && chartSectionMatch && docTriggerMatch;
              
              if (isExactDuplicate) {
                console.log(`   ⏭️  Skipping duplicate: ${newRule.rule_id} (matches ${existingRule.rule_id})`);
              }
              
              return isExactDuplicate;
            });
            
            if (!isDuplicate) {
              console.log(`   ✅ New rule: ${newRule.rule_id} - ${newRule.description.substring(0, 80)}...`);
            }
            
            return !isDuplicate;
          });
          
          console.log(`📊 De-duplication results:`);
          console.log(`   - Extracted: ${rules.length} rules`);
          console.log(`   - New: ${newRules.length} rules`);
          console.log(`   - Duplicates skipped: ${rules.length - newRules.length} rules`);
          
          if (newRules.length > 0) {
            SOPManagementService.addRulesToSOP(item.sopId, newRules);
            console.log(`✅ ${newRules.length} new rules saved successfully!`);
          } else {
            console.log(`ℹ️ No new rules to add - all extracted rules already exist in SOP`);
          }
          
          // Update item with actual new rules count
          item.rulesExtracted = newRules.length;
        } else {
          // CREATE mode: add all rules
          SOPManagementService.addRulesToSOP(item.sopId, rules);
          console.log(`✅ ${rules.length} rules saved successfully!`);
        }
      } else {
        console.warn(`⚠️ No rules to save - extraction may have failed`);
      }

      // Update item with success
      item.status = 'completed';
      item.progress = 100;
      item.rulesExtracted = rules.length;
      item.completedAt = new Date().toISOString();
      item.estimatedTimeRemaining = 0;
      item.extractedRules = rules;

      console.log(`✅ Processing complete for ${item.fileName}: ${rules.length} rules extracted and saved to SOP`);

    } catch (error) {
      console.error(`❌ Processing failed for ${item.fileName}:`, error);
      
      // Update document status to error if document was created
      try {
        const document = SOPManagementService.getSOPById(item.sopId)?.documents?.find(d => d.file_name === item.fileName);
        if (document) {
          SOPManagementService.updateDocumentStatus(
            item.sopId,
            document.id,
            'error',
            0,
            error instanceof Error ? error.message : 'Processing failed'
          );
        }
      } catch (docError) {
        console.error('Failed to update document status:', docError);
      }

      item.status = 'error';
      item.progress = 0;
      item.estimatedTimeRemaining = 0;
      item.errorMessage = error instanceof Error ? error.message : 'Processing failed';
    }

    this.notifyListeners();
  }

  // Get current queue
  getQueue(): ProcessingQueueItem[] {
    return [...this.queue];
  }

  // Remove item from queue
  removeItem(itemId: string) {
    const index = this.queue.findIndex(item => item.id === itemId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      this.notifyListeners();
    }
  }

  // Clear completed items
  clearCompleted() {
    this.queue = this.queue.filter(item => 
      item.status !== 'completed' && item.status !== 'error'
    );
    this.notifyListeners();
  }

  // Cancel processing
  cancelProcessing() {
    this.isProcessing = false;
    this.currentProcessingId = null;
    
    // Cancel all queued items
    this.queue.forEach(item => {
      if (item.status === 'queued' || item.status === 'processing') {
        item.status = 'cancelled';
      }
    });
    
    this.notifyListeners();
  }

  // Get processing statistics
  getStats() {
    const total = this.queue.length;
    const completed = this.queue.filter(item => item.status === 'completed').length;
    const processing = this.queue.filter(item => item.status === 'processing').length;
    const queued = this.queue.filter(item => item.status === 'queued').length;
    const errors = this.queue.filter(item => item.status === 'error').length;

    return {
      total,
      completed,
      processing,
      queued,
      errors,
      isProcessing: this.isProcessing
    };
  }

  // Helper methods
  private getFileType(fileName: string): 'pdf' | 'docx' | 'csv' | 'xlsx' {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return 'pdf';
      case 'docx':
      case 'doc': return 'docx';
      case 'csv': return 'csv';
      case 'xlsx':
      case 'xls': return 'xlsx';
      default: return 'pdf';
    }
  }

  private estimateProcessingTime(fileSize: number): number {
    // Estimate based on file size (rough calculation)
    const baseSizeKB = fileSize / 1024;
    const baseTimeSeconds = Math.max(60, baseSizeKB * 0.5); // At least 1 minute
    return Math.round(baseTimeSeconds);
  }

  // Auto-refresh methods
  private startAutoRefresh() {
    if (this.refreshInterval) return;
    
    this.refreshInterval = setInterval(() => {
      // Update estimated time remaining for queued items
      this.queue.forEach(item => {
        if (item.status === 'queued' && item.estimatedTimeRemaining > 0) {
          item.estimatedTimeRemaining = Math.max(0, item.estimatedTimeRemaining - 2);
        }
      });
      
      // Notify listeners of updates
      this.notifyListeners();
    }, 2000); // Update every 2 seconds
  }

  private stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  // Retry a failed item
  retryItem(itemId: string) {
    const item = this.queue.find(i => i.id === itemId);
    if (!item) {
      console.error(`❌ Cannot retry: item ${itemId} not found`);
      return;
    }

    if (item.status !== 'error') {
      console.warn(`⚠️ Cannot retry: item ${itemId} is not in error state (current: ${item.status})`);
      return;
    }

    console.log(`🔄 Retrying item: ${item.fileName}`);
    
    // Reset item to queued state
    item.status = 'queued';
    item.progress = 0;
    item.errorMessage = undefined;
    item.estimatedTimeRemaining = this.estimateProcessingTime(item.fileSize);
    
    this.notifyListeners();

    // Start processing if not already running
    if (!this.isProcessing) {
      console.log(`🚀 Starting processing for retry`);
      this.startProcessing();
    }
  }

  // Clear all queue data - for testing purposes
  clearAllData() {
    console.log('🗑️ Clearing global processing queue...');
    this.queue = [];
    this.isProcessing = false;
    this.currentProcessingId = null;
    this.notifyListeners();
    console.log('   ✅ Global processing queue cleared');
  }
}

// Export singleton instance
export const globalProcessingQueue = new GlobalProcessingQueueService();
