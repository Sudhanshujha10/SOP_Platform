import React, { useState, useMemo } from 'react';
import { Check, X, Edit2, Trash2, AlertTriangle, Search, Filter, Tag } from 'lucide-react';
import { SOPRule, RuleStatus, ConflictSeverity, RuleSearchSuggestion } from '@/types/ruleApproval';
import { RuleEditModal } from './RuleEditModal';

interface RuleApprovalTableProps {
  rules: SOPRule[];
  onApprove: (ruleId: string) => void;
  onReject: (ruleId: string) => void;
  onEdit: (ruleId: string, changes: Partial<SOPRule>) => void;
  onDelete: (ruleId: string) => void;
  onViewConflict: (ruleId: string) => void;
  onShowNewTags: () => void;
}

export const RuleApprovalTable: React.FC<RuleApprovalTableProps> = ({
  rules,
  onApprove,
  onReject,
  onEdit,
  onDelete,
  onViewConflict,
  onShowNewTags
}) => {
  const [editingRule, setEditingRule] = useState<SOPRule | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<RuleStatus[]>([]);
  const [conflictFilter, setConflictFilter] = useState<ConflictSeverity[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<RuleSearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Generate search suggestions
  const generateSuggestions = (query: string): RuleSearchSuggestion[] => {
    if (!query || query.length < 2) return [];

    const suggestions: RuleSearchSuggestion[] = [];
    const lowerQuery = query.toLowerCase();

    rules.forEach(rule => {
      // Rule ID suggestions
      if (rule.rule_id.toLowerCase().includes(lowerQuery)) {
        suggestions.push({
          type: 'rule_id',
          value: rule.rule_id,
          label: `Rule: ${rule.rule_id}`,
          ruleId: rule.rule_id
        });
      }

      // Code suggestions
      const codes = rule.code.split(',').map(c => c.trim());
      codes.forEach(code => {
        if (code.toLowerCase().includes(lowerQuery) && !suggestions.find(s => s.value === code)) {
          suggestions.push({
            type: 'code',
            value: code,
            label: `Code: ${code}`
          });
        }
      });

      // Description suggestions
      if (rule.description.toLowerCase().includes(lowerQuery)) {
        const snippet = rule.description.substring(0, 50) + '...';
        suggestions.push({
          type: 'description',
          value: rule.description,
          label: `Description: ${snippet}`,
          ruleId: rule.rule_id
        });
      }

      // Tag suggestions
      [rule.payer_group, rule.provider_group, rule.code_group, rule.action].forEach(tag => {
        if (tag && tag.toLowerCase().includes(lowerQuery) && !suggestions.find(s => s.value === tag)) {
          suggestions.push({
            type: 'tag',
            value: tag,
            label: `Tag: ${tag}`
          });
        }
      });
    });

    return suggestions.slice(0, 10); // Limit to 10 suggestions
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    const suggestions = generateSuggestions(value);
    setSearchSuggestions(suggestions);
    setShowSuggestions(suggestions.length > 0);
  };

  const handleSuggestionClick = (suggestion: RuleSearchSuggestion) => {
    setSearchQuery(suggestion.value);
    setShowSuggestions(false);
  };

  // Filter rules
  const filteredRules = useMemo(() => {
    let filtered = rules;

    // Status filter
    if (statusFilter.length > 0) {
      filtered = filtered.filter(rule => statusFilter.includes(rule.status));
    }

    // Conflict severity filter
    if (conflictFilter.length > 0) {
      filtered = filtered.filter(rule => {
        if (!rule.conflicts || rule.conflicts.length === 0) return false;
        return rule.conflicts.some(c => conflictFilter.includes(c.severity));
      });
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(rule =>
        rule.rule_id.toLowerCase().includes(query) ||
        rule.code.toLowerCase().includes(query) ||
        rule.description.toLowerCase().includes(query) ||
        rule.payer_group?.toLowerCase().includes(query) ||
        rule.provider_group?.toLowerCase().includes(query) ||
        rule.code_group?.toLowerCase().includes(query) ||
        rule.action?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [rules, statusFilter, conflictFilter, searchQuery]);

  // Sort rules: pending first, then active, then rejected
  const sortedRules = useMemo(() => {
    return [...filteredRules].sort((a, b) => {
      const statusOrder = { pending: 0, active: 1, rejected: 2 };
      return statusOrder[a.status] - statusOrder[b.status];
    });
  }, [filteredRules]);

  const handleEditSave = (updatedRule: SOPRule) => {
    onEdit(updatedRule.rule_id, updatedRule);
    setEditingRule(null);
  };

  const getStatusBadge = (status: RuleStatus) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      active: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300'
    };

    const labels = {
      pending: 'Pending',
      active: 'Active',
      rejected: 'Rejected'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getConflictBadge = (conflicts: any[] | undefined) => {
    if (!conflicts || conflicts.length === 0) return null;

    const highestSeverity = conflicts.reduce((max, c) => {
      const severityOrder = { low: 1, medium: 2, high: 3 };
      return severityOrder[c.severity] > severityOrder[max] ? c.severity : max;
    }, 'low');

    const styles = {
      low: 'bg-blue-100 text-blue-800 border-blue-300',
      medium: 'bg-orange-100 text-orange-800 border-orange-300',
      high: 'bg-red-100 text-red-800 border-red-300'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[highestSeverity]} flex items-center gap-1`}>
        <AlertTriangle className="w-3 h-3" />
        {conflicts.length} Conflict{conflicts.length > 1 ? 's' : ''}
      </span>
    );
  };

  const newTagsCount = rules.reduce((count, rule) => {
    if (!rule.new_tags) return count;
    return count + 
      (rule.new_tags.code_groups?.length || 0) +
      (rule.new_tags.payer_groups?.length || 0) +
      (rule.new_tags.provider_groups?.length || 0) +
      (rule.new_tags.actions?.length || 0) +
      (rule.new_tags.chart_sections?.length || 0);
  }, 0);

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex items-center gap-3">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => searchSuggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Search by rule ID, code, description, or tag..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Search Suggestions */}
          {showSuggestions && searchSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {searchSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100 last:border-b-0"
                >
                  <span className="text-xs text-gray-500 uppercase">{suggestion.type}</span>
                  <span className="text-sm text-gray-900">{suggestion.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filter Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition-colors ${
            showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>

        {/* New Tags Button */}
        {newTagsCount > 0 && (
          <button
            onClick={onShowNewTags}
            className="px-4 py-2 bg-purple-50 border border-purple-300 text-purple-700 rounded-lg flex items-center gap-2 hover:bg-purple-100 transition-colors"
          >
            <Tag className="w-4 h-4" />
            New Tags ({newTagsCount})
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <div className="flex flex-wrap gap-2">
              {(['pending', 'active', 'rejected'] as RuleStatus[]).map(status => (
                <button
                  key={status}
                  onClick={() => {
                    setStatusFilter(prev =>
                      prev.includes(status)
                        ? prev.filter(s => s !== status)
                        : [...prev, status]
                    );
                  }}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter.includes(status)
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Conflict Severity Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Conflict Severity</label>
            <div className="flex flex-wrap gap-2">
              {(['low', 'medium', 'high'] as ConflictSeverity[]).map(severity => (
                <button
                  key={severity}
                  onClick={() => {
                    setConflictFilter(prev =>
                      prev.includes(severity)
                        ? prev.filter(s => s !== severity)
                        : [...prev, severity]
                    );
                  }}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    conflictFilter.includes(severity)
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setStatusFilter([]);
              setConflictFilter([]);
              setSearchQuery('');
            }}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing {sortedRules.length} of {rules.length} rules
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rule ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code(s)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conflicts
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedRules.map((rule) => (
                <tr key={rule.rule_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {rule.rule_id}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 max-w-md">
                    <div className="line-clamp-2">{rule.description}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <div className="flex flex-wrap gap-1">
                      {rule.code.split(',').slice(0, 3).map((code, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {code.trim()}
                        </span>
                      ))}
                      {rule.code.split(',').length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">
                          +{rule.code.split(',').length - 3} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      {rule.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(rule.status)}
                  </td>
                  <td className="px-4 py-3">
                    {getConflictBadge(rule.conflicts)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {rule.status === 'pending' && (
                        <>
                          <button
                            onClick={() => onApprove(rule.rule_id)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingRule(rule)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onReject(rule.rule_id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {rule.status === 'active' && (
                        <button
                          onClick={() => setEditingRule(rule)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {rule.status === 'rejected' && (
                        <button
                          onClick={() => onDelete(rule.rule_id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      {rule.conflicts && rule.conflicts.length > 0 && (
                        <button
                          onClick={() => onViewConflict(rule.rule_id)}
                          className="p-1.5 text-orange-600 hover:bg-orange-50 rounded transition-colors"
                          title="View Conflicts"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedRules.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No rules found matching your filters
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingRule && (
        <RuleEditModal
          rule={editingRule}
          isOpen={!!editingRule}
          onClose={() => setEditingRule(null)}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
};
