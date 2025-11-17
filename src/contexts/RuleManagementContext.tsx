// Context for Rule Management Services - Minimal Implementation

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TagValidationService } from '@/services/tagValidationService';
import { DocumentProcessingService } from '@/services/documentProcessingService';
import { ComprehensiveExtractionPipeline, PipelineResult } from '@/services/comprehensiveExtractionPipeline';
import { EnhancedLookupTables, SOPLookupTable } from '@/types/lookupTable';
import { AdvancedSOPRule } from '@/types/advanced';
import { lookupTables } from '@/data/lookupTables';
import { convertToEnhancedLookupTables } from '@/utils/lookupTableConverter';

interface RuleManagementContextType {
  tagValidationService: TagValidationService;
  documentProcessingService: DocumentProcessingService;
  comprehensiveExtractionPipeline: ComprehensiveExtractionPipeline;
  enhancedLookupTables: EnhancedLookupTables;
  updateLookupTables: (tables: EnhancedLookupTables) => void;
  runComprehensivePipeline: (documentText: string, documentName: string, rules: AdvancedSOPRule[]) => Promise<PipelineResult>;
  generateSOPLookupTable: (sopId: string, sopName: string, rules: AdvancedSOPRule[]) => SOPLookupTable;
}

const RuleManagementContext = createContext<RuleManagementContextType | undefined>(undefined);

export const RuleManagementProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [enhancedLookupTables, setEnhancedLookupTables] = useState<EnhancedLookupTables>(() => 
    convertToEnhancedLookupTables(lookupTables)
  );

  const [tagValidationService] = useState(() => new TagValidationService(enhancedLookupTables));
  const [documentProcessingService] = useState(() => new DocumentProcessingService(tagValidationService));
  const [comprehensiveExtractionPipeline] = useState(
    () => new ComprehensiveExtractionPipeline(enhancedLookupTables)
  );

  const updateLookupTables = (tables: EnhancedLookupTables) => {
    setEnhancedLookupTables(tables);
  };

  const runComprehensivePipeline = async (
    documentText: string,
    documentName: string,
    rules: AdvancedSOPRule[]
  ): Promise<PipelineResult> => {
    const result = await comprehensiveExtractionPipeline.execute(
      documentText,
      documentName,
      rules
    );
    
    // Update lookup tables with any changes
    setEnhancedLookupTables(result.updatedLookupTables);
    
    return result;
  };

  const generateSOPLookupTable = (
    sopId: string,
    sopName: string,
    rules: AdvancedSOPRule[]
  ): SOPLookupTable => {
    // Simple stub implementation
    return {
      sop_id: sopId,
      sop_name: sopName,
      codeGroups: [],
      codes: [],
      payerGroups: [],
      providerGroups: [],
      actionTags: [],
      chartSections: [],
      created_date: new Date().toISOString(),
      last_updated: new Date().toISOString()
    };
  };

  return (
    <RuleManagementContext.Provider
      value={{
        tagValidationService,
        documentProcessingService,
        comprehensiveExtractionPipeline,
        enhancedLookupTables,
        updateLookupTables,
        runComprehensivePipeline,
        generateSOPLookupTable
      }}
    >
      {children}
    </RuleManagementContext.Provider>
  );
};

export const useRuleManagement = () => {
  const context = useContext(RuleManagementContext);
  if (!context) {
    throw new Error('useRuleManagement must be used within RuleManagementProvider');
  }
  return context;
};
