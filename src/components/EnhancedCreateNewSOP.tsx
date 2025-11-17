import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileText, 
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles
} from 'lucide-react';
import { SOPManagementService } from '@/services/sopManagementService';
import { AIProviderService } from '@/services/aiProviderService';
import { useToast } from '@/hooks/use-toast';
import { SOP } from '@/types/sop-management';
import { AdvancedSOPRule } from '@/types/advanced';
import { globalProcessingQueue } from '@/services/globalProcessingQueueService';

interface EnhancedCreateNewSOPProps {
  onClose: () => void;
  onSuccess: (sop: SOP) => void;
}

export const EnhancedCreateNewSOP = ({ onClose, onSuccess }: EnhancedCreateNewSOPProps) => {
  const [step, setStep] = useState<'details' | 'upload'>('details');
  const [sopName, setSOPName] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [department, setDepartment] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const [clientPrefix, setClientPrefix] = useState('');
  const [isGeneratingPrefix, setIsGeneratingPrefix] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [createdSOP, setCreatedSOP] = useState<SOP | null>(null);
  const { toast } = useToast();

  // Auto-generate client prefix when organization name changes
  useEffect(() => {
    if (organisation && organisation.length > 2 && !clientPrefix) {
      generateClientPrefix();
    }
  }, [organisation]);

  const generateClientPrefix = async () => {
    setIsGeneratingPrefix(true);
    try {
      const suggestedPrefix = await AIProviderService.suggestClientPrefix(organisation);
      setClientPrefix(suggestedPrefix);
    } catch (error) {
      console.error('Failed to generate prefix:', error);
      // Fallback to manual generation
      const words = organisation.trim().split(/\s+/);
      const prefix = words.map(w => w[0]).join('').substring(0, 4).toUpperCase();
      setClientPrefix(prefix);
    } finally {
      setIsGeneratingPrefix(false);
    }
  };

  const handleCreateSOP = () => {
    if (!sopName || !organisation || !department || !createdBy || !clientPrefix) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    const sop = SOPManagementService.createSOP({
      name: sopName,
      organisation_name: organisation,
      department: department,
      created_by: createdBy
    });

    setCreatedSOP(sop);
    setStep('upload');

    toast({
      title: 'SOP Created',
      description: `${sopName} has been created as a draft`,
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadAndProcess = async () => {
    if (!createdSOP || selectedFiles.length === 0) {
      toast({
        title: 'No Files Selected',
        description: 'Please select at least one document or CSV to upload',
        variant: 'destructive'
      });
      return;
    }

    try {
      console.log(`🎯 EnhancedCreateNewSOP.handleUploadAndProcess called`);
      console.log(`   - SOP ID: ${createdSOP.id}`);
      console.log(`   - SOP Name: ${createdSOP.name}`);
      console.log(`   - Files: ${selectedFiles.length}`);
      console.log(`   - Client Prefix: ${clientPrefix}`);
      console.log(`   - Created By: ${createdBy}`);
      
      // Add documents to global processing queue
      const queueIds = globalProcessingQueue.addToQueue(
        selectedFiles,
        createdSOP.id,
        createdSOP.name,
        clientPrefix,
        createdBy
      );

      console.log(`📤 Added ${selectedFiles.length} documents to processing queue:`, queueIds);

      // Show success message
      toast({
        title: 'Documents Added to Processing Queue',
        description: `${selectedFiles.length} documents are now being processed in the background. Check the AI Processing Queue on the dashboard for progress.`,
      });

      // Close dialog immediately
      onSuccess(createdSOP);

    } catch (error) {
      toast({
        title: 'Upload Error',
        description: error instanceof Error ? error.message : 'Failed to add documents to processing queue',
        variant: 'destructive'
      });
    }
  };

  const handleSkipUpload = () => {
    if (createdSOP) {
      toast({
        title: 'Draft SOP Created',
        description: 'You can upload documents later from the SOP detail page',
      });
      onSuccess(createdSOP);
    }
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    const fileType = file.name.split('.').pop()?.toLowerCase();

    if (fileType === 'csv') {
      // Read CSV as text
      return await file.text();
    } else if (fileType === 'pdf' || fileType === 'docx') {
      // For now, read as text (in production, use proper PDF/DOCX parsers)
      return await file.text();
    }

    return await file.text();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Create New SOP</CardTitle>
              <CardDescription>
                {step === 'details' 
                  ? 'Enter SOP details - client prefix will be auto-generated'
                  : 'Upload documents or CSV files for AI rule extraction'
                }
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={step} onValueChange={(v) => setStep(v as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">
                1. SOP Details
              </TabsTrigger>
              <TabsTrigger value="upload" disabled={!createdSOP}>
                2. Upload Documents
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="sopName">SOP Name *</Label>
                  <Input
                    id="sopName"
                    placeholder="e.g., Advanced Urology Billing SOP"
                    value={sopName}
                    onChange={(e) => setSOPName(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="organisation">Organisation Name *</Label>
                  <Input
                    id="organisation"
                    placeholder="e.g., Advanced Urology Associates"
                    value={organisation}
                    onChange={(e) => setOrganisation(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Client prefix will be auto-generated from organization name
                  </p>
                </div>

                <div>
                  <Label htmlFor="clientPrefix">Client Prefix *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="clientPrefix"
                      placeholder="e.g., AU"
                      value={clientPrefix}
                      onChange={(e) => setClientPrefix(e.target.value.toUpperCase())}
                      maxLength={4}
                      className="max-w-xs"
                    />
                    {isGeneratingPrefix && (
                      <Button variant="outline" disabled>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Generating...
                      </Button>
                    )}
                    {!isGeneratingPrefix && organisation && (
                      <Button variant="outline" onClick={generateClientPrefix}>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Regenerate
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    2-4 letter prefix for rule IDs (e.g., AU-MOD25-0001)
                  </p>
                </div>

                <div>
                  <Label htmlFor="department">Department *</Label>
                  <Input
                    id="department"
                    placeholder="e.g., Urology Department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="createdBy">Created By *</Label>
                  <Input
                    id="createdBy"
                    placeholder="e.g., Dr. Sarah Chen"
                    value={createdBy}
                    onChange={(e) => setCreatedBy(e.target.value)}
                  />
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    After creating the SOP, you can upload policy documents or CSV files for AI-powered rule extraction.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateSOP}>
                    Create SOP & Continue
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="upload" className="space-y-4 mt-6">
              {createdSOP && (
                <>
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>{createdSOP.name}</strong> created successfully with prefix <strong>{clientPrefix}</strong>.
                      Upload documents or CSV files to extract rules and activate the SOP.
                    </AlertDescription>
                  </Alert>

                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <input
                        type="file"
                        id="sop-file-input"
                        className="hidden"
                        accept=".pdf,.docx,.doc,.csv,.xlsx"
                        multiple
                        onChange={handleFileSelect}
                      />
                      <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-sm text-gray-600 mb-2">
                        Upload policy documents or CSV files
                      </p>
                      <p className="text-xs text-gray-500 mb-4">
                        Supports PDF, DOCX, CSV, XLSX (max 50MB per file)
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('sop-file-input')?.click()}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Select Files
                      </Button>
                    </div>

                  {selectedFiles.length > 0 && (
                    <div className="space-y-2">
                      <Label>Selected Files ({selectedFiles.length})</Label>
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Documents will be processed in the background using AI. You can monitor progress in the AI Processing Queue on the dashboard.
                    </AlertDescription>
                  </Alert>

                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={handleSkipUpload}
                    >
                      Skip for Now
                    </Button>
                    <Button 
                      onClick={handleUploadAndProcess}
                      disabled={selectedFiles.length === 0}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload & Process ({selectedFiles.length})
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
