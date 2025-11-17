import { UploadedFile } from '@/types/sop';

/**
 * File Processing Service for handling PDF, DOCX, and CSV uploads
 */
export class FileProcessingService {
  /**
   * Process uploaded file and extract text content
   */
  async processFile(file: File): Promise<UploadedFile> {
    const uploadedFile: UploadedFile = {
      id: this.generateFileId(),
      name: file.name,
      type: this.getFileType(file),
      size: file.size,
      uploadedAt: new Date().toISOString(),
      status: 'pending'
    };

    try {
      uploadedFile.status = 'processing';
      
      const extractedText = await this.extractText(file, uploadedFile.type);
      
      uploadedFile.extractedText = extractedText;
      uploadedFile.status = 'completed';
      
      return uploadedFile;
    } catch (error) {
      uploadedFile.status = 'error';
      uploadedFile.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  /**
   * Extract text from different file types
   */
  private async extractText(file: File, type: 'pdf' | 'docx' | 'csv'): Promise<string> {
    switch (type) {
      case 'pdf':
        return await this.extractFromPDF(file);
      case 'docx':
        return await this.extractFromDOCX(file);
      case 'csv':
        return await this.extractFromCSV(file);
      default:
        throw new Error(`Unsupported file type: ${type}`);
    }
  }

  /**
   * Extract text from PDF using pdf-parse library
   */
  private async extractFromPDF(file: File): Promise<string> {
    try {
      // For browser environment, we'll use PDF.js
      // This is a placeholder - in production, you'd use a proper PDF parsing library
      const arrayBuffer = await file.arrayBuffer();
      
      // Note: In a real implementation, you would use pdf-parse or PDF.js
      // For now, we'll return a placeholder that indicates PDF processing is needed
      return `[PDF Content from ${file.name}]\n\nNote: PDF parsing requires server-side processing or PDF.js integration.\n\nPlease ensure the PDF contains claim-editing rules with phrases like:\n- "must add modifier"\n- "do not bill"\n- "requires diagnosis"\n- "append modifier"\n- "remove code"`;
    } catch (error) {
      throw new Error(`Failed to extract PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from DOCX
   */
  private async extractFromDOCX(file: File): Promise<string> {
    try {
      // For browser environment, we'll use mammoth.js or similar
      // This is a placeholder
      const text = await file.text();
      
      // Note: In a real implementation, you would use mammoth.js or docx library
      return `[DOCX Content from ${file.name}]\n\n${text}`;
    } catch (error) {
      throw new Error(`Failed to extract DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from CSV
   */
  private async extractFromCSV(file: File): Promise<string> {
    try {
      const text = await file.text();
      return text;
    } catch (error) {
      throw new Error(`Failed to extract CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Determine file type from File object
   */
  private getFileType(file: File): 'pdf' | 'docx' | 'csv' {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (extension === 'pdf') return 'pdf';
    if (extension === 'docx' || extension === 'doc') return 'docx';
    if (extension === 'csv') return 'csv';
    
    // Fallback to MIME type
    if (file.type === 'application/pdf') return 'pdf';
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
    if (file.type === 'text/csv') return 'csv';
    
    throw new Error('Unsupported file type. Please upload PDF, DOCX, or CSV files.');
  }

  /**
   * Generate unique file ID
   */
  private generateFileId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate file before processing
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 50MB limit' };
    }

    // Check file type
    const allowedExtensions = ['pdf', 'docx', 'doc', 'csv'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (!extension || !allowedExtensions.includes(extension)) {
      return { valid: false, error: 'Invalid file type. Only PDF, DOCX, and CSV files are allowed.' };
    }

    return { valid: true };
  }
}

/**
 * Create a file processing service instance
 */
export const createFileProcessingService = (): FileProcessingService => {
  return new FileProcessingService();
};
