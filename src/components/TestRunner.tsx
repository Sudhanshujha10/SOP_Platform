import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { runAutomatedTest } from '@/tests/automatedExtractionTest';

export const TestRunner = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<Awaited<ReturnType<typeof runAutomatedTest>> | null>(null);

  const handleRunTest = async () => {
    setIsRunning(true);
    setTestResults(null);

    try {
      const results = await runAutomatedTest();
      setTestResults(results);
      
      // Also log to console
      console.log('\n' + '='.repeat(60));
      console.log('AUTOMATED EXTRACTION TEST RESULTS');
      console.log('='.repeat(60) + '\n');
      results.logs.forEach(log => console.log(log));
      
      if (results.errors.length > 0) {
        console.log('\n' + '='.repeat(60));
        console.log('ERRORS:');
        console.log('='.repeat(60));
        results.errors.forEach(error => console.error(error));
      }
    } catch (error) {
      console.error('Test execution error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Automated Extraction Test</CardTitle>
          <CardDescription>
            Tests the complete SOP creation and rule extraction pipeline using dummy Cardiology data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Prerequisites:</strong> AI Provider must be configured in Settings with a valid API key.
            </AlertDescription>
          </Alert>

          <div className="flex items-center gap-4">
            <Button 
              onClick={handleRunTest} 
              disabled={isRunning}
              size="lg"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running Test...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Automated Test
                </>
              )}
            </Button>

            {testResults && (
              <Badge 
                variant={testResults.success ? 'default' : 'destructive'}
                className="text-lg py-2 px-4"
              >
                {testResults.success ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    PASSED
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 mr-2" />
                    FAILED
                  </>
                )}
              </Badge>
            )}
          </div>

          {testResults && (
            <div className="mt-6 space-y-4">
              {/* Summary */}
              <Card className={testResults.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <CardHeader>
                  <CardTitle className="text-lg">Test Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">SOP ID</p>
                      <p className="font-mono text-sm">{testResults.sopId || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">SOP Status</p>
                      <Badge variant={testResults.sopStatus === 'active' ? 'default' : 'secondary'}>
                        {testResults.sopStatus}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Rules Extracted</p>
                      <p className="text-2xl font-bold">{testResults.rulesExtracted}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Errors</p>
                      <p className="text-2xl font-bold text-red-600">{testResults.errors.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Errors */}
              {testResults.errors.length > 0 && (
                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-red-600">Errors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {testResults.errors.map((error, index) => (
                        <Alert key={index} variant="destructive">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Logs */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Test Logs</CardTitle>
                  <CardDescription>Detailed execution log (also available in browser console)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs max-h-96 overflow-y-auto">
                    {testResults.logs.map((log, index) => (
                      <div key={index} className="whitespace-pre-wrap">
                        {log}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Next Steps */}
              {testResults.success && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Success!</strong> The test SOP has been created and is now visible in the Dashboard under Active SOPs.
                    Navigate to the Dashboard to view the extracted rules.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">What This Test Does:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
              <li>Checks AI Provider configuration</li>
              <li>Creates a test SOP (Cardiology specialty)</li>
              <li>Processes dummy cardiology billing policy document</li>
              <li>Extracts rules using AI (2-step pipeline)</li>
              <li>Validates all extracted rules</li>
              <li>Saves rules to SOP</li>
              <li>Verifies automatic Draft → Active transition</li>
              <li>Confirms all 13 fields are populated</li>
              <li>Displays detailed results</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
