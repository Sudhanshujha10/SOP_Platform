
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  ChevronDown 
} from 'lucide-react';

interface SOPFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onFilterChange?: (filterType: string, value: string) => void;
}

export const SOPFilters = ({ searchTerm, onSearchChange, onFilterChange }: SOPFiltersProps) => {
  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      <div className="flex flex-col space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search description, codes, actions…"
            className="pl-10 h-10"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        {/* Filter Dropdowns */}
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" className="h-9">
            Code Group
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
          <Button variant="outline" size="sm" className="h-9">
            Payer Group
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
          <Button variant="outline" size="sm" className="h-9">
            Provider Group
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
          <Button variant="outline" size="sm" className="h-9">
            Action
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
          <Button variant="outline" size="sm" className="h-9">
            Status
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};
