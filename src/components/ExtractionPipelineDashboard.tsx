// Extraction Pipeline Dashboard - Comprehensive validation and reporting

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Code,
  Link,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Download
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { PipelineResult, ExtractedCode, ConflictReport } from '@/services/comprehensiveExtractionPipeline';

interface ExtractionPipelineDashboardProps {
  result: PipelineResult;
  onResolveConflict?: (conflict: ConflictReport) => void;
  onExportReport?: () => void;
}

export const ExtractionPipelineDashboard: React.FC<ExtractionPipelineDashboardProps> = ({
  result,
  onResolveConflict,
  onExportReport
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['validation', 'coverage'])
  );

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'covered':
        return 'bg-green-100 text-green-800';
      case 'missing_in_rules':
        return 'bg-orange-100 text-orange-800';
      case 'missing_in_lookup':
        return 'bg-red-100 text-red-800';
      case 'orphaned':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Extraction Pipeline Report</h2>
              <p className="text-sm text-gray-600 mt-1">{result.documentName}</p>
            </div>
            <div className="flex gap-2">
              {onExportReport && (
                <Button variant="outline" size="sm" onClick={onExportReport}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-gray-500">
            Generated: {new Date(result.timestamp).toLocaleString()}
          </div>
        </CardContent>
      </Card>

      {/* Validation Checklist */}
      <Collapsible open={expandedSections.has('validation')}>
        <Card className={result.validation.passed ? 'border-green-300' : 'border-red-300'}>
          <CollapsibleTrigger
            className="w-full"
            onClick={() => toggleSection('validation')}
          >
            <CardHeader className="cursor-pointer hover:bg-gray-50">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {expandedSections.has('validation') ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                  {result.validation.passed ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600" />
                  )}
                  <span>Validation Checklist</span>
                  <Badge className={result.validation.passed ? 'bg-green-600' : 'bg-red-600'}>
                    Score: {result.validation.score}/100
                  </Badge>
                </div>
                <Badge className={result.validation.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {result.validation.passed ? 'PASSED' : 'FAILED'}
                </Badge>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="space-y-3">
                <ChecklistItem
                  label="All codes from document in rules"
                  passed={result.validation.allCodesInRules}
                  details={`${result.codeCoverage.totalCodesInRules}/${result.codeCoverage.totalCodesInDocument} codes`}
                />
                <ChecklistItem
                  label="All codes in lookup table"
                  passed={result.validation.allCodesInLookup}
                  details={`${result.codeCoverage.missingInLookup.length} missing`}
                />
                <ChecklistItem
                  label="All rules linked to lookup table"
                  passed={result.validation.allRulesLinked}
                  details={`${result.ruleLookupValidation.filter(r => r.allValid).length}/${result.ruleLookupValidation.length} valid`}
                />
                <ChecklistItem
                  label="No duplicate tags"
                  passed={result.validation.noDuplicates}
                  details={`${result.conflicts.filter(c => c.type === 'duplicate_tag').length} duplicates`}
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Code Coverage */}
      <Collapsible open={expandedSections.has('coverage')}>
        <Card>
          <CollapsibleTrigger
            className="w-full"
            onClick={() => toggleSection('coverage')}
          >
            <CardHeader className="cursor-pointer hover:bg-gray-50">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {expandedSections.has('coverage') ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                  <Code className="w-5 h-5" />
                  <span>Code Coverage Audit</span>
                  <Badge className="bg-blue-100 text-blue-800">
                    {result.codeCoverage.coveragePercentage.toFixed(1)}%
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <StatCard
                  label="Total Codes"
                  value={result.codeCoverage.totalCodesInDocument}
                  icon={<FileText className="w-5 h-5" />}
                  color="blue"
                />
                <StatCard
                  label="Covered"
                  value={result.codeCoverage.coveredCodes.length}
                  icon={<CheckCircle className="w-5 h-5" />}
                  color="green"
                />
                <StatCard
                  label="Missing in Rules"
                  value={result.codeCoverage.missingInRules.length}
                  icon={<AlertTriangle className="w-5 h-5" />}
                  color="orange"
                />
                <StatCard
                  label="Orphaned"
                  value={result.codeCoverage.orphanedCodes.length}
                  icon={<XCircle className="w-5 h-5" />}
                  color="red"
                />
              </div>

              {/* Missing in Rules */}
              {result.codeCoverage.missingInRules.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    Codes Missing in Rules ({result.codeCoverage.missingInRules.length})
                  </h4>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 max-h-60 overflow-y-auto">
                    {result.codeCoverage.missingInRules.map((code, idx) => (
                      <CodeItem key={idx} code={code} />
                    ))}
                  </div>
                </div>
              )}

              {/* Missing in Lookup */}
              {result.codeCoverage.missingInLookup.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    Codes Missing in Lookup Table ({result.codeCoverage.missingInLookup.length})
                  </h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-60 overflow-y-auto">
                    {result.codeCoverage.missingInLookup.map((code, idx) => (
                      <CodeItem key={idx} code={code} />
                    ))}
                  </div>
                </div>
              )}

              {/* Orphaned Codes */}
              {result.codeCoverage.orphanedCodes.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-purple-600" />
                    Orphaned Codes ({result.codeCoverage.orphanedCodes.length})
                  </h4>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 max-h-60 overflow-y-auto">
                    {result.codeCoverage.orphanedCodes.map((code, idx) => (
                      <CodeItem key={idx} code={code} />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Rule Lookup Validation */}
      <Collapsible open={expandedSections.has('rules')}>
        <Card>
          <CollapsibleTrigger
            className="w-full"
            onClick={() => toggleSection('rules')}
          >
            <CardHeader className="cursor-pointer hover:bg-gray-50">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {expandedSections.has('rules') ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                  <Link className="w-5 h-5" />
                  <span>Rule-Lookup Validation</span>
                  <Badge className="bg-blue-100 text-blue-800">
                    {result.ruleLookupValidation.filter(r => r.allValid).length}/{result.ruleLookupValidation.length}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="space-y-2">
                {result.ruleLookupValidation.filter(r => !r.allValid).map((validation, idx) => (
                  <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm">Rule: {validation.ruleId}</p>
                        <div className="mt-2 space-y-1">
                          {validation.brokenLinks.map((link, linkIdx) => (
                            <Badge key={linkIdx} className="bg-red-100 text-red-800 mr-2">
                              {link}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <XCircle className="w-5 h-5 text-red-600" />
                    </div>
                  </div>
                ))}
                {result.ruleLookupValidation.every(r => r.allValid) && (
                  <div className="text-center py-4 text-green-600">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-semibold">All rules validated successfully!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Conflicts */}
      {result.conflicts.length > 0 && (
        <Collapsible open={expandedSections.has('conflicts')}>
          <Card className="border-orange-300">
            <CollapsibleTrigger
              className="w-full"
              onClick={() => toggleSection('conflicts')}
            >
              <CardHeader className="cursor-pointer hover:bg-gray-50">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedSections.has('conflicts') ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    <span>Conflicts Detected</span>
                    <Badge className="bg-orange-100 text-orange-800">
                      {result.conflicts.length}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="space-y-3">
                  {result.conflicts.map((conflict, idx) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityColor(conflict.severity)}>
                            {conflict.severity.toUpperCase()}
                          </Badge>
                          <Badge className="bg-gray-100 text-gray-700">
                            {conflict.type.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        {onResolveConflict && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onResolveConflict(conflict)}
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                      <p className="text-sm font-medium mb-2">{conflict.description}</p>
                      <p className="text-xs text-gray-600 mb-2">
                        <strong>Resolution:</strong> {conflict.resolution}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {conflict.affectedEntities.map((entity, entityIdx) => (
                          <Badge key={entityIdx} className="bg-gray-100 text-gray-700 text-xs">
                            {entity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Auto-Population Summary */}
      {result.autoPopulationResult.suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              Lookup Table Suggestions
              <Badge className="bg-blue-100 text-blue-800">
                {result.autoPopulationResult.suggestions.length} pending
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-2">
              {result.autoPopulationResult.newCodeGroups.length} new code groups discovered
            </p>
            <p className="text-sm text-gray-600">
              {result.autoPopulationResult.updatedCodeGroups.length} existing groups can be expanded
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Helper Components
const ChecklistItem: React.FC<{ label: string; passed: boolean; details: string }> = ({
  label,
  passed,
  details
}) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
    <div className="flex items-center gap-3">
      {passed ? (
        <CheckCircle className="w-5 h-5 text-green-600" />
      ) : (
        <XCircle className="w-5 h-5 text-red-600" />
      )}
      <span className="font-medium text-sm">{label}</span>
    </div>
    <span className="text-xs text-gray-600">{details}</span>
  </div>
);

const StatCard: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'orange' | 'red';
}> = ({ label, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800',
    red: 'bg-red-50 border-red-200 text-red-800'
  };

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
};

const CodeItem: React.FC<{ code: ExtractedCode }> = ({ code }) => (
  <div className="mb-2 pb-2 border-b border-gray-200 last:border-0">
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center gap-2">
        <Badge className="bg-gray-700 text-white font-mono text-xs">
          {code.code}
        </Badge>
        <Badge className="bg-gray-100 text-gray-700 text-xs">
          {code.type}
        </Badge>
        {code.inRules.length > 0 && (
          <span className="text-xs text-gray-600">
            in {code.inRules.length} rule(s)
          </span>
        )}
      </div>
      <Badge className={`text-xs ${code.inLookupTable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {code.inLookupTable ? 'In Lookup' : 'Not in Lookup'}
      </Badge>
    </div>
    <p className="text-xs text-gray-600 truncate">{code.context}</p>
    {code.lookupTableGroups.length > 0 && (
      <div className="mt-1 flex flex-wrap gap-1">
        {code.lookupTableGroups.map((group, idx) => (
          <Badge key={idx} className="bg-teal-100 text-teal-700 text-xs">
            {group}
          </Badge>
        ))}
      </div>
    )}
  </div>
);
