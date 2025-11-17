import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ChevronDown,
  ChevronRight,
  Copy, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  FileText,
  Users,
  CreditCard,
  Zap,
  Tag,
  AlertCircle
} from 'lucide-react';
import { SOPRule } from '@/types/sop';
import { getTokenColor } from '@/utils/colorTokens';

interface AccordionSOPTableProps {
  rules: SOPRule[];
  onEdit?: (rule: SOPRule) => void;
  onDelete?: (rule: SOPRule) => void;
  onDuplicate?: (rule: SOPRule) => void;
}

export const AccordionSOPTable = ({ rules, onEdit, onDelete, onDuplicate }: AccordionSOPTableProps) => {
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);

  const toggleRule = (ruleId: string) => {
    setExpandedRuleId(expandedRuleId === ruleId ? null : ruleId);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Active':
        return <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">Active</Badge>;
      case 'Review':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs">Review</Badge>;
      case 'Retired':
        return <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">Retired</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status || 'N/A'}</Badge>;
    }
  };

  const getArrayValue = (value: string | string[] | undefined): string[] => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  };

  const getStringValue = (value: string | string[] | undefined): string => {
    if (!value) return 'N/A';
    return Array.isArray(value) ? value.join(', ') : value;
  };

  const getDescription = (rule: SOPRule): string => {
    return rule.raw_description || rule.description || 'No description available';
  };

  const truncateText = (text: string, maxLength: number = 100): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="space-y-2">
      {rules.map((rule) => {
        const isExpanded = expandedRuleId === rule.rule_id;
        const description = getDescription(rule);
        
        return (
          <div
            key={rule.rule_id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-all duration-200"
          >
            {/* Collapsed Header */}
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={() => toggleRule(rule.rule_id)}
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Expand/Collapse Icon */}
                <div className="flex-shrink-0">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-blue-600 dark:text-blue-400 transition-transform duration-200" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400 transition-transform duration-200" />
                  )}
                </div>

                {/* Rule ID */}
                <div className="flex-shrink-0">
                  <p className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {rule.rule_id}
                  </p>
                </div>

                {/* Short Description */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {truncateText(description, 80)}
                  </p>
                </div>

                {/* Status Badge */}
                <div className="flex-shrink-0">
                  {getStatusBadge(rule.status)}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 ml-4 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onEdit(rule)}
                    title="Edit Rule"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {onDuplicate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onDuplicate(rule)}
                    title="Duplicate Rule"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => onDelete(rule)}
                    title="Delete Rule"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 animate-in slide-in-from-top-2 duration-200">
                <div className="p-6 space-y-6">
                  
                  {/* Full Description */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-2">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide block mb-2">
                          Description
                        </label>
                        <p className="text-sm leading-relaxed text-gray-900 dark:text-gray-100">
                          {description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Two Column Layout for Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Code / Code Group */}
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start gap-2">
                        <Tag className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">
                            Code / Code Group
                          </label>
                          {rule.code_group ? (
                            <Badge className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs">
                              {rule.code_group}
                            </Badge>
                          ) : rule.code ? (
                            <p className="text-sm font-mono text-gray-900 dark:text-gray-100">{rule.code}</p>
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">N/A</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Codes Selected */}
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start gap-2">
                        <Tag className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">
                            Codes Selected
                          </label>
                          <div className="flex flex-wrap gap-1">
                            {rule.codes_selected && rule.codes_selected.length > 0 ? (
                              rule.codes_selected.map((code, idx) => (
                                <Badge key={idx} className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-mono">
                                  {code}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-gray-500 dark:text-gray-400 italic">None</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start gap-2">
                        <Zap className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">
                            Action
                          </label>
                          <div className="flex flex-wrap gap-1">
                            {getArrayValue(rule.action).map((action, idx) => (
                              <Badge key={idx} className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs">
                                {action}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payer Group */}
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start gap-2">
                        <CreditCard className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">
                            Payer Group
                          </label>
                          <div className="flex flex-wrap gap-1">
                            {getArrayValue(rule.payer_group).map((payer, idx) => (
                              <Badge key={idx} className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs">
                                {payer}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Provider Group */}
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start gap-2">
                        <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">
                            Provider Group
                          </label>
                          <div className="flex flex-wrap gap-1">
                            {getArrayValue(rule.provider_group).map((provider, idx) => (
                              <Badge key={idx} className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs">
                                {provider}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Chart Section */}
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">
                            Chart Section
                          </label>
                          <p className="text-sm font-mono text-gray-900 dark:text-gray-100">
                            {rule.chart_section || rule.meta?.chart_section || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Documentation Trigger */}
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 md:col-span-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">
                            Documentation Trigger
                          </label>
                          <div className="flex flex-wrap gap-1">
                            {(rule.documentation_trigger || rule.meta?.triggers?.join('; ') || 'N/A')
                              .split(';')
                              .filter(t => t.trim())
                              .map((trigger, idx) => (
                                <Badge key={idx} className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs">
                                  {trigger.trim()}
                                </Badge>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Effective Date */}
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">
                            Effective Date
                          </label>
                          <p className="text-sm font-mono text-gray-900 dark:text-gray-100">
                            {rule.effective_date || rule.meta?.effective_date || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* End Date */}
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">
                            End Date
                          </label>
                          <p className="text-sm font-mono text-gray-900 dark:text-gray-100">
                            {rule.end_date || rule.meta?.end_date || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Reference */}
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 md:col-span-2">
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">
                            Reference
                          </label>
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {rule.reference || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Metadata Footer */}
                  {(rule.meta?.updated_by || rule.meta?.last_updated || rule.source || rule.confidence !== undefined) && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        {rule.meta?.updated_by && (
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>Updated by: {rule.meta.updated_by}</span>
                          </div>
                        )}
                        {rule.meta?.last_updated && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Last updated: {new Date(rule.meta.last_updated).toLocaleDateString()}</span>
                          </div>
                        )}
                        {rule.source && (
                          <div className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            <span>Source: {rule.source}</span>
                          </div>
                        )}
                        {rule.confidence !== undefined && (
                          <div className="flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>Confidence: {rule.confidence}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Collapse Button */}
                  <div className="flex justify-center pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleRule(rule.rule_id)}
                      className="text-xs"
                    >
                      <ChevronDown className="w-4 h-4 mr-1 rotate-180" />
                      Collapse
                    </Button>
                  </div>

                </div>
              </div>
            )}
          </div>
        );
      })}

      {rules.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No rules found</p>
          <p className="text-sm">Try adjusting your filters or search term</p>
        </div>
      )}
    </div>
  );
};
