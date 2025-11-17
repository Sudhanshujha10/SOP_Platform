import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ChevronDown,
  ChevronRight,
  Copy, 
  Edit, 
  Trash2,
  Calendar,
  FileText,
  Users,
  CreditCard,
  Zap,
  Tag,
  AlertCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { AdvancedSOPRule } from '@/types/advanced';

interface AccordionSOPManagementProps {
  rules: AdvancedSOPRule[];
  onEdit?: (rule: AdvancedSOPRule) => void;
  onDelete?: (rule: AdvancedSOPRule) => void;
  onDuplicate?: (rule: AdvancedSOPRule) => void;
}

export const AccordionSOPManagement = ({ rules, onEdit, onDelete, onDuplicate }: AccordionSOPManagementProps) => {
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);

  const toggleRule = (ruleId: string) => {
    setExpandedRuleId(expandedRuleId === ruleId ? null : ruleId);
  };

  const getStatusIcon = (rule: AdvancedSOPRule) => {
    if (rule.validation_status === 'error') {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    if (rule.validation_status === 'warning') {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    if (rule.status === 'approved' || rule.status === 'active') {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    return null;
  };

  const getStatusBadge = (status: AdvancedSOPRule['status']) => {
    const variants: Record<AdvancedSOPRule['status'], string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewed: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      active: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      needs_definition: 'bg-orange-100 text-orange-800'
    };

    return (
      <Badge className={`${variants[status]} text-xs`}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getSourceBadge = (source: AdvancedSOPRule['source']) => {
    const variants: Record<AdvancedSOPRule['source'], string> = {
      ai: 'bg-purple-100 text-purple-800',
      manual: 'bg-blue-100 text-blue-800',
      template: 'bg-indigo-100 text-indigo-800',
      csv: 'bg-gray-100 text-gray-800'
    };

    return (
      <Badge className={variants[source]} variant="outline">
        {source.toUpperCase()}
      </Badge>
    );
  };

  const getArrayValue = (value: string | string[] | undefined): string[] => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  };

  const getDescription = (rule: AdvancedSOPRule): string => {
    return rule.description || 'No description available';
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

                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {getStatusIcon(rule)}
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
                    {truncateText(description, 60)}
                  </p>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {getStatusBadge(rule.status)}
                  {getSourceBadge(rule.source)}
                  {rule.confidence !== undefined && (
                    <Badge variant="outline" className="text-xs">
                      {rule.confidence}%
                    </Badge>
                  )}
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
                            {rule.chart_section || 'N/A'}
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
                            {(rule.documentation_trigger || 'N/A')
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
                            {rule.effective_date || 'N/A'}
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
                            {rule.end_date || 'N/A'}
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

                  {/* Validation Issues */}
                  {rule.validation_issues && rule.validation_issues.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4 border border-red-200 dark:border-red-800">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-red-700 dark:text-red-300 uppercase tracking-wide block mb-2">
                            Validation Issues
                          </label>
                          <ul className="space-y-1">
                            {rule.validation_issues.map((issue, idx) => (
                              <li key={idx} className="text-sm text-red-900 dark:text-red-100">
                                <span className="font-semibold">{issue.field}:</span> {issue.message}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Metadata Footer */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      {rule.created_by && (
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>Created by: {rule.created_by}</span>
                        </div>
                      )}
                      {rule.last_modified && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Modified: {new Date(rule.last_modified).toLocaleDateString()}</span>
                        </div>
                      )}
                      {rule.version !== undefined && (
                        <div className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          <span>Version: {rule.version}</span>
                        </div>
                      )}
                    </div>
                  </div>

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
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No rules found</p>
          <p className="text-sm">Try adjusting your filters or search term</p>
        </div>
      )}
    </div>
  );
};
