import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Filter,
  Download,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye
} from 'lucide-react';
import { AdvancedSOPRule, RuleFilter } from '@/types/advanced';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RuleDetailsModal } from '@/components/RuleDetailsModal';
import { AccordionSOPManagement } from '@/components/sop/AccordionSOPManagement';
import { LayoutGrid, List } from 'lucide-react';

interface SOPManagementProps {
  rules: AdvancedSOPRule[];
  onEdit: (rule: AdvancedSOPRule) => void;
  onDelete: (ruleIds: string[]) => void;
  onExport: () => void;
  onCreateNew: () => void;
}

export const SOPManagement = ({ rules, onEdit, onDelete, onExport, onCreateNew }: SOPManagementProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRules, setSelectedRules] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<RuleFilter>({});
  const [sortField, setSortField] = useState<keyof AdvancedSOPRule>('rule_id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedRule, setSelectedRule] = useState<AdvancedSOPRule | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'accordion'>('accordion');

  // Apply filters and search
  const filteredRules = rules.filter(rule => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const description = rule.description || '';
      const code = rule.code || '';
      const payerGroup = Array.isArray(rule.payer_group) ? rule.payer_group.join(' ') : rule.payer_group;
      
      const matchesSearch = 
        rule.rule_id.toLowerCase().includes(searchLower) ||
        description.toLowerCase().includes(searchLower) ||
        code.toLowerCase().includes(searchLower) ||
        payerGroup.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(rule.status)) return false;
    }

    // Validation status filter
    if (filters.validation_status && filters.validation_status.length > 0) {
      if (!filters.validation_status.includes(rule.validation_status)) return false;
    }

    // Source filter
    if (filters.source && filters.source.length > 0) {
      if (!filters.source.includes(rule.source)) return false;
    }

    return true;
  });

  // Sort rules
  const sortedRules = [...filteredRules].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    
    if (aVal === undefined) return 1;
    if (bVal === undefined) return -1;
    
    const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortDirection === 'asc' ? comparison : -comparison;
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
    if (selectedRules.size === sortedRules.length) {
      setSelectedRules(new Set());
    } else {
      setSelectedRules(new Set(sortedRules.map(r => r.rule_id)));
    }
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
      <Badge className={variants[status]}>
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

  const stats = {
    total: rules.length,
    active: rules.filter(r => r.status === 'active').length,
    pending: rules.filter(r => r.status === 'pending').length,
    needsReview: rules.filter(r => r.validation_status === 'warning' || r.validation_status === 'error').length
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SOP Management</h1>
          <p className="text-gray-500 mt-1">
            {stats.total} total rules • {stats.active} active • {stats.pending} pending
            {stats.needsReview > 0 && ` • ${stats.needsReview} need review`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={onCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Create Rule
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search rules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Tabs 
              value={filters.status?.[0] || 'all'} 
              onValueChange={(v) => setFilters({...filters, status: v === 'all' ? undefined : [v as any]})}
            >
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="needs_definition">Needs Review</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <Button
                variant={viewMode === 'accordion' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('accordion')}
                className="h-8"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="h-8"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>

            {selectedRules.size > 0 && viewMode === 'table' && (
              <Button
                variant="destructive"
                onClick={() => {
                  onDelete(Array.from(selectedRules));
                  setSelectedRules(new Set());
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete ({selectedRules.size})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content - Accordion or Table View */}
      {viewMode === 'accordion' ? (
        <AccordionSOPManagement
          rules={sortedRules}
          onEdit={onEdit}
          onDelete={(rule) => onDelete([rule.rule_id])}
          onDuplicate={(rule) => console.log('Duplicate', rule)}
        />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="border rounded-lg overflow-hidden">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedRules.size === sortedRules.length && sortedRules.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Rule ID</TableHead>
                  <TableHead>Code Group</TableHead>
                  <TableHead>Payer Group</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Effective Date</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRules.map((rule) => (
                  <TableRow 
                    key={rule.rule_id}
                    className="hover:bg-blue-50 dark:hover:bg-blue-950 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedRule(rule);
                      setIsModalOpen(true);
                    }}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedRules.has(rule.rule_id)}
                        onCheckedChange={() => toggleSelectRule(rule.rule_id)}
                      />
                    </TableCell>
                    <TableCell>
                      {getStatusIcon(rule)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{rule.rule_id}</TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{rule.code_group || rule.code}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{rule.payer_group}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">{rule.action}</span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(rule.status)}
                    </TableCell>
                    <TableCell>
                      {getSourceBadge(rule.source)}
                    </TableCell>
                    <TableCell className="text-sm">{rule.effective_date}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onEdit(rule);
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRule(rule);
                            setIsModalOpen(true);
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete([rule.rule_id]);
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {sortedRules.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No rules found</p>
                <p className="text-sm">Try adjusting your filters or search term</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      )}

      {/* Rule Details Modal */}
      <RuleDetailsModal
        rule={selectedRule}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
