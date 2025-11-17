import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Plus, 
  Loader2, 
  AlertCircle, 
  Lightbulb, 
  CheckCircle2,
  Sparkles,
  Tag,
  Users,
  CreditCard,
  Activity
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { lookupTables } from '@/data/lookupTables';
import { SOPManagementService } from '@/services/sopManagementService';
import { AIProviderService } from '@/services/aiProviderService';
import { useToast } from '@/hooks/use-toast';
import { AdvancedSOPRule } from '@/types/advanced';
import { SOP } from '@/types/sop-management';

interface CreateManualRuleProps {
  sopId: string;
  sopName: string;
  onClose: () => void;
  onSuccess: (newRule: AdvancedSOPRule) => void;
}

interface Suggestion {
  type: 'code_group' | 'payer_group' | 'provider_group' | 'action' | 'chart_section';
  value: string;
  display: string;
  description?: string;
  icon: React.ReactNode;
}

// Mock rule generation function (replace with actual LLM API call)
const mockGenerateRule = async (description: string, lookupContext: any): Promise<any> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Simple rule generation based on keywords in description
  const lowerDesc = description.toLowerCase();
  
  // Extract code from description
  let code = '';
  if (lowerDesc.includes('botox') || lowerDesc.includes('52287')) {
    code = '@BOTOX_BLADDER';
  } else if (lowerDesc.includes('e&m') || lowerDesc.includes('office visit')) {
    code = '@E&M_OFFICE_VISITS';
  } else if (lowerDesc.includes('urodynamic')) {
    code = '@URODYNAMICS_PANEL';
  } else {
    code = '99213'; // Default office visit
  }
  
  // Extract payer from description
  let payerGroup = 'ALL_PAYERS';
  if (lowerDesc.includes('bcbs') || lowerDesc.includes('blue cross')) {
    payerGroup = '@BCBS';
  } else if (lowerDesc.includes('medicare')) {
    payerGroup = '@MEDICARE';
  } else if (lowerDesc.includes('medicaid')) {
    payerGroup = '@MEDICAID';
  }
  
  // Extract action from description
  let action = 'review';
  if (lowerDesc.includes('require') || lowerDesc.includes('prior auth')) {
    action = 'require_prior_auth';
  } else if (lowerDesc.includes('deny') || lowerDesc.includes('reject')) {
    action = 'deny';
  } else if (lowerDesc.includes('approve') || lowerDesc.includes('allow')) {
    action = 'approve';
  }
  
  // Extract provider from description
  let providerGroup = 'ALL_PROVIDERS';
  if (lowerDesc.includes('urologist') || lowerDesc.includes('urology')) {
    providerGroup = '@PHYSICIAN_MD_DO';
  }
  
  return {
    code,
    action,
    payer_group: payerGroup,
    provider_group: providerGroup,
    description: description,
    documentation_trigger: 'Clinical documentation required',
    chart_section: 'ASSESSMENT_PLAN',
    modifiers: []
  };
};

export const CreateManualRule = ({ sopId, sopName, onClose, onSuccess }: CreateManualRuleProps) => {
  const { toast } = useToast();
  const [description, setDescription] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState(0);

  // Build comprehensive suggestion database
  const buildSuggestions = (): Suggestion[] => {
    const allSuggestions: Suggestion[] = [];

    // Code Groups
    lookupTables.codeGroups.forEach(cg => {
      allSuggestions.push({
        type: 'code_group',
        value: cg.tag,
        display: cg.tag,
        description: cg.purpose,
        icon: <Tag className="h-4 w-4 text-blue-600" />
      });

      // Add individual codes as suggestions too
      cg.expands_to.forEach(code => {
        allSuggestions.push({
          type: 'code_group',
          value: code,
          display: code,
          description: `From ${cg.tag}: ${cg.purpose}`,
          icon: <Tag className="h-4 w-4 text-blue-400" />
        });
      });
    });

    // Payer Groups
    lookupTables.payerGroups.forEach(pg => {
      allSuggestions.push({
        type: 'payer_group',
        value: pg.tag,
        display: pg.tag,
        description: pg.name,
        icon: <CreditCard className="h-4 w-4 text-green-600" />
      });
    });

    // Provider Groups
    lookupTables.providerGroups.forEach(prg => {
      allSuggestions.push({
        type: 'provider_group',
        value: prg.tag,
        display: prg.tag,
        description: prg.description,
        icon: <Users className="h-4 w-4 text-purple-600" />
      });
    });

    // Actions
    lookupTables.actionTags.forEach(action => {
      allSuggestions.push({
        type: 'action',
        value: action.tag,
        display: action.tag,
        description: action.description,
        icon: <Activity className="h-4 w-4 text-orange-600" />
      });
    });

    // Chart Sections
    lookupTables.chartSections.forEach(cs => {
      allSuggestions.push({
        type: 'chart_section',
        value: cs.tag,
        display: cs.tag,
        description: cs.description,
        icon: <Activity className="h-4 w-4 text-indigo-600" />
      });
    });

    return allSuggestions;
  };

  const allSuggestions = buildSuggestions();

  // Filter suggestions based on input
  const filterSuggestions = (input: string): Suggestion[] => {
    if (!input || input.length < 2) return [];

    const searchTerm = input.toLowerCase();
    const filtered = allSuggestions.filter(suggestion => {
      return (
        suggestion.value.toLowerCase().includes(searchTerm) ||
        suggestion.display.toLowerCase().includes(searchTerm) ||
        suggestion.description?.toLowerCase().includes(searchTerm)
      );
    });

    // Limit to top 10 most relevant
    return filtered.slice(0, 10);
  };

  // Handle text input and show suggestions
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setDescription(value);
    setCursorPosition(e.target.selectionStart);

    // Get current word being typed
    const beforeCursor = value.substring(0, e.target.selectionStart);
    const words = beforeCursor.split(/\s+/);
    const currentWord = words[words.length - 1];

    if (currentWord && currentWord.length >= 2) {
      const filtered = filterSuggestions(currentWord);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  // Insert suggestion into text
  const insertSuggestion = (suggestion: Suggestion) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const beforeCursor = description.substring(0, cursorPosition);
    const afterCursor = description.substring(cursorPosition);
    
    // Find the start of the current word
    const words = beforeCursor.split(/\s+/);
    const currentWord = words[words.length - 1];
    const wordStart = beforeCursor.lastIndexOf(currentWord);
    
    // Replace current word with suggestion
    const newText = 
      description.substring(0, wordStart) + 
      suggestion.value + 
      ' ' + 
      afterCursor;
    
    setDescription(newText);
    setShowSuggestions(false);
    
    // Focus back to textarea
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = wordStart + suggestion.value.length + 1;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Generate rule using LLM
  const generateRule = async () => {
    if (!description.trim()) {
      setError('Please enter a description for the rule.');
      return;
    }

    setCreating(true);
    setError('');

    try {
      // Get AI configuration
      const aiConfig = AIProviderService.getConfig();
      if (!aiConfig.apiKey) {
        throw new Error('AI provider not configured. Please configure AI settings first.');
      }

      // Get existing SOP for context
      const existingSOP = SOPManagementService.getSOPById(sopId);
      if (!existingSOP) {
        throw new Error('SOP not found');
      }

      // Prepare context for LLM
      const lookupContext = {
        codeGroups: lookupTables.codeGroups.map(cg => ({
          tag: cg.tag,
          purpose: cg.purpose,
          codes: cg.expands_to
        })),
        payerGroups: lookupTables.payerGroups.map(pg => ({
          tag: pg.tag,
          name: pg.name,
          type: pg.type
        })),
        providerGroups: lookupTables.providerGroups.map(prg => ({
          tag: prg.tag,
          name: prg.name,
          description: prg.description
        })),
        actions: lookupTables.actionTags.map(a => ({
          tag: a.tag,
          description: a.description,
          syntax: a.syntax
        })),
        chartSections: lookupTables.chartSections.map(cs => ({
          tag: cs.tag,
          name: cs.name,
          description: cs.description
        }))
      };

      // Create LLM prompt
      const prompt = `
You are a healthcare billing rule generator. Based on the user's description, generate a complete SOP rule.

CONTEXT:
- SOP Name: ${sopName}
- Organization: ${existingSOP.organisation_name}
- Department: ${existingSOP.department}

USER DESCRIPTION:
"${description}"

AVAILABLE LOOKUP TABLES:
${JSON.stringify(lookupContext, null, 2)}

INSTRUCTIONS:
1. Parse the user's description and extract relevant information
2. Map to appropriate lookup table values where possible
3. Generate a complete rule with all required fields
4. Use proper medical billing terminology
5. Ensure the rule is specific and actionable

REQUIRED OUTPUT FORMAT (JSON):
{
  "code": "string (CPT/ICD/HCPCS code or code group tag)",
  "action": "string (from actions lookup or appropriate action)",
  "payer_group": "string or array (from payer groups or specific payers)",
  "provider_group": "string or array (from provider groups or specific providers)",
  "description": "string (clear, detailed rule description)",
  "documentation_trigger": "string (what documentation is required)",
  "chart_section": "string (where to document)",
  "modifiers": "array of strings (any required modifiers)",
  "status": "pending"
}

Generate only the JSON object, no additional text.
`;

      // Mock LLM API call for now (replace with actual API when backend is ready)
      const generatedRule = await mockGenerateRule(description, lookupContext);
      
      console.log('Generated rule:', generatedRule);

      // Generate unique rule ID
      const existingRuleIds = existingSOP.rules.map(r => r.rule_id);
      const baseId = `${existingSOP.organisation_name.substring(0, 3).toUpperCase()}-MAN`;
      let ruleId = `${baseId}-${String(existingRuleIds.length + 1).padStart(3, '0')}`;
      let counter = 1;
      while (existingRuleIds.includes(ruleId)) {
        counter++;
        ruleId = `${baseId}-${String(existingRuleIds.length + counter).padStart(3, '0')}`;
      }

      // Create complete rule object
      const newRule: AdvancedSOPRule = {
        rule_id: ruleId,
        code: generatedRule.code || '',
        action: generatedRule.action || 'review',
        payer_group: generatedRule.payer_group || 'ALL_PAYERS',
        provider_group: generatedRule.provider_group || 'ALL_PROVIDERS',
        description: generatedRule.description || description,
        documentation_trigger: generatedRule.documentation_trigger || 'Manual review required',
        chart_section: generatedRule.chart_section || 'ASSESSMENT_PLAN',
        modifiers: generatedRule.modifiers || [],
        status: 'pending',
        source: 'manual',
        effective_date: new Date().toISOString().split('T')[0],
        reference: `Manual rule created from: "${description.substring(0, 100)}${description.length > 100 ? '...' : ''}"`,
        validation_status: 'warning'
      };

      // Check for duplicates
      const isDuplicate = existingSOP.rules.some(existingRule => 
        existingRule.code === newRule.code &&
        existingRule.action === newRule.action &&
        JSON.stringify(existingRule.payer_group) === JSON.stringify(newRule.payer_group) &&
        JSON.stringify(existingRule.provider_group) === JSON.stringify(newRule.provider_group) &&
        existingRule.description === newRule.description
      );

      if (isDuplicate) {
        setError('A similar rule already exists in this SOP. Please modify your description or check existing rules.');
        return;
      }

      // Add rule to SOP
      SOPManagementService.addRulesToSOP(sopId, [newRule]);

      toast({
        title: 'Manual Rule Created',
        description: `Rule ${ruleId} has been added to ${sopName}`,
      });

      onSuccess(newRule);
      onClose();

    } catch (err) {
      console.error('Rule generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate rule');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-600" />
            Create Manual Rule
          </DialogTitle>
          <DialogDescription>
            Describe the rule you want to create for "{sopName}". Use natural language and reference 
            lookup table items for auto-suggestions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Description Input with Auto-suggestions */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Rule Description
            </label>
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={description}
                onChange={handleDescriptionChange}
                placeholder="Example: For BCBS patients, require prior authorization for @BOTOX_BLADDER procedures when performed by urologists..."
                className="min-h-[120px] resize-none"
                disabled={creating}
              />
              
              {/* Auto-suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto border shadow-lg">
                  <CardContent className="p-2">
                    <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                      <Lightbulb className="h-3 w-3" />
                      Suggestions from Lookup Tables
                    </div>
                    <div className="space-y-1">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => insertSuggestion(suggestion)}
                          className="w-full text-left p-2 rounded hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {suggestion.icon}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {suggestion.display}
                              </div>
                              {suggestion.description && (
                                <div className="text-xs text-gray-500 truncate">
                                  {suggestion.description}
                                </div>
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {suggestion.type.replace('_', ' ')}
                            </Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            <div className="text-xs text-gray-500">
              Type to see suggestions from lookup tables. Use tags like @BCBS, @E&M_OFFICE_VISITS, etc.
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <Sparkles className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-2">How it works:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Describe your rule in natural language</li>
                  <li>Use auto-suggestions to insert lookup table values</li>
                  <li>AI will parse your description and generate a complete rule</li>
                  <li>System checks for duplicates before adding</li>
                  <li>Rule will be marked as "pending" for review</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={creating}
          >
            Cancel
          </Button>
          <Button
            onClick={generateRule}
            disabled={creating || !description.trim()}
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Rule...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Rule
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
