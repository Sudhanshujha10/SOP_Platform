import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Search,
  Download,
  FileText,
  Calendar,
  Building2,
  User,
  Upload,
  Plus,
  ChevronUp,
  ChevronDown,
  Tag,
  AlertTriangle,
  X
} from 'lucide-react';
import { SOP } from '@/types/sop-management';
import { SOPManagementService } from '@/services/sopManagementService';
import { AdvancedSOPRule } from '@/types/advanced';
import { AccordionSOPManagement } from '@/components/sop/AccordionSOPManagement';
import { UpdateDocuments } from '@/components/UpdateDocuments';
import { CreateManualRule } from '@/components/CreateManualRule';
import { ConflictDetection } from '@/components/ConflictDetection';
import { IntegratedRulesView } from '@/components/IntegratedRulesView';
import { SOPLookupTable } from '@/components/SOPLookupTable';
import { RuleApprovalTable } from '@/components/RuleApprovalTable';
import { RuleEditModal } from '@/components/RuleEditModal';
import { ConflictResolutionModal } from '@/components/ConflictResolutionModal';
import { NewTagsViewer } from '@/components/NewTagsViewer';
import { SOPLookupTableViewer } from '@/components/SOPLookupTableViewer';
import { SOPSpecificLookupTable } from '@/components/SOPSpecificLookupTable';
import { masterLookupTableService } from '@/services/masterLookupTableService';
import { SOPRule } from '@/types/ruleApproval';
import { RuleApprovalService } from '@/services/ruleApprovalService';
import { sampleAdvanceUrologySOPRules } from '@/data/sampleSOPRules';
import { useToast } from '@/hooks/use-toast';

interface SOPDetailProps {
  sopId: string;
  onBack: () => void;
}

export const SOPDetail = ({ sopId, onBack }: SOPDetailProps) => {
  const [sop, setSOP] = useState<SOP | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRules, setFilteredRules] = useState<AdvancedSOPRule[]>([]);
  const [showUpdateDocuments, setShowUpdateDocuments] = useState(false);
  const [showCreateManualRule, setShowCreateManualRule] = useState(false);
  const [showLookupTable, setShowLookupTable] = useState(false);
  const [showNewTags, setShowNewTags] = useState(false);
  const [showSOPLookupTable, setShowSOPLookupTable] = useState(false);
  const [editingRule, setEditingRule] = useState<SOPRule | null>(null);
  const [conflictRule, setConflictRule] = useState<SOPRule | null>(null);
  const { toast } = useToast();

  // Generate SOP-specific lookup table using master service
  const sopLookupTable = useMemo(() => {
    if (!sop) return null;
    return masterLookupTableService.generateSOPLookupTable(sopId, sop.name, sop.rules);
  }, [sop, sopId]);

  const loadSOP = useCallback(() => {
    const loadedSOP = SOPManagementService.getSOPById(sopId);
    
    // For demo purposes, if this is the "Advance Urology SOP", add sample rules
    if (loadedSOP && loadedSOP.name === "Advance Urology SOP") {
      loadedSOP.rules = [...(loadedSOP.rules || []), ...sampleAdvanceUrologySOPRules];
      console.log(`🔄 Added ${sampleAdvanceUrologySOPRules.length} sample rules to Advance Urology SOP`);
      
      // Trigger auto-population
      masterLookupTableService.onRulesAddedToSOP(sopId, loadedSOP.name, sampleAdvanceUrologySOPRules);
      
      // Detect conflicts after adding rules
      console.log(`🔍 Detecting conflicts for SOP: ${loadedSOP.name}`);
      RuleApprovalService.detectConflicts(sopId);
    }
    
    setSOP(loadedSOP);
  }, [sopId]);

  const filterRules = useCallback(() => {
    if (!sop) return;

    let rules = sop.rules;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      rules = rules.filter(rule => {
        const description = rule.description || '';
        const code = rule.code || '';
        const payerGroup = Array.isArray(rule.payer_group) ? rule.payer_group.join(' ') : (rule.payer_group || '');
        
        return rule.rule_id.toLowerCase().includes(searchLower) ||
          description.toLowerCase().includes(searchLower) ||
          code.toLowerCase().includes(searchLower) ||
          (payerGroup || '').toLowerCase().includes(searchLower);
      });
    }

    setFilteredRules(rules);
  }, [sop, searchTerm]);

  useEffect(() => {
    loadSOP();
  }, [sopId, loadSOP]);

  useEffect(() => {
    if (sop) {
      filterRules();
      // Detect conflicts when rules change
      RuleApprovalService.detectConflicts(sopId);
    }
  }, [sop, searchTerm, sopId, filterRules]);

  const handleExport = () => {
    if (!sop) return;

    const csvContent = generateCSV(sop.rules);
    downloadCSV(csvContent, `${sop.name}_rules.csv`);
  };

  const generateCSV = (rules: AdvancedSOPRule[]): string => {
    const headers = [
      'rule_id', 'description', 'status', 'code_group', 'code', 
      'payer_group', 'provider_group', 'action', 'modifiers',
      'source', 'effective_date', 'chart_section', 'documentation_trigger', 'reference'
    ];

    const rows = rules.map(rule => [
      rule.rule_id,
      rule.description,
      rule.status,
      rule.code_group || '',
      rule.code || '',
      rule.payer_group || '',
      rule.provider_group || '',
      Array.isArray(rule.action) ? rule.action.join('|') : (rule.action || ''),
      rule.modifiers?.join('|') || '',
      rule.source || '',
      rule.effective_date || '',
      rule.chart_section || '',
      rule.documentation_trigger || '',
      rule.reference || ''
    ].map(field => `"${String(field).replace(/"/g, '""')}"`));

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Rule Approval Handlers
  const handleApprove = (ruleId: string) => {
    RuleApprovalService.approveRule(sopId, ruleId);
    loadSOP();
  };

  const handleReject = (ruleId: string) => {
    RuleApprovalService.rejectRule(sopId, ruleId);
    loadSOP();
  };

  const handleEdit = (ruleId: string, changes: Partial<SOPRule>) => {
    RuleApprovalService.editRule(sopId, ruleId, changes);
    loadSOP();
  };

  const handleDelete = (ruleId: string) => {
    const count = RuleApprovalService.deleteRejectedRules(sopId);
    console.log(`Deleted ${count} rejected rules`);
    loadSOP();
  };

  const handleViewConflict = (ruleId: string) => {
    const rule = sop?.rules.find(r => r.rule_id === ruleId) as SOPRule | undefined;
    if (rule) {
      setConflictRule(rule);
    }
  };

  const handleConflictResolve = async (conflictId: string, action: 'keep_first' | 'keep_second' | 'keep_both' | 'merge' | 'delete_both') => {
    try {
      console.log(`🔧 SOPDetail: Starting conflict resolution for ${conflictId} with action: ${action}`);
      
      // Call the resolve conflict service
      RuleApprovalService.resolveConflict(sopId, {
        conflictId,
        action,
        timestamp: new Date().toISOString()
      });
      
      console.log(`✅ SOPDetail: RuleApprovalService.resolveConflict completed successfully`);
      
      // Show success message
      toast({
        title: 'Conflict Resolved',
        description: `Successfully resolved conflict using "${action.replace('_', ' ')}" action`,
      });
      
      // Refresh the SOP data
      loadSOP();
      
      // Check if the current rule still has conflicts after resolution
      setTimeout(() => {
        const updatedSOP = SOPManagementService.getSOPById(sopId);
        if (updatedSOP && conflictRule) {
          const updatedRule = updatedSOP.rules.find(r => r.rule_id === conflictRule.rule_id) as SOPRule;
          
          // Log all rule statuses for debugging
          console.log(`📊 Rule statuses after conflict resolution:`);
          updatedSOP.rules.forEach(r => {
            console.log(`   - ${r.rule_id}: ${r.status}`);
          });
          
          if (updatedRule && (!updatedRule.conflicts || updatedRule.conflicts.length === 0)) {
            // No more conflicts for this rule - close the modal
            console.log(`✅ All conflicts resolved for rule ${conflictRule.rule_id} - closing modal`);
            setConflictRule(null);
          } else if (updatedRule && updatedRule.conflicts && updatedRule.conflicts.length > 0) {
            // Still has conflicts - update the conflictRule to show remaining conflicts
            console.log(`⚠️ Rule ${conflictRule.rule_id} still has ${updatedRule.conflicts.length} conflicts - keeping modal open`);
            setConflictRule(updatedRule);
          }
        }
      }, 100); // Small delay to ensure SOP data is updated
      
      console.log(`✅ Conflict resolution completed successfully`);
    } catch (error) {
      console.error('❌ Error resolving conflict:', error);
      toast({
        title: 'Error',
        description: 'Failed to resolve conflict. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleApproveTag = (tag: string) => {
    // Tag approval logic - mark as approved in lookup tables
    console.log('Approving tag:', tag);
    loadSOP();
  };

  const handleRejectTag = (tag: string) => {
    // Tag rejection logic
    console.log('Rejecting tag:', tag);
    loadSOP();
  };

  const handleExportCSV = () => {
    if (!sop || !sopLookupTable) {
      toast({
        title: 'Export Error',
        description: 'No lookup table data available to export',
        variant: 'destructive'
      });
      return;
    }

    try {
      console.log('🔄 Exporting SOP lookup table to CSV...');
      
      // Prepare CSV data
      const csvData: string[][] = [];
      
      // Add header
      csvData.push(['Type', 'Tag/Code', 'Name/Description', 'Details', 'Usage Count']);
      
      // Add Code Groups
      sopLookupTable.codeGroups.forEach(group => {
        csvData.push([
          'Code Group',
          group.tag,
          group.purpose || '',
          `Type: ${group.type}, Expands to: ${group.expands_to?.join(', ') || 'N/A'}`,
          group.usage_count?.toString() || '0'
        ]);
      });
      
      // Add Individual Codes
      sopLookupTable.codes.forEach(code => {
        csvData.push([
          'Individual Code',
          code.code,
          code.description || '',
          `Type: ${code.type}, Group: ${code.code_group || 'N/A'}`,
          '1' // Individual codes don't have usage_count in the interface
        ]);
      });
      
      // Add Payer Groups
      sopLookupTable.payerGroups.forEach(payer => {
        csvData.push([
          'Payer Group',
          payer.tag,
          payer.name || '',
          `Type: ${payer.type || 'N/A'}`,
          payer.usage_count?.toString() || '0'
        ]);
      });
      
      // Add Provider Groups
      sopLookupTable.providerGroups.forEach(provider => {
        csvData.push([
          'Provider Group',
          provider.tag,
          provider.name || '',
          provider.description || '',
          provider.usage_count?.toString() || '0'
        ]);
      });
      
      // Add Action Tags
      sopLookupTable.actionTags.forEach(action => {
        csvData.push([
          'Action Tag',
          action.tag,
          action.description || '',
          `Syntax: ${action.syntax || 'N/A'}`,
          action.usage_count?.toString() || '0'
        ]);
      });
      
      // Add Chart Sections
      sopLookupTable.chartSections.forEach(section => {
        csvData.push([
          'Chart Section',
          section.tag,
          section.name || '',
          section.description || '',
          section.usage_count?.toString() || '0'
        ]);
      });
      
      // Convert to CSV string
      const csvContent = csvData.map(row => 
        row.map(cell => `"${cell.replace(/"/g, '""')}"`)
          .join(',')
      ).join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${sop.name.replace(/[^a-zA-Z0-9]/g, '_')}_lookup_table.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Export Successful',
        description: `Lookup table exported as CSV with ${csvData.length - 1} entries`,
      });
      
      console.log(`✅ Successfully exported ${csvData.length - 1} lookup table entries to CSV`);
      
    } catch (error) {
      console.error('❌ Error exporting CSV:', error);
      toast({
        title: 'Export Error',
        description: 'Failed to export lookup table. Please try again.',
        variant: 'destructive'
      });
    }
  };

  if (!sop) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{sop.name}</h1>
            <p className="text-gray-500 mt-1">{sop.rules.length} rules • {sop.rules.filter(r => r.status === 'active').length} active</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => setShowCreateManualRule(true)}
            variant="default"
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Manual Rule
          </Button>
          <Button 
            onClick={() => setShowUpdateDocuments(true)}
            variant="default"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Upload className="h-4 w-4 mr-2" />
            Update Documents
          </Button>
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Rules
          </Button>
        </div>
      </div>

      {/* SOP Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Organisation</p>
                <p className="font-medium">{sop.organisation_name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Department</p>
                <p className="font-medium">{sop.department}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="font-medium">{new Date(sop.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Created By</p>
                <p className="font-medium">{sop.created_by}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rules Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>SOP Rules</CardTitle>
            </div>
            <div className="flex items-center gap-3">
              {/* SOP-Specific Lookup Table Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowSOPLookupTable(true);
                }}
                className="flex items-center gap-2"
              >
                <Tag className="h-4 w-4" />
                Lookup Tables
              </Button>
              
              {/* New Tags Button */}
              {(() => {
                const newTags = RuleApprovalService.getNewTags(sopId);
                const newTagsCount = newTags.reduce((count, tag) => {
                  return count + (tag.status === 'pending' ? 1 : 0);
                }, 0);
                
                // Always show button for testing (remove this condition in production)
                const showButton = newTags.length > 0;
                
                return showButton ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowNewTags(true);
                    }}
                    className="flex items-center gap-2 bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100"
                  >
                    <Tag className="h-4 w-4" />
                    New Tags ({newTagsCount > 0 ? newTagsCount : newTags.length})
                  </Button>
                ) : null;
              })()}
              
              {/* Conflict Detection */}
              <ConflictDetection 
                rules={filteredRules}
                onRuleClick={(ruleId) => {
                  handleViewConflict(ruleId);
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <IntegratedRulesView 
            rules={filteredRules}
            searchTerm={searchTerm}
            onRulesUpdate={(updatedRules) => {
              if (sop) {
                setSOP({ ...sop, rules: updatedRules });
              }
            }}
            onApprove={handleApprove}
            onReject={handleReject}
            onEdit={(ruleId) => {
              const rule = sop.rules.find(r => r.rule_id === ruleId);
              if (rule) {
                setEditingRule(rule as SOPRule);
              }
            }}
            onDelete={handleDelete}
            onViewConflict={handleViewConflict}
          />
        </CardContent>
      </Card>

      {/* Update Documents Modal */}
      {showUpdateDocuments && sop && (
        <UpdateDocuments
          sopId={sop.id}
          sopName={sop.name}
          onClose={() => setShowUpdateDocuments(false)}
          onSuccess={() => {
            setShowUpdateDocuments(false);
            loadSOP(); // Refresh SOP data
          }}
        />
      )}

      {/* Create Manual Rule Modal */}
      {showCreateManualRule && sop && (
        <CreateManualRule
          sopId={sop.id}
          sopName={sop.name}
          onClose={() => setShowCreateManualRule(false)}
          onSuccess={(newRule) => {
            setShowCreateManualRule(false);
            loadSOP(); // Refresh SOP data
            console.log('New manual rule created:', newRule);
          }}
        />
      )}

      {/* Rule Edit Modal */}
      {editingRule && (
        <RuleEditModal
          rule={editingRule}
          isOpen={!!editingRule}
          onClose={() => setEditingRule(null)}
          onSave={(updatedRule) => {
            handleEdit(updatedRule.rule_id, updatedRule);
            setEditingRule(null);
          }}
        />
      )}

      {/* Conflict Resolution Modal */}
      {conflictRule && (
        <ConflictResolutionModal
          rule={conflictRule}
          isOpen={!!conflictRule}
          onClose={() => setConflictRule(null)}
          onResolve={handleConflictResolve}
          allRules={sop.rules as SOPRule[]}
        />
      )}

      {/* New Tags Viewer */}
      <NewTagsViewer
        newTags={RuleApprovalService.getNewTags(sopId)}
        isOpen={showNewTags}
        onClose={() => setShowNewTags(false)}
        onApproveTag={handleApproveTag}
        onRejectTag={handleRejectTag}
      />

      {/* SOP Lookup Table Modal */}
      {showSOPLookupTable && sop && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <Tag className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">{sop.name} - Lookup Tables</h2>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowSOPLookupTable(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <SOPSpecificLookupTable
                sopId={sopId}
                sopName={sop.name}
                rules={sop.rules}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
