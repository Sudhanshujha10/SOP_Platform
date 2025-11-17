import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Edit, 
  Save, 
  X,
  Plus,
  Code,
  Users,
  Building,
  Zap,
  FileText
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { masterLookupTableService, NewTag } from '@/services/masterLookupTableService';
import { EnhancedLookupTables, LookupSearchResult } from '@/types/lookupTable';
import { useToast } from '@/hooks/use-toast';

interface MainLookupTableManagerProps {
  onTagUpdate?: (type: string, tag: string, updates: any) => void;
}

export const MainLookupTableManager: React.FC<MainLookupTableManagerProps> = ({
  onTagUpdate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<LookupSearchResult[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [editingTag, setEditingTag] = useState<{ type: string; tag: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [lookupTables, setLookupTables] = useState<EnhancedLookupTables | null>(null);
  const [newTags, setNewTags] = useState<NewTag[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Load initial lookup tables
    const tables = masterLookupTableService.getMainLookupTables();
    setLookupTables(tables);
    
    // Load new tags
    const allNewTags = masterLookupTableService.getAllNewTags();
    setNewTags(allNewTags);
  }, []);

  // Handle search with auto-suggestions
  useEffect(() => {
    if (searchTerm.trim()) {
      const results = masterLookupTableService.searchLookupTables(searchTerm, 20);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const startEdit = (type: string, tag: string, field: string, currentValue: string) => {
    setEditingTag({ type, tag, field });
    setEditValue(currentValue);
  };

  const saveEdit = () => {
    if (!editingTag) return;

    const updates = { [editingTag.field]: editValue };
    const success = masterLookupTableService.updateMainLookupTag(
      editingTag.type, 
      editingTag.tag, 
      updates
    );

    if (success) {
      // Refresh lookup tables
      const updatedTables = masterLookupTableService.getMainLookupTables();
      setLookupTables(updatedTables);
      
      // Notify parent component
      onTagUpdate?.(editingTag.type, editingTag.tag, updates);
      
      toast({
        title: 'Tag Updated',
        description: `${editingTag.tag} has been updated successfully`,
      });
    } else {
      toast({
        title: 'Update Failed',
        description: 'Failed to update the tag',
        variant: 'destructive'
      });
    }

    setEditingTag(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingTag(null);
    setEditValue('');
  };

  const approveNewTag = (tagId: string) => {
    const success = masterLookupTableService.approveNewTag(tagId);
    if (success) {
      // Refresh data
      const updatedTables = masterLookupTableService.getMainLookupTables();
      setLookupTables(updatedTables);
      
      const updatedNewTags = masterLookupTableService.getAllNewTags();
      setNewTags(updatedNewTags);
      
      toast({
        title: 'Tag Approved',
        description: 'New tag has been added to the main lookup table',
      });
    }
  };

  const rejectNewTag = (tagId: string) => {
    const success = masterLookupTableService.rejectNewTag(tagId);
    if (success) {
      const updatedNewTags = masterLookupTableService.getAllNewTags();
      setNewTags(updatedNewTags);
      
      toast({
        title: 'Tag Rejected',
        description: 'New tag has been rejected',
      });
    }
  };

  const renderEditableField = (type: string, tag: string, field: string, value: string, label: string) => {
    const isEditing = editingTag?.type === type && editingTag?.tag === tag && editingTag?.field === field;
    
    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit();
              if (e.key === 'Escape') cancelEdit();
            }}
          />
          <Button size="sm" onClick={saveEdit}>
            <Save className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={cancelEdit}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between group">
        <div>
          <span className="font-medium">{label}: </span>
          <span>{value}</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="opacity-0 group-hover:opacity-100"
          onClick={() => startEdit(type, tag, field, value)}
        >
          <Edit className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  if (!lookupTables) {
    return <div>Loading lookup tables...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Main Lookup Table</h1>
          <p className="text-muted-foreground">
            Manage all tags, code groups, and reference data used by the LLM
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {lookupTables.codeGroups.length + lookupTables.payerGroups.length + 
             lookupTables.providerGroups.length + lookupTables.actionTags.length + 
             lookupTables.chartSections.length} Total Tags
          </Badge>
          {newTags.filter(t => t.status === 'PENDING_REVIEW').length > 0 && (
            <Badge variant="destructive">
              {newTags.filter(t => t.status === 'PENDING_REVIEW').length} Pending Review
            </Badge>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by tag name, code, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
              <h4 className="font-medium text-sm text-muted-foreground">Search Results:</h4>
              {searchResults.map((result, index) => (
                <div key={index} className="p-3 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{result.display}</div>
                      <div className="text-sm text-muted-foreground">{result.description}</div>
                      {result.expands_to && result.expands_to.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Codes: {result.expands_to.join(', ')}
                        </div>
                      )}
                    </div>
                    <Badge variant="outline">{result.type}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Tags Section */}
      {newTags.filter(t => t.status === 'PENDING_REVIEW').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              New Tags Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {newTags.filter(t => t.status === 'PENDING_REVIEW').map((tag) => (
                <div key={tag.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{tag.tag}</div>
                    <div className="text-sm text-muted-foreground">{tag.description}</div>
                    <div className="text-xs text-muted-foreground">
                      From SOP: {tag.sopName} • Type: {tag.type}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => approveNewTag(tag.id)}>
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => rejectNewTag(tag.id)}>
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Code Groups */}
      <Card>
        <Collapsible 
          open={expandedSections.has('codeGroups')} 
          onOpenChange={() => toggleSection('codeGroups')}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Code Groups ({lookupTables.codeGroups.length})
                </div>
                {expandedSections.has('codeGroups') ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="space-y-4">
                {lookupTables.codeGroups.map((codeGroup) => (
                  <div key={codeGroup.tag} className="border rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-lg">{codeGroup.tag}</h4>
                        <Badge variant="outline">{codeGroup.type}</Badge>
                      </div>
                      
                      {renderEditableField('codeGroup', codeGroup.tag, 'purpose', codeGroup.purpose, 'Purpose')}
                      
                      <div>
                        <span className="font-medium">Expands to: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {codeGroup.expands_to.map((code) => (
                            <Badge key={code} variant="secondary" className="text-xs">
                              {code}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        Usage: {codeGroup.usage_count || 0} times • 
                        Created: {new Date(codeGroup.created_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Payer Groups */}
      <Card>
        <Collapsible 
          open={expandedSections.has('payerGroups')} 
          onOpenChange={() => toggleSection('payerGroups')}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Payer Groups ({lookupTables.payerGroups.length})
                </div>
                {expandedSections.has('payerGroups') ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="space-y-4">
                {lookupTables.payerGroups.map((payerGroup) => (
                  <div key={payerGroup.tag} className="border rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-lg">{payerGroup.tag}</h4>
                        <Badge variant="outline">{payerGroup.type}</Badge>
                      </div>
                      
                      {renderEditableField('payerGroup', payerGroup.tag, 'name', payerGroup.name, 'Name')}
                      
                      <div className="text-sm text-muted-foreground">
                        Usage: {payerGroup.usage_count || 0} times • 
                        Created: {new Date(payerGroup.created_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Provider Groups */}
      <Card>
        <Collapsible 
          open={expandedSections.has('providerGroups')} 
          onOpenChange={() => toggleSection('providerGroups')}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Provider Groups ({lookupTables.providerGroups.length})
                </div>
                {expandedSections.has('providerGroups') ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="space-y-4">
                {lookupTables.providerGroups.map((providerGroup) => (
                  <div key={providerGroup.tag} className="border rounded-lg p-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-lg">{providerGroup.tag}</h4>
                      
                      {renderEditableField('providerGroup', providerGroup.tag, 'name', providerGroup.name, 'Name')}
                      {renderEditableField('providerGroup', providerGroup.tag, 'description', providerGroup.description, 'Description')}
                      
                      <div className="text-sm text-muted-foreground">
                        Usage: {providerGroup.usage_count || 0} times • 
                        Created: {new Date(providerGroup.created_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Action Tags */}
      <Card>
        <Collapsible 
          open={expandedSections.has('actionTags')} 
          onOpenChange={() => toggleSection('actionTags')}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Action Tags ({lookupTables.actionTags.length})
                </div>
                {expandedSections.has('actionTags') ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="space-y-4">
                {lookupTables.actionTags.map((actionTag) => (
                  <div key={actionTag.tag} className="border rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-lg">{actionTag.tag}</h4>
                        <Badge variant="outline">{actionTag.category}</Badge>
                      </div>
                      
                      <div>
                        <span className="font-medium">Syntax: </span>
                        <code className="bg-muted px-2 py-1 rounded text-sm">{actionTag.syntax}</code>
                      </div>
                      
                      {renderEditableField('actionTag', actionTag.tag, 'description', actionTag.description, 'Description')}
                      
                      <div className="text-sm text-muted-foreground">
                        Usage: {actionTag.usage_count || 0} times • 
                        Created: {new Date(actionTag.created_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Chart Sections */}
      <Card>
        <Collapsible 
          open={expandedSections.has('chartSections')} 
          onOpenChange={() => toggleSection('chartSections')}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Chart Sections ({lookupTables.chartSections.length})
                </div>
                {expandedSections.has('chartSections') ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="space-y-4">
                {lookupTables.chartSections.map((chartSection) => (
                  <div key={chartSection.tag} className="border rounded-lg p-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-lg">{chartSection.tag}</h4>
                      
                      {renderEditableField('chartSection', chartSection.tag, 'name', chartSection.name, 'Name')}
                      {renderEditableField('chartSection', chartSection.tag, 'description', chartSection.description, 'Description')}
                      
                      <div className="text-sm text-muted-foreground">
                        Usage: {chartSection.usage_count || 0} times • 
                        Created: {new Date(chartSection.created_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
};
