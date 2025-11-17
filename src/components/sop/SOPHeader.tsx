
import { Button } from '@/components/ui/button';
import { 
  Download, 
  Upload, 
  FileText, 
  Plus 
} from 'lucide-react';

interface SOPHeaderProps {
  title: string;
  totalRules: number;
  lastUpdated: string;
  lastUpdatedBy: string;
}

export const SOPHeader = ({ title, totalRules, lastUpdated, lastUpdatedBy }: SOPHeaderProps) => {
  return (
    <div className="flex justify-between items-start mb-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">{title}</h1>
        <p className="text-sm text-muted-foreground">
          ({totalRules} of {totalRules} rules) • Last updated: {lastUpdated} by {lastUpdatedBy}
        </p>
      </div>
      
      <div className="flex space-x-3">
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Upload Excel
        </Button>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Upload Documents
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </Button>
      </div>
    </div>
  );
};
