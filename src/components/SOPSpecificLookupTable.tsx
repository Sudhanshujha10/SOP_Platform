import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Plus,
  Code,
  Users,
  Building,
  Zap,
  FileText,
  Eye
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { masterLookupTableService, NewTag } from '@/services/masterLookupTableService';
import { SOPLookupTable, LookupSearchResult } from '@/types/lookupTable';
import { AdvancedSOPRule } from '@/types/advanced';
import { useToast } from '@/hooks/use-toast';

interface SOPSpecificLookupTableProps {
  sopId: string;
  sopName: string;
  rules: AdvancedSOPRule[];
}

export const SOPSpecificLookupTable: React.FC<SOPSpecificLookupTableProps> = ({
  sopId,
  sopName,
  rules
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<LookupSearchResult[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [sopLookupTable, setSopLookupTable] = useState<SOPLookupTable | null>(null);
  const [newTags, setNewTags] = useState<NewTag[]>([]);
  const [showNewTagsDialog, setShowNewTagsDialog] = useState(false);
  const { toast } = useToast();

  // Generate SOP-specific lookup table
  useEffect(() => {
    const sopTable = masterLookupTableService.generateSOPLookupTable(sopId, sopName, rules);
    setSopLookupTable(sopTable);
    
    // Get new tags for this SOP
    const sopNewTags = masterLookupTableService.getNewTagsForSOP(sopId);
    setNewTags(sopNewTags);
  }, [sopId, sopName, rules]);

  // Extract tags used in this SOP from rules - Enhanced extraction
  const usedTags = useMemo(() => {
    const tags = {
      codeGroups: new Set<string>(),
      payerGroups: new Set<string>(),
      providerGroups: new Set<string>(),
      actionTags: new Set<string>(),
      chartSections: new Set<string>(),
      codes: new Set<string>()
    };

    console.log(`🔍 Analyzing ${rules.length} rules for SOP: ${sopName}`);

    rules.forEach((rule, index) => {
      console.log(`📋 Rule ${index + 1}:`, rule);

      // Code groups - handle multiple formats
      if (rule.code_group) {
        let codeGroupTags: string[] = [];
        if (Array.isArray(rule.code_group)) {
          codeGroupTags = rule.code_group;
        } else if (typeof rule.code_group === 'string') {
          // Split by comma and clean up
          codeGroupTags = rule.code_group.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        }
        codeGroupTags.forEach(tag => {
          if (tag && tag.length > 0) {
            tags.codeGroups.add(tag);
            console.log(`  ✅ Code Group: ${tag}`);
          }
        });
      }

      // Individual codes - extract from code field
      if (rule.code) {
        let codes: string[] = [];
        if (Array.isArray(rule.code)) {
          codes = rule.code;
        } else if (typeof rule.code === 'string') {
          // Split by comma, semicolon, or space and clean up
          codes = rule.code.split(/[,;\s]+/).map(code => code.trim()).filter(code => code.length > 0);
        }
        codes.forEach(code => {
          if (code && code.length > 0 && !code.startsWith('@')) {
            // Only add actual codes, not tag references
            if (/^\d+[A-Z]*$/.test(code) || /^[A-Z]\d+/.test(code)) {
              tags.codes.add(code);
              console.log(`  ✅ Code: ${code}`);
            }
          }
        });
      }

      // Payer groups
      if (rule.payer_group) {
        let payerTags: string[] = [];
        if (Array.isArray(rule.payer_group)) {
          payerTags = rule.payer_group;
        } else if (typeof rule.payer_group === 'string') {
          payerTags = rule.payer_group.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        }
        payerTags.forEach(tag => {
          if (tag && tag.length > 0) {
            tags.payerGroups.add(tag);
            console.log(`  ✅ Payer Group: ${tag}`);
          }
        });
      }

      // Provider groups
      if (rule.provider_group) {
        let providerTags: string[] = [];
        if (Array.isArray(rule.provider_group)) {
          providerTags = rule.provider_group;
        } else if (typeof rule.provider_group === 'string') {
          providerTags = rule.provider_group.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        }
        providerTags.forEach(tag => {
          if (tag && tag.length > 0) {
            tags.providerGroups.add(tag);
            console.log(`  ✅ Provider Group: ${tag}`);
          }
        });
      }

      // Action tags - extract from action field
      if (rule.action) {
        const actionStr = Array.isArray(rule.action) ? rule.action.join(' ') : rule.action.toString();
        // Look for @TAG patterns
        const actionTagMatches = actionStr.match(/@[A-Z_][A-Z0-9_]*/g);
        if (actionTagMatches) {
          actionTagMatches.forEach(tag => {
            tags.actionTags.add(tag);
            console.log(`  ✅ Action Tag: ${tag}`);
          });
        }
        
        // Also look for common action patterns
        const commonActions = ['@ADD', '@REMOVE', '@SWAP', '@COND_ADD', '@COND_REMOVE', '@ALWAYS_LINK', '@NEVER_LINK'];
        commonActions.forEach(action => {
          if (actionStr.includes(action)) {
            tags.actionTags.add(action);
            console.log(`  ✅ Action Tag (pattern): ${action}`);
          }
        });
      }

      // Chart sections
      if (rule.chart_section) {
        let chartTags: string[] = [];
        if (Array.isArray(rule.chart_section)) {
          chartTags = rule.chart_section;
        } else if (typeof rule.chart_section === 'string') {
          chartTags = rule.chart_section.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        }
        chartTags.forEach(tag => {
          if (tag && tag.length > 0) {
            tags.chartSections.add(tag);
            console.log(`  ✅ Chart Section: ${tag}`);
          }
        });
      }

      // Additional extraction from description and other fields
      if (rule.description) {
        // Extract codes mentioned in description
        const codeMatches = rule.description.match(/\b\d{5}[A-Z]?\b/g);
        if (codeMatches) {
          codeMatches.forEach(code => {
            tags.codes.add(code);
            console.log(`  ✅ Code (from description): ${code}`);
          });
        }

        // Extract tag references from description
        const tagMatches = rule.description.match(/@[A-Z_][A-Z0-9_]*/g);
        if (tagMatches) {
          tagMatches.forEach(tag => {
            // Categorize based on common patterns
            if (tag.includes('PAYER') || tag.includes('INSURANCE')) {
              tags.payerGroups.add(tag);
              console.log(`  ✅ Payer Group (from description): ${tag}`);
            } else if (tag.includes('PROVIDER') || tag.includes('MD') || tag.includes('DO')) {
              tags.providerGroups.add(tag);
              console.log(`  ✅ Provider Group (from description): ${tag}`);
            } else if (['@ADD', '@REMOVE', '@SWAP', '@LINK', '@NEVER', '@ALWAYS', '@COND'].some(action => tag.includes(action))) {
              tags.actionTags.add(tag);
              console.log(`  ✅ Action Tag (from description): ${tag}`);
            } else {
              tags.codeGroups.add(tag);
              console.log(`  ✅ Code Group (from description): ${tag}`);
            }
          });
        }
      }
    });

    console.log('📊 Final tag counts:', {
      codeGroups: tags.codeGroups.size,
      payerGroups: tags.payerGroups.size,
      providerGroups: tags.providerGroups.size,
      actionTags: tags.actionTags.size,
      chartSections: tags.chartSections.size,
      codes: tags.codes.size
    });

    return tags;
  }, [rules, sopName]);

  // Get lookup table data for used tags
  const lookupData = useMemo(() => {
    const mainTables = masterLookupTableService.getMainLookupTables();
    
    return {
      codeGroups: mainTables.codeGroups.filter(cg => usedTags.codeGroups.has(cg.tag)),
      payerGroups: mainTables.payerGroups.filter(pg => usedTags.payerGroups.has(pg.tag)),
      providerGroups: mainTables.providerGroups.filter(pg => usedTags.providerGroups.has(pg.tag)),
      actionTags: mainTables.actionTags.filter(at => usedTags.actionTags.has(at.tag)),
      chartSections: mainTables.chartSections.filter(cs => usedTags.chartSections.has(cs.tag))
    };
  }, [usedTags]);

  // Enhanced search with code expansion and auto-suggestions
  useEffect(() => {
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase().trim();
      const results: LookupSearchResult[] = [];

      // Search in code groups used in this SOP
      lookupData.codeGroups.forEach(codeGroup => {
        // Match by tag name
        if (codeGroup.tag.toLowerCase().includes(query)) {
          results.push({
            type: 'codeGroup',
            tag: codeGroup.tag,
            display: `${codeGroup.tag} (${codeGroup.type})`,
            description: codeGroup.purpose,
            category: codeGroup.type,
            expands_to: codeGroup.expands_to
          });
        }
        
        // Match by individual codes within the code group (CODE EXPANSION SEARCH)
        if (codeGroup.expands_to.some(code => code.toLowerCase().includes(query))) {
          const matchingCodes = codeGroup.expands_to.filter(code => code.toLowerCase().includes(query));
          results.push({
            type: 'code',
            tag: codeGroup.tag,
            display: `${matchingCodes.join(', ')} → ${codeGroup.tag}`,
            description: `Found in code group: ${codeGroup.purpose}`,
            category: codeGroup.type,
            expands_to: matchingCodes
          });
        }

        // Match by purpose/description
        if (codeGroup.purpose.toLowerCase().includes(query)) {
          results.push({
            type: 'codeGroup',
            tag: codeGroup.tag,
            display: `${codeGroup.tag} (${codeGroup.type})`,
            description: codeGroup.purpose,
            category: codeGroup.type,
            expands_to: codeGroup.expands_to
          });
        }
      });

      // Search individual codes used in this SOP
      Array.from(usedTags.codes).forEach(code => {
        if (code.toLowerCase().includes(query)) {
          const codeGroup = lookupData.codeGroups.find(cg => cg.expands_to.includes(code));
          results.push({
            type: 'code',
            tag: code,
            display: codeGroup ? `${code} → ${codeGroup.tag}` : code,
            description: codeGroup ? `Part of ${codeGroup.tag}: ${codeGroup.purpose}` : `Individual code used in ${sopName}`,
            category: codeGroup?.type || 'individual'
          });
        }
      });

      // Search payer groups
      lookupData.payerGroups.forEach(payerGroup => {
        if (payerGroup.tag.toLowerCase().includes(query) ||
            payerGroup.name.toLowerCase().includes(query)) {
          results.push({
            type: 'payerGroup',
            tag: payerGroup.tag,
            display: `${payerGroup.tag} - ${payerGroup.name}`,
            description: `${payerGroup.type} payer group`,
            category: payerGroup.type
          });
        }
      });

      // Search provider groups
      lookupData.providerGroups.forEach(providerGroup => {
        if (providerGroup.tag.toLowerCase().includes(query) ||
            providerGroup.name.toLowerCase().includes(query)) {
          results.push({
            type: 'providerGroup',
            tag: providerGroup.tag,
            display: `${providerGroup.tag} - ${providerGroup.name}`,
            description: providerGroup.description
          });
        }
      });

      // Search action tags
      lookupData.actionTags.forEach(actionTag => {
        if (actionTag.tag.toLowerCase().includes(query) ||
            actionTag.description.toLowerCase().includes(query)) {
          results.push({
            type: 'actionTag',
            tag: actionTag.tag,
            display: `${actionTag.tag}`,
            description: actionTag.description
          });
        }
      });

      // Search chart sections
      lookupData.chartSections.forEach(chartSection => {
        if (chartSection.tag.toLowerCase().includes(query) ||
            chartSection.name.toLowerCase().includes(query)) {
          results.push({
            type: 'chartSection',
            tag: chartSection.tag,
            display: `${chartSection.tag} - ${chartSection.name}`,
            description: chartSection.description
          });
        }
      });

      // Remove duplicates and limit results
      const uniqueResults = Array.from(
        new Map(results.map(r => [r.tag + r.type + r.display, r])).values()
      );

      setSearchResults(uniqueResults.slice(0, 10));
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, usedTags, lookupData, sopName]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const totalTags = lookupData.codeGroups.length + lookupData.payerGroups.length + 
                   lookupData.providerGroups.length + lookupData.actionTags.length + 
                   lookupData.chartSections.length;

  const pendingNewTags = newTags.filter(t => t.status === 'PENDING_REVIEW');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">
            Tags and codes used in this SOP's rules
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {totalTags} Tags Used
          </Badge>
          <Badge variant="outline">
            {usedTags.codes.size} Individual Codes
          </Badge>
          {pendingNewTags.length > 0 && (
            <Dialog open={showNewTagsDialog} onOpenChange={setShowNewTagsDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Tags ({pendingNewTags.length})
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>New Tags Created for {sopName}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  {pendingNewTags.map((tag) => (
                    <div key={tag.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{tag.tag}</div>
                          <div className="text-sm text-muted-foreground">{tag.description}</div>
                          <div className="text-xs text-muted-foreground">
                            Type: {tag.type} • Status: {tag.status}
                          </div>
                        </div>
                        <Badge variant={tag.status === 'PENDING_REVIEW' ? 'destructive' : 'secondary'}>
                          {tag.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search SOP-specific tags, codes, or descriptions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        
        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
            {searchResults.map((result, index) => (
              <div key={index} className="p-3 hover:bg-muted/50 border-b last:border-b-0 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{result.display}</div>
                    <div className="text-xs text-muted-foreground">{result.description}</div>
                    {result.expands_to && result.expands_to.length > 0 && (
                      <div className="text-xs text-blue-600 mt-1">
                        Expands to: {result.expands_to.join(', ')}
                      </div>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs ml-2">{result.type}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Code Groups Used in SOP */}
      {lookupData.codeGroups.length > 0 && (
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
                    Code Groups Used ({lookupData.codeGroups.length})
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
                  {lookupData.codeGroups.map((codeGroup) => (
                    <div key={codeGroup.tag} className="border rounded-lg p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-lg">{codeGroup.tag}</h4>
                          <Badge variant="outline">{codeGroup.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{codeGroup.purpose}</p>
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
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Individual Codes Used */}
      {usedTags.codes.size > 0 && (
        <Card>
          <Collapsible 
            open={expandedSections.has('individualCodes')} 
            onOpenChange={() => toggleSection('individualCodes')}
          >
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Individual Codes Used ({usedTags.codes.size})
                  </div>
                  {expandedSections.has('individualCodes') ? 
                    <ChevronDown className="h-4 w-4" /> : 
                    <ChevronRight className="h-4 w-4" />
                  }
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Array.from(usedTags.codes).map((code) => (
                    <Badge key={code} variant="secondary">
                      {code}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Payer Groups Used */}
      {lookupData.payerGroups.length > 0 && (
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
                    Payer Groups Used ({lookupData.payerGroups.length})
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
                  {lookupData.payerGroups.map((payerGroup) => (
                    <div key={payerGroup.tag} className="border rounded-lg p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-lg">{payerGroup.tag}</h4>
                          <Badge variant="outline">{payerGroup.type}</Badge>
                        </div>
                        <p className="text-sm">{payerGroup.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Provider Groups Used */}
      {lookupData.providerGroups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Provider Groups Used ({lookupData.providerGroups.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lookupData.providerGroups.map((pg) => (
                <div key={pg.tag} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <span className="font-medium">{pg.tag}</span>
                    <span className="text-sm text-muted-foreground ml-2">- {pg.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Tags Used */}
      {lookupData.actionTags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Action Tags Used ({lookupData.actionTags.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lookupData.actionTags.map((at) => (
                <div key={at.tag} className="p-2 border rounded">
                  <div className="font-medium">{at.tag}</div>
                  <div className="text-sm text-muted-foreground">{at.description}</div>
                  <code className="text-xs bg-muted px-1 rounded">{at.syntax}</code>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart Sections Used */}
      {lookupData.chartSections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Chart Sections Used ({lookupData.chartSections.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lookupData.chartSections.map((cs) => (
                <div key={cs.tag} className="p-2 border rounded">
                  <div className="font-medium">{cs.tag}</div>
                  <div className="text-sm text-muted-foreground">{cs.name}</div>
                  <div className="text-xs text-muted-foreground">{cs.description}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
