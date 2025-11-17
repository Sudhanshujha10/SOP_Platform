import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle2, 
  XCircle, 
  Edit, 
  Search,
  Filter,
  Download,
  AlertTriangle
} from 'lucide-react';
import { AdvancedSOPRule } from '@/types/advanced';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface BatchReviewProps {
  rules: AdvancedSOPRule[];
  onApprove: (ruleIds: string[]) => void;
  onReject: (ruleIds: string[]) => void;
  onEdit: (rule: AdvancedSOPRule) => void;
  onImportToSOP: (rules: AdvancedSOPRule[]) => void;
}

export const BatchReview = ({ rules, onApprove, onReject, onEdit, onImportToSOP }: BatchReviewProps) => {
  const [selectedRules, setSelectedRules] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [editingRule, setEditingRule] = useState<AdvancedSOPRule | null>(null);

  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.rule_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || rule.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const toggleSelectRule = (ruleId: string) => {
    const newSelected = new Set(selectedRules);
    if (newSelected.has(ruleId)) {
      newSelected.delete(ruleId);
    } else {
      newSelected.add(ruleId);
    }
    setSelectedRules(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedRules.size === filteredRules.length) {
      setSelectedRules(new Set());
    } else {
      setSelectedRules(new Set(filteredRules.map(r => r.rule_id)));
    }
  };

  const handleBatchApprove = () => {
    onApprove(Array.from(selectedRules));
    setSelectedRules(new Set());
  };

  const handleBatchReject = () => {
    onReject(Array.from(selectedRules));
    setSelectedRules(new Set());
  };

  const handleImport = () => {
    const approvedRules = rules.filter(r => r.status === 'approved');
    onImportToSOP(approvedRules);
  };

  const getConfidenceBadge = (confidence?: number) => {
    if (!confidence) return null;
    
    if (confidence >= 80) {
      return <Badge className="bg-green-100 text-green-800">High: {confidence}%</Badge>;
    } else if (confidence >= 60) {
      return <Badge className="bg-yellow-100 text-yellow-800">Medium: {confidence}%</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">Low: {confidence}%</Badge>;
    }
  };

  const stats = {
    total: rules.length,
    pending: rules.filter(r => r.status === 'pending').length,
    approved: rules.filter(r => r.status === 'approved').length,
    rejected: rules.filter(r => r.status === 'rejected').length,
    needsReview: rules.filter(r => r.validation_status === 'warning' || r.validation_status === 'error').length
  };

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Batch Review - {stats.total} Rules Extracted</CardTitle>
              <CardDescription>
                Review and approve rules before importing to SOP
              </CardDescription>
            </div>
            <Button 
              onClick={handleImport}
              disabled={stats.approved === 0}
              size="lg"
            >
              <Download className="h-4 w-4 mr-2" />
              Import {stats.approved} Approved Rules
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Rules</div>
            </div>
            <div className="text-center p-4 border rounded-lg bg-yellow-50">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="text-center p-4 border rounded-lg bg-green-50">
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <div className="text-sm text-gray-600">Approved</div>
            </div>
            <div className="text-center p-4 border rounded-lg bg-red-50">
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <div className="text-sm text-gray-600">Rejected</div>
            </div>
            <div className="text-center p-4 border rounded-lg bg-orange-50">
              <div className="text-2xl font-bold text-orange-600">{stats.needsReview}</div>
              <div className="text-sm text-gray-600">Needs Review</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search rules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>
            </Tabs>
            {selectedRules.size > 0 && (
              <div className="flex gap-2">
                <Button onClick={handleBatchApprove} size="sm">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve ({selectedRules.size})
                </Button>
                <Button onClick={handleBatchReject} variant="destructive" size="sm">
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject ({selectedRules.size})
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rules List */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            {/* Select All */}
            <div className="flex items-center gap-2 p-3 border-b">
              <Checkbox
                checked={selectedRules.size === filteredRules.length && filteredRules.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm font-medium">
                Select All ({filteredRules.length} rules)
              </span>
            </div>

            {/* Rule Items */}
            {filteredRules.map((rule) => (
              <div
                key={rule.rule_id}
                className={`border rounded-lg p-4 ${
                  rule.status === 'approved' ? 'bg-green-50 border-green-200' :
                  rule.status === 'rejected' ? 'bg-red-50 border-red-200' :
                  rule.validation_status === 'error' ? 'bg-red-50 border-red-200' :
                  rule.validation_status === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedRules.has(rule.rule_id)}
                    onCheckedChange={() => toggleSelectRule(rule.rule_id)}
                    className="mt-1"
                  />
                  
                  <div className="flex-1 space-y-2">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium">{rule.rule_id}</span>
                          {rule.status === 'approved' && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Approved
                            </Badge>
                          )}
                          {rule.status === 'rejected' && (
                            <Badge className="bg-red-100 text-red-800">
                              <XCircle className="h-3 w-3 mr-1" />
                              Rejected
                            </Badge>
                          )}
                          {rule.status === 'pending' && (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              Pending Review
                            </Badge>
                          )}
                          {getConfidenceBadge(rule.confidence)}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {rule.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingRule(rule)}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => onApprove([rule.rule_id])}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => onReject([rule.rule_id])}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm">{rule.description}</p>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Code:</span>{' '}
                        <span className="font-mono">{rule.code}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Action:</span>{' '}
                        <span className="font-mono">{rule.action}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Payer:</span>{' '}
                        <span className="font-mono">{rule.payer_group}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Provider:</span>{' '}
                        <span className="font-mono">{rule.provider_group}</span>
                      </div>
                      {rule.documentation_trigger && (
                        <div className="col-span-2">
                          <span className="text-gray-600">Triggers:</span>{' '}
                          <span className="text-xs">{rule.documentation_trigger}</span>
                        </div>
                      )}
                    </div>

                    {/* Validation Issues */}
                    {rule.validation_issues && rule.validation_issues.length > 0 && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                          <div className="text-sm space-y-1">
                            {rule.validation_issues.map((issue, idx) => (
                              <div key={idx}>
                                <span className="font-medium">{issue.field}:</span> {issue.message}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredRules.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No rules match your filters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal would go here - simplified for now */}
      {editingRule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Edit Rule: {editingRule.rule_id}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={editingRule.description}
                  onChange={(e) => setEditingRule({...editingRule, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditingRule(null)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  onEdit(editingRule);
                  setEditingRule(null);
                }}>
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
