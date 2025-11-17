import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  FileText,
  Settings,
  Table as TableIcon
} from 'lucide-react';
import { UploadedFile, SOPRule, ExtractionResult } from '@/types/sop';
import { lookupTables } from '@/data/lookupTables';
import { createOpenAIService } from '@/services/openaiService';
import { createCSVExportService } from '@/services/csvExportService';
import { createRuleValidationService } from '@/services/ruleValidationService';
import { useToast } from '@/hooks/use-toast';

export const RuleExtraction = () => {
  const [apiKey, setApiKey] = useState('');
  const [clientPrefix, setClientPrefix] = useState('AU');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [extractedRules, setExtractedRules] = useState<SOPRule[]>([]);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [apiKeyValid, setApiKeyValid] = useState(false);
  
  const { toast } = useToast();
  const csvService = createCSVExportService();
  const validationService = createRuleValidationService(lookupTables);

  const handleFileProcessed = (file: UploadedFile) => {
    setUploadedFiles(prev => {
      const existing = prev.find(f => f.id === file.id);
      if (existing) {
        return prev.map(f => f.id === file.id ? file : f);
      }
      return [...prev, file];
    });

    toast({
      title: 'File uploaded successfully',
      description: `${file.name} is ready for processing`,
    });
  };

  const handleValidateApiKey = async () => {
    if (!apiKey) {
      toast({
        title: 'API Key Required',
        description: 'Please enter your OpenAI API key',
        variant: 'destructive'
      });
      return;
    }

    try {
      const openaiService = createOpenAIService(apiKey);
      const isValid = await openaiService.validateApiKey();
      
      setApiKeyValid(isValid);
      
      if (isValid) {
        toast({
          title: 'API Key Valid',
          description: 'Your OpenAI API key has been validated successfully',
        });
      } else {
        toast({
          title: 'Invalid API Key',
          description: 'Please check your OpenAI API key and try again',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Validation Error',
        description: 'Failed to validate API key',
        variant: 'destructive'
      });
    }
  };

  const handleExtractRules = async () => {
    if (!apiKeyValid) {
      toast({
        title: 'API Key Required',
        description: 'Please validate your OpenAI API key first',
        variant: 'destructive'
      });
      return;
    }

    const completedFiles = uploadedFiles.filter(f => f.status === 'completed' && f.extractedText);
    
    if (completedFiles.length === 0) {
      toast({
        title: 'No Files to Process',
        description: 'Please upload and process files first',
        variant: 'destructive'
      });
      return;
    }

    setIsExtracting(true);

    try {
      const openaiService = createOpenAIService(apiKey);
      const allRules: SOPRule[] = [];

      for (const file of completedFiles) {
        const result = await openaiService.extractRules({
          fileId: file.id,
          text: file.extractedText!,
          clientPrefix,
          lookupTables
        });

        allRules.push(...result.rules);
        setExtractionResult(result);
      }

      setExtractedRules(allRules);

      toast({
        title: 'Extraction Complete',
        description: `Successfully extracted ${allRules.length} rules`,
      });
    } catch (error) {
      toast({
        title: 'Extraction Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleExportCSV = () => {
    if (extractedRules.length === 0) {
      toast({
        title: 'No Rules to Export',
        description: 'Please extract rules first',
        variant: 'destructive'
      });
      return;
    }

    csvService.exportRulesToCSV(extractedRules, `${clientPrefix}_sop_rules.csv`);
    
    toast({
      title: 'CSV Exported',
      description: `Exported ${extractedRules.length} rules to CSV`,
    });
  };

  const handleExportLookupTables = () => {
    csvService.exportLookupTablesToCSV(lookupTables, 'lookup_tables.csv');
    
    toast({
      title: 'Lookup Tables Exported',
      description: 'Lookup tables exported successfully',
    });
  };

  const handleDownloadTemplate = () => {
    csvService.downloadTemplate(clientPrefix);
    
    toast({
      title: 'Template Downloaded',
      description: 'CSV template downloaded successfully',
    });
  };

  const validateRules = () => {
    const validations = validationService.validateRules(extractedRules);
    let errorCount = 0;
    let warningCount = 0;

    validations.forEach(validation => {
      errorCount += validation.errors.filter(e => e.severity === 'error').length;
      warningCount += validation.errors.filter(e => e.severity === 'warning').length;
    });

    return { errorCount, warningCount, validations };
  };

  const { errorCount, warningCount } = extractedRules.length > 0 ? validateRules() : { errorCount: 0, warningCount: 0 };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rule Extraction</h1>
          <p className="text-gray-500 mt-1">
            AI-powered extraction of claim-editing rules from policy documents
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
          <Button variant="outline" onClick={handleExportLookupTables}>
            <TableIcon className="h-4 w-4 mr-2" />
            Export Lookup Tables
          </Button>
        </div>
      </div>

      <Tabs defaultValue="setup" className="space-y-6">
        <TabsList>
          <TabsTrigger value="setup">
            <Settings className="h-4 w-4 mr-2" />
            Setup
          </TabsTrigger>
          <TabsTrigger value="upload">
            <FileText className="h-4 w-4 mr-2" />
            Upload Files
          </TabsTrigger>
          <TabsTrigger value="extract">
            <Sparkles className="h-4 w-4 mr-2" />
            Extract Rules
          </TabsTrigger>
          <TabsTrigger value="results">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Results ({extractedRules.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>
                Configure your Gemini API key and client settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">OpenAI API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Enter your OpenAI API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleValidateApiKey} variant="outline">
                    Validate
                  </Button>
                </div>
                {apiKeyValid && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    API key validated successfully
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Get your API key from{' '}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    OpenAI Platform
                  </a>
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="clientPrefix">Client Prefix</Label>
                <Input
                  id="clientPrefix"
                  placeholder="e.g., AU, HM, CC"
                  value={clientPrefix}
                  onChange={(e) => setClientPrefix(e.target.value.toUpperCase())}
                  maxLength={4}
                  className="max-w-xs"
                />
                <p className="text-xs text-gray-500">
                  2-4 letter prefix for rule IDs (e.g., AU for Advanced Urology, HM for Hospital Medicine)
                </p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your API key is stored locally and never sent to our servers. It's only used to communicate directly with OpenAI's API.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload">
          <FileUpload onFileProcessed={handleFileProcessed} />
          
          {/* Document Queue for batch processing */}
          {apiKeyValid && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Or Process Multiple Documents Sequentially</h3>
              {/* DocumentQueue component would go here */}
              <div className="p-6 border-2 border-dashed rounded-lg text-center text-gray-500">
                <p>Document Queue component will be integrated here</p>
                <p className="text-sm">Upload multiple files for sequential AI processing</p>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="extract" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Extract Rules with AI</CardTitle>
              <CardDescription>
                Use OpenAI GPT-4 to automatically extract and normalize claim-editing rules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Files Ready for Processing</p>
                  <p className="text-sm text-gray-500">
                    {uploadedFiles.filter(f => f.status === 'completed').length} files uploaded and ready
                  </p>
                </div>
                <Badge variant="secondary">
                  {uploadedFiles.filter(f => f.status === 'completed').length} files
                </Badge>
              </div>

              <Button
                onClick={handleExtractRules}
                disabled={!apiKeyValid || uploadedFiles.filter(f => f.status === 'completed').length === 0 || isExtracting}
                className="w-full"
                size="lg"
              >
                {isExtracting ? (
                  <>
                    <Sparkles className="h-5 w-5 mr-2 animate-pulse" />
                    Extracting Rules...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Extract Rules with AI
                  </>
                )}
              </Button>

              {extractionResult && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">Extraction completed with {extractionResult.confidence.toFixed(0)}% confidence</p>
                      {extractionResult.warnings.length > 0 && (
                        <div>
                          <p className="text-sm font-medium">Warnings:</p>
                          <ul className="text-sm list-disc list-inside">
                            {extractionResult.warnings.slice(0, 5).map((warning, idx) => (
                              <li key={idx}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Extracted Rules</CardTitle>
                  <CardDescription>
                    {extractedRules.length} rules extracted and validated
                  </CardDescription>
                </div>
                <Button onClick={handleExportCSV} disabled={extractedRules.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Export to CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {extractedRules.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No rules extracted yet</p>
                  <p className="text-sm">Upload files and extract rules to see results here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {extractedRules.length - errorCount} valid
                    </Badge>
                    {errorCount > 0 && (
                      <Badge variant="outline" className="text-red-600">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errorCount} errors
                      </Badge>
                    )}
                    {warningCount > 0 && (
                      <Badge variant="outline" className="text-yellow-600">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {warningCount} warnings
                      </Badge>
                    )}
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Rule ID</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Code</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Action</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Payer</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {extractedRules.map((rule, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-mono">{rule.rule_id}</td>
                            <td className="px-4 py-3 text-sm font-mono">{rule.code}</td>
                            <td className="px-4 py-3 text-sm font-mono">{rule.action}</td>
                            <td className="px-4 py-3 text-sm">{rule.payer_group}</td>
                            <td className="px-4 py-3 text-sm">{rule.description.substring(0, 100)}...</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
