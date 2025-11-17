import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  Eye,
  ExternalLink,
  Zap
} from 'lucide-react';
import { AdvancedSOPRule } from '@/types/advanced';

interface ConflictDetectionProps {
  rules: AdvancedSOPRule[];
  onRuleClick?: (ruleId: string) => void;
}

interface Conflict {
  type: 'duplicate' | 'contradiction' | 'overlap';
  severity: 'high' | 'medium' | 'low';
  ruleIds: string[];
  description: string;
  details: string;
}

export const ConflictDetection = ({ rules, onRuleClick }: ConflictDetectionProps) => {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Analyze rules for conflicts
  const analyzeConflicts = () => {
    setIsAnalyzing(true);
    const detectedConflicts: Conflict[] = [];

    // 1. Detect exact duplicates
    const duplicateGroups = new Map<string, string[]>();
    rules.forEach(rule => {
      const payerGroup = Array.isArray(rule.payer_group) ? rule.payer_group : [String(rule.payer_group)];
      const providerGroup = Array.isArray(rule.provider_group) ? rule.provider_group : [String(rule.provider_group)];
      const key = `${rule.code}-${rule.action}-${JSON.stringify(payerGroup)}-${JSON.stringify(providerGroup)}`;
      if (!duplicateGroups.has(key)) {
        duplicateGroups.set(key, []);
      }
      duplicateGroups.get(key)!.push(rule.rule_id);
    });

    duplicateGroups.forEach((ruleIds, key) => {
      if (ruleIds.length > 1) {
        detectedConflicts.push({
          type: 'duplicate',
          severity: 'high',
          ruleIds,
          description: `${ruleIds.length} identical rules detected`,
          details: 'These rules have the same code, action, payer group, and provider group. Consider consolidating them.'
        });
      }
    });

    // 2. Detect contradictions (same code, different actions)
    const codeActionMap = new Map<string, Map<string, string[]>>();
    rules.forEach(rule => {
      const code = String(rule.code);
      const action = String(rule.action);
      
      if (!codeActionMap.has(code)) {
        codeActionMap.set(code, new Map());
      }
      const actionMap = codeActionMap.get(code)!;
      if (!actionMap.has(action)) {
        actionMap.set(action, []);
      }
      actionMap.get(action)!.push(rule.rule_id);
    });

    codeActionMap.forEach((actionMap, code) => {
      if (actionMap.size > 1) {
        const actions = Array.from(actionMap.keys());
        const allRuleIds = Array.from(actionMap.values()).flat();
        
        // Check for conflicting actions
        const conflictingActions = ['deny', 'approve', 'require_prior_auth'];
        const presentActions = actions.filter(action => conflictingActions.includes(action));
        
        if (presentActions.length > 1) {
          detectedConflicts.push({
            type: 'contradiction',
            severity: 'high',
            ruleIds: allRuleIds,
            description: `Conflicting actions for code ${code}`,
            details: `Code ${code} has conflicting actions: ${presentActions.join(', ')}. This may cause processing errors.`
          });
        }
      }
    });

    // 3. Detect overlapping payer/provider combinations
    const overlaps = new Map<string, string[]>();
    rules.forEach(rule1 => {
      rules.forEach(rule2 => {
        if (rule1.rule_id !== rule2.rule_id && rule1.code === rule2.code) {
          // Check for payer overlap
          const payer1 = Array.isArray(rule1.payer_group) ? rule1.payer_group : [String(rule1.payer_group)];
          const payer2 = Array.isArray(rule2.payer_group) ? rule2.payer_group : [String(rule2.payer_group)];
          
          const payerOverlap = payer1.some(p1 => payer2.some(p2 => p1 === p2 || p1 === 'ALL_PAYERS' || p2 === 'ALL_PAYERS'));
          
          if (payerOverlap && rule1.action !== rule2.action) {
            const overlapKey = `${rule1.rule_id}-${rule2.rule_id}`;
            const reverseKey = `${rule2.rule_id}-${rule1.rule_id}`;
            
            if (!overlaps.has(overlapKey) && !overlaps.has(reverseKey)) {
              overlaps.set(overlapKey, [rule1.rule_id, rule2.rule_id]);
            }
          }
        }
      });
    });

    overlaps.forEach((ruleIds, key) => {
      const rule1 = rules.find(r => r.rule_id === ruleIds[0]);
      const rule2 = rules.find(r => r.rule_id === ruleIds[1]);
      
      if (rule1 && rule2) {
        detectedConflicts.push({
          type: 'overlap',
          severity: 'medium',
          ruleIds,
          description: `Overlapping rules for code ${rule1.code}`,
          details: `Rules have overlapping payer groups but different actions (${rule1.action} vs ${rule2.action}). Review for consistency.`
        });
      }
    });

    // 4. Detect potential issues with ALL_PAYERS/ALL_PROVIDERS
    const broadRules = rules.filter(rule => {
      const payerGroup = Array.isArray(rule.payer_group) ? rule.payer_group : [String(rule.payer_group)];
      const providerGroup = Array.isArray(rule.provider_group) ? rule.provider_group : [String(rule.provider_group)];
      
      return payerGroup.includes('ALL_PAYERS') || providerGroup.includes('ALL_PROVIDERS');
    });

    broadRules.forEach(broadRule => {
      const specificRules = rules.filter(rule => 
        rule.rule_id !== broadRule.rule_id &&
        rule.code === broadRule.code &&
        rule.payer_group !== 'ALL_PAYERS' &&
        !Array.isArray(rule.payer_group) || !rule.payer_group.includes('ALL_PAYERS')
      );

      if (specificRules.length > 0 && broadRule.action !== specificRules[0].action) {
        detectedConflicts.push({
          type: 'overlap',
          severity: 'low',
          ruleIds: [broadRule.rule_id, ...specificRules.map(r => r.rule_id)],
          description: `Broad rule may override specific rules`,
          details: `Rule ${broadRule.rule_id} applies to ALL_PAYERS/ALL_PROVIDERS but specific rules exist with different actions.`
        });
      }
    });

    setConflicts(detectedConflicts);
    setIsAnalyzing(false);
  };

  // Re-analyze when rules change
  useEffect(() => {
    if (rules.length > 0) {
      analyzeConflicts();
    }
  }, [rules]);

  const getConflictIcon = (type: Conflict['type'], severity: Conflict['severity']) => {
    if (type === 'duplicate') {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    if (type === 'contradiction') {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    if (severity === 'high') {
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    }
    if (severity === 'medium') {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
    return <AlertCircle className="h-4 w-4 text-blue-500" />;
  };

  const getConflictBadge = (type: Conflict['type'], severity: Conflict['severity']) => {
    const colors = {
      duplicate: 'bg-red-100 text-red-800 border-red-200',
      contradiction: 'bg-red-100 text-red-800 border-red-200',
      overlap: severity === 'high' ? 'bg-orange-100 text-orange-800 border-orange-200' :
               severity === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
               'bg-blue-100 text-blue-800 border-blue-200'
    };

    return (
      <Badge className={`${colors[type]} text-xs`}>
        {type === 'duplicate' ? 'Duplicate' :
         type === 'contradiction' ? 'Contradiction' :
         'Overlap'}
      </Badge>
    );
  };

  if (isAnalyzing) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Zap className="h-4 w-4 animate-pulse" />
        Analyzing conflicts...
      </div>
    );
  }

  if (conflicts.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <CheckCircle2 className="h-4 w-4" />
        No conflicts detected
      </div>
    );
  }

  const highSeverityCount = conflicts.filter(c => c.severity === 'high').length;
  const mediumSeverityCount = conflicts.filter(c => c.severity === 'medium').length;
  const lowSeverityCount = conflicts.filter(c => c.severity === 'low').length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <span className="text-red-600 font-medium">
            {conflicts.length} Conflict{conflicts.length !== 1 ? 's' : ''}
          </span>
          {highSeverityCount > 0 && (
            <Badge className="bg-red-100 text-red-800 text-xs">
              {highSeverityCount} High
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 max-h-96 overflow-y-auto" align="start">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Rule Conflicts
            </CardTitle>
            <div className="flex gap-2 text-sm">
              {highSeverityCount > 0 && (
                <Badge className="bg-red-100 text-red-800">
                  {highSeverityCount} High
                </Badge>
              )}
              {mediumSeverityCount > 0 && (
                <Badge className="bg-yellow-100 text-yellow-800">
                  {mediumSeverityCount} Medium
                </Badge>
              )}
              {lowSeverityCount > 0 && (
                <Badge className="bg-blue-100 text-blue-800">
                  {lowSeverityCount} Low
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {conflicts.map((conflict, index) => (
              <div
                key={index}
                className="border rounded-lg p-3 space-y-2 bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getConflictIcon(conflict.type, conflict.severity)}
                    <span className="font-medium text-sm">
                      {conflict.description}
                    </span>
                  </div>
                  {getConflictBadge(conflict.type, conflict.severity)}
                </div>
                
                <p className="text-xs text-gray-600">
                  {conflict.details}
                </p>
                
                <div className="flex flex-wrap gap-1">
                  {conflict.ruleIds.map(ruleId => (
                    <Button
                      key={ruleId}
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => onRuleClick?.(ruleId)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      {ruleId}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
            
            <div className="pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={analyzeConflicts}
              >
                <Zap className="h-3 w-3 mr-1" />
                Re-analyze Conflicts
              </Button>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};
