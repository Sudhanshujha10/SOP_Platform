import { useState } from 'react';
import { SOPHeader } from '@/components/sop/SOPHeader';
import { SOPFilters } from '@/components/sop/SOPFilters';
import { AccordionSOPTable } from '@/components/sop/AccordionSOPTable';
import { SOPRule } from '@/types/sop';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List } from 'lucide-react';

export const SOPs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'accordion' | 'table'>('accordion');

  const sopRules: SOPRule[] = [
    {
      rule_id: 'AU-MOD25-0001',
      raw_description: 'For @BCBS and @ANTHEM when office E&M is billed with 0-/10-day global procedure, @ADD(modifier 25) to E&M; if only UA codes then @REMOVE(modifier 25).',
      tokens: [
        { type: 'payer', value: 'BCBS' },
        { type: 'payer', value: 'ANTHEM' },
        { type: 'action', value: 'ADD modifier 25' },
        { type: 'action', value: 'REMOVE modifier 25' }
      ],
      codes_selected: ['99213', '99214', '99215'],
      payer_group: ['BCBS', 'ANTHEM'],
      provider_group: ['PHYSICIAN_MD_DO'],
      action: ['ADD modifier 25', 'REMOVE modifier 25'],
      status: 'Active',
      meta: {
        effective_date: '2024-01-01',
        end_date: '2025-12-31',
        chart_section: 'ASSESSMENT_PLAN',
        chart_id: 'UROL-001',
        triggers: ['global procedure', 'E&M'],
        last_updated: '2024-01-15T21:15:00Z',
        updated_by: 'Sarah Chen'
      },
      query_count: 2
    },
    {
      rule_id: 'PA-COND-0002',
      raw_description: 'For @MEDICAID providers when @E&M_MINOR_PROC is billed, @ADD(modifier 95) for telemedicine visits.',
      tokens: [
        { type: 'payer', value: 'MEDICAID' },
        { type: 'code_group', value: 'E&M Minor Procedures' },
        { type: 'action', value: 'ADD modifier 95' }
      ],
      codes_selected: ['99201', '99202', '99203'],
      payer_group: ['MEDICAID'],
      provider_group: ['PHYSICIAN_MD_DO', 'NP_PA'],
      action: ['ADD modifier 95'],
      status: 'Active',
      meta: {
        effective_date: '2024-02-01',
        end_date: '2024-12-31',
        chart_section: 'TELEHEALTH',
        chart_id: 'TELE-002',
        triggers: ['telemedicine', 'virtual visit'],
        last_updated: '2024-02-10T14:30:00Z',
        updated_by: 'Michael Rodriguez'
      },
      query_count: 0
    },
    {
      rule_id: 'DX-LINK-0003',
      raw_description: 'For @KAISER when @UROLOGY_PROC codes are billed without appropriate ICD-10, @DENY(claim) and require supporting documentation.',
      tokens: [
        { type: 'payer', value: 'KAISER' },
        { type: 'code_group', value: 'Urology Procedures' },
        { type: 'action', value: 'DENY claim' }
      ],
      payer_group: ['KAISER'],
      provider_group: ['PHYSICIAN_MD_DO'],
      action: ['DENY claim'],
      status: 'Review',
      meta: {
        effective_date: '2024-03-01',
        chart_section: 'DIAGNOSIS',
        chart_id: 'UROL-003',
        triggers: ['missing diagnosis', 'incomplete documentation'],
        last_updated: '2024-03-05T09:45:00Z',
        updated_by: 'Dr. Lisa Park'
      },
      query_count: 1
    },
    {
      rule_id: 'PREV-CARE-0004',
      raw_description: 'For @COMMERCIAL_PLANS when @PREVENTIVE_CARE is provided to patients over 65, @ADD(modifier 33) for preventive services.',
      tokens: [
        { type: 'payer', value: 'Commercial Plans' },
        { type: 'code_group', value: 'Preventive Care' },
        { type: 'action', value: 'ADD modifier 33' }
      ],
      codes_selected: ['99391', '99392', '99393', '99394'],
      payer_group: ['BCBS', 'AETNA', 'ANTHEM'],
      provider_group: ['PHYSICIAN_MD_DO', 'NP_PA'],
      action: ['ADD modifier 33'],
      status: 'Active',
      meta: {
        effective_date: '2024-01-01',
        chart_section: 'PREVENTIVE_CARE',
        chart_id: 'PREV-004',
        triggers: ['age verification', 'annual wellness'],
        last_updated: '2024-01-20T16:20:00Z',
        updated_by: 'Amanda Johnson'
      },
      query_count: 0
    },
    {
      rule_id: 'SURG-GLOBAL-0005',
      raw_description: 'For @ALL_PAYERS when @SURGICAL_PROC has global period, @REMOVE(separate E&M billing) during global period unless @modifier 25 is appropriate.',
      tokens: [
        { type: 'payer', value: 'All Payers' },
        { type: 'code_group', value: 'Surgical Procedures' },
        { type: 'action', value: 'REMOVE separate E&M billing' },
        { type: 'modifier', value: '25' }
      ],
      payer_group: ['BCBS', 'MEDICAID', 'MEDICARE', 'KAISER'],
      provider_group: ['PHYSICIAN_MD_DO'],
      action: ['REMOVE separate E&M billing'],
      status: 'Active',
      meta: {
        effective_date: '2024-01-01',
        chart_section: 'SURGICAL_NOTES',
        chart_id: 'SURG-005',
        triggers: ['global period', 'post-operative care'],
        last_updated: '2024-01-10T11:15:00Z',
        updated_by: 'Dr. Robert Kim'
      },
      query_count: 3
    }
  ];

  const filteredRules = sopRules.filter(rule => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const actionArray = Array.isArray(rule.action) ? rule.action : [rule.action];
    const tokensArray = rule.tokens || [];
    
    // Handle include/exclude syntax
    if (searchTerm.includes('+') || searchTerm.includes('-')) {
      const terms = searchTerm.split(/\s+/);
      return terms.every(term => {
        if (term.startsWith('+')) {
          const includeText = term.slice(1).toLowerCase();
          return (rule.raw_description || '').toLowerCase().includes(includeText) ||
                 rule.rule_id.toLowerCase().includes(includeText) ||
                 actionArray.some(action => action.toLowerCase().includes(includeText)) ||
                 tokensArray.some(token => token.value.toLowerCase().includes(includeText));
        } else if (term.startsWith('-')) {
          const excludeText = term.slice(1).toLowerCase();
          return !((rule.raw_description || '').toLowerCase().includes(excludeText) ||
                   rule.rule_id.toLowerCase().includes(excludeText) ||
                   actionArray.some(action => action.toLowerCase().includes(excludeText)) ||
                   tokensArray.some(token => token.value.toLowerCase().includes(excludeText)));
        } else {
          return (rule.raw_description || '').toLowerCase().includes(term) ||
                 rule.rule_id.toLowerCase().includes(term) ||
                 actionArray.some(action => action.toLowerCase().includes(term)) ||
                 tokensArray.some(token => token.value.toLowerCase().includes(term));
        }
      });
    }
    
    // Regular search
    return (rule.raw_description || '').toLowerCase().includes(searchLower) ||
           rule.rule_id.toLowerCase().includes(searchLower) ||
           actionArray.some(action => action.toLowerCase().includes(searchLower)) ||
           tokensArray.some(token => token.value.toLowerCase().includes(searchLower));
  });

  return (
    <div className="p-6 space-y-6">
      <SOPHeader 
        title="Advanced Urology SOP"
        totalRules={sopRules.length}
        lastUpdated="3 hours ago"
        lastUpdatedBy="Dr. Sarah Chen"
      />
      
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <SOPFilters 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <Button
            variant={viewMode === 'accordion' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('accordion')}
            className="h-8"
          >
            <List className="h-4 w-4 mr-2" />
            Accordion
          </Button>
        </div>
      </div>
      
      <AccordionSOPTable rules={filteredRules} />
    </div>
  );
};