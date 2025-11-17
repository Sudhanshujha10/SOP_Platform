import React, { useState } from 'react';
import { X, Tag, Check, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { NewTag } from '@/types/ruleApproval';

interface NewTagsViewerProps {
  newTags: NewTag[];
  isOpen: boolean;
  onClose: () => void;
  onApproveTag: (tag: string) => void;
  onRejectTag: (tag: string) => void;
}

export const NewTagsViewer: React.FC<NewTagsViewerProps> = ({
  newTags,
  isOpen,
  onClose,
  onApproveTag,
  onRejectTag
}) => {
  const [expandedType, setExpandedType] = useState<string | null>(null);

  if (!isOpen) return null;

  // Debug logging
  console.log('NewTagsViewer - newTags:', newTags);
  console.log('NewTagsViewer - newTags type:', typeof newTags);
  console.log('NewTagsViewer - newTags length:', newTags?.length);

  // Validate newTags
  if (!Array.isArray(newTags)) {
    console.error('newTags is not an array:', newTags);
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          <p className="text-red-600">Error: newTags is not an array</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Group tags by type
  const groupedTags = newTags.reduce((acc, tag) => {
    // Validate tag structure
    if (!tag || typeof tag !== 'object' || !tag.type || !tag.tag) {
      console.warn('Invalid tag structure:', tag);
      return acc;
    }
    
    if (!acc[tag.type]) {
      acc[tag.type] = [];
    }
    acc[tag.type].push(tag);
    return acc;
  }, {} as Record<string, NewTag[]>);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      code_group: 'Code Groups',
      payer_group: 'Payer Groups',
      provider_group: 'Provider Groups',
      action: 'Actions',
      chart_section: 'Chart Sections'
    };
    return labels[type] || type;
  };

  const getTypeIcon = (type: string) => {
    return <Tag className="w-4 h-4" />;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      approved: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Tag className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">New Tags</h2>
              <p className="text-sm text-gray-600">{newTags.length} new tags found by AI</p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {Object.entries(groupedTags).map(([type, tags]) => (
            <div key={type} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Type Header */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setExpandedType(expandedType === type ? null : type);
                }}
                className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getTypeIcon(type)}
                  <span className="font-semibold text-gray-900">{getTypeLabel(type)}</span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                    {tags.length}
                  </span>
                </div>
                {expandedType === type ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
              </button>

              {/* Tags List */}
              {expandedType === type && (
                <div className="divide-y divide-gray-200">
                  {tags.map((tag) => (
                    <div key={tag.tag} className="px-4 py-3 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <code className="px-2 py-1 bg-gray-100 text-gray-900 rounded text-sm font-mono">
                              {String(tag.tag || '')}
                            </code>
                            {getStatusBadge(String(tag.status || 'pending'))}
                          </div>
                          
                          {tag.purpose && (
                            <p className="text-sm text-gray-600 mb-2">{String(tag.purpose)}</p>
                          )}

                          {tag.expands_to && Array.isArray(tag.expands_to) && tag.expands_to.length > 0 && (
                            <div className="mb-2">
                              <span className="text-xs text-gray-500 font-medium">Expands to:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {tag.expands_to.slice(0, 5).map((code, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                                    {String(code)}
                                  </span>
                                ))}
                                {tag.expands_to.length > 5 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                    +{tag.expands_to.length - 5} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Created by: {tag.created_by === 'ai' ? 'AI' : 'User'}</span>
                            <span>Used in {Array.isArray(tag.used_in_rules) ? tag.used_in_rules.length : 0} rule{(Array.isArray(tag.used_in_rules) ? tag.used_in_rules.length : 0) !== 1 ? 's' : ''}</span>
                          </div>
                        </div>

                        {tag.status === 'pending' && (
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onApproveTag(tag.tag);
                              }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Approve tag"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onRejectTag(tag.tag);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Reject tag"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {newTags.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Tag className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No new tags found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <AlertCircle className="w-4 h-4 inline mr-1" />
            Approved tags will be added to the main lookup table
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
