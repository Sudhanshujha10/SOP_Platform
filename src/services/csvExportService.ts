import { SOPRule, LookupTables } from '@/types/sop';

/**
 * CSV Export Service - Generates properly formatted CSV files
 */
export class CSVExportService {
  /**
   * Export SOP rules to CSV format
   */
  exportRulesToCSV(rules: SOPRule[], filename: string = 'sop_rules.csv'): void {
    const csvContent = this.generateCSVContent(rules);
    this.downloadCSV(csvContent, filename);
  }

  /**
   * Export lookup tables to CSV format
   */
  exportLookupTablesToCSV(lookupTables: LookupTables, filename: string = 'lookup_tables.csv'): void {
    const csvContent = this.generateLookupTablesCSV(lookupTables);
    this.downloadCSV(csvContent, filename);
  }

  /**
   * Generate CSV content from rules
   */
  private generateCSVContent(rules: SOPRule[]): string {
    const headers = [
      'rule_id',
      'code',
      'action',
      'payer_group',
      'provider_group',
      'description',
      'documentation_trigger',
      'chart_section',
      'effective_date',
      'end_date',
      'reference'
    ];

    const rows = rules.map(rule => [
      this.escapeCSVField(rule.rule_id),
      this.escapeCSVField(rule.code),
      this.escapeCSVField(rule.action),
      this.escapeCSVField(rule.payer_group),
      this.escapeCSVField(rule.provider_group),
      this.escapeCSVField(rule.description),
      this.escapeCSVField(rule.documentation_trigger),
      this.escapeCSVField(rule.chart_section),
      this.escapeCSVField(rule.effective_date),
      this.escapeCSVField(rule.end_date || ''),
      this.escapeCSVField(rule.reference)
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }

  /**
   * Generate CSV content for lookup tables
   */
  private generateLookupTablesCSV(lookupTables: LookupTables): string {
    const sections: string[] = [];

    // Code Groups
    sections.push('# Code Groups');
    sections.push('tag,type,expands_to,purpose');
    lookupTables.codeGroups.forEach(cg => {
      sections.push([
        this.escapeCSVField(cg.tag),
        this.escapeCSVField(cg.type),
        this.escapeCSVField(cg.expands_to.join(';')),
        this.escapeCSVField(cg.purpose)
      ].join(','));
    });
    sections.push('');

    // Payer Groups
    sections.push('# Payer Groups');
    sections.push('tag,name,type');
    lookupTables.payerGroups.forEach(pg => {
      sections.push([
        this.escapeCSVField(pg.tag),
        this.escapeCSVField(pg.name),
        this.escapeCSVField(pg.type)
      ].join(','));
    });
    sections.push('');

    // Provider Groups
    sections.push('# Provider Groups');
    sections.push('tag,name,description');
    lookupTables.providerGroups.forEach(pg => {
      sections.push([
        this.escapeCSVField(pg.tag),
        this.escapeCSVField(pg.name),
        this.escapeCSVField(pg.description)
      ].join(','));
    });
    sections.push('');

    // Action Tags
    sections.push('# Action Tags');
    sections.push('tag,syntax,description,category');
    lookupTables.actionTags.forEach(at => {
      sections.push([
        this.escapeCSVField(at.tag),
        this.escapeCSVField(at.syntax),
        this.escapeCSVField(at.description),
        this.escapeCSVField(at.category)
      ].join(','));
    });
    sections.push('');

    // Chart Sections
    sections.push('# Chart Sections');
    sections.push('tag,name,description');
    lookupTables.chartSections.forEach(cs => {
      sections.push([
        this.escapeCSVField(cs.tag),
        this.escapeCSVField(cs.name),
        this.escapeCSVField(cs.description)
      ].join(','));
    });

    return sections.join('\n');
  }

  /**
   * Escape CSV field to handle commas, quotes, and newlines
   */
  private escapeCSVField(field: string): string {
    if (field === null || field === undefined) {
      return '';
    }

    const stringField = String(field);

    // If field contains comma, quote, or newline, wrap in quotes and escape quotes
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }

    return stringField;
  }

  /**
   * Download CSV file
   */
  private downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Import rules from CSV content
   */
  async importRulesFromCSV(csvContent: string): Promise<SOPRule[]> {
    const lines = csvContent.split('\n').filter(line => line.trim().length > 0);
    
    if (lines.length < 2) {
      throw new Error('CSV file is empty or invalid');
    }

    const headers = this.parseCSVLine(lines[0]);
    const rules: SOPRule[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      
      if (values.length !== headers.length) {
        console.warn(`Skipping line ${i + 1}: column count mismatch`);
        continue;
      }

      const rule: any = {};
      headers.forEach((header, index) => {
        rule[header] = values[index];
      });

      // Ensure required fields
      if (rule.rule_id && rule.code && rule.action && rule.description) {
        rules.push(rule as SOPRule);
      }
    }

    return rules;
  }

  /**
   * Parse a single CSV line handling quoted fields
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    // Add last field
    result.push(current);

    return result;
  }

  /**
   * Generate template CSV for manual rule entry
   */
  generateTemplateCSV(clientPrefix: string = 'CLIENT'): string {
    const headers = [
      'rule_id',
      'code',
      'action',
      'payer_group',
      'provider_group',
      'description',
      'documentation_trigger',
      'chart_section',
      'effective_date',
      'end_date',
      'reference'
    ];

    const exampleRule = [
      `${clientPrefix}-MOD25-0001`,
      '@E&M_MINOR_PROC',
      '@ADD(@25)',
      '@BCBS|@ANTHEM',
      '@PHYSICIAN_MD_DO',
      'For @BCBS|@ANTHEM payers, if office E&M is billed with 0-/10-day global procedure and the @ASSESSMENT_PLAN states "separate service," then @ADD(@25).',
      'separate service;global procedure;E&M',
      'ASSESSMENT_PLAN',
      new Date().toISOString().split('T')[0],
      '',
      'Policy Document p. 1'
    ];

    return [
      headers.join(','),
      exampleRule.map(field => this.escapeCSVField(field)).join(',')
    ].join('\n');
  }

  /**
   * Download template CSV
   */
  downloadTemplate(clientPrefix: string = 'CLIENT'): void {
    const content = this.generateTemplateCSV(clientPrefix);
    this.downloadCSV(content, `${clientPrefix}_sop_template.csv`);
  }
}

/**
 * Create a CSV export service instance
 */
export const createCSVExportService = (): CSVExportService => {
  return new CSVExportService();
};
