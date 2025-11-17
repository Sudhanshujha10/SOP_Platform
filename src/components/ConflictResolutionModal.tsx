import React, { useState } from 'react';
import { X, AlertTriangle, Check, Trash2, GitMerge } from 'lucide-react';
import { SOPRule, RuleConflict } from '@/types/ruleApproval';

interface ConflictResolutionModalProps {
  rule: SOPRule;
  isOpen: boolean;
  onClose: () => void;
  onResolve: (conflictId: string, action: 'keep_first' | 'keep_second' | 'keep_both' | 'merge' | 'delete_both', mergedRule?: SOPRule) => Promise<void> | void;
  allRules: SOPRule[];
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  rule,
  isOpen,
  onClose,
  onResolve,
  allRules
}) => {
  const [selectedConflict, setSelectedConflict] = useState<RuleConflict | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  if (!isOpen || !rule.conflicts || rule.conflicts.length === 0) return null;

  const handleResolve = async (conflictId: string, action: 'keep_first' | 'keep_second' | 'keep_both' | 'merge' | 'delete_both') => {
    setIsResolving(true);
    try {
      console.log(`🔧 ConflictResolutionModal: Resolving conflict ${conflictId} with action: ${action}`);
      await onResolve(conflictId, action);
      console.log(`✅ ConflictResolutionModal: Conflict resolved successfully`);
      
      // Don't close the modal automatically - let the parent component handle it
      // The modal will stay open if there are more conflicts to resolve
      
    } catch (error) {
      console.error('❌ ConflictResolutionModal: Error resolving conflict:', error);
    } finally {
      setIsResolving(false);
    }
  };

  const getConflictedRule = (ruleId: string): SOPRule | undefined => {
    return allRules.find(r => r.rule_id === ruleId);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Resolve Conflicts</h2>
              <p className="text-sm text-gray-600">Rule: {rule.rule_id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Conflicts List */}
          <div className="space-y-4">
            {rule.conflicts.map((conflict) => {
              const [ruleId1, ruleId2] = conflict.affectedRuleIds;
              const conflictedRule = getConflictedRule(ruleId1 === rule.rule_id ? ruleId2 : ruleId1);

              return (
                <div key={conflict.id} className={`border-2 rounded-lg p-4 ${getSeverityColor(conflict.severity)}`}>
                  {/* Conflict Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-1 text-xs font-semibold uppercase rounded">
                          {conflict.severity} Severity
                        </span>
                        <span className="px-2 py-1 text-xs font-semibold uppercase rounded bg-white">
                          {conflict.type}
                        </span>
                      </div>
                      <p className="text-sm font-medium mt-2">{conflict.description}</p>
                      {conflict.suggestion && (
                        <p className="text-sm mt-1 opacity-80">💡 {conflict.suggestion}</p>
                      )}
                    </div>
                  </div>

                  {/* Conflicting Rules Comparison */}
                  {conflictedRule && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      {/* Current Rule */}
                      <div className="bg-white rounded-lg p-4 border-2 border-blue-300">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-sm text-gray-900">Current Rule</h4>
                          <span className="text-xs text-blue-600 font-medium">{rule.rule_id}</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-gray-500">Code:</span>
                            <span className="ml-2 font-medium">{rule.code}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Action:</span>
                            <span className="ml-2 font-medium">{rule.action}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Payer:</span>
                            <span className="ml-2 font-medium">{rule.payer_group}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Description:</span>
                            <p className="mt-1 text-xs text-gray-700 line-clamp-3">{rule.description}</p>
                          </div>
                        </div>
                      </div>

                      {/* Conflicted Rule */}
                      <div className="bg-white rounded-lg p-4 border-2 border-orange-300">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-sm text-gray-900">Conflicting Rule</h4>
                          <span className="text-xs text-orange-600 font-medium">{conflictedRule.rule_id}</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-gray-500">Code:</span>
                            <span className="ml-2 font-medium">{conflictedRule.code}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Action:</span>
                            <span className="ml-2 font-medium">{conflictedRule.action}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Payer:</span>
                            <span className="ml-2 font-medium">{conflictedRule.payer_group}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Description:</span>
                            <p className="mt-1 text-xs text-gray-700 line-clamp-3">{conflictedRule.description}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Resolution Actions */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-current border-opacity-20">
                    <button
                      onClick={() => {
                        console.log(`🖱️ ConflictResolutionModal: Keep Current button clicked for conflict ${conflict.id}`);
                        console.log(`📋 Current rule: ${rule.rule_id}, Conflicted rule: ${conflictedRule?.rule_id}`);
                        console.log(`📋 Conflict affected rules: [${conflict.affectedRuleIds.join(', ')}]`);
                        
                        // Determine if current rule is first or second in the conflict
                        const isCurrentRuleFirst = conflict.affectedRuleIds[0] === rule.rule_id;
                        const action = isCurrentRuleFirst ? 'keep_first' : 'keep_second';
                        console.log(`📋 Using action: ${action} (current rule is ${isCurrentRuleFirst ? 'first' : 'second'})`);
                        
                        handleResolve(conflict.id, action);
                      }}
                      disabled={isResolving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Check className="w-4 h-4" />
                      Keep Current
                    </button>
                    <button
                      onClick={() => {
                        console.log(`🖱️ ConflictResolutionModal: Keep Other button clicked for conflict ${conflict.id}`);
                        console.log(`📋 Current rule: ${rule.rule_id}, Conflicted rule: ${conflictedRule?.rule_id}`);
                        
                        // Determine if current rule is first or second in the conflict
                        const isCurrentRuleFirst = conflict.affectedRuleIds[0] === rule.rule_id;
                        const action = isCurrentRuleFirst ? 'keep_second' : 'keep_first';
                        console.log(`📋 Using action: ${action} (keeping the ${isCurrentRuleFirst ? 'second' : 'first'} rule)`);
                        
                        handleResolve(conflict.id, action);
                      }}
                      disabled={isResolving}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Check className="w-4 h-4" />
                      Keep Other
                    </button>
                    <button
                      onClick={() => {
                        console.log(`🖱️ ConflictResolutionModal: Keep Both button clicked for conflict ${conflict.id}`);
                        handleResolve(conflict.id, 'keep_both');
                      }}
                      disabled={isResolving}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Check className="w-4 h-4" />
                      <Check className="w-4 h-4 -ml-3" />
                      Keep Both
                    </button>
                    <button
                      onClick={() => handleResolve(conflict.id, 'delete_both')}
                      disabled={isResolving}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Both
                    </button>
                  </div>
                  
                  {isResolving && (
                    <div className="mt-2 text-center text-sm text-gray-600">
                      Resolving conflict...
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
