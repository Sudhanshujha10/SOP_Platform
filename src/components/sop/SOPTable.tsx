import React, { useState } from 'react';
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
  Eye,
  Copy, 
  Edit, 
  Trash2, 
  MessageCircle
} from 'lucide-react';
import { SOPRule, Token } from '@/types/sop';
import { InlineTagRenderer } from './InlineTagRenderer';
import { MetaChips } from './MetaChips';
import { CodeChips } from './CodeChips';
import { RuleDrawer } from './RuleDrawer';
import { getTokenColor } from '@/utils/colorTokens';
import { RuleDetailsModal } from '@/components/RuleDetailsModal';

interface SOPTableProps {
  rules: SOPRule[];
}

export const SOPTable = ({ rules }: SOPTableProps) => {
  const [selectedRule, setSelectedRule] = useState<SOPRule | null>(null);
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
      case 'Review':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Review</Badge>;
      case 'Retired':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Retired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleRowClick = (rule: SOPRule) => {
    setSelectedRule(rule);
    setIsModalOpen(true);
  };

  const handleExpandRow = (rule: SOPRule) => {
    if (expandedRuleId === rule.rule_id) {
      setExpandedRuleId(null);
    } else {
      setExpandedRuleId(rule.rule_id);
    }
  };

  const handleTagClick = (token: Token) => {
    console.log('Tag clicked:', token);
    // TODO: Implement filter by tag
  };

  const handleMetaChipClick = (type: string, value: string) => {
    console.log('Meta chip clicked:', type, value);
    // TODO: Implement filter by meta
  };

  const handleCodeClick = (code: string) => {
    console.log('Code clicked:', code);
    // TODO: Implement filter by code
  };

  const handleAddQuery = (ruleId: string) => {
    console.log('Add query for rule:', ruleId);
    // TODO: Implement add query functionality
  };

  const formatLastUpdated = (dateTime: string) => {
    const date = new Date(dateTime);
    const dateStr = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    return `${dateStr} · ${timeStr}`;
  };

  const renderActionChips = (actions: string | string[]) => {
    const actionArray = Array.isArray(actions) ? actions : [actions];
    return (
      <div className="flex gap-1 whitespace-nowrap">
        {actionArray.map((action, index) => (
          <Badge
            key={index}
            className="text-xs inline-flex whitespace-nowrap"
            style={{ 
              backgroundColor: getTokenColor('action', action),
              color: 'white'
            }}
          >
            {action}
          </Badge>
        ))}
      </div>
    );
  };

  const renderPayerChips = (payers: string | string[]) => {
    const payerArray = Array.isArray(payers) ? payers : [payers];
    return (
      <div className="flex flex-wrap gap-1">
        {payerArray.map((payer, index) => (
          <Badge
            key={index}
            className="text-xs inline-block"
            style={{ 
              backgroundColor: getTokenColor('payer'),
              color: 'white'
            }}
          >
            {payer}
          </Badge>
        ))}
      </div>
    );
  };

  const renderProviderChips = (providers: string | string[]) => {
    const providerArray = Array.isArray(providers) ? providers : [providers];
    return (
      <div className="flex flex-wrap gap-1">
        {providerArray.map((provider, index) => (
          <Badge
            key={index}
            className="text-xs inline-block"
            style={{ 
              backgroundColor: getTokenColor('provider'),
              color: 'white'
            }}
          >
            {provider}
          </Badge>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead style={{ width: '120px' }}>Rule ID</TableHead>
              <TableHead style={{ width: '60%' }}>Description</TableHead>
              <TableHead style={{ width: '180px' }}>Code Group</TableHead>
              <TableHead style={{ width: '120px' }}>Provider Group</TableHead>
              <TableHead style={{ width: '160px' }}>Payer Group</TableHead>
              <TableHead style={{ width: '180px' }}>Action</TableHead>
              <TableHead style={{ width: '100px' }}>Status</TableHead>
              <TableHead style={{ width: '180px' }}>Last Updated</TableHead>
              <TableHead style={{ width: '120px' }}>⋯ Quick Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule) => (
              <React.Fragment key={rule.rule_id}>
                <TableRow 
                  className="hover:bg-blue-50 dark:hover:bg-blue-950 cursor-pointer transition-colors"
                  onClick={() => handleRowClick(rule)}
                >
                  <TableCell className="align-top">
                    <div className="whitespace-nowrap">
                      <p className="font-mono text-sm font-medium text-primary">{rule.rule_id}</p>
                    </div>
                  </TableCell>
                  
                  <TableCell className="align-top">
                    <div className="flex items-center justify-between group">
                      <div className="flex-1">
                        <InlineTagRenderer 
                          description={rule.raw_description}
                          tokens={rule.tokens}
                          onTagClick={handleTagClick}
                        />
                        <MetaChips 
                          meta={rule.meta}
                          onChipClick={handleMetaChipClick}
                        />
                      </div>
                      <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Click to view all
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell className="align-top">
                    <div className="whitespace-nowrap">
                      {rule.codes_selected && rule.codes_selected.length > 0 ? (
                        <CodeChips codes_selected={rule.codes_selected} />
                      ) : (
                        <Badge
                          className="text-xs"
                          style={{ 
                            backgroundColor: getTokenColor('code_group'),
                            color: 'white'
                          }}
                        >
                          {rule.tokens.find(t => t.type === 'code_group')?.value || 'Code Group'}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell className="align-top">
                    {renderProviderChips(rule.provider_group)}
                  </TableCell>
                  
                  <TableCell className="align-top">
                    {renderPayerChips(rule.payer_group)}
                  </TableCell>
                  
                  <TableCell className="align-top">
                    {renderActionChips(rule.action)}
                  </TableCell>
                  
                  <TableCell className="align-top">
                    {getStatusBadge(rule.status)}
                  </TableCell>
                  
                  <TableCell className="align-top">
                    <div className="whitespace-nowrap">
                      <p className="text-sm font-medium" title={rule.meta.updated_by}>
                        {formatLastUpdated(rule.meta.last_updated)} · {rule.meta.updated_by}
                      </p>
                    </div>
                  </TableCell>
                  
                  <TableCell className="align-top">
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExpandRow(rule);
                        }}
                        title="Expand/Collapse"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                        title="Duplicate Rule"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                        title="Edit Rule"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                        title="Delete Rule"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="relative">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => e.stopPropagation()}
                          title={`Queries (${rule.query_count})`}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        {rule.query_count > 0 && (
                          <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-destructive text-destructive-foreground text-xs font-bold border border-background">
                            {rule.query_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
                {expandedRuleId === rule.rule_id && selectedRule && (
                  <TableRow key={`${rule.rule_id}-expanded`}>
                    <TableCell colSpan={9} className="p-0">
                      <div className="border-t bg-muted/20 p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Left Pane */}
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2">Full Description</h4>
                              <InlineTagRenderer 
                                description={selectedRule.raw_description}
                                tokens={selectedRule.tokens}
                              />
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Code Groups</h4>
                              <CodeChips codes_selected={selectedRule.codes_selected} />
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Meta Information</h4>
                              <MetaChips meta={selectedRule.meta} />
                            </div>
                          </div>
                          
                          {/* Right Pane */}
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2">Query Thread</h4>
                              <div className="text-sm text-muted-foreground">
                                {selectedRule.query_count > 0 ? (
                                  <p>{selectedRule.query_count} open queries</p>
                                ) : (
                                  <p>No open queries</p>
                                )}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Change History</h4>
                              <div className="text-sm text-muted-foreground">
                                <p>Last updated: {formatLastUpdated(selectedRule.meta.last_updated)}</p>
                                <p>Updated by: {selectedRule.meta.updated_by}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Rule Details Modal */}
      <RuleDetailsModal
        rule={selectedRule}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};