// Audit Context - Global state for quality audit

import React, { createContext, useContext, useState, useCallback } from 'react';
import { RuleQualityAuditService, AuditReport } from '@/services/ruleQualityAuditService';
import { AdvancedSOPRule } from '@/types/advanced';
import { useRuleManagement } from './RuleManagementContext';

interface AuditContextType {
  currentReport: AuditReport | null;
  isAuditing: boolean;
  auditHistory: AuditReport[];
  performAudit: (documentText: string, documentName: string, rules: AdvancedSOPRule[]) => Promise<AuditReport>;
  clearCurrentReport: () => void;
  exportReport: (report: AuditReport) => void;
}

const AuditContext = createContext<AuditContextType | undefined>(undefined);

export const AuditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { enhancedLookupTables } = useRuleManagement();
  const [currentReport, setCurrentReport] = useState<AuditReport | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditHistory, setAuditHistory] = useState<AuditReport[]>([]);

  const performAudit = useCallback(
    async (documentText: string, documentName: string, rules: AdvancedSOPRule[]) => {
      setIsAuditing(true);
      
      try {
        const auditService = new RuleQualityAuditService(enhancedLookupTables);
        const report = auditService.generateAuditReport(documentText, documentName, rules);
        
        setCurrentReport(report);
        setAuditHistory(prev => [report, ...prev].slice(0, 10)); // Keep last 10 reports
        
        return report;
      } finally {
        setIsAuditing(false);
      }
    },
    [enhancedLookupTables]
  );

  const clearCurrentReport = useCallback(() => {
    setCurrentReport(null);
  }, []);

  const exportReport = useCallback((report: AuditReport) => {
    // Export as JSON
    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-report-${report.documentName}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <AuditContext.Provider
      value={{
        currentReport,
        isAuditing,
        auditHistory,
        performAudit,
        clearCurrentReport,
        exportReport
      }}
    >
      {children}
    </AuditContext.Provider>
  );
};

export const useAudit = () => {
  const context = useContext(AuditContext);
  if (!context) {
    throw new Error('useAudit must be used within AuditProvider');
  }
  return context;
};
