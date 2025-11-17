import React, { useState, useMemo } from 'react';
import { X, Search, Tag, ChevronDown, ChevronRight, Download } from 'lucide-react';

interface SOPLookupTableViewerProps {
  isOpen: boolean;
  onClose: () => void;
  sopLookupTable: any; // SOP-specific lookup table
  sopName?: string;
}

export const SOPLookupTableViewer: React.FC<SOPLookupTableViewerProps> = ({
  isOpen,
  onClose,
  sopLookupTable,
  sopName = 'SOP'
}) => {
  // ALL HOOKS MUST BE AT THE TOP - BEFORE ANY RETURNS!
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Generate autocomplete suggestions - MUST be before any returns
  const allTags = useMemo(() => {
    if (!sopLookupTable) return [];
    const tags: string[] = [];
    [
      ...(sopLookupTable.codeGroups || []),
      ...(sopLookupTable.payerGroups || []),
      ...(sopLookupTable.providerGroups || []),
      ...(sopLookupTable.actionTags || []),
      ...(sopLookupTable.chartSections || [])
    ].forEach(item => {
      if (item.tag) tags.push(item.tag);
      if (item.purpose) tags.push(item.purpose);
      if (item.description) tags.push(item.description);
    });
    return [...new Set(tags)];
  }, [sopLookupTable]);

  // NOW we can do early returns
  if (!isOpen) return null;
  
  // Debug logging
  console.log('SOPLookupTableViewer - sopLookupTable:', sopLookupTable);
  console.log('SOPLookupTableViewer - sopName:', sopName);
  
  // Show loading state if no data
  if (!sopLookupTable) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          <p className="text-gray-600">Loading lookup table...</p>
          <p className="text-xs text-gray-500 mt-2">sopLookupTable is null</p>
        </div>
      </div>
    );
  }
  
  // Validate data structure
  if (!sopLookupTable.codeGroups && !sopLookupTable.payerGroups && !sopLookupTable.providerGroups && !sopLookupTable.actionTags && !sopLookupTable.chartSections) {
    console.error('Invalid sopLookupTable structure:', sopLookupTable);
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          <p className="text-red-600">Error: Invalid lookup table data structure</p>
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

  const filterTags = (tags: any[], query: string) => {
    if (!query) return tags;
    const lowerQuery = query.toLowerCase();
    return tags.filter(tag =>
      tag.tag?.toLowerCase().includes(lowerQuery) ||
      tag.purpose?.toLowerCase().includes(lowerQuery) ||
      tag.description?.toLowerCase().includes(lowerQuery)
    );
  };

  const filteredCodeGroups = filterTags(sopLookupTable.codeGroups || [], searchQuery);
  const filteredPayerGroups = filterTags(sopLookupTable.payerGroups || [], searchQuery);
  const filteredProviderGroups = filterTags(sopLookupTable.providerGroups || [], searchQuery);
  const filteredActionTags = filterTags(sopLookupTable.actionTags || [], searchQuery);
  const filteredChartSections = filterTags(sopLookupTable.chartSections || [], searchQuery);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.length > 0) {
      const matches = allTags.filter(tag =>
        tag.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  };

  const groups = [
    {
      id: 'code_groups',
      name: 'Code Groups',
      count: filteredCodeGroups.length,
      items: filteredCodeGroups,
      color: 'blue'
    },
    {
      id: 'payer_groups',
      name: 'Payer Groups',
      count: filteredPayerGroups.length,
      items: filteredPayerGroups,
      color: 'green'
    },
    {
      id: 'provider_groups',
      name: 'Provider Groups',
      count: filteredProviderGroups.length,
      items: filteredProviderGroups,
      color: 'purple'
    },
    {
      id: 'action_tags',
      name: 'Action Tags',
      count: filteredActionTags.length,
      items: filteredActionTags,
      color: 'orange'
    },
    {
      id: 'chart_sections',
      name: 'Chart Sections',
      count: filteredChartSections.length,
      items: filteredChartSections,
      color: 'pink'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      green: 'bg-green-50 text-green-700 border-green-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
      orange: 'bg-orange-50 text-orange-700 border-orange-200',
      pink: 'bg-pink-50 text-pink-700 border-pink-200'
    };
    return colors[color] || colors.blue;
  };

  // Export to CSV
  const exportToCSV = () => {
    const rows: string[][] = [
      ['Group', 'Tag', 'Description/Purpose', 'Details']
    ];

    // Add Code Groups
    (sopLookupTable.codeGroups || []).forEach((item: any) => {
      rows.push([
        'Code Group',
        item.tag || '',
        item.purpose || '',
        item.expands_to ? `Expands to: ${item.expands_to.join(', ')}` : ''
      ]);
    });

    // Add Payer Groups
    (sopLookupTable.payerGroups || []).forEach((item: any) => {
      rows.push([
        'Payer Group',
        item.tag || '',
        item.name || item.description || '',
        item.payers ? `Payers: ${item.payers.join(', ')}` : ''
      ]);
    });

    // Add Provider Groups
    (sopLookupTable.providerGroups || []).forEach((item: any) => {
      rows.push([
        'Provider Group',
        item.tag || '',
        item.description || '',
        item.providers ? `Providers: ${item.providers.join(', ')}` : ''
      ]);
    });

    // Add Action Tags
    (sopLookupTable.actionTags || []).forEach((item: any) => {
      rows.push([
        'Action',
        item.tag || '',
        item.description || '',
        ''
      ]);
    });

    // Add Chart Sections
    (sopLookupTable.chartSections || []).forEach((item: any) => {
      rows.push([
        'Chart Section',
        item.tag || '',
        item.description || '',
        item.category ? `Category: ${item.category}` : ''
      ]);
    });

    // Convert to CSV string
    const csvContent = rows.map(row =>
      row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${sopName.replace(/\s+/g, '_')}_Lookup_Table.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <Tag className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{sopName} - Lookup Tables</h2>
              <p className="text-sm text-gray-600">Tags used in this SOP's rules</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                exportToCSV();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
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
        </div>

        {/* Search with Autocomplete */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search tags, codes, descriptions..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {/* Autocomplete Suggestions */}
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    type="button"
                    key={index}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSearchQuery(suggestion);
                      setSuggestions([]);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors text-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {groups.map((group) => (
            <div key={group.id} className={`border-2 rounded-lg overflow-hidden ${getColorClasses(group.color)}`}>
              {/* Group Header */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setExpandedGroup(expandedGroup === group.id ? null : group.id);
                }}
                className="w-full px-4 py-3 flex items-center justify-between hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center gap-3">
                  <Tag className="w-5 h-5" />
                  <span className="font-semibold text-lg">{group.name}</span>
                  <span className="px-2 py-1 bg-white rounded-full text-sm font-medium">
                    {group.count}
                  </span>
                </div>
                {expandedGroup === group.id ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </button>

              {/* Group Items */}
              {expandedGroup === group.id && (
                <div className="bg-white border-t-2">
                  {group.items.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {group.items.map((item: any, index: number) => (
                        <div key={index} className="px-4 py-3 hover:bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <code className="px-3 py-1 bg-gray-100 text-gray-900 rounded font-mono text-sm font-semibold">
                                  {item.tag}
                                </code>
                                {item.status && (
                                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                                    item.status === 'PENDING_REVIEW'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-green-100 text-green-800'
                                  }`}>
                                    {item.status}
                                  </span>
                                )}
                              </div>

                              {(item.purpose || item.description) && (
                                <p className="text-sm text-gray-700 mb-2">
                                  {item.purpose || item.description}
                                </p>
                              )}

                              {/* Code Groups - Show expanded codes */}
                              {item.expands_to && item.expands_to.length > 0 && (
                                <div className="mb-2">
                                  <span className="text-xs text-gray-500 font-medium">Expands to:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {item.expands_to.slice(0, 10).map((code: string, idx: number) => (
                                      <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-mono">
                                        {code}
                                      </span>
                                    ))}
                                    {item.expands_to.length > 10 && (
                                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                        +{item.expands_to.length - 10} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Payer Groups - Show payers */}
                              {item.payers && item.payers.length > 0 && (
                                <div className="mb-2">
                                  <span className="text-xs text-gray-500 font-medium">Payers:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {item.payers.map((payer: string, idx: number) => (
                                      <span key={idx} className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                                        {payer}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Provider Groups - Show providers */}
                              {item.providers && item.providers.length > 0 && (
                                <div className="mb-2">
                                  <span className="text-xs text-gray-500 font-medium">Providers:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {item.providers.map((provider: string, idx: number) => (
                                      <span key={idx} className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">
                                        {provider}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Metadata */}
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                {item.category && <span>Category: {item.category}</span>}
                                {item.created_by && <span>Created by: {item.created_by}</span>}
                                {item.source_document && <span>Source: {item.source_document}</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-8 text-center text-gray-500">
                      No items found
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex items-center justify-end">
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
