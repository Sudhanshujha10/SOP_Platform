import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Trash2, 
  RotateCcw, 
  AlertTriangle,
  Calendar,
  User,
  FileText,
  Building2
} from 'lucide-react';
import { SOP } from '@/types/sop-management';
import { SOPManagementService } from '@/services/sopManagementService';
import { useToast } from '@/hooks/use-toast';

export const DeletedSOPs = () => {
  const [deletedSOPs, setDeletedSOPs] = useState<SOP[]>([]);
  const [selectedSOP, setSelectedSOP] = useState<SOP | null>(null);
  const [actionType, setActionType] = useState<'restore' | 'permanent' | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadDeletedSOPs();
  }, []);

  const loadDeletedSOPs = () => {
    const deleted = SOPManagementService.getDeletedSOPs();
    setDeletedSOPs(deleted);
  };

  const handleRestore = (sop: SOP) => {
    setSelectedSOP(sop);
    setActionType('restore');
  };

  const handlePermanentDelete = (sop: SOP) => {
    setSelectedSOP(sop);
    setActionType('permanent');
  };

  const confirmRestore = () => {
    if (!selectedSOP) return;

    const restored = SOPManagementService.restoreSOP(selectedSOP.id, 'Current User');
    
    if (restored) {
      toast({
        title: 'SOP Restored',
        description: `"${selectedSOP.name}" has been restored to ${restored.status} status.`,
      });
      loadDeletedSOPs();
    } else {
      toast({
        title: 'Restore Failed',
        description: 'Failed to restore the SOP. Please try again.',
        variant: 'destructive'
      });
    }

    setSelectedSOP(null);
    setActionType(null);
  };

  const confirmPermanentDelete = () => {
    if (!selectedSOP) return;

    const deleted = SOPManagementService.permanentlyDeleteSOP(selectedSOP.id, 'Current User');
    
    if (deleted) {
      toast({
        title: 'SOP Permanently Deleted',
        description: `"${selectedSOP.name}" has been permanently deleted and cannot be recovered.`,
      });
      loadDeletedSOPs();
    } else {
      toast({
        title: 'Delete Failed',
        description: 'Failed to permanently delete the SOP. Please try again.',
        variant: 'destructive'
      });
    }

    setSelectedSOP(null);
    setActionType(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Trash2 className="h-8 w-8 mr-3 text-red-500" />
            Deleted SOPs (Trash)
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage deleted SOPs - restore or permanently delete
          </p>
        </div>
        
        <Badge variant="outline" className="text-lg px-4 py-2">
          {deletedSOPs.length} Deleted SOP{deletedSOPs.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Empty State */}
      {deletedSOPs.length === 0 && (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <Trash2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Deleted SOPs</h3>
              <p className="text-sm text-gray-500">
                Deleted SOPs will appear here and can be restored or permanently deleted.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deleted SOPs List */}
      {deletedSOPs.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {deletedSOPs.map((sop) => (
            <Card key={sop.id} className="border-red-200 bg-red-50/30">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-red-500" />
                      {sop.name}
                      <Badge variant="destructive" className="ml-2">
                        Deleted
                      </Badge>
                      {sop.previous_status && (
                        <Badge variant="outline" className="ml-2">
                          Was: {sop.previous_status}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2 space-y-1">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          {sop.organisation_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {sop.rules_count} rules
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-red-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Deleted: {sop.deleted_at ? formatDate(sop.deleted_at) : 'Unknown'}
                        </span>
                        {sop.deleted_by && (
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            By: {sop.deleted_by}
                          </span>
                        )}
                      </div>
                    </CardDescription>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(sop)}
                      className="border-green-300 text-green-700 hover:bg-green-50"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restore
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handlePermanentDelete(sop)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Forever
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={actionType === 'restore'} onOpenChange={() => setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-green-600" />
              Restore SOP?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore <strong>"{selectedSOP?.name}"</strong>?
              <br /><br />
              This SOP will be restored to its previous status ({selectedSOP?.previous_status || 'draft'}) 
              and all its rules and data will be available again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRestore}
              className="bg-green-600 hover:bg-green-700"
            >
              Restore SOP
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent Delete Confirmation Dialog */}
      <AlertDialog open={actionType === 'permanent'} onOpenChange={() => setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Permanently Delete SOP?
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p className="font-semibold text-red-600">
                  ⚠️ This action cannot be undone!
                </p>
                <p>
                  Are you sure you want to permanently delete <strong>"{selectedSOP?.name}"</strong>?
                </p>
                <p>
                  This will permanently remove:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>The SOP and all its metadata</li>
                  <li>All {selectedSOP?.rules_count || 0} associated rules</li>
                  <li>All document references</li>
                  <li>All history and activity logs</li>
                </ul>
                <p className="font-semibold mt-4">
                  This data will be lost forever and cannot be recovered.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPermanentDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Permanently Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
