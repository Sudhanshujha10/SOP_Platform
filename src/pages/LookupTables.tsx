import React from 'react';
import { MainLookupTableManager } from '@/components/MainLookupTableManager';
import { useRuleManagement } from '@/contexts/RuleManagementContext';
import { useToast } from '@/hooks/use-toast';

export const LookupTables = () => {
  const { updateLookupTables } = useRuleManagement();
  const { toast } = useToast();

  const handleTagUpdate = (type: string, tag: string, updates: any) => {
    // This will trigger real-time updates across the platform
    console.log(`Tag updated: ${type} - ${tag}`, updates);
    
    toast({
      title: 'Tag Updated',
      description: `${tag} has been updated and changes will reflect across all SOPs`,
    });
    
    // Optionally refresh the lookup tables in the context
    // updateLookupTables(updatedTables);
  };

  return (
    <div className="container mx-auto p-6">
      <MainLookupTableManager onTagUpdate={handleTagUpdate} />
    </div>
  );
};