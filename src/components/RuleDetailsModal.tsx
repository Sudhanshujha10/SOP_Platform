import React from 'react';
import { X } from 'lucide-react';
import { SOPRule } from '@/types/sop';
import { AdvancedSOPRule } from '@/types/advanced';

interface RuleDetailsModalProps {
  rule: SOPRule | AdvancedSOPRule | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RuleDetailsModal: React.FC<RuleDetailsModalProps> = ({ rule, isOpen, onClose }) => {
  if (!isOpen || !rule) return null;

  // Helper to get array values
  const getArrayValue = (value: string | string[] | undefined): string[] => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  };

  // Helper to get string value
  const getStringValue = (value: string | string[] | undefined): string => {
    if (!value) return 'N/A';
    return Array.isArray(value) ? value.join(', ') : value;
  };

  const description = rule.raw_description || rule.description || 'N/A';
  const effectiveDate = rule.effective_date || rule.meta?.effective_date || 'N/A';
  const endDate = rule.end_date || rule.meta?.end_date || 'N/A';
  const chartSection = rule.chart_section || rule.meta?.chart_section || 'N/A';
  const reference = rule.reference || 'N/A';
  const documentationTrigger = rule.documentation_trigger || rule.meta?.triggers?.join('; ') || 'N/A';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{rule.rule_id}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Complete Rule Details</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            
            {/* Field 1: Rule ID */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                1. Rule ID
              </label>
              <p className="mt-1 text-lg font-mono text-gray-900 dark:text-gray-100">{rule.rule_id}</p>
            </div>

            {/* Field 2: Code */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                2. Code
              </label>
              <p className="mt-1 text-lg font-mono text-gray-900 dark:text-gray-100">{rule.code || 'N/A'}</p>
            </div>

            {/* Field 3: Code Group */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                3. Code Group
              </label>
              <p className="mt-1 text-lg font-mono text-gray-900 dark:text-gray-100">{rule.code_group || 'N/A'}</p>
            </div>

            {/* Field 4: Codes Selected */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                4. Codes Selected
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {rule.codes_selected && rule.codes_selected.length > 0 ? (
                  rule.codes_selected.map((code, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-mono">
                      {code}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 dark:text-gray-400 italic">None</span>
                )}
              </div>
            </div>

            {/* Field 5: Action */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                5. Action
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {getArrayValue(rule.action).map((action, idx) => (
                  <span key={idx} className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm font-mono">
                    {action}
                  </span>
                ))}
              </div>
            </div>

            {/* Field 6: Payer Group */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                6. Payer Group
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {getArrayValue(rule.payer_group).map((payer, idx) => (
                  <span key={idx} className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-mono">
                    {payer}
                  </span>
                ))}
              </div>
            </div>

            {/* Field 7: Provider Group */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                7. Provider Group
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {getArrayValue(rule.provider_group).map((provider, idx) => (
                  <span key={idx} className="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full text-sm font-mono">
                    {provider}
                  </span>
                ))}
              </div>
            </div>

            {/* Field 8: Description (Full) */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-800">
              <label className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                8. Description (Complete)
              </label>
              <p className="mt-2 text-base leading-relaxed text-gray-900 dark:text-gray-100">{description}</p>
            </div>

            {/* Field 9: Documentation Trigger */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                9. Documentation Trigger
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {documentationTrigger.split(';').filter(t => t.trim()).map((trigger, idx) => (
                  <span key={idx} className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-sm">
                    {trigger.trim()}
                  </span>
                ))}
              </div>
            </div>

            {/* Field 10: Chart Section */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                10. Chart Section
              </label>
              <p className="mt-1 text-lg font-mono text-gray-900 dark:text-gray-100">{chartSection}</p>
            </div>

            {/* Field 11: Effective Date */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                11. Effective Date
              </label>
              <p className="mt-1 text-lg font-mono text-gray-900 dark:text-gray-100">{effectiveDate}</p>
            </div>

            {/* Field 12: End Date */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                12. End Date
              </label>
              <p className="mt-1 text-lg font-mono text-gray-900 dark:text-gray-100">{endDate}</p>
            </div>

            {/* Field 13: Reference */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                13. Reference
              </label>
              <p className="mt-1 text-lg font-mono text-gray-900 dark:text-gray-100">{reference}</p>
            </div>

            {/* Metadata */}
            <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Metadata</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{rule.status || 'N/A'}</p>
                </div>
                {rule.confidence !== undefined && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Confidence</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{rule.confidence}%</p>
                  </div>
                )}
                {rule.source && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Source</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{rule.source}</p>
                  </div>
                )}
                {(rule.created_by || rule.meta?.updated_by) && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Created/Updated By</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{rule.created_by || rule.meta?.updated_by || 'N/A'}</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium text-gray-900 dark:text-gray-100"
          >
            Close
          </button>
          <button
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Edit Rule
          </button>
        </div>
      </div>
    </div>
  );
};
