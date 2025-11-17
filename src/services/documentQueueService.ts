import { DocumentQueueItem, ProcessingQueue, AdvancedSOPRule } from '@/types/advanced';
import { createOpenAIService } from './openaiService';
import { lookupTables } from '@/data/lookupTables';

/**
 * Document Queue Service - Sequential Processing
 * Processes documents ONE AT A TIME to avoid overloading AI
 */
export class DocumentQueueService {
  private queue: ProcessingQueue;
  private apiKey: string;
  private clientPrefix: string;
  private onProgressUpdate?: (queue: ProcessingQueue) => void;
  private onDocumentComplete?: (item: DocumentQueueItem) => void;
  private isProcessing = false;

  constructor(apiKey: string, clientPrefix: string) {
    this.apiKey = apiKey;
    this.clientPrefix = clientPrefix;
    this.queue = {
      items: [],
      currentIndex: -1,
      totalDocuments: 0,
      completedDocuments: 0,
      isProcessing: false,
      estimatedTotalTime: 0
    };
  }

  /**
   * Add documents to the queue
   */
  addDocuments(files: File[]): void {
    const newItems: DocumentQueueItem[] = files.map(file => ({
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      file,
      fileName: file.name,
      fileType: this.getFileType(file),
      fileSize: file.size,
      status: 'queued',
      progress: 0,
      rulesExtracted: 0,
      estimatedTimeRemaining: this.estimateProcessingTime(file)
    }));

    this.queue.items.push(...newItems);
    this.queue.totalDocuments = this.queue.items.length;
    this.updateEstimatedTotalTime();
    this.notifyProgress();
  }

  /**
   * Start processing the queue sequentially
   */
  async startProcessing(): Promise<void> {
    if (this.isProcessing) {
      console.warn('Queue is already processing');
      return;
    }

    this.isProcessing = true;
    this.queue.isProcessing = true;
    this.queue.currentIndex = 0;

    while (this.queue.currentIndex < this.queue.items.length) {
      const item = this.queue.items[this.queue.currentIndex];
      
      if (item.status === 'queued') {
        await this.processDocument(item);
      }

      this.queue.currentIndex++;
    }

    this.isProcessing = false;
    this.queue.isProcessing = false;
    this.queue.currentIndex = -1;
    this.notifyProgress();
  }

  /**
   * Process a single document
   */
  private async processDocument(item: DocumentQueueItem): Promise<void> {
    item.status = 'processing';
    item.startedAt = new Date().toISOString();
    item.progress = 0;
    this.notifyProgress();

    try {
      // Extract text from file
      const text = await this.extractText(item.file, item.fileType);
      item.progress = 20;
      this.notifyProgress();

      // Process with AI
      const openaiService = createOpenAIService(this.apiKey);
      
      // Simulate progress updates during AI processing
      const progressInterval = setInterval(() => {
        if (item.progress < 90) {
          item.progress += 5;
          this.notifyProgress();
        }
      }, 2000);

      const result = await openaiService.extractRules({
        fileId: item.id,
        text,
        clientPrefix: this.clientPrefix,
        lookupTables
      });

      clearInterval(progressInterval);

      // Convert to AdvancedSOPRule format
      item.extractedRules = result.rules.map((rule, index) => ({
        ...rule,
        code_group: this.detectCodeGroup(rule.code),
        codes_selected: this.extractCodes(rule.code),
        modifiers: this.extractModifiers(rule.action),
        status: 'pending' as const,
        confidence: result.confidence,
        source: 'ai' as const,
        validation_status: 'warning' as const,
        created_by: 'AI Extraction',
        last_modified: new Date().toISOString(),
        version: 1
      }));

      item.rulesExtracted = item.extractedRules.length;
      item.progress = 100;
      item.status = 'completed';
      item.completedAt = new Date().toISOString();
      this.queue.completedDocuments++;

      if (this.onDocumentComplete) {
        this.onDocumentComplete(item);
      }

    } catch (error) {
      item.status = 'error';
      item.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      item.progress = 0;
      console.error(`Error processing ${item.fileName}:`, error);
    }

    this.updateEstimatedTotalTime();
    this.notifyProgress();
  }

  /**
   * Extract text from different file types
   */
  private async extractText(file: File, type: DocumentQueueItem['fileType']): Promise<string> {
    switch (type) {
      case 'pdf':
        return await this.extractFromPDF(file);
      case 'docx':
        return await this.extractFromDOCX(file);
      case 'csv':
      case 'xlsx':
        return await this.extractFromSpreadsheet(file);
      default:
        throw new Error(`Unsupported file type: ${type}`);
    }
  }

  private async extractFromPDF(file: File): Promise<string> {
    // Placeholder - in production use pdf.js or similar
    const text = await file.text();
    return `[PDF Content from ${file.name}]\n\n${text}`;
  }

  private async extractFromDOCX(file: File): Promise<string> {
    // Placeholder - in production use mammoth.js
    const text = await file.text();
    return `[DOCX Content from ${file.name}]\n\n${text}`;
  }

  private async extractFromSpreadsheet(file: File): Promise<string> {
    const text = await file.text();
    return text;
  }

  /**
   * Detect code group from code field
   */
  private detectCodeGroup(code: string): string | undefined {
    if (code.startsWith('@')) {
      return code;
    }
    return undefined;
  }

  /**
   * Extract individual codes from code field
   */
  private extractCodes(code: string): string[] | undefined {
    if (!code.startsWith('@')) {
      return code.split(',').map(c => c.trim());
    }
    return undefined;
  }

  /**
   * Extract modifiers from action field
   */
  private extractModifiers(action: string): string[] | undefined {
    const modifierPattern = /@(25|50|52|59|95|FS|JW|JZ|XU|GT|GQ)/g;
    const matches = action.match(modifierPattern);
    return matches || undefined;
  }

  /**
   * Estimate processing time based on file size
   */
  private estimateProcessingTime(file: File): number {
    // Base time: 180 seconds (3 minutes)
    // Add 30 seconds per MB
    const baseTime = 180;
    const sizeInMB = file.size / (1024 * 1024);
    const additionalTime = Math.floor(sizeInMB * 30);
    return baseTime + additionalTime;
  }

  /**
   * Update estimated total time for remaining documents
   */
  private updateEstimatedTotalTime(): void {
    const remaining = this.queue.items.filter(
      item => item.status === 'queued' || item.status === 'processing'
    );
    
    this.queue.estimatedTotalTime = remaining.reduce(
      (total, item) => total + item.estimatedTimeRemaining,
      0
    );
  }

  /**
   * Get file type from File object
   */
  private getFileType(file: File): DocumentQueueItem['fileType'] {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (extension === 'pdf') return 'pdf';
    if (extension === 'docx' || extension === 'doc') return 'docx';
    if (extension === 'csv') return 'csv';
    if (extension === 'xlsx' || extension === 'xls') return 'xlsx';
    
    throw new Error('Unsupported file type');
  }

  /**
   * Set progress update callback
   */
  onProgress(callback: (queue: ProcessingQueue) => void): void {
    this.onProgressUpdate = callback;
  }

  /**
   * Set document complete callback
   */
  onComplete(callback: (item: DocumentQueueItem) => void): void {
    this.onDocumentComplete = callback;
  }

  /**
   * Notify progress update
   */
  private notifyProgress(): void {
    if (this.onProgressUpdate) {
      this.onProgressUpdate({ ...this.queue });
    }
  }

  /**
   * Get current queue state
   */
  getQueue(): ProcessingQueue {
    return { ...this.queue };
  }

  /**
   * Cancel processing
   */
  cancelProcessing(): void {
    this.isProcessing = false;
    this.queue.isProcessing = false;
    
    this.queue.items.forEach(item => {
      if (item.status === 'queued' || item.status === 'processing') {
        item.status = 'cancelled';
      }
    });
    
    this.notifyProgress();
  }

  /**
   * Remove document from queue
   */
  removeDocument(documentId: string): void {
    const index = this.queue.items.findIndex(item => item.id === documentId);
    if (index !== -1) {
      this.queue.items.splice(index, 1);
      this.queue.totalDocuments = this.queue.items.length;
      this.updateEstimatedTotalTime();
      this.notifyProgress();
    }
  }

  /**
   * Clear completed documents
   */
  clearCompleted(): void {
    this.queue.items = this.queue.items.filter(
      item => item.status !== 'completed' && item.status !== 'error'
    );
    this.queue.totalDocuments = this.queue.items.length;
    this.queue.completedDocuments = 0;
    this.updateEstimatedTotalTime();
    this.notifyProgress();
  }

  /**
   * Get all extracted rules from completed documents
   */
  getAllExtractedRules(): AdvancedSOPRule[] {
    return this.queue.items
      .filter(item => item.status === 'completed' && item.extractedRules)
      .flatMap(item => item.extractedRules!);
  }
}

/**
 * Create document queue service instance
 */
export const createDocumentQueueService = (
  apiKey: string,
  clientPrefix: string
): DocumentQueueService => {
  return new DocumentQueueService(apiKey, clientPrefix);
};
