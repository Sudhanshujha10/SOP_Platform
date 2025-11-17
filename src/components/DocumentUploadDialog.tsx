// Document Upload Dialog Component

import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRuleManagement } from '@/contexts/RuleManagementContext';
import { DocumentProcessingResult } from '@/services/documentProcessingService';

interface DocumentUploadDialogProps {
  onClose: () => void;
  onRulesExtracted: (result: DocumentProcessingResult) => void;
}

export const DocumentUploadDialog: React.FC<DocumentUploadDialogProps> = ({ 
  onClose, 
  onRulesExtracted 
}) => {
  const { documentProcessingService } = useRuleManagement();
  const [file, setFile] = useState<File | null>(null);
  const [processingType, setProcessingType] = useState<'new' | 'update' | 'bulk'>('bulk');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<DocumentProcessingResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsProcessing(true);
    try {
      const content = await file.text();
      const processingResult = await documentProcessingService.processDocument(
        content,
        file.name,
        processingType
      );
      
      setResult(processingResult);
      onRulesExtracted(processingResult);
    } catch (error) {
      console.error('Document processing error:', error);
      setResult({
        extractedRules: [],
        newTagsCreated: [],
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        warnings: [],
        summary: {
          totalRulesExtracted: 0,
          validRules: 0,
          rulesNeedingReview: 0,
          invalidRules: 0,
          newTagsDetected: 0
        }
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Upload className="w-6 h-6" />
            Upload SOP Document
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Upload a document to extract SOP rules automatically
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Processing Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Processing Type
            </label>
            <div className="flex gap-2">
              {(['new', 'update', 'bulk'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setProcessingType(type)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    processingType === type
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Document
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                onChange={handleFileChange}
                accept=".txt,.md,.pdf,.doc,.docx"
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  {file ? file.name : 'Click to select or drag and drop'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Supported: TXT, MD, PDF, DOC, DOCX
                </p>
              </label>
            </div>
          </div>

          {/* Processing Result */}
          {result && (
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold text-gray-900 mb-3">Processing Summary</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm">
                      <strong>{result.summary.validRules}</strong> Valid Rules
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <span className="text-sm">
                      <strong>{result.summary.rulesNeedingReview}</strong> Need Review
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm">
                      <strong>{result.summary.invalidRules}</strong> Invalid
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">
                      <strong>{result.summary.newTagsDetected}</strong> New Tags
                    </span>
                  </div>
                </div>
              </div>

              {/* Errors */}
              {result.errors.length > 0 && (
                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Errors
                  </h4>
                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                    {result.errors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                  <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Warnings
                  </h4>
                  <ul className="list-disc list-inside text-sm text-orange-700 space-y-1">
                    {result.warnings.slice(0, 5).map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                    {result.warnings.length > 5 && (
                      <li className="text-xs">... and {result.warnings.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}

              {/* New Tags */}
              {result.newTagsCreated.length > 0 && (
                <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                  <h4 className="font-semibold text-blue-900 mb-2">New Tags Created</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.newTagsCreated.slice(0, 10).map((tag, idx) => (
                      <Badge key={idx} className="bg-blue-100 text-blue-800 border border-blue-200">
                        {tag.tag} ({tag.type})
                      </Badge>
                    ))}
                    {result.newTagsCreated.length > 10 && (
                      <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
                        +{result.newTagsCreated.length - 10} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
          >
            {result ? 'Close' : 'Cancel'}
          </Button>
          
          {!result && (
            <Button
              onClick={handleUpload}
              disabled={!file || isProcessing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Process Document
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
