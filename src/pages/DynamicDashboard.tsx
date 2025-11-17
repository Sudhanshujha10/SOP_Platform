import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Database,
  Eye,
  Plus,
  Loader2,
  Building2,
  Calendar,
  User,
  Trash2,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { SOP, RecentActivity, ProcessingQueueItem, DashboardStats } from '@/types/sop-management';
import { SOPManagementService } from '@/services/sopManagementService';
import { AIProcessingQueue } from '@/components/AIProcessingQueue';
import { useToast } from '@/hooks/use-toast';

interface DynamicDashboardProps {
  onCreateNewSOP: () => void;
  onViewSOP: (sopId: string) => void;
}

export const DynamicDashboard = ({ onCreateNewSOP, onViewSOP }: DynamicDashboardProps) => {
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    total_sops: 0,
    active_sops: 0,
    draft_sops: 0,
    deleted_sops: 0,
    total_rules: 0,
    documents_processing: 0,
    recent_activity_count: 0
  });
  const [sops, setSops] = useState<SOP[]>([]);
  const [activeSops, setActiveSops] = useState<SOP[]>([]);
  const [draftSops, setDraftSops] = useState<SOP[]>([]);
  const [deletedSOPs, setDeletedSOPs] = useState<SOP[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [processingQueue, setProcessingQueue] = useState<ProcessingQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSOP, setSelectedSOP] = useState<SOP | null>(null);
  const [actionType, setActionType] = useState<'restore' | 'permanent' | null>(null);

  useEffect(() => {
    loadDashboardData();
    
    // Refresh every 2 seconds for real-time updates
    const interval = setInterval(loadDashboardData, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = () => {
    // Load statistics
    const dashboardStats = SOPManagementService.getDashboardStats();
    setStats(dashboardStats);

    // Load SOPs
    const allSOPs = SOPManagementService.getAllSOPs();
    setActiveSops(allSOPs.filter(sop => sop.status === 'active'));
    setDraftSops(allSOPs.filter(sop => sop.status === 'draft'));
    setDeletedSOPs(SOPManagementService.getDeletedSOPs());

    // Load recent activity (last 5)
    const activity = SOPManagementService.getRecentActivity(5);
    setRecentActivity(activity);

    // Load processing queue
    const queue = SOPManagementService.getProcessingQueue();
    setProcessingQueue(queue);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'review':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Review</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleDeleteSOP = (sopId: string, sopName: string) => {
    if (window.confirm(`Are you sure you want to delete "${sopName}"? It will be moved to trash and can be restored later.`)) {
      const deleted = SOPManagementService.softDeleteSOP(sopId, 'Current User');
      if (deleted) {
        loadDashboardData(); // Refresh the dashboard
      }
    }
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
      loadDashboardData();
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
      loadDashboardData();
    } else {
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete the SOP. Please try again.',
        variant: 'destructive'
      });
    }

    setSelectedSOP(null);
    setActionType(null);
  };

  const SOPCard = ({ sop }: { sop: SOP }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-foreground mb-1">{sop.name}</h3>
            
            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-3 w-3" />
                <span>{sop.organisation_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-3 w-3" />
                <span>{sop.department}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 mb-3">
              <div className="flex items-center space-x-1">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{sop.rules_count} Rules</span>
              </div>
            </div>
            
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                <span>{new Date(sop.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-3 w-3" />
                <span>{sop.created_by}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-2">
            {getStatusBadge(sop.status)}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onViewSOP(sop.id)}>
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={() => handleDeleteSOP(sop.id, sop.name)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your SOP management platform</p>
        </div>
        
        <Button onClick={onCreateNewSOP} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Create New SOP
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{stats.total_sops}</div>
              <div className="text-sm text-gray-600 mt-1">Total SOPs</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.active_sops}</div>
              <div className="text-sm text-gray-600 mt-1">Active SOPs</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{stats.draft_sops}</div>
              <div className="text-sm text-gray-600 mt-1">Draft SOPs</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.total_rules}</div>
              <div className="text-sm text-gray-600 mt-1">Total Rules</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{stats.documents_processing}</div>
              <div className="text-sm text-gray-600 mt-1">Processing</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SOPs Overview with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Standard Operating Procedures</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">
                Active SOPs ({activeSops.length})
              </TabsTrigger>
              <TabsTrigger value="draft">
                Draft SOPs ({draftSops.length})
              </TabsTrigger>
              <TabsTrigger value="recent">
                Recent Changes ({deletedSOPs.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="space-y-4 mt-6">
              {activeSops.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active SOPs yet</p>
                  <p className="text-sm mt-2">Create your first SOP to get started</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeSops.map((sop) => (
                    <SOPCard key={sop.id} sop={sop} />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="draft" className="space-y-4 mt-6">
              {draftSops.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No draft SOPs</p>
                  <p className="text-sm mt-2">Draft SOPs appear here when created without documents</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {draftSops.map((sop) => (
                    <SOPCard key={sop.id} sop={sop} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="recent" className="space-y-4 mt-6">
              {deletedSOPs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Trash2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No deleted SOPs</p>
                  <p className="text-sm mt-2">Deleted SOPs will appear here and can be restored</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {deletedSOPs.map((sop) => (
                    <div
                      key={sop.id}
                      className="border border-red-200 bg-red-50/30 rounded-lg p-5 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* SOP Header */}
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="font-semibold text-lg text-gray-900">{sop.name}</h3>
                            <Badge className="bg-red-500 text-white">Deleted</Badge>
                            {sop.previous_status && (
                              <Badge variant="outline" className="border-gray-300">
                                Was: {sop.previous_status}
                              </Badge>
                            )}
                          </div>

                          {/* SOP Details */}
                          <div className="space-y-2 mb-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Building2 className="h-3 w-3" />
                              <span>{sop.organisation_name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <FileText className="h-3 w-3" />
                              <span>{sop.department}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <FileText className="h-4 w-4 text-primary" />
                              <span className="font-medium">{sop.rules_count} Rules</span>
                            </div>
                          </div>

                          {/* Deletion Info */}
                          <div className="space-y-1 text-xs text-gray-500">
                            {sop.deleted_at && (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3" />
                                <span>Deleted: {new Date(sop.deleted_at).toLocaleDateString()}</span>
                              </div>
                            )}
                            {sop.deleted_by && (
                              <div className="flex items-center gap-2">
                                <User className="h-3 w-3" />
                                <span>By: {sop.deleted_by}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRestore(sop)}
                            className="border-green-500 text-green-700 hover:bg-green-50"
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Restore
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handlePermanentDelete(sop)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete Forever
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={actionType === 'restore'} onOpenChange={() => setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore SOP?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore "{selectedSOP?.name}"?
              {selectedSOP?.previous_status && (
                <span className="block mt-2 font-medium">
                  It will be restored to <span className="text-green-600">{selectedSOP.previous_status}</span> status.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRestore} className="bg-green-600 hover:bg-green-700">
              Restore
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
                <p className="font-medium">
                  Are you sure you want to permanently delete "{selectedSOP?.name}"?
                </p>
                <p className="text-red-600 font-semibold">This action cannot be undone!</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>The SOP will be removed from the database</li>
                  <li>All {selectedSOP?.rules_count} rules will be deleted</li>
                  <li>All associated documents will be removed</li>
                  <li>This SOP cannot be recovered</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPermanentDelete} className="bg-red-600 hover:bg-red-700">
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest 5 actions in the system</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm font-medium text-foreground">{activity.type.replace(/_/g, ' ').toUpperCase()}</p>
                        {getStatusBadge(activity.status)}
                      </div>
                      {activity.sop_name && (
                        <p className="text-sm text-primary font-medium">{activity.sop_name}</p>
                      )}
                      <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-muted-foreground">{activity.user}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{formatTimeAgo(activity.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Processing Queue */}
        <AIProcessingQueue 
          onSOPClick={(sopId) => {
            console.log('Navigate to SOP:', sopId);
            onViewSOP(sopId);
          }}
        />
      </div>
    </div>
  );
};
