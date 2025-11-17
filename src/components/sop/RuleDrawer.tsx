
import React from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SOPRule } from '@/types/sop';
import { X, Plus, Clock, MessageCircle } from 'lucide-react';

interface RuleDrawerProps {
  rule: SOPRule | null;
  isOpen: boolean;
  onClose: () => void;
  onAddQuery?: (ruleId: string) => void;
}

export const RuleDrawer: React.FC<RuleDrawerProps> = ({ 
  rule, 
  isOpen, 
  onClose, 
  onAddQuery 
}) => {
  if (!rule) return null;

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="h-[80vh]">
        <DrawerHeader className="border-b">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-lg font-semibold">
              Rule Details: {rule.rule_id}
            </DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>
        
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Rule Details */}
          <div className="flex-1 p-6 overflow-y-auto border-r">
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-sm leading-relaxed">{rule.raw_description}</p>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Tokens</h3>
                <div className="flex flex-wrap gap-2">
                  {rule.tokens.map((token, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {token.type}: {token.value}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Metadata</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Effective:</span> {rule.meta.effective_date}
                  </div>
                  <div>
                    <span className="text-muted-foreground">End Date:</span> {rule.meta.end_date || 'None'}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Chart Section:</span> {rule.meta.chart_section}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Triggers:</span> {rule.meta.triggers.join(', ')}
                  </div>
                </div>
              </div>
              
              {rule.codes_selected && rule.codes_selected.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Codes</h3>
                  <div className="flex flex-wrap gap-2">
                    {rule.codes_selected.map((code, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {code}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Panel - Activity */}
          <div className="w-80 p-6 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Query Thread</h3>
                <Button 
                  size="sm" 
                  onClick={() => onAddQuery?.(rule.rule_id)}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add Query
                </Button>
              </div>
              
              <div className="space-y-3">
                {rule.query_count > 0 ? (
                  <div className="text-sm text-muted-foreground">
                    {rule.query_count} queries found
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No queries yet
                  </div>
                )}
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  History
                </h4>
                <div className="text-sm text-muted-foreground">
                  <div>Last updated: {rule.meta.last_updated}</div>
                  <div>By: {rule.meta.updated_by}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
