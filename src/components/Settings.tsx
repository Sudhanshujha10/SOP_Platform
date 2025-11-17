import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { 
  X,
  Key,
  Palette,
  User,
  CheckCircle2,
  AlertCircle,
  Save
} from 'lucide-react';
import { AIProviderService, AIProvider, AIConfig } from '@/services/aiProviderService';
import { useToast } from '@/hooks/use-toast';

interface SettingsProps {
  onClose: () => void;
}

export const Settings = ({ onClose }: SettingsProps) => {
  const [aiConfig, setAIConfig] = useState<AIConfig>(AIProviderService.getConfig());
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const { toast } = useToast();

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('billblaze_theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  const handleProviderChange = (provider: AIProvider) => {
    setAIConfig({ ...aiConfig, provider });
    setConnectionStatus('idle');
  };

  const handleApiKeyChange = (apiKey: string) => {
    setAIConfig({ ...aiConfig, apiKey });
    setConnectionStatus('idle');
  };

  const handleModelChange = (model: string) => {
    setAIConfig({ ...aiConfig, model });
  };

  const handleTestConnection = async () => {
    if (!aiConfig.apiKey) {
      toast({
        title: 'API Key Required',
        description: 'Please enter an API key to test the connection',
        variant: 'destructive'
      });
      return;
    }

    setTestingConnection(true);
    setConnectionStatus('idle');

    try {
      // Test by generating a simple prefix
      await AIProviderService.suggestClientPrefix('Test Organization');
      
      setConnectionStatus('success');
      toast({
        title: 'Connection Successful',
        description: `Successfully connected to ${aiConfig.provider.toUpperCase()}`,
      });
    } catch (error) {
      setConnectionStatus('error');
      toast({
        title: 'Connection Failed',
        description: error instanceof Error ? error.message : 'Failed to connect to AI provider',
        variant: 'destructive'
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveAIConfig = () => {
    AIProviderService.setConfig(aiConfig);
    toast({
      title: 'Settings Saved',
      description: 'AI provider configuration has been saved',
    });
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('billblaze_theme', newTheme);
    applyTheme(newTheme);
    
    toast({
      title: 'Theme Updated',
      description: `Switched to ${newTheme} mode`,
    });
  };

  const applyTheme = (theme: 'light' | 'dark') => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const getModelOptions = (provider: AIProvider): Array<{ value: string; label: string; supportsJson: boolean }> => {
    switch (provider) {
      case 'openai':
        return [
          { value: 'gpt-4-turbo-preview', label: 'GPT-4 Turbo Preview (Recommended)', supportsJson: true },
          { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', supportsJson: true },
          { value: 'gpt-4-turbo-2024-04-09', label: 'GPT-4 Turbo (2024-04-09)', supportsJson: true },
          { value: 'gpt-4', label: 'GPT-4', supportsJson: true },
          { value: 'gpt-4-0613', label: 'GPT-4 (0613)', supportsJson: true },
          { value: 'gpt-4-32k', label: 'GPT-4 32K', supportsJson: true },
          { value: 'gpt-3.5-turbo-0125', label: 'GPT-3.5 Turbo (0125) - JSON Support', supportsJson: true },
          { value: 'gpt-3.5-turbo-1106', label: 'GPT-3.5 Turbo (1106) - JSON Support', supportsJson: true },
          { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Latest)', supportsJson: false },
          { value: 'gpt-3.5-turbo-16k', label: 'GPT-3.5 Turbo 16K', supportsJson: false }
        ];
      case 'anthropic':
        return [
          { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus (Recommended)', supportsJson: true },
          { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet', supportsJson: true },
          { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku (Fast)', supportsJson: true },
          { value: 'claude-2.1', label: 'Claude 2.1', supportsJson: true },
          { value: 'claude-2.0', label: 'Claude 2.0', supportsJson: true },
          { value: 'claude-instant-1.2', label: 'Claude Instant (Fast)', supportsJson: true }
        ];
      case 'gemini':
        return [
          { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Recommended)', supportsJson: true },
          { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Fast)', supportsJson: true },
          { value: 'gemini-pro', label: 'Gemini Pro', supportsJson: true },
          { value: 'gemini-pro-vision', label: 'Gemini Pro Vision', supportsJson: true }
        ];
      default:
        return [];
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Settings</CardTitle>
              <CardDescription>
                Configure AI provider, theme, and account preferences
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="ai" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="ai">
                <Key className="h-4 w-4 mr-2" />
                AI Provider
              </TabsTrigger>
              <TabsTrigger value="appearance">
                <Palette className="h-4 w-4 mr-2" />
                Appearance
              </TabsTrigger>
              <TabsTrigger value="account">
                <User className="h-4 w-4 mr-2" />
                Account
              </TabsTrigger>
            </TabsList>

            {/* AI Provider Settings */}
            <TabsContent value="ai" className="space-y-4 mt-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Admin Only:</strong> Configure the AI provider for rule extraction. End users will not see or configure API keys.
                </AlertDescription>
              </Alert>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Recommended:</strong> Use GPT-4 Turbo Preview or Claude 3 Opus for best extraction results. 
                  Models marked with "✓ JSON" support structured output for more reliable parsing.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="provider">AI Provider</Label>
                  <Select value={aiConfig.provider} onValueChange={(v) => handleProviderChange(v as AIProvider)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI (GPT-4)</SelectItem>
                      <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                      <SelectItem value="gemini">Google (Gemini)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Select the AI provider for rule extraction and processing
                  </p>
                </div>

                <div>
                  <Label htmlFor="model">Model</Label>
                  <Select value={aiConfig.model} onValueChange={handleModelChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getModelOptions(aiConfig.provider).map(model => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                          {model.supportsJson && <span className="ml-2 text-xs text-green-600">✓ JSON</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Select the specific model to use. Models with "✓ JSON" support structured output.
                  </p>
                </div>

                <div>
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder={`Enter your ${aiConfig.provider.toUpperCase()} API key`}
                    value={aiConfig.apiKey}
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Your API key is stored securely and never exposed to end users
                  </p>
                </div>

                {connectionStatus === 'success' && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Connection successful! AI provider is configured and ready.
                    </AlertDescription>
                  </Alert>
                )}

                {connectionStatus === 'error' && (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      Connection failed. Please check your API key and try again.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={testingConnection || !aiConfig.apiKey}
                  >
                    {testingConnection ? 'Testing...' : 'Test Connection'}
                  </Button>
                  <Button onClick={handleSaveAIConfig} disabled={!aiConfig.apiKey}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Configuration
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Appearance Settings */}
            <TabsContent value="appearance" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Theme</Label>
                    <p className="text-sm text-gray-500">
                      Choose your preferred color theme
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Light</span>
                    <Switch
                      checked={theme === 'dark'}
                      onCheckedChange={(checked) => handleThemeChange(checked ? 'dark' : 'light')}
                    />
                    <span className="text-sm">Dark</span>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Theme preferences are saved locally and will persist across sessions.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>

            {/* Account Settings */}
            <TabsContent value="account" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="Enter your username"
                    defaultValue="Admin User"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    defaultValue="admin@billblaze.com"
                  />
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Account management features are coming soon.
                  </AlertDescription>
                </Alert>

                <Button disabled>
                  <Save className="h-4 w-4 mr-2" />
                  Save Account Settings
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
