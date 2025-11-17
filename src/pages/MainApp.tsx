import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { DynamicDashboard } from '@/pages/DynamicDashboard';
import { SOPManagement } from '@/pages/SOPManagement';
import { SOPDetail } from '@/pages/SOPDetail';
import { LookupTables } from '@/pages/LookupTables';
import { EnhancedCreateNewSOP } from '@/components/EnhancedCreateNewSOP';
import { Settings } from '@/components/Settings';
import { TestRunner } from '@/components/TestRunner';
import { AdvancedSOPRule } from '@/types/advanced';
import { SOPManagementService } from '@/services/sopManagementService';
import { useToast } from '@/hooks/use-toast';

export const MainApp = () => {
  const [currentModule, setCurrentModule] = useState<'dashboard' | 'sops' | 'lookup' | 'test'>('dashboard');
  const [showCreateSOP, setShowCreateSOP] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedSOPId, setSelectedSOPId] = useState<string | null>(null);
  const { toast } = useToast();

  // Handle create new SOP
  const handleCreateNewSOP = () => {
    setShowCreateSOP(true);
  };

  // Handle SOP creation success
  const handleSOPCreated = (sop: any) => {
    setShowCreateSOP(false);
    setCurrentModule('dashboard');
    
    toast({
      title: 'SOP Created Successfully',
      description: `${sop.name} has been created`,
    });
  };

  // Handle view SOP
  const handleViewSOP = (sopId: string) => {
    setSelectedSOPId(sopId);
  };

  // Handle back from SOP detail
  const handleBackFromDetail = () => {
    setSelectedSOPId(null);
  };

  // Get all rules from all SOPs
  const getAllRules = (): AdvancedSOPRule[] => {
    return SOPManagementService.getAllRules();
  };

  // Handle SOP rule edit
  const handleSOPEdit = (rule: AdvancedSOPRule) => {
    // This would update the rule in the SOP
    toast({
      title: 'Rule Updated',
      description: `Rule ${rule.rule_id} has been updated`,
    });
  };

  // Handle SOP rule delete
  const handleSOPDelete = (ruleIds: string[]) => {
    toast({
      title: 'Rules Deleted',
      description: `${ruleIds.length} rules deleted`,
      variant: 'destructive'
    });
  };

  // Handle SOP export
  const handleSOPExport = () => {
    const allRules = getAllRules();
    const csvContent = generateCSV(allRules);
    downloadCSV(csvContent, 'all_sop_rules.csv');

    toast({
      title: 'Export Successful',
      description: `${allRules.length} rules exported`,
    });
  };

  // Handle create new rule
  const handleCreateNew = () => {
    // This would open a manual rule creation form
    toast({
      title: 'Create New Rule',
      description: 'Manual rule creation coming soon',
    });
  };

  // Generate CSV content
  const generateCSV = (rules: AdvancedSOPRule[]): string => {
    const headers = [
      'rule_id', 'code', 'action', 'payer_group', 'provider_group',
      'description', 'documentation_trigger', 'chart_section',
      'effective_date', 'end_date', 'reference', 'status', 'source'
    ];

    const rows = rules.map(rule => [
      rule.rule_id,
      rule.code,
      rule.action,
      rule.payer_group,
      rule.provider_group,
      rule.description,
      rule.documentation_trigger,
      rule.chart_section,
      rule.effective_date,
      rule.end_date || '',
      rule.reference,
      rule.status,
      rule.source
    ].map(field => `"${String(field).replace(/"/g, '""')}"`));

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  };

  // Download CSV
  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render current module
  const renderContent = () => {
    // Show SOP detail if selected
    if (selectedSOPId) {
      return (
        <SOPDetail
          sopId={selectedSOPId}
          onBack={handleBackFromDetail}
        />
      );
    }

    switch (currentModule) {
      case 'dashboard':
        return (
          <DynamicDashboard
            onCreateNewSOP={handleCreateNewSOP}
            onViewSOP={handleViewSOP}
          />
        );
      case 'sops':
        return (
          <SOPManagement
            rules={getAllRules()}
            onEdit={handleSOPEdit}
            onDelete={handleSOPDelete}
            onExport={handleSOPExport}
            onCreateNew={handleCreateNewSOP}
          />
        );
      case 'lookup':
        return <LookupTables />;
      case 'test':
        return <TestRunner />;
      default:
        return (
          <DynamicDashboard
            onCreateNewSOP={handleCreateNewSOP}
            onViewSOP={handleViewSOP}
          />
        );
    }
  };

  return (
    <>
      <Layout 
        currentModule={currentModule} 
        onModuleChange={setCurrentModule}
        onSettingsClick={() => setShowSettings(true)}
      >
        {renderContent()}
      </Layout>
      
      {/* Create New SOP Modal */}
      {showCreateSOP && (
        <EnhancedCreateNewSOP
          onClose={() => setShowCreateSOP(false)}
          onSuccess={handleSOPCreated}
        />
      )}
      
      {/* Settings Modal */}
      {showSettings && (
        <Settings
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
};

export default MainApp;
