
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { SOPRuleMeta } from '@/types/sop';

interface MetaChipsProps {
  meta: SOPRuleMeta;
  onChipClick?: (type: string, value: string) => void;
}

export const MetaChips: React.FC<MetaChipsProps> = ({ meta, onChipClick }) => {
  // Always show all 5 chips in exact order
  const chips = [
    { type: 'effective', label: 'Effective', value: meta.effective_date || '2024-01-01' },
    { type: 'triggers', label: 'Triggers', value: meta.triggers?.join(', ') || 'UA, E&M' },
    { type: 'end_date', label: 'End', value: meta.end_date || '2025-12-31' },
    { type: 'chart_section', label: 'Chart Section', value: meta.chart_section || 'ASSESSMENT_PLAN' },
    { type: 'chart_id', label: 'Chart-ID', value: meta.chart_id ? `#${meta.chart_id}` : '#UROL-001' }
  ];

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {chips.map((chip, index) => (
        <Badge
          key={index}
          variant="outline"
          className="text-xs cursor-pointer hover:bg-muted/50 bg-muted/20"
          onClick={() => onChipClick?.(chip.type, chip.value)}
        >
          {chip.label}: {chip.value}
        </Badge>
      ))}
    </div>
  );
};
