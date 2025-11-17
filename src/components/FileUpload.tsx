import { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { UploadedFile } from '@/types/sop';

interface FileUploadProps {
  onFileProcessed: (file: UploadedFile) => void;
  acceptedTypes?: string[];
  maxSize?: number;
}

export const FileUpload = ({ 
  onFileProcessed, 
  acceptedTypes = ['.pdf', '.docx', '.doc', '.csv'],
  maxSize = 50 * 1024 * 1024 // 50MB
}: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return `File size exceeds ${maxSize / (1024 * 1024)}MB limit`;
    }

    // Check file type
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(extension)) {
      return `Invalid file type. Accepted types: ${acceptedTypes.join(', ')}`;
    }

    return null;
  };

  const processFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    const uploadedFile: UploadedFile = {
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      type: file.name.endsWith('.pdf') ? 'pdf' : file.name.endsWith('.csv') ? 'csv' : 'docx',
      size: file.size,
      uploadedAt: new Date().toISOString(),
      status: 'processing'
    };

    setUploadedFiles(prev => [...prev, uploadedFile]);
    setError(null);

    try {
      // Simulate file processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Read file content
      const text = await file.text();
      
      uploadedFile.extractedText = text;
      uploadedFile.status = 'completed';
      
      setUploadedFiles(prev => 
        prev.map(f => f.id === uploadedFile.id ? uploadedFile : f)
      );

      onFileProcessed(uploadedFile);
    } catch (err) {
      uploadedFile.status = 'error';
      uploadedFile.errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      setUploadedFiles(prev => 
        prev.map(f => f.id === uploadedFile.id ? uploadedFile : f)
      );
      
      setError(uploadedFile.errorMessage);
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      await processFile(file);
    }
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      await processFile(file);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Upload Source Files</CardTitle>
          <CardDescription>
            Upload PDF, DOCX, or CSV files containing claim-editing rules and policy documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'}
            `}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium mb-2">
              Drag and drop files here
            </p>
            <p className="text-sm text-gray-500 mb-4">
              or click to browse
            </p>
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept={acceptedTypes.join(',')}
              multiple
              onChange={handleFileSelect}
            />
            <Button asChild variant="outline">
              <label htmlFor="file-upload" className="cursor-pointer">
                Select Files
              </label>
            </Button>
            <p className="text-xs text-gray-400 mt-4">
              Supported formats: PDF, DOCX, CSV (max {maxSize / (1024 * 1024)}MB)
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadedFiles.map(file => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)} • {file.type.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {file.status === 'processing' && (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        <span className="text-xs text-blue-500">Processing...</span>
                      </>
                    )}
                    {file.status === 'completed' && (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-xs text-green-500">Completed</span>
                      </>
                    )}
                    {file.status === 'error' && (
                      <>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <span className="text-xs text-red-500">Error</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
