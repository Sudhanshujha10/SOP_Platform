import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  ChevronRight, 
  Edit, 
  Copy, 
  Trash2,
  Check,
  X,
  AlertTriangle
} from 'lucide-react';
import { AdvancedSOPRule } from '@/types/advanced';
import { SOPRule } from '@/types/ruleApproval';
import { lookupTables } from '@/data/lookupTables';

interface ProperRulesTableProps {
  rules: AdvancedSOPRule[];
  searchTerm?: string;
  onApprove?: (ruleId: string) => void;
  onReject?: (ruleId: string) => void;
  onEdit?: (ruleId: string) => void;
  onDelete?: (ruleId: string) => void;
  onViewConflict?: (ruleId: string) => void;
}

export const ProperRulesTable = ({ 
  rules, 
  searchTerm = '',
  onApprove,
  onReject,
  onEdit,
  onDelete,
  onViewConflict
}: ProperRulesTableProps) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (ruleId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(ruleId)) {
      newExpanded.delete(ruleId);
    } else {
      newExpanded.add(ruleId);
    }
    setExpandedRows(newExpanded);
  };

  // Get rule status
  const getRuleStatus = (rule: AdvancedSOPRule): 'pending' | 'active' | 'rejected' => {
    return (rule as any).status || 'active';
  };

  // Get status badge
  const getStatusBadge = (rule: AdvancedSOPRule) => {
    const status = getRuleStatus(rule);
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
      <Badge className={`${styles[status]} text-xs px-2 py-1 rounded-full border`}>
        {labels[status]}
      </Badge>
    );
  };

  // Get conflict badge
  const getConflictBadge = (rule: AdvancedSOPRule) => {
    const conflicts = (rule as any).conflicts;
    if (!conflicts || conflicts.length === 0) return null;

    const highestSeverity = conflicts.reduce((max: string, c: any) => {
      const severityOrder: any = { low: 1, medium: 2, high: 3 };
      return severityOrder[c.severity] > severityOrder[max] ? c.severity : max;
    }, 'low');

    const styles: any = {
      low: 'bg-blue-100 text-blue-800 border-blue-300',
      medium: 'bg-orange-100 text-orange-800 border-orange-300',
      high: 'bg-red-100 text-red-800 border-red-300'
    };

    return (
      <Badge className={`${styles[highestSeverity]} text-xs px-2 py-1 rounded-full border flex items-center gap-1`}>
        <AlertTriangle className="w-3 h-3" />
        {conflicts.length}
      </Badge>
    );
  };

  // Render description with inline badges - simple approach
  const renderDescription = (rule: AdvancedSOPRule) => {
    if (!rule.description) return <span className="text-gray-500 italic">No description</span>;
    
    let description = rule.description;
    
    // Helper function to split multi-tags and process each
    const processMultiTags = (tagText: string) => {
      // Split by | to handle multiple tags like @HUMANA_COMMERCIAL|@HUMANA_MEDICARE
      const individualTags = tagText.split('|');
      const badges = [];
      
      individualTags.forEach((tag, index) => {
        const cleanedTag = tag.trim();
        if (cleanedTag) {
          const tagInfo = getTagInfo(cleanedTag);
          const displayText = cleanedTag.replace(/@/g, '');
          
          badges.push(
            <Badge 
              key={`multi-badge-${index}`}
              className={`${tagInfo.color} text-xs px-2 py-1 rounded-full font-medium cursor-help transition-all hover:shadow-sm`}
              title={tagInfo.tooltip}
              style={{ 
                maxWidth: '200px',
                wordBreak: 'break-word',
                whiteSpace: 'normal',
                lineHeight: '1.3'
              }}
            >
              {displayText}
            </Badge>
          );
        }
      });
      
      return badges;
    };

    // Helper function to determine tag category and color
    const getTagInfo = (tagText: string) => {
      const cleanTag = tagText.replace('@', '');
      
      // Check payer groups - more flexible matching
      const payer = lookupTables.payerGroups.find(p => {
        const payerTag = p.tag.replace('@', '');
        return cleanTag === payerTag || 
               cleanTag.includes(payerTag) ||
               payerTag.includes(cleanTag.split('_')[0]); // Match base names like HUMANA
      });
      if (payer) {
        return { color: 'bg-blue-100 text-blue-800 border border-blue-200', tooltip: payer.name, category: 'payer' };
      }
      
      // Check action tags
      const action = lookupTables.actionTags.find(a => 
        cleanTag.startsWith(a.tag.replace('@', ''))
      );
      if (action) {
        let color = 'bg-gray-100 text-gray-700 border border-gray-200';
        if (action.tag.includes('ADD')) color = 'bg-green-100 text-green-800 border border-green-200';
        else if (action.tag.includes('REMOVE')) color = 'bg-red-100 text-red-800 border border-red-200';
        return { color, tooltip: action.description, category: 'action' };
      }
      
      // Check code groups
      const codeGroup = lookupTables.codeGroups.find(c => 
        c.tag.replace('@', '') === cleanTag
      );
      if (codeGroup) {
        return { color: 'bg-teal-100 text-teal-800 border border-teal-200', tooltip: codeGroup.purpose, category: 'code' };
      }
      
      // Check provider groups - more flexible matching
      const provider = lookupTables.providerGroups.find(p => {
        const providerTag = p.tag.replace('@', '');
        return cleanTag === providerTag || 
               cleanTag.includes(providerTag) ||
               providerTag.includes(cleanTag.split('_')[0]);
      });
      if (provider) {
        return { color: 'bg-purple-100 text-purple-800 border border-purple-200', tooltip: provider.description, category: 'provider' };
      }
      
      // Check chart sections
      const chartSection = lookupTables.chartSections.find(s => 
        s.tag === cleanTag
      );
      if (chartSection) {
        return { color: 'bg-orange-100 text-orange-800 border border-orange-200', tooltip: chartSection.description, category: 'chart' };
      }
      
      // Chart section variations
      if (cleanTag.includes('HPI') || cleanTag.includes('ASSESSMENT') || cleanTag.includes('PLAN')) {
        return { color: 'bg-orange-100 text-orange-800 border border-orange-200', tooltip: 'Chart section', category: 'chart' };
      }
      
      // Default for any @ tag
      return { color: 'bg-gray-100 text-gray-700 border border-gray-200', tooltip: 'System tag', category: 'other' };
    };
    
    // Find ALL @ tags using a comprehensive pattern - more flexible
    const tagPattern = /@[A-Z_][A-Z0-9_]*(?:\([^)]*\))?(?:\|@[A-Z_][A-Z0-9_]*(?:\([^)]*\))?)*(?:→@[A-Z0-9_-]*)?/g;
    
    // Replace each @ tag with a placeholder and collect replacements
    const replacements = [];
    let placeholderIndex = 0;
    
    description = description.replace(tagPattern, (match) => {
      const placeholder = `__BADGE_${placeholderIndex}__`;
      
      // Check if this is a multi-tag (contains |)
      if (match.includes('|')) {
        const multiBadges = processMultiTags(match);
        replacements[placeholderIndex] = {
          badge: (
            <span key={`multi-container-${placeholderIndex}`} className="inline-flex flex-wrap gap-1">
              {multiBadges}
            </span>
          )
        };
      } else {
        // Single tag processing
        const tagInfo = getTagInfo(match);
        const displayText = match.replace(/@/g, '');
        
        replacements[placeholderIndex] = {
          badge: (
            <Badge 
              key={`badge-${placeholderIndex}`} 
              className={`${tagInfo.color} text-xs px-2 py-1 rounded-full font-medium cursor-help transition-all hover:shadow-sm`}
              title={tagInfo.tooltip}
              style={{ 
                maxWidth: '200px',
                wordBreak: 'break-word',
                whiteSpace: 'normal',
                lineHeight: '1.3'
              }}
            >
              {displayText}
            </Badge>
          )
        };
      }
      
      placeholderIndex++;
      return placeholder;
    });
    
    // Process description to replace ALL placeholders with badges
    let processedDescription = description;
    const badgeElements = [];
    let keyIndex = 0;
    
    // Replace all placeholders with a unique marker and collect badges
    for (let i = 0; i < placeholderIndex; i++) {
      const placeholder = `__BADGE_${i}__`;
      if (processedDescription.includes(placeholder)) {
        const uniqueMarker = `|||BADGE_${i}|||`;
        processedDescription = processedDescription.replace(placeholder, uniqueMarker);
        if (replacements[i]) {
          badgeElements[i] = replacements[i].badge;
        }
      }
    }
    
    // Split by markers and rebuild with badges
    const parts = [];
    const segments = processedDescription.split(/\|\|\|BADGE_(\d+)\|\|\|/);
    
    for (let i = 0; i < segments.length; i++) {
      if (i % 2 === 0) {
        // Text segment
        if (segments[i]) {
          parts.push(
            <span key={`text-${keyIndex++}`}>
              {segments[i]}
            </span>
          );
        }
      } else {
        // Badge segment
        const badgeIndex = parseInt(segments[i]);
        if (badgeElements[badgeIndex]) {
          parts.push(badgeElements[badgeIndex]);
        }
      }
    }
    
    // If no parts were created, return original description
    if (parts.length === 0) {
      parts.push(<span key="original">{rule.description}</span>);
    }
    
    return <div className="text-sm leading-relaxed break-words overflow-wrap-anywhere">{parts}</div>;
  };

  // Render metadata chips under description
  const renderMetadataChips = (rule: AdvancedSOPRule) => {
    return (
      <div className="mt-2 space-y-1 text-xs text-gray-600">
        <div><strong>Effective:</strong> {rule.effective_date || '2024-01-01'}</div>
        <div><strong>Triggers:</strong> global procedure, E&M</div>
        <div><strong>End:</strong> 2025-12-31</div>
        <div><strong>Chart Section:</strong> ASSESSMENT_PLAN</div>
        <div><strong>Chart-ID:</strong> #{rule.rule_id.replace(/-/g, '')}</div>
      </div>
    );
  };

  // Render code group badges (tags only, not expanded codes)
  const renderCodeGroups = (rule: AdvancedSOPRule) => {
    if (!rule.code_group) return <span className="text-gray-400 text-xs italic">None</span>;
    
    const codeGroups = rule.code_group.split(',').map(c => c.trim());
    return (
      <>
        {codeGroups.map((codeGroup, index) => (
          <Badge 
            key={index} 
            className="bg-teal-100 text-teal-800 border border-teal-200 text-xs px-2 py-1 rounded-full font-medium"
          >
            {codeGroup.replace('@', '')}
          </Badge>
        ))}
      </>
    );
  };

  // Render expanded codes from code groups
  const renderExpandedCodes = (rule: AdvancedSOPRule) => {
    // Get codes from rule.code field (which should contain expanded codes)
    const codes = rule.code ? rule.code.split(',').map(c => c.trim()) : [];
    
    // Filter out any @ tags (in case they weren't expanded)
    const actualCodes = codes.filter(code => !code.startsWith('@'));
    
    if (actualCodes.length === 0) {
      return <span className="text-gray-400 text-xs italic">No codes</span>;
    }
    
    return (
      <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
        {actualCodes.map((code, index) => (
          <Badge 
            key={index} 
            className="bg-gray-100 text-gray-700 border border-gray-300 text-xs font-mono px-2 py-0.5 rounded"
          >
            {code}
          </Badge>
        ))}
      </div>
    );
  };

  // Render documentation trigger
  const renderDocumentationTrigger = (rule: AdvancedSOPRule) => {
    if (!rule.documentation_trigger) {
      return <span className="text-gray-400 text-xs italic">None</span>;
    }
    
    const triggers = rule.documentation_trigger.split(';').map(t => t.trim());
    return (
      <div className="flex flex-wrap gap-1">
        {triggers.map((trigger, index) => (
          <Badge 
            key={index} 
            className="bg-amber-50 text-amber-700 border border-amber-200 text-xs px-2 py-0.5 rounded"
          >
            {trigger}
          </Badge>
        ))}
      </div>
    );
  };

  // Render reference/source
  const renderReference = (rule: AdvancedSOPRule) => {
    if (!rule.reference) {
      return <span className="text-gray-400 text-xs italic">No reference</span>;
    }
    
    return (
      <div className="text-xs text-gray-700">
        {rule.reference}
      </div>
    );
  };

  // Render provider group badges
  const renderProviderGroups = (rule: AdvancedSOPRule) => {
    const providers = Array.isArray(rule.provider_group) ? rule.provider_group : [rule.provider_group];
    return (
      <>
        {providers.map((provider, index) => (
          <Badge 
            key={index} 
            className="bg-purple-100 text-purple-800 border border-purple-200 text-xs px-2 py-1 rounded-full font-medium"
          >
            {String(provider).replace('@', '')}
          </Badge>
        ))}
      </>
    );
  };

  // Render payer group badges
  const renderPayerGroups = (rule: AdvancedSOPRule) => {
    const payers = Array.isArray(rule.payer_group) ? rule.payer_group : [rule.payer_group];
    return (
      <>
        {payers.map((payer, index) => (
          <Badge 
            key={index} 
            className="bg-blue-100 text-blue-800 border border-blue-200 text-xs px-2 py-1 rounded-full font-medium"
          >
            {String(payer).replace('@', '')}
          </Badge>
        ))}
      </>
    );
  };

  // Render action badges
  const renderActions = (rule: AdvancedSOPRule) => {
    const actions = Array.isArray(rule.action) ? rule.action : [rule.action];
    return (
      <div className="flex flex-wrap gap-1">
        {actions.map((action, index) => {
          const actionStr = String(action);
          let colorClass = 'bg-gray-100 text-gray-800 border border-gray-200';
          
          if (actionStr.toLowerCase().includes('add')) {
            colorClass = 'bg-green-100 text-green-800 border border-green-200';
          } else if (actionStr.toLowerCase().includes('remove')) {
            colorClass = 'bg-red-100 text-red-800 border border-red-200';
          }
          
          return (
            <Badge 
              key={index} 
              className={`${colorClass} text-xs px-2 py-1 rounded-full font-medium`}
            >
              {actionStr.replace('@', '')}
            </Badge>
          );
        })}
      </div>
    );
  };

  const filteredRules = rules.filter(rule => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      rule.rule_id.toLowerCase().includes(searchLower) ||
      rule.description?.toLowerCase().includes(searchLower) ||
      rule.code.toLowerCase().includes(searchLower) ||
      String(rule.action).toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="w-full">
      {/* Horizontal Scrolling Container */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
        <table className="w-full text-sm border-collapse bg-white">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b border-r border-gray-200">
                Rule ID
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b border-r border-gray-200" style={{ minWidth: '400px' }}>
                Description
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700 border-b border-r border-gray-200" style={{ minWidth: '150px' }}>
                Code Group
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700 border-b border-r border-gray-200" style={{ minWidth: '200px' }}>
                Codes
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700 border-b border-r border-gray-200" style={{ minWidth: '180px' }}>
                Provider Group
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700 border-b border-r border-gray-200" style={{ minWidth: '220px' }}>
                Payer Group
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700 border-b border-r border-gray-200" style={{ minWidth: '160px' }}>
                Action
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700 border-b border-r border-gray-200" style={{ minWidth: '180px' }}>
                Doc Trigger
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700 border-b border-r border-gray-200" style={{ minWidth: '200px' }}>
                Reference
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700 border-b border-r border-gray-200" style={{ minWidth: '120px' }}>
                Status
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700 border-b border-r border-gray-200" style={{ minWidth: '100px' }}>
                Conflicts
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700 border-b border-r border-gray-200" style={{ minWidth: '140px' }}>
                Last Updated
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700 border-b border-gray-200" style={{ minWidth: '180px' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRules.map((rule, index) => (
              <Collapsible key={rule.rule_id} open={expandedRows.has(rule.rule_id)} asChild>
                <>
                  <CollapsibleTrigger asChild>
                    <tr 
                      className={`cursor-pointer hover:bg-blue-50 transition-all duration-200 border-b border-gray-100 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                      onClick={() => toggleRow(rule.rule_id)}
                    >
                      {/* Rule ID */}
                      <td className="px-4 py-3 border-r border-gray-200 align-top">
                        <div className="font-mono text-sm font-medium text-blue-600">
                          {rule.rule_id}
                        </div>
                      </td>
                      
                      {/* Description */}
                      <td className="px-4 py-3 border-r border-gray-200 align-top">
                        <div className="text-sm leading-relaxed">
                          {renderDescription(rule)}
                        </div>
                        {expandedRows.has(rule.rule_id) && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            {renderMetadataChips(rule)}
                          </div>
                        )}
                      </td>
                      
                      {/* Code Groups */}
                      <td className="px-3 py-3 border-r border-gray-200 align-top text-center">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {renderCodeGroups(rule)}
                        </div>
                      </td>
                      
                      {/* Codes (Expanded) */}
                      <td className="px-3 py-3 border-r border-gray-200 align-top text-center">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {renderExpandedCodes(rule)}
                        </div>
                      </td>
                      
                      {/* Provider Groups */}
                      <td className="px-3 py-3 border-r border-gray-200 align-top text-center">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {renderProviderGroups(rule)}
                        </div>
                      </td>
                      
                      {/* Payer Groups */}
                      <td className="px-3 py-3 border-r border-gray-200 align-top text-center">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {renderPayerGroups(rule)}
                        </div>
                      </td>
                      
                      {/* Actions */}
                      <td className="px-3 py-3 border-r border-gray-200 align-top text-center">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {renderActions(rule)}
                        </div>
                      </td>
                      
                      {/* Documentation Trigger */}
                      <td className="px-3 py-3 border-r border-gray-200 align-top text-center">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {renderDocumentationTrigger(rule)}
                        </div>
                      </td>
                      
                      {/* Reference */}
                      <td className="px-3 py-3 border-r border-gray-200 align-top text-center">
                        {renderReference(rule)}
                      </td>
                      
                      {/* Status */}
                      <td className="px-3 py-3 border-r border-gray-200 align-middle text-center">
                        {getStatusBadge(rule)}
                      </td>
                      
                      {/* Conflicts */}
                      <td className="px-3 py-3 border-r border-gray-200 align-middle text-center">
                        {getConflictBadge(rule)}
                      </td>
                      
                      {/* Last Updated */}
                      <td className="px-3 py-3 border-r border-gray-200 align-middle text-center">
                        <span className="text-xs text-gray-500">
                          {(rule as any).updated_at ? new Date((rule as any).updated_at).toLocaleDateString() : rule.effective_date || '2024-01-01'}
                        </span>
                      </td>
                      
                      {/* Actions */}
                      <td className="px-3 py-3 align-middle text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          {getRuleStatus(rule) === 'pending' && (
                            <>
                              {onApprove && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-green-600 hover:bg-green-50 hover:text-green-700"
                                  onClick={() => onApprove(rule.rule_id)}
                                  title="Approve"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              {onEdit && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                  onClick={() => onEdit(rule.rule_id)}
                                  title="Edit"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {onReject && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                                  onClick={() => onReject(rule.rule_id)}
                                  title="Reject"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          )}
                          {getRuleStatus(rule) === 'active' && onEdit && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                              onClick={() => onEdit(rule.rule_id)}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {getRuleStatus(rule) === 'rejected' && onDelete && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => onDelete(rule.rule_id)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          {(rule as any).conflicts && (rule as any).conflicts.length > 0 && onViewConflict && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                              onClick={() => onViewConflict(rule.rule_id)}
                              title="View Conflicts"
                            >
                              <AlertTriangle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  </CollapsibleTrigger>
                </>
              </Collapsible>
            ))}
          </tbody>
        </table>

        {filteredRules.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No rules found</p>
            {searchTerm && (
              <p className="text-sm mt-2">Try adjusting your search terms</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
