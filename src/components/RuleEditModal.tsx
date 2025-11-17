import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { SOPRule } from '@/types/ruleApproval';
import { lookupTables } from '@/data/lookupTables';

interface RuleEditModalProps {
  rule: SOPRule;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedRule: SOPRule) => void;
}

export const RuleEditModal: React.FC<RuleEditModalProps> = ({
  rule,
  isOpen,
  onClose,
  onSave
}) => {
  const [editedRule, setEditedRule] = useState<SOPRule>(rule);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setEditedRule(rule);
    setErrors({});
  }, [rule]);

  if (!isOpen) return null;

  const handleChange = (field: keyof SOPRule, value: any) => {
    setEditedRule(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateRule = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!editedRule.rule_id) {
      newErrors.rule_id = 'Rule ID is required';
    }
    if (!editedRule.description) {
      newErrors.description = 'Description is required';
    }
    if (!editedRule.action) {
      newErrors.action = 'Action is required';
    }
    if (!editedRule.payer_group) {
      newErrors.payer_group = 'Payer group is required';
    }
    if (!editedRule.provider_group) {
      newErrors.provider_group = 'Provider group is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateRule()) {
      onSave(editedRule);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Edit Rule: {rule.rule_id}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Rule ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rule ID
            </label>
            <input
              type="text"
              value={editedRule.rule_id}
              onChange={(e) => handleChange('rule_id', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.rule_id ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.rule_id && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.rule_id}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={editedRule.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="For @PAYER payers @ACTION(@item) when <trigger>; the @CHART_SECTION must include 'keywords'."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.description}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Format: For @PAYER payers @ACTION(@item) when &lt;trigger&gt;; the @CHART_SECTION must include "keywords".
            </p>
          </div>

          {/* Code and Code Group */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code(s)
              </label>
              <input
                type="text"
                value={editedRule.code}
                onChange={(e) => handleChange('code', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="12345,12346,12347"
              />
              <p className="mt-1 text-xs text-gray-500">Comma-separated codes</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code Group
              </label>
              <select
                value={editedRule.code_group}
                onChange={(e) => handleChange('code_group', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">None</option>
                {lookupTables.codeGroups.map(cg => (
                  <option key={cg.tag} value={cg.tag}>
                    {cg.tag} - {cg.purpose}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action
            </label>
            <select
              value={editedRule.action}
              onChange={(e) => handleChange('action', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.action ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select action...</option>
              {lookupTables.actionTags.map(at => (
                <option key={at.tag} value={at.tag}>
                  {at.tag} - {at.description}
                </option>
              ))}
            </select>
            {errors.action && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.action}
              </p>
            )}
          </div>

          {/* Payer and Provider Groups */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payer Group
              </label>
              <select
                value={editedRule.payer_group}
                onChange={(e) => handleChange('payer_group', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.payer_group ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select payer...</option>
                {lookupTables.payerGroups.map(pg => (
                  <option key={pg.tag} value={pg.tag}>
                    {pg.tag} - {pg.description}
                  </option>
                ))}
              </select>
              {errors.payer_group && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.payer_group}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provider Group
              </label>
              <select
                value={editedRule.provider_group}
                onChange={(e) => handleChange('provider_group', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.provider_group ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select provider...</option>
                {lookupTables.providerGroups.map(pg => (
                  <option key={pg.tag} value={pg.tag}>
                    {pg.tag} - {pg.description}
                  </option>
                ))}
              </select>
              {errors.provider_group && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.provider_group}
                </p>
              )}
            </div>
          </div>

          {/* Documentation Trigger */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Documentation Trigger
            </label>
            <input
              type="text"
              value={editedRule.documentation_trigger}
              onChange={(e) => handleChange('documentation_trigger', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="documented; keyword1; keyword2"
            />
            <p className="mt-1 text-xs text-gray-500">Semicolon-separated keywords</p>
          </div>

          {/* Chart Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chart Section
            </label>
            <select
              value={editedRule.chart_section}
              onChange={(e) => handleChange('chart_section', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select chart section...</option>
              {lookupTables.chartSections.map(cs => (
                <option key={cs.tag} value={cs.tag}>
                  {cs.tag} - {cs.description}
                </option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Effective Date
              </label>
              <input
                type="date"
                value={editedRule.effective_date}
                onChange={(e) => handleChange('effective_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={editedRule.end_date}
                onChange={(e) => handleChange('end_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Reference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reference
            </label>
            <input
              type="text"
              value={editedRule.reference}
              onChange={(e) => handleChange('reference', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Document name - Page X"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
