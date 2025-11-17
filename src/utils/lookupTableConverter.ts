// Utility to convert existing lookup tables to enhanced format

import { LookupTables } from '@/types/sop';
import { 
  EnhancedLookupTables, 
  EnhancedCodeGroup, 
  EnhancedPayerGroup, 
  EnhancedProviderGroup,
  EnhancedActionTag,
  EnhancedChartSection
} from '@/types/lookupTable';

export function convertToEnhancedLookupTables(
  originalTables: LookupTables
): EnhancedLookupTables {
  const now = new Date().toISOString();

  // Convert code groups
  const enhancedCodeGroups: EnhancedCodeGroup[] = originalTables.codeGroups.map(cg => ({
    ...cg,
    status: 'ACTIVE' as const,
    created_date: now,
    created_by: 'SYSTEM' as const,
    usage_count: 0
  }));

  // Convert payer groups
  const enhancedPayerGroups: EnhancedPayerGroup[] = originalTables.payerGroups.map(pg => ({
    ...pg,
    status: 'ACTIVE' as const,
    created_date: now,
    created_by: 'SYSTEM' as const,
    usage_count: 0
  }));

  // Convert provider groups
  const enhancedProviderGroups: EnhancedProviderGroup[] = originalTables.providerGroups.map(pg => ({
    ...pg,
    status: 'ACTIVE' as const,
    created_date: now,
    created_by: 'SYSTEM' as const,
    usage_count: 0
  }));

  // Convert action tags
  const enhancedActionTags: EnhancedActionTag[] = originalTables.actionTags.map(at => ({
    ...at,
    status: 'ACTIVE' as const,
    created_date: now,
    created_by: 'SYSTEM' as const,
    usage_count: 0
  }));

  // Convert chart sections
  const enhancedChartSections: EnhancedChartSection[] = originalTables.chartSections.map(cs => ({
    ...cs,
    status: 'ACTIVE' as const,
    created_date: now,
    created_by: 'SYSTEM' as const,
    usage_count: 0
  }));

  return {
    codeGroups: enhancedCodeGroups,
    payerGroups: enhancedPayerGroups,
    providerGroups: enhancedProviderGroups,
    actionTags: enhancedActionTags,
    chartSections: enhancedChartSections
  };
}
