// Rule Status Indicator Component with Visual Status System

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { RuleValidationResult } from '@/types/lookupTable';

interface RuleStatusIndicatorProps {
  validation: RuleValidationResult;
  showDetails?: boolean;
}

export const RuleStatusIndicator: React.FC<RuleStatusIndicatorProps> = ({ 
  validation, 
  showDetails = false 
}) => {
  const getStatusConfig = () => {
    switch (validation.status) {
      case 'VALID':
        return {
          icon: CheckCircle2,
          color: 'bg-green-100 text-green-800 border-green-200',
          label: 'Valid',
          iconColor: 'text-green-600'
        };
      case 'NEEDS_REVIEW':
        return {
          icon: AlertTriangle,
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          label: 'Needs Review',
          iconColor: 'text-orange-600'
        };
      case 'INVALID':
        return {
          icon: XCircle,
          color: 'bg-red-100 text-red-800 border-red-200',
          label: 'Invalid',
          iconColor: 'text-red-600'
        };
      default:
        return {
          icon: Clock,
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          label: 'Pending',
          iconColor: 'text-gray-600'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="space-y-2">
      <Badge className={`${config.color} border px-2 py-1 rounded-full font-medium inline-flex items-center gap-1`}>
        <Icon className={`w-3 h-3 ${config.iconColor}`} />
        {config.label}
      </Badge>

      {showDetails && (
        <div className="text-xs space-y-1">
          {validation.errors.length > 0 && (
            <div className="text-red-600">
              <strong>Errors:</strong>
              <ul className="list-disc list-inside ml-2">
                {validation.errors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {validation.warnings.length > 0 && (
            <div className="text-orange-600">
              <strong>Warnings:</strong>
              <ul className="list-disc list-inside ml-2">
                {validation.warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {validation.missingTags.length > 0 && (
            <div className="text-orange-600">
              <strong>Missing Tags:</strong>
              <div className="flex flex-wrap gap-1 mt-1">
                {validation.missingTags.map((tag, idx) => (
                  <Badge key={idx} className="bg-orange-50 text-orange-700 border border-orange-200 text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {validation.newTagsToCreate.length > 0 && (
            <div className="text-blue-600">
              <strong>New Tags to Create:</strong>
              <div className="flex flex-wrap gap-1 mt-1">
                {validation.newTagsToCreate.map((tagReq, idx) => (
                  <Badge key={idx} className="bg-blue-50 text-blue-700 border border-blue-200 text-xs">
                    {tagReq.tag} ({tagReq.type})
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Tag Status Badge Component
interface TagStatusBadgeProps {
  tag: string;
  status: 'ACTIVE' | 'NEEDS_DEFINITION' | 'PENDING_REVIEW' | 'DEPRECATED';
  type: 'codeGroup' | 'payerGroup' | 'providerGroup' | 'actionTag' | 'chartSection';
  tooltip?: string;
}

export const TagStatusBadge: React.FC<TagStatusBadgeProps> = ({ 
  tag, 
  status, 
  type, 
  tooltip 
}) => {
  const getColorClass = () => {
    switch (type) {
      case 'payerGroup':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'codeGroup':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'providerGroup':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'actionTag':
        if (tag.includes('ADD')) return 'bg-green-100 text-green-800 border-green-200';
        if (tag.includes('REMOVE')) return 'bg-red-100 text-red-800 border-red-200';
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'chartSection':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle2 className="w-3 h-3 text-green-600" />;
      case 'NEEDS_DEFINITION':
        return <AlertTriangle className="w-3 h-3 text-orange-600" />;
      case 'PENDING_REVIEW':
        return <Clock className="w-3 h-3 text-blue-600" />;
      case 'DEPRECATED':
        return <XCircle className="w-3 h-3 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <Badge 
      className={`${getColorClass()} border px-2 py-1 rounded-full font-medium inline-flex items-center gap-1 text-xs cursor-help`}
      title={tooltip || `${tag} - ${status}`}
    >
      {status !== 'ACTIVE' && getStatusIcon()}
      {tag.replace('@', '')}
    </Badge>
  );
};
