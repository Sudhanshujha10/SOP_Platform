// Audit Report Dashboard - Comprehensive QA visualization

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Download,
  FileText,
  Code,
  Tag,
  List,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { AuditReport, CodeMappingValidation, CodeGroupValidation, RuleValidationResult } from '@/services/ruleQualityAuditService';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface AuditReportDashboardProps {
  report: AuditReport;
  onExport?: () => void;
  onFixIssue?: (issueType: string, issueId: string) => void;
}

export const AuditReportDashboard: React.FC<AuditReportDashboardProps> = ({
  report,
  onExport,
  onFixIssue
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  // Render summary cards
  const renderSummaryCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Document Codes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Code className="w-4 h-4" />
            Document Codes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-600">
            {report.summary.totalCodesInDocument}
          </div>
          <p className="text-xs text-gray-500 mt-1">Unique codes found</p>
        </CardContent>
      </Card>

      {/* Rules Created */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Rules Created
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-purple-600">
            {report.summary.totalRulesCreated}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {report.summary.validRulesCount} valid, {report.summary.rulesWithErrorsCount} errors
          </p>
        </CardContent>
      </Card>

      {/* Missing Codes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Missing Codes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${report.summary.missingCodesCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {report.summary.missingCodesCount}
          </div>
          <p className="text-xs text-gray-500 mt-1">Codes not in rules</p>
        </CardContent>
      </Card>

      {/* Mapping Errors */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Mapping Errors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${report.summary.mappingErrorsCount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
            {report.summary.mappingErrorsCount}
          </div>
          <p className="text-xs text-gray-500 mt-1">Lookup table issues</p>
        </CardContent>
      </Card>
    </div>
  );

  // Render publish status
  const renderPublishStatus = () => (
    <Card className={`mb-6 ${report.canPublish ? 'border-green-500' : 'border-red-500'}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {report.canPublish ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-600">Ready to Publish</span>
            </>
          ) : (
            <>
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-600">Cannot Publish - Issues Found</span>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {report.canPublish ? (
          <p className="text-sm text-gray-600">
            All quality checks passed. Rules are ready for publication.
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Blocking Issues:</p>
            <ul className="list-disc list-inside space-y-1">
              {report.blockingIssues.map((issue, index) => (
                <li key={index} className="text-sm text-red-600">{issue}</li>
              ))}
            </ul>
          </div>
        )}

        {report.recommendations.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-gray-700">Recommendations:</p>
            <ul className="list-disc list-inside space-y-1">
              {report.recommendations.map((rec, index) => (
                <li key={index} className="text-sm text-blue-600">{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Render missing codes section
  const renderMissingCodes = () => (
    <Collapsible open={expandedSections.has('missing-codes')}>
      <Card className="mb-6">
        <CollapsibleTrigger
          className="w-full"
          onClick={() => toggleSection('missing-codes')}
        >
          <CardHeader className="cursor-pointer hover:bg-gray-50">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                {expandedSections.has('missing-codes') ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
                Missing Codes ({report.missingCodes.length})
              </span>
              {report.missingCodes.length > 0 && (
                <Badge className="bg-red-100 text-red-800">
                  {report.missingCodes.length} issues
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            {report.missingCodes.length === 0 ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">All codes from document are present in rules</span>
              </div>
            ) : (
              <div className="space-y-3">
                {report.missingCodes.map((code, index) => (
                  <div key={index} className="border border-red-200 rounded-lg p-3 bg-red-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="bg-red-600 text-white font-mono">
                            {code.code}
                          </Badge>
                          <Badge className="bg-gray-100 text-gray-700">
                            {code.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-1">
                          <strong>Context:</strong> {code.context}
                        </p>
                        <p className="text-xs text-gray-500">
                          <strong>Section:</strong> {code.section}
                          {code.lineNumber && ` | Line ${code.lineNumber}`}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onFixIssue?.('missing-code', code.code)}
                      >
                        Fix
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );

  // Render mapping errors section
  const renderMappingErrors = () => (
    <Collapsible open={expandedSections.has('mapping-errors')}>
      <Card className="mb-6">
        <CollapsibleTrigger
          className="w-full"
          onClick={() => toggleSection('mapping-errors')}
        >
          <CardHeader className="cursor-pointer hover:bg-gray-50">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                {expandedSections.has('mapping-errors') ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
                Mapping Errors ({report.mappingErrors.length})
              </span>
              {report.mappingErrors.length > 0 && (
                <Badge className="bg-orange-100 text-orange-800">
                  {report.mappingErrors.length} issues
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            {report.mappingErrors.length === 0 ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">All codes properly mapped to lookup table</span>
              </div>
            ) : (
              <div className="space-y-3">
                {report.mappingErrors.map((error, index) => (
                  <div key={index} className="border border-orange-200 rounded-lg p-3 bg-orange-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-orange-600 text-white font-mono">
                            {error.code}
                          </Badge>
                          <Badge className={`${
                            error.status === 'missing_in_lookup' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {error.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <ul className="list-disc list-inside space-y-1 mb-2">
                          {error.issues.map((issue, i) => (
                            <li key={i} className="text-sm text-gray-700">{issue}</li>
                          ))}
                        </ul>
                        {error.mappedToCodeGroup && (
                          <p className="text-xs text-gray-600">
                            <strong>Mapped to:</strong> {error.mappedToCodeGroup}
                          </p>
                        )}
                        {error.rulesUsing.length > 0 && (
                          <p className="text-xs text-gray-600">
                            <strong>Used in rules:</strong> {error.rulesUsing.join(', ')}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onFixIssue?.('mapping-error', error.code)}
                      >
                        Fix
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );

  // Render code group validation section
  const renderCodeGroupValidation = () => (
    <Collapsible open={expandedSections.has('code-groups')}>
      <Card className="mb-6">
        <CollapsibleTrigger
          className="w-full"
          onClick={() => toggleSection('code-groups')}
        >
          <CardHeader className="cursor-pointer hover:bg-gray-50">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                {expandedSections.has('code-groups') ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
                Code Group Validation ({report.codeGroupValidation.length})
              </span>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            <div className="space-y-3">
              {report.codeGroupValidation.map((validation, index) => (
                <div 
                  key={index} 
                  className={`border rounded-lg p-3 ${
                    validation.status === 'valid' 
                      ? 'border-green-200 bg-green-50' 
                      : validation.status === 'incomplete'
                      ? 'border-yellow-200 bg-yellow-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-teal-100 text-teal-800">
                        {validation.tag}
                      </Badge>
                      <Badge className={`${
                        validation.status === 'valid'
                          ? 'bg-green-100 text-green-800'
                          : validation.status === 'incomplete'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {validation.status}
                      </Badge>
                    </div>
                    {validation.status !== 'valid' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onFixIssue?.('code-group', validation.tag)}
                      >
                        Fix
                      </Button>
                    )}
                  </div>

                  {validation.issues.length > 0 && (
                    <ul className="list-disc list-inside space-y-1 mb-2">
                      {validation.issues.map((issue, i) => (
                        <li key={i} className="text-sm text-gray-700">{issue}</li>
                      ))}
                    </ul>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <strong>Lookup Table:</strong> {validation.codesInLookupTable.length} codes
                    </div>
                    <div>
                      <strong>In Rules:</strong> {validation.codesInRules.length} codes
                    </div>
                  </div>

                  {validation.missingCodes.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-red-600">
                        Missing codes: {validation.missingCodes.join(', ')}
                      </p>
                    </div>
                  )}

                  {validation.extraCodes.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-orange-600">
                        Extra codes: {validation.extraCodes.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );

  // Render rule validation section
  const renderRuleValidation = () => (
    <Collapsible open={expandedSections.has('rules')}>
      <Card className="mb-6">
        <CollapsibleTrigger
          className="w-full"
          onClick={() => toggleSection('rules')}
        >
          <CardHeader className="cursor-pointer hover:bg-gray-50">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                {expandedSections.has('rules') ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
                Rule Validation ({report.ruleValidation.length})
              </span>
              <div className="flex gap-2">
                <Badge className="bg-green-100 text-green-800">
                  {report.summary.validRulesCount} valid
                </Badge>
                {report.summary.rulesWithWarningsCount > 0 && (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    {report.summary.rulesWithWarningsCount} warnings
                  </Badge>
                )}
                {report.summary.rulesWithErrorsCount > 0 && (
                  <Badge className="bg-red-100 text-red-800">
                    {report.summary.rulesWithErrorsCount} errors
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            <div className="space-y-3">
              {report.ruleValidation
                .filter(v => v.status !== 'valid') // Show only rules with issues
                .map((validation, index) => (
                  <div 
                    key={index} 
                    className={`border rounded-lg p-3 ${
                      validation.status === 'warning'
                        ? 'border-yellow-200 bg-yellow-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-medium">
                          {validation.ruleId}
                        </span>
                        <Badge className={`${
                          validation.status === 'warning'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {validation.status}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onFixIssue?.('rule', validation.ruleId)}
                      >
                        Fix
                      </Button>
                    </div>

                    {validation.issues.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-red-700 mb-1">Errors:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {validation.issues.map((issue, i) => (
                            <li key={i} className="text-sm text-red-600">
                              <strong>{issue.field}:</strong> {issue.message}
                              {issue.suggestion && (
                                <span className="block ml-5 text-xs text-gray-600 mt-1">
                                  💡 {issue.suggestion}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {validation.warnings.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-yellow-700 mb-1">Warnings:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {validation.warnings.map((warning, i) => (
                            <li key={i} className="text-sm text-yellow-600">
                              <strong>{warning.field}:</strong> {warning.message}
                              {warning.suggestion && (
                                <span className="block ml-5 text-xs text-gray-600 mt-1">
                                  💡 {warning.suggestion}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}

              {report.ruleValidation.filter(v => v.status !== 'valid').length === 0 && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">All rules passed validation</span>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quality Audit Report</h2>
          <p className="text-sm text-gray-600 mt-1">
            {report.documentName} • Processed {new Date(report.processedAt).toLocaleString()}
          </p>
        </div>
        <Button onClick={onExport} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      {renderSummaryCards()}

      {/* Publish Status */}
      {renderPublishStatus()}

      {/* Missing Codes */}
      {renderMissingCodes()}

      {/* Mapping Errors */}
      {renderMappingErrors()}

      {/* Code Group Validation */}
      {renderCodeGroupValidation()}

      {/* Rule Validation */}
      {renderRuleValidation()}
    </div>
  );
};
