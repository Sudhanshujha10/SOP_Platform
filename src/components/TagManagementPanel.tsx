// Tag Management Panel Component

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertTriangle, XCircle, Tag, Trash2, Edit } from 'lucide-react';
import { useRuleManagement } from '@/contexts/RuleManagementContext';
import { TagStatus } from '@/types/lookupTable';

type TagType = 'codeGroup' | 'payerGroup' | 'providerGroup' | 'actionTag' | 'chartSection';

export const TagManagementPanel: React.FC = () => {
  const { enhancedLookupTables, updateLookupTables, tagValidationService } = useRuleManagement();
  const [selectedType, setSelectedType] = useState<TagType>('codeGroup');
  const [filterStatus, setFilterStatus] = useState<TagStatus | 'all'>('all');

  const getTagsByType = () => {
    switch (selectedType) {
      case 'codeGroup':
        return enhancedLookupTables.codeGroups;
      case 'payerGroup':
        return enhancedLookupTables.payerGroups;
      case 'providerGroup':
        return enhancedLookupTables.providerGroups;
      case 'actionTag':
        return enhancedLookupTables.actionTags;
      case 'chartSection':
        return enhancedLookupTables.chartSections;
    }
  };

  const filteredTags = getTagsByType().filter(tag => 
    filterStatus === 'all' || tag.status === filterStatus
  );

  const getStatusIcon = (status: TagStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'NEEDS_DEFINITION':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'PENDING_REVIEW':
        return <AlertTriangle className="w-4 h-4 text-blue-600" />;
      case 'DEPRECATED':
        return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusBadgeColor = (status: TagStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'NEEDS_DEFINITION':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'PENDING_REVIEW':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DEPRECATED':
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const handleApprove = (tag: string) => {
    // Update tag status to ACTIVE
    const updatedTables = { ...enhancedLookupTables };
    const tagList = getTagsByType();
    const tagIndex = tagList.findIndex(t => t.tag === tag);
    
    if (tagIndex !== -1) {
      (tagList[tagIndex] as any).status = 'ACTIVE';
      updateLookupTables(updatedTables);
    }
  };

  const handleDelete = (tag: string) => {
    const canDelete = tagValidationService.canDeleteTag(tag);
    
    if (!canDelete.canDelete) {
      alert(canDelete.reason);
      return;
    }

    if (confirm(`Are you sure you want to delete ${tag}?`)) {
      const updatedTables = { ...enhancedLookupTables };
      
      switch (selectedType) {
        case 'codeGroup':
          updatedTables.codeGroups = updatedTables.codeGroups.filter(t => t.tag !== tag);
          break;
        case 'payerGroup':
          updatedTables.payerGroups = updatedTables.payerGroups.filter(t => t.tag !== tag);
          break;
        case 'providerGroup':
          updatedTables.providerGroups = updatedTables.providerGroups.filter(t => t.tag !== tag);
          break;
        case 'actionTag':
          updatedTables.actionTags = updatedTables.actionTags.filter(t => t.tag !== tag);
          break;
        case 'chartSection':
          updatedTables.chartSections = updatedTables.chartSections.filter(t => t.tag !== tag);
          break;
      }
      
      updateLookupTables(updatedTables);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Tag className="w-6 h-6" />
          Tag Management
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Review and manage lookup table tags
        </p>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-gray-200 space-y-4">
        {/* Type Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Tag Type
          </label>
          <div className="flex flex-wrap gap-2">
            {(['codeGroup', 'payerGroup', 'providerGroup', 'actionTag', 'chartSection'] as TagType[]).map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                  selectedType === type
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                }`}
              >
                {type.replace(/([A-Z])/g, ' $1').trim()}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Status
          </label>
          <div className="flex flex-wrap gap-2">
            {(['all', 'ACTIVE', 'NEEDS_DEFINITION', 'PENDING_REVIEW', 'DEPRECATED'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                  filterStatus === status
                    ? 'bg-gray-600 text-white border-gray-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                {status === 'all' ? 'All' : status.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tags List */}
      <div className="p-4">
        <div className="space-y-2">
          {filteredTags.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Tag className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No tags found</p>
            </div>
          ) : (
            filteredTags.map((tag, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(tag.status)}
                    <span className="font-mono font-semibold text-gray-900">
                      {tag.tag}
                    </span>
                    <Badge className={`${getStatusBadgeColor(tag.status)} border text-xs`}>
                      {tag.status}
                    </Badge>
                    <Badge className="bg-gray-100 text-gray-700 border border-gray-200 text-xs">
                      Used in {tag.usage_count} rules
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {'purpose' in tag && <p>{tag.purpose}</p>}
                    {'name' in tag && <p>{tag.name}</p>}
                    {'description' in tag && <p>{tag.description}</p>}
                  </div>

                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span>Created: {new Date(tag.created_date).toLocaleDateString()}</span>
                    <span>By: {tag.created_by}</span>
                    {tag.confidence_score && (
                      <span>Confidence: {(tag.confidence_score * 100).toFixed(0)}%</span>
                    )}
                    {tag.last_used && (
                      <span>Last used: {new Date(tag.last_used).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  {tag.status === 'NEEDS_DEFINITION' && (
                    <Button
                      size="sm"
                      onClick={() => handleApprove(tag.tag)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(tag.tag)}
                    disabled={tag.usage_count > 0}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
