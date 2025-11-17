
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface CodeChipsProps {
  codes_selected?: string[];
  onCodeClick?: (code: string) => void;
}

export const CodeChips: React.FC<CodeChipsProps> = ({ 
  codes_selected, 
  onCodeClick 
}) => {
  if (codes_selected && codes_selected.length > 0) {
    return (
      <div className="flex flex-wrap gap-1">
        {codes_selected.map((code, index) => (
          <Badge
            key={index}
            variant="outline"
            className="text-xs cursor-pointer hover:bg-muted/50"
            onClick={() => onCodeClick?.(code)}
          >
            {code}
          </Badge>
        ))}
      </div>
    );
  }
  
  return null;
};
