import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Calendar,
  User,
  FileText,
  Target,
  Clock
} from 'lucide-react';
import { AdvancedSOPRule } from '@/types/advanced';

interface EnhancedRulesTableProps {
  rules: AdvancedSOPRule[];
  searchTerm?: string;
}

export const EnhancedRulesTable = ({ rules, searchTerm = '' }: EnhancedRulesTableProps) => {
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

  const getStatusBadge = (status: AdvancedSOPRule['status']) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      reviewed: 'bg-blue-100 text-blue-800 border-blue-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      active: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      needs_definition: 'bg-orange-100 text-orange-800 border-orange-200'
    };

    return (
      <Badge className={`${variants[status]} text-xs font-medium`}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getActionBadge = (action: string | string[]) => {
    const actionArray = Array.isArray(action) ? action : [action];
    
    const getActionColor = (act: string) => {
      const colors = {
        'ADD': 'bg-green-500 text-white',
        'REMOVE': 'bg-red-500 text-white',
        'require_prior_auth': 'bg-orange-500 text-white',
        'deny': 'bg-red-600 text-white',
        'approve': 'bg-green-600 text-white',
        'review': 'bg-blue-500 text-white'
      };
      return colors[act as keyof typeof colors] || 'bg-gray-500 text-white';
    };

    return (
      <div className="flex flex-wrap gap-1">
        {actionArray.map((act, index) => (
          <Badge key={index} className={`${getActionColor(act)} text-xs font-medium`}>
            {act.replace('_', ' ')}
          </Badge>
        ))}
      </div>
    );
  };

  const getPayerBadges = (payerGroup: string | string[]) => {
    const payers = Array.isArray(payerGroup) ? payerGroup : [payerGroup];
    
    return (
      <div className="flex flex-wrap gap-1">
        {payers.map((payer, index) => (
          <Badge key={index} className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
            {payer}
          </Badge>
        ))}
      </div>
    );
  };

  const getProviderBadges = (providerGroup: string | string[]) => {
    const providers = Array.isArray(providerGroup) ? providerGroup : [providerGroup];
    
    return (
      <div className="flex flex-wrap gap-1">
        {providers.map((provider, index) => (
          <Badge key={index} className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
            {provider}
          </Badge>
        ))}
      </div>
    );
  };

  const getCodeBadges = (code: string) => {
    // Split codes if multiple
    const codes = code.includes(',') ? code.split(',').map(c => c.trim()) : [code];
    
    return (
      <div className="flex flex-wrap gap-1">
        {codes.map((codeItem, index) => (
          <Badge key={index} className="bg-gray-100 text-gray-800 border-gray-200 text-xs font-mono">
            {codeItem}
          </Badge>
        ))}
      </div>
    );
  };

  const renderDescription = (rule: AdvancedSOPRule) => {
    if (!rule.description) return <span className="text-gray-500 italic">No description</span>;
    
    let description = rule.description;
    
    // Replace payer tags with colored badges
    const payerTags = [
      { tag: '@BCBS', display: 'BCBS', color: 'bg-blue-500 text-white' },
      { tag: '@ANTHEM', display: 'ANTHEM', color: 'bg-blue-500 text-white' },
      { tag: '@MEDICAID', display: 'MEDICAID', color: 'bg-blue-500 text-white' },
      { tag: '@MEDICARE', display: 'MEDICARE', color: 'bg-blue-500 text-white' }
    ];
    
    payerTags.forEach(({ tag, display, color }) => {
      if (description.includes(tag)) {
        description = description.replace(
          new RegExp(tag, 'g'), 
          `<span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium ${color} mx-1">${display}</span>`
        );
      }
    });

    // Replace action tags with colored badges
    const actionTags = [
      { tag: 'ADD modifier 25', color: 'bg-green-500 text-white' },
      { tag: 'REMOVE modifier 25', color: 'bg-red-500 text-white' },
      { tag: 'ADD modifier 95', color: 'bg-green-500 text-white' },
      { tag: 'REMOVE modifier 95', color: 'bg-red-500 text-white' }
    ];
    
    actionTags.forEach(({ tag, color }) => {
      if (description.includes(tag)) {
        description = description.replace(
          new RegExp(tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 
          `<span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium ${color} mx-1">${tag}</span>`
        );
      }
    });

    return (
      <div 
        className="text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: description }}
      />
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
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 border-b">
            <TableHead className="w-12 text-gray-600"></TableHead>
            <TableHead className="w-32 font-semibold text-gray-700">Rule ID</TableHead>
            <TableHead className="font-semibold text-gray-700">Description</TableHead>
            <TableHead className="w-32 font-semibold text-gray-700">Code Group</TableHead>
            <TableHead className="w-40 font-semibold text-gray-700">Provider Group</TableHead>
            <TableHead className="w-32 font-semibold text-gray-700">Payer Group</TableHead>
            <TableHead className="w-32 font-semibold text-gray-700">Action</TableHead>
            <TableHead className="w-24 font-semibold text-gray-700">Status</TableHead>
            <TableHead className="w-32 font-semibold text-gray-700">Last Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRules.map((rule) => (
            <Collapsible key={rule.rule_id} open={expandedRows.has(rule.rule_id)}>
              <CollapsibleTrigger asChild>
                <TableRow 
                  className="cursor-pointer hover:bg-gray-50 transition-colors border-b"
                  onClick={() => toggleRow(rule.rule_id)}
                >
                  <TableCell className="text-center">
                    {expandedRows.has(rule.rule_id) ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm font-medium text-blue-600">
                    {rule.rule_id}
                  </TableCell>
                  <TableCell className="max-w-md">
                    {renderDescription(rule)}
                  </TableCell>
                  <TableCell>
                    {getCodeBadges(rule.code)}
                  </TableCell>
                  <TableCell>
                    {getProviderBadges(rule.provider_group)}
                  </TableCell>
                  <TableCell>
                    {getPayerBadges(rule.payer_group)}
                  </TableCell>
                  <TableCell>
                    {getActionBadge(rule.action)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(rule.status)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {rule.effective_date ? new Date(rule.effective_date).toLocaleDateString() : 'N/A'}
                  </TableCell>
                </TableRow>
              </CollapsibleTrigger>
              
              <CollapsibleContent asChild>
                <TableRow className="bg-gray-50/50">
                  <TableCell colSpan={9} className="p-0">
                    <div className="p-6 space-y-4 border-t bg-white">
                      {/* Metadata Section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Effective Date
                          </h4>
                          <p className="text-sm">{rule.effective_date || 'Not specified'}</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Triggers
                          </h4>
                          <p className="text-sm">{rule.documentation_trigger || 'Not specified'}</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            End Date
                          </h4>
                          <p className="text-sm">{rule.end_date || '2025-12-31'}</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Chart Section
                          </h4>
                          <p className="text-sm">{rule.chart_section || 'ASSESSMENT_PLAN'}</p>
                        </div>
                      </div>

                      {/* Additional Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm text-gray-700">Chart ID</h4>
                          <p className="text-sm font-mono">#{rule.rule_id.replace(/-/g, '')}</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm text-gray-700">Source</h4>
                          <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                            {rule.source?.toUpperCase() || 'AI'}
                          </Badge>
                        </div>
                      </div>

                      {/* Query Thread Section */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-gray-700">Query Thread</h4>
                        <p className="text-sm text-blue-600">2 open queries</p>
                      </div>

                      {/* Change History */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-gray-700">Change History</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Last updated: {rule.effective_date ? new Date(rule.effective_date).toLocaleDateString() : new Date().toLocaleDateString()} • 02:45</p>
                          <p className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            Updated by: Sarah Chen
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2 border-t">
                        <Button variant="outline" size="sm" className="gap-2">
                          <Edit className="h-3 w-3" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Copy className="h-3 w-3" />
                          Duplicate
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2 text-red-600 hover:text-red-700">
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </TableBody>
      </Table>

      {filteredRules.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No rules found</p>
          {searchTerm && (
            <p className="text-sm mt-2">Try adjusting your search terms</p>
          )}
        </div>
      )}
    </div>
  );
};
