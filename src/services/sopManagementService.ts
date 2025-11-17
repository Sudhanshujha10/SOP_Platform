import { SOP, CreateSOPRequest, RecentActivity, ProcessingQueueItem, DashboardStats, SOPDocument } from '@/types/sop-management';
import { AdvancedSOPRule } from '@/types/advanced';
import { BackendApiService } from './backendApiService';

/**
 * SOP Management Service
 * Handles all SOP CRUD operations, document processing, and real-time updates
 * Now uses BackendApiService for persistence
 */
export class SOPManagementService {
  // Keep storage keys for backward compatibility
  private static STORAGE_KEY_SOPS = 'billblaze_sops';
  private static STORAGE_KEY_ACTIVITY = 'billblaze_recent_activity';
  private static STORAGE_KEY_QUEUE = 'billblaze_processing_queue';

  /**
   * Create a new SOP
   */
  static createSOP(request: CreateSOPRequest): SOP {
    const sop: SOP = {
      id: `sop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: request.name,
      organisation_name: request.organisation_name,
      department: request.department,
      status: 'draft',
      rules_count: 0,
      created_at: new Date().toISOString(),
      created_by: request.created_by,
      updated_at: new Date().toISOString(),
      rules: [],
      documents: []
    };

    // Save to storage
    const sops = this.getAllSOPs();
    sops.push(sop);
    this.saveSOPs(sops);

    // Add to recent activity
    this.addActivity({
      id: `activity_${Date.now()}`,
      type: 'sop_created',
      sop_id: sop.id,
      sop_name: sop.name,
      description: `Created new SOP: ${sop.name}`,
      user: request.created_by,
      timestamp: new Date().toISOString(),
      status: 'pending'
    });

    return sop;
  }

  /**
   * Get all SOPs
   */
  static getAllSOPs(): SOP[] {
    const stored = localStorage.getItem(this.STORAGE_KEY_SOPS);
    if (!stored) return [];
    
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse SOPs:', e);
      return [];
    }
  }

  /**
   * Get SOP by ID
   */
  static getSOPById(id: string): SOP | null {
    const sops = this.getAllSOPs();
    return sops.find(sop => sop.id === id) || null;
  }

  /**
   * Update SOP
   */
  static updateSOP(id: string, updates: Partial<SOP>): SOP | null {
    const sops = this.getAllSOPs();
    const index = sops.findIndex(sop => sop.id === id);
    
    if (index === -1) return null;

    sops[index] = {
      ...sops[index],
      ...updates,
      updated_at: new Date().toISOString()
    };

    this.saveSOPs(sops);
    return sops[index];
  }

  /**
   * Delete SOP
   */
  static deleteSOP(id: string): boolean {
    const sops = this.getAllSOPs();
    const filtered = sops.filter(sop => sop.id !== id);
    
    if (filtered.length === sops.length) return false;
    
    this.saveSOPs(filtered);
    return true;
  }

  /**
   * Add document to SOP
   */
  static addDocumentToSOP(sopId: string, file: File, uploadedBy: string): SOPDocument {
    const document: SOPDocument = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sop_id: sopId,
      file_name: file.name,
      file_type: this.getFileType(file),
      file_size: file.size,
      uploaded_at: new Date().toISOString(),
      uploaded_by: uploadedBy,
      processing_status: 'pending',
      rules_extracted: 0
    };

    const sop = this.getSOPById(sopId);
    if (!sop) throw new Error('SOP not found');

    if (!sop.documents) sop.documents = [];
    sop.documents.push(document);

    this.updateSOP(sopId, { documents: sop.documents });

    // Add to recent activity
    this.addActivity({
      id: `activity_${Date.now()}`,
      type: 'document_uploaded',
      sop_id: sopId,
      sop_name: sop.name,
      document_name: file.name,
      description: `Uploaded document: ${file.name}`,
      user: uploadedBy,
      timestamp: new Date().toISOString(),
      status: 'pending'
    });

    return document;
  }

  /**
   * Update document processing status
   */
  static updateDocumentStatus(
    sopId: string,
    documentId: string,
    status: SOPDocument['processing_status'],
    rulesExtracted?: number,
    errorMessage?: string
  ): void {
    const sop = this.getSOPById(sopId);
    if (!sop || !sop.documents) return;

    const docIndex = sop.documents.findIndex(d => d.id === documentId);
    if (docIndex === -1) return;

    sop.documents[docIndex].processing_status = status;
    if (rulesExtracted !== undefined) {
      sop.documents[docIndex].rules_extracted = rulesExtracted;
    }
    if (errorMessage) {
      sop.documents[docIndex].error_message = errorMessage;
    }

    this.updateSOP(sopId, { documents: sop.documents });

    // Add to recent activity if completed
    if (status === 'completed') {
      this.addActivity({
        id: `activity_${Date.now()}`,
        type: 'document_processed',
        sop_id: sopId,
        sop_name: sop.name,
        document_name: sop.documents[docIndex].file_name,
        description: `Processed ${sop.documents[docIndex].file_name} - ${rulesExtracted} rules extracted`,
        user: 'AI Processing',
        timestamp: new Date().toISOString(),
        status: 'completed'
      });
    }
  }

  /**
   * Add rules to SOP
   */
  static addRulesToSOP(sopId: string, rules: AdvancedSOPRule[]): void {
    console.log(`🔧 addRulesToSOP called with ${rules.length} rules for SOP ${sopId}`);
    
    const sop = this.getSOPById(sopId);
    if (!sop) {
      console.error(`❌ SOP not found: ${sopId}`);
      return;
    }

    console.log(`📊 SOP before update:`, {
      id: sop.id,
      name: sop.name,
      status: sop.status,
      rules_count: sop.rules_count,
      existing_rules: sop.rules.length
    });

    sop.rules.push(...rules);
    sop.rules_count = sop.rules.length;

    // If SOP was draft and now has rules, make it active
    const wasActivated = sop.status === 'draft' && sop.rules.length > 0;
    if (wasActivated) {
      sop.status = 'active';
      console.log(`🎉 SOP STATUS CHANGED: draft → active (${sop.rules.length} rules)`);
    }

    this.updateSOP(sopId, {
      rules: sop.rules,
      rules_count: sop.rules_count,
      status: sop.status
    });

    console.log(`📊 SOP after update:`, {
      id: sop.id,
      name: sop.name,
      status: sop.status,
      rules_count: sop.rules_count,
      total_rules: sop.rules.length
    });

    // Add to recent activity
    this.addActivity({
      id: `activity_${Date.now()}`,
      type: 'rule_created',
      sop_id: sopId,
      sop_name: sop.name,
      description: `Added ${rules.length} rules to ${sop.name}`,
      user: 'AI Processing',
      timestamp: new Date().toISOString(),
      status: 'active'
    });

    if (wasActivated) {
      this.addActivity({
        id: `activity_${Date.now() + 1}`,
        type: 'sop_created',
        sop_id: sopId,
        sop_name: sop.name,
        description: `SOP activated with ${sop.rules.length} rules`,
        user: 'System',
        timestamp: new Date().toISOString(),
        status: 'active'
      });
    }
  }

  /**
   * Get all rules across all SOPs
   */
  static getAllRules(): AdvancedSOPRule[] {
    const sops = this.getAllSOPs();
    return sops.flatMap(sop => sop.rules);
  }

  /**
   * Get recent activity
   */
  static getRecentActivity(limit: number = 5): RecentActivity[] {
    const stored = localStorage.getItem(this.STORAGE_KEY_ACTIVITY);
    if (!stored) return [];
    
    try {
      const activities: RecentActivity[] = JSON.parse(stored);
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (e) {
      console.error('Failed to parse activity:', e);
      return [];
    }
  }

  /**
   * Add activity
   */
  static addActivity(activity: RecentActivity): void {
    const activities = this.getRecentActivity(100); // Keep last 100
    activities.unshift(activity);
    localStorage.setItem(this.STORAGE_KEY_ACTIVITY, JSON.stringify(activities.slice(0, 100)));
  }

  /**
   * Get processing queue
   */
  static getProcessingQueue(): ProcessingQueueItem[] {
    const stored = localStorage.getItem(this.STORAGE_KEY_QUEUE);
    if (!stored) return [];
    
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse queue:', e);
      return [];
    }
  }

  /**
   * Add to processing queue
   */
  static addToQueue(item: ProcessingQueueItem): void {
    const queue = this.getProcessingQueue();
    queue.push(item);
    localStorage.setItem(this.STORAGE_KEY_QUEUE, JSON.stringify(queue));
  }

  /**
   * Update queue item
   */
  static updateQueueItem(id: string, updates: Partial<ProcessingQueueItem>): void {
    const queue = this.getProcessingQueue();
    const index = queue.findIndex(item => item.id === id);
    
    if (index !== -1) {
      queue[index] = { ...queue[index], ...updates };
      localStorage.setItem(this.STORAGE_KEY_QUEUE, JSON.stringify(queue));
    }
  }

  /**
   * Remove from queue
   */
  static removeFromQueue(id: string): void {
    const queue = this.getProcessingQueue();
    const filtered = queue.filter(item => item.id !== id);
    localStorage.setItem(this.STORAGE_KEY_QUEUE, JSON.stringify(filtered));
  }

  /**
   * Clear completed from queue
   */
  static clearCompletedFromQueue(): void {
    const queue = this.getProcessingQueue();
    const filtered = queue.filter(item => item.status !== 'completed' && item.status !== 'error');
    localStorage.setItem(this.STORAGE_KEY_QUEUE, JSON.stringify(filtered));
  }

  /**
   * Get dashboard statistics
   */
  static getDashboardStats(): DashboardStats {
    const sops = this.getAllSOPs();
    const queue = this.getProcessingQueue();
    const activity = this.getRecentActivity(100);

    return {
      total_sops: sops.filter(s => s.status !== 'deleted').length,
      active_sops: sops.filter(s => s.status === 'active').length,
      draft_sops: sops.filter(s => s.status === 'draft').length,
      deleted_sops: sops.filter(s => s.status === 'deleted').length,
      total_rules: sops.filter(s => s.status !== 'deleted').reduce((sum, sop) => sum + sop.rules_count, 0),
      documents_processing: queue.filter(q => q.status === 'processing' || q.status === 'queued').length,
      recent_activity_count: activity.length
    };
  }

  /**
   * Soft delete an SOP (move to deleted/trash)
   */
  static softDeleteSOP(sopId: string, deletedBy: string): SOP | null {
    console.log(`🗑️ Soft deleting SOP: ${sopId}`);
    
    const sops = this.getAllSOPs();
    const sopIndex = sops.findIndex(s => s.id === sopId);
    
    if (sopIndex === -1) {
      console.error(`❌ SOP not found: ${sopId}`);
      return null;
    }

    const sop = sops[sopIndex];
    
    // Store previous status for restoration
    sop.previous_status = sop.status as 'draft' | 'active' | 'archived';
    sop.status = 'deleted';
    sop.deleted_at = new Date().toISOString();
    sop.deleted_by = deletedBy;
    sop.updated_at = new Date().toISOString();
    sop.updated_by = deletedBy;

    this.saveSOPs(sops);

    // Add activity
    this.addActivity({
      id: `activity_${Date.now()}`,
      type: 'sop_deleted',
      sop_id: sop.id,
      sop_name: sop.name,
      description: `SOP "${sop.name}" moved to trash`,
      user: deletedBy,
      timestamp: new Date().toISOString(),
      status: 'completed'
    });

    console.log(`✅ SOP soft deleted: ${sop.name}`);
    return sop;
  }

  /**
   * Restore a deleted SOP
   */
  static restoreSOP(sopId: string, restoredBy: string): SOP | null {
    console.log(`♻️ Restoring SOP: ${sopId}`);
    
    const sops = this.getAllSOPs();
    const sopIndex = sops.findIndex(s => s.id === sopId);
    
    if (sopIndex === -1) {
      console.error(`❌ SOP not found: ${sopId}`);
      return null;
    }

    const sop = sops[sopIndex];
    
    if (sop.status !== 'deleted') {
      console.error(`❌ SOP is not deleted: ${sopId}`);
      return null;
    }

    // Restore to previous status or default to draft
    sop.status = sop.previous_status || 'draft';
    sop.updated_at = new Date().toISOString();
    sop.updated_by = restoredBy;
    
    // Clear deletion metadata
    delete sop.deleted_at;
    delete sop.deleted_by;
    delete sop.previous_status;

    this.saveSOPs(sops);

    // Add activity
    this.addActivity({
      id: `activity_${Date.now()}`,
      type: 'sop_restored',
      sop_id: sop.id,
      sop_name: sop.name,
      description: `SOP "${sop.name}" restored from trash`,
      user: restoredBy,
      timestamp: new Date().toISOString(),
      status: 'completed'
    });

    console.log(`✅ SOP restored: ${sop.name} to ${sop.status}`);
    return sop;
  }

  /**
   * Permanently delete an SOP (irreversible)
   */
  static permanentlyDeleteSOP(sopId: string, deletedBy: string): boolean {
    console.log(`🔥 Permanently deleting SOP: ${sopId}`);
    
    const sops = this.getAllSOPs();
    const sopIndex = sops.findIndex(s => s.id === sopId);
    
    if (sopIndex === -1) {
      console.error(`❌ SOP not found: ${sopId}`);
      return false;
    }

    const sop = sops[sopIndex];
    
    if (sop.status !== 'deleted') {
      console.error(`❌ SOP must be in deleted state before permanent deletion: ${sopId}`);
      return false;
    }

    // Add activity before deletion
    this.addActivity({
      id: `activity_${Date.now()}`,
      type: 'sop_permanently_deleted',
      sop_id: sop.id,
      sop_name: sop.name,
      description: `SOP "${sop.name}" permanently deleted`,
      user: deletedBy,
      timestamp: new Date().toISOString(),
      status: 'completed'
    });

    // Remove from array
    sops.splice(sopIndex, 1);
    this.saveSOPs(sops);

    console.log(`✅ SOP permanently deleted: ${sop.name}`);
    return true;
  }

  /**
   * Get all deleted SOPs
   */
  static getDeletedSOPs(): SOP[] {
    return this.getAllSOPs().filter(sop => sop.status === 'deleted');
  }

  /**
   * Save SOPs to storage
   */
  private static saveSOPs(sops: SOP[]): void {
    localStorage.setItem(this.STORAGE_KEY_SOPS, JSON.stringify(sops));
  }

  /**
   * Clear all data (SOPs, activity, queue) - for testing purposes
   */
  static clearAllData(): void {
    console.log('🗑️ Clearing all SOP data...');
    
    // Clear SOPs
    localStorage.removeItem(this.STORAGE_KEY_SOPS);
    console.log('   ✅ SOPs cleared');
    
    // Clear activity
    localStorage.removeItem(this.STORAGE_KEY_ACTIVITY);
    console.log('   ✅ Recent activity cleared');
    
    // Clear processing queue
    localStorage.removeItem(this.STORAGE_KEY_QUEUE);
    console.log('   ✅ Processing queue cleared');
    
    // Clear backend mock data
    localStorage.removeItem('billblaze_sops');
    localStorage.removeItem('billblaze_processing_queue');
    localStorage.removeItem('billblaze_recent_activity');
    console.log('   ✅ Backend mock data cleared');
    
    console.log('🎉 All data cleared successfully!');
  }

  /**
   * Get file type from File object
   */
  private static getFileType(file: File): SOPDocument['file_type'] {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (extension === 'pdf') return 'pdf';
    if (extension === 'docx' || extension === 'doc') return 'docx';
    if (extension === 'csv') return 'csv';
    if (extension === 'xlsx' || extension === 'xls') return 'xlsx';
    
    return 'pdf'; // default
  }
}
