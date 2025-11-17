// SOP-Specific Lookup Table - Shows only tags used in this SOP

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Search,
  ChevronDown,
  ChevronRight,
  Code,
  Users,
  Building,
  Zap,
  FileText,
  Download
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { SOPLookupTable as SOPLookupTableType } from '@/types/lookupTable';

interface SOPLookupTableProps {
  lookupTable: SOPLookupTableType;
}

export const SOPLookupTable: React.FC<SOPLookupTableProps> = ({ lookupTable }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['codeGroups', 'codes'])
  );

  // Filter items based on search
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) {
      return {
        codeGroups: lookupTable.codeGroups,
        codes: lookupTable.codes,
        payerGroups: lookupTable.payerGroups,
        providerGroups: lookupTable.providerGroups,
        actionTags: lookupTable.actionTags
      };
    }

    const lowerQuery = searchQuery.toLowerCase();

    return {
      codeGroups: lookupTable.codeGroups.filter(cg =>
        cg.tag.toLowerCase().includes(lowerQuery) ||
        cg.purpose.toLowerCase().includes(lowerQuery) ||
        cg.expands_to.some(code => code.includes(lowerQuery))
      ),
      codes: lookupTable.codes.filter(c =>
        c.code.includes(lowerQuery) ||
        c.description.toLowerCase().includes(lowerQuery) ||
        c.code_group?.toLowerCase().includes(lowerQuery)
      ),
      payerGroups: lookupTable.payerGroups.filter(pg =>
        pg.tag.toLowerCase().includes(lowerQuery) ||
        pg.name.toLowerCase().includes(lowerQuery)
      ),
      providerGroups: lookupTable.providerGroups.filter(pg =>
        pg.tag.toLowerCase().includes(lowerQuery) ||
        pg.name.toLowerCase().includes(lowerQuery)
      ),
      actionTags: lookupTable.actionTags.filter(at =>
        at.tag.toLowerCase().includes(lowerQuery) ||
        at.description.toLowerCase().includes(lowerQuery)
      )
    };
  }, [lookupTable, searchQuery]);

  // Organize codes by type
  const codesByType = useMemo(() => {
    return {
      procedure: filteredData.codes.filter(c => c.type === 'procedure'),
      diagnosis: filteredData.codes.filter(c => c.type === 'diagnosis'),
      modifier: filteredData.codes.filter(c => c.type === 'modifier')
    };
  }, [filteredData.codes]);

  // Organize code groups by type
  const codeGroupsByType = useMemo(() => {
    return {
      procedure: filteredData.codeGroups.filter(cg => cg.type === 'procedure'),
      diagnosis: filteredData.codeGroups.filter(cg => cg.type === 'diagnosis'),
      modifier: filteredData.codeGroups.filter(cg => cg.type === 'modifier')
    };
  }, [filteredData.codeGroups]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(lookupTable, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${lookupTable.sop_name.replace(/\s+/g, '_')}_lookup_table.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">SOP Lookup Table</h2>
              <p className="text-sm text-gray-600 mt-1">{lookupTable.sop_name}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search codes, tags, or descriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-5 gap-4 mt-4">
            <StatCard label="Code Groups" value={lookupTable.codeGroups.length} color="blue" />
            <StatCard label="Codes" value={lookupTable.codes.length} color="green" />
            <StatCard label="Payer Groups" value={lookupTable.payerGroups.length} color="purple" />
            <StatCard label="Provider Groups" value={lookupTable.providerGroups.length} color="orange" />
            <StatCard label="Action Tags" value={lookupTable.actionTags.length} color="red" />
          </div>
        </CardContent>
      </Card>

      {/* Code Groups */}
      <Collapsible open={expandedSections.has('codeGroups')}>
        <Card>
          <CollapsibleTrigger
            className="w-full"
            onClick={() => toggleSection('codeGroups')}
          >
            <CardHeader className="cursor-pointer hover:bg-gray-50">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {expandedSections.has('codeGroups') ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                  <Code className="w-5 h-5" />
                  <span>Code Groups</span>
                  <Badge className="bg-blue-100 text-blue-800">
                    {filteredData.codeGroups.length}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {/* Procedure Code Groups */}
              {codeGroupsByType.procedure.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">Procedure Codes</Badge>
                    <span className="text-gray-600">({codeGroupsByType.procedure.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {codeGroupsByType.procedure.map((codeGroup) => (
                      <CodeGroupItem key={codeGroup.tag} codeGroup={codeGroup} />
                    ))}
                  </div>
                </div>
              )}

              {/* Diagnosis Code Groups */}
              {codeGroupsByType.diagnosis.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Badge className="bg-purple-100 text-purple-800">Diagnosis Codes</Badge>
                    <span className="text-gray-600">({codeGroupsByType.diagnosis.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {codeGroupsByType.diagnosis.map((codeGroup) => (
                      <CodeGroupItem key={codeGroup.tag} codeGroup={codeGroup} />
                    ))}
                  </div>
                </div>
              )}

              {/* Modifier Code Groups */}
              {codeGroupsByType.modifier.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Badge className="bg-orange-100 text-orange-800">Modifiers</Badge>
                    <span className="text-gray-600">({codeGroupsByType.modifier.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {codeGroupsByType.modifier.map((codeGroup) => (
                      <CodeGroupItem key={codeGroup.tag} codeGroup={codeGroup} />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Individual Codes */}
      <Collapsible open={expandedSections.has('codes')}>
        <Card>
          <CollapsibleTrigger
            className="w-full"
            onClick={() => toggleSection('codes')}
          >
            <CardHeader className="cursor-pointer hover:bg-gray-50">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {expandedSections.has('codes') ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                  <FileText className="w-5 h-5" />
                  <span>Individual Codes</span>
                  <Badge className="bg-blue-100 text-blue-800">
                    {filteredData.codes.length}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {/* Procedure Codes */}
              {codesByType.procedure.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">Procedure Codes</Badge>
                    <span className="text-gray-600">({codesByType.procedure.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {codesByType.procedure.map((code, idx) => (
                      <CodeItem key={idx} code={code} />
                    ))}
                  </div>
                </div>
              )}

              {/* Diagnosis Codes */}
              {codesByType.diagnosis.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Badge className="bg-purple-100 text-purple-800">Diagnosis Codes</Badge>
                    <span className="text-gray-600">({codesByType.diagnosis.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {codesByType.diagnosis.map((code, idx) => (
                      <CodeItem key={idx} code={code} />
                    ))}
                  </div>
                </div>
              )}

              {/* Modifiers */}
              {codesByType.modifier.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Badge className="bg-orange-100 text-orange-800">Modifiers</Badge>
                    <span className="text-gray-600">({codesByType.modifier.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {codesByType.modifier.map((code, idx) => (
                      <CodeItem key={idx} code={code} />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Payer Groups */}
      {filteredData.payerGroups.length > 0 && (
        <Collapsible open={expandedSections.has('payerGroups')}>
          <Card>
            <CollapsibleTrigger
              className="w-full"
              onClick={() => toggleSection('payerGroups')}
            >
              <CardHeader className="cursor-pointer hover:bg-gray-50">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedSections.has('payerGroups') ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                    <Building className="w-5 h-5" />
                    <span>Payer Groups</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {filteredData.payerGroups.length}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="space-y-2">
                  {filteredData.payerGroups.map((payerGroup) => (
                    <PayerGroupItem key={payerGroup.tag} payerGroup={payerGroup} />
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Provider Groups */}
      {filteredData.providerGroups.length > 0 && (
        <Collapsible open={expandedSections.has('providerGroups')}>
          <Card>
            <CollapsibleTrigger
              className="w-full"
              onClick={() => toggleSection('providerGroups')}
            >
              <CardHeader className="cursor-pointer hover:bg-gray-50">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedSections.has('providerGroups') ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                    <Users className="w-5 h-5" />
                    <span>Provider Groups</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {filteredData.providerGroups.length}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="space-y-2">
                  {filteredData.providerGroups.map((providerGroup) => (
                    <ProviderGroupItem key={providerGroup.tag} providerGroup={providerGroup} />
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Action Tags */}
      {filteredData.actionTags.length > 0 && (
        <Collapsible open={expandedSections.has('actionTags')}>
          <Card>
            <CollapsibleTrigger
              className="w-full"
              onClick={() => toggleSection('actionTags')}
            >
              <CardHeader className="cursor-pointer hover:bg-gray-50">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedSections.has('actionTags') ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                    <Zap className="w-5 h-5" />
                    <span>Action Tags</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {filteredData.actionTags.length}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="space-y-2">
                  {filteredData.actionTags.map((actionTag) => (
                    <ActionTagItem key={actionTag.tag} actionTag={actionTag} />
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
    </div>
  );
};

// Helper Components
const StatCard: React.FC<{
  label: string;
  value: number;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}> = ({ label, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800',
    red: 'bg-red-50 border-red-200 text-red-800'
  };

  return (
    <div className={`border rounded-lg p-3 ${colorClasses[color]}`}>
      <div className="text-xs font-medium mb-1">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
};

const CodeGroupItem: React.FC<{ codeGroup: any }> = ({ codeGroup }) => (
  <div className="border rounded-lg p-3 bg-gray-50">
    <div className="flex items-center gap-2 mb-2">
      <Badge className="bg-gray-700 text-white font-mono text-xs">
        {codeGroup.tag}
      </Badge>
      <Badge className={`text-xs ${
        codeGroup.type === 'procedure' ? 'bg-green-100 text-green-800' :
        codeGroup.type === 'diagnosis' ? 'bg-purple-100 text-purple-800' :
        'bg-orange-100 text-orange-800'
      }`}>
        {codeGroup.type}
      </Badge>
      <span className="text-xs text-gray-500">
        {codeGroup.expands_to.length} codes
      </span>
    </div>
    <p className="text-sm text-gray-700 mb-2">{codeGroup.purpose}</p>
    <div className="flex flex-wrap gap-1">
      {codeGroup.expands_to.map((code: string, idx: number) => (
        <Badge key={idx} className="bg-blue-50 text-blue-700 text-xs font-mono">
          {code}
        </Badge>
      ))}
    </div>
  </div>
);

const CodeItem: React.FC<{ code: any }> = ({ code }) => (
  <div className="border rounded-lg p-3 bg-gray-50">
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center gap-2">
        <Badge className="bg-gray-700 text-white font-mono text-xs">
          {code.code}
        </Badge>
        <Badge className={`text-xs ${
          code.type === 'procedure' ? 'bg-green-100 text-green-800' :
          code.type === 'diagnosis' ? 'bg-purple-100 text-purple-800' :
          'bg-orange-100 text-orange-800'
        }`}>
          {code.type}
        </Badge>
      </div>
      {code.code_group && (
        <Badge className="bg-teal-100 text-teal-800 text-xs">
          {code.code_group}
        </Badge>
      )}
    </div>
    <p className="text-sm text-gray-700">{code.description}</p>
  </div>
);

const PayerGroupItem: React.FC<{ payerGroup: any }> = ({ payerGroup }) => (
  <div className="border rounded-lg p-3 bg-gray-50">
    <div className="flex items-center gap-2">
      <Badge className="bg-gray-700 text-white font-mono text-xs">
        {payerGroup.tag}
      </Badge>
      <span className="font-semibold text-sm">{payerGroup.name}</span>
      <Badge className="bg-blue-100 text-blue-800 text-xs">
        {payerGroup.type}
      </Badge>
    </div>
  </div>
);

const ProviderGroupItem: React.FC<{ providerGroup: any }> = ({ providerGroup }) => (
  <div className="border rounded-lg p-3 bg-gray-50">
    <div className="flex items-center gap-2 mb-1">
      <Badge className="bg-gray-700 text-white font-mono text-xs">
        {providerGroup.tag}
      </Badge>
      <span className="font-semibold text-sm">{providerGroup.name}</span>
    </div>
    <p className="text-xs text-gray-600">{providerGroup.description}</p>
  </div>
);

const ActionTagItem: React.FC<{ actionTag: any }> = ({ actionTag }) => (
  <div className="border rounded-lg p-3 bg-gray-50">
    <div className="flex items-center gap-2 mb-1">
      <Badge className="bg-gray-700 text-white font-mono text-xs">
        {actionTag.tag}
      </Badge>
      <code className="text-xs bg-white px-2 py-1 rounded border">{actionTag.syntax}</code>
      <Badge className="bg-purple-100 text-purple-800 text-xs">
        {actionTag.category}
      </Badge>
    </div>
    <p className="text-sm text-gray-700">{actionTag.description}</p>
  </div>
);
