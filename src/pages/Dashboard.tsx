import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdvancedSOPRule } from '@/types/advanced';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Upload, 
  FileSpreadsheet, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Users,
  Database,
  Eye,
  MessageCircle
} from 'lucide-react';
import { AIProcessingQueue } from '@/components/AIProcessingQueue';
import { SOPManagementService } from '@/services/sopManagementService';
import { globalProcessingQueue } from '@/services/globalProcessingQueueService';

export const Dashboard = () => {
  console.log('🔍 Dashboard component rendering with Clear All SOPs button');
  
  const handleClearAllData = () => {
    console.log('🗑️ Clear All SOPs button clicked');
    if (window.confirm('⚠️ This will delete ALL SOPs, activity, and queue data. Are you sure?')) {
      // Clear SOP management data
      SOPManagementService.clearAllData();
      
      // Clear global processing queue
      globalProcessingQueue.clearAllData();
      
      // Refresh the page to show empty state
      window.location.reload();
    }
  };

  const activeSops = [
    {
      id: 1,
      name: 'Advanced Urology SOP',
      department: 'Urology Department',
      rulesCount: 142,
      queriesCount: 3,
      lastUpdated: '2024-01-15 3:45 PM',
      updatedBy: 'Dr. Sarah Chen',
      status: 'active'
    },
    {
      id: 2,
      name: 'Cardiology Procedures SOP',
      department: 'Heart Center',
      rulesCount: 89,
      queriesCount: 1,
      lastUpdated: '2024-01-14 2:20 PM',
      updatedBy: 'Dr. Michael Torres',
      status: 'active'
    },
    {
      id: 3,
      name: 'Emergency Medicine SOP',
      department: 'Emergency Department',
      rulesCount: 167,
      queriesCount: 5,
      lastUpdated: '2024-01-13 4:15 PM',
      updatedBy: 'Dr. Jennifer Park',
      status: 'active'
    }
  ];

  const draftSops = [
    {
      id: 4,
      name: 'Telehealth Guidelines SOP',
      department: 'General Practice',
      rulesCount: 23,
      queriesCount: 0,
      lastUpdated: '2024-01-12 1:30 PM',
      updatedBy: 'Dr. Robert Kim',
      status: 'draft'
    },
    {
      id: 5,
      name: 'Modifier 25 Updates SOP',
      department: 'Billing Department',
      rulesCount: 15,
      queriesCount: 2,
      lastUpdated: '2024-01-11 10:45 AM',
      updatedBy: 'Sarah Johnson',
      status: 'draft'
    }
  ];

  const recentActivity = [
    {
      id: 1,
      action: 'Created new SOP',
      rule: 'AU-MOD25-0023',
      description: 'BCBS modifier 25 rule for telehealth E&M',
      user: 'Sarah Chen',
      time: '2 hours ago',
      status: 'active'
    },
    {
      id: 2,
      action: 'Updated SOP',
      rule: 'AU-BOTOX-0001',
      description: 'Botox detrusor injection coding update',
      user: 'Michael Torres',
      time: '4 hours ago',
      status: 'review'
    },
    {
      id: 3,
      action: 'Imported document',
      rule: 'ANTHEM_Policy_2024.pdf',
      description: '23 rules extracted and pending review',
      user: 'AI Processing',
      time: '6 hours ago',
      status: 'pending'
    }
  ];


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'review':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Review</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const SOPCard = ({ sop }: { sop: any }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-foreground mb-1">{sop.name}</h3>
            <p className="text-sm text-muted-foreground mb-3">{sop.department}</p>
            
            <div className="flex items-center space-x-4 mb-3">
              <div className="flex items-center space-x-1">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{sop.rulesCount} Rules</span>
              </div>
              {sop.queriesCount > 0 && (
                <div className="flex items-center space-x-1">
                  <MessageCircle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">{sop.queriesCount} Queries</span>
                </div>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground">
              {sop.lastUpdated} by {sop.updatedBy}
            </p>
          </div>
          
          <div className="flex flex-col items-end space-y-2">
            {getStatusBadge(sop.status)}
            <Button size="sm" variant="outline">
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
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
        
        <div className="flex space-x-3">
          <Button 
            variant="destructive" 
            onClick={handleClearAllData}
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Clear All SOPs
          </Button>
          <Button variant="outline">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Upload Documents
          </Button>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Create New SOP
          </Button>
        </div>
      </div>

      {/* SOPs Overview with Tabs */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Standard Operating Procedures</CardTitle>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleClearAllData}
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Clear All SOPs
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="active">Active SOPs</TabsTrigger>
              <TabsTrigger value="draft">Draft SOPs</TabsTrigger>
              <TabsTrigger value="queries">Open Queries</TabsTrigger>
              <TabsTrigger value="recent">Recent Changes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeSops.map((sop) => (
                  <SOPCard key={sop.id} sop={sop} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="draft" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {draftSops.map((sop) => (
                  <SOPCard key={sop.id} sop={sop} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="queries" className="space-y-4 mt-6">
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-orange-500 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">8 total queries across all SOPs</p>
                <Button variant="outline" className="mt-3">View All Queries</Button>
              </div>
            </TabsContent>
            
            <TabsContent value="recent" className="space-y-4 mt-6">
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-foreground">{activity.action}</p>
                        <Badge 
                          variant={activity.status === 'active' ? 'default' : activity.status === 'review' ? 'secondary' : 'outline'}
                          className="text-xs"
                        >
                          {activity.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-primary font-mono">{activity.rule}</p>
                      <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-muted-foreground">{activity.user}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{activity.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-foreground">{activity.action}</p>
                      <Badge 
                        variant={activity.status === 'active' ? 'default' : activity.status === 'review' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {activity.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-primary font-mono">{activity.rule}</p>
                    <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-muted-foreground">{activity.user}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{activity.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Processing Queue */}
        <AIProcessingQueue 
          onSOPClick={(sopId) => {
            console.log('Navigate to SOP:', sopId);
            // TODO: Implement navigation to SOP detail page
          }}
        />
      </div>

    </div>
  );
};
