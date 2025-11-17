import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2,
  Trash2,
  ExternalLink,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  Database
} from 'lucide-react';
import { globalProcessingQueue, ProcessingQueueItem } from '@/services/globalProcessingQueueService';

interface AIProcessingQueueProps {
  onSOPClick?: (sopId: string) => void;
}

export const AIProcessingQueue = ({ onSOPClick }: AIProcessingQueueProps) => {
  const [queueItems, setQueueItems] = useState<ProcessingQueueItem[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    processing: 0,
    queued: 0,
    errors: 0,
    isProcessing: false
  });

  useEffect(() => {
    console.log('🔄 AIProcessingQueue component mounting, setting up subscription...');
    
    // CRITICAL: Load existing queue items FIRST before subscribing
    const existingItems = globalProcessingQueue.getQueue();
    console.log('🔄 AIProcessingQueue IMMEDIATE load BEFORE subscription:', existingItems.length, 'items', existingItems);
    if (existingItems.length > 0) {
      console.log('⚠️ FOUND EXISTING ITEMS IN QUEUE - Loading immediately!');
      setQueueItems([...existingItems]);
      setStats(globalProcessingQueue.getStats());
    }
    
    // Subscribe to queue updates
    const unsubscribe = globalProcessingQueue.subscribe((items) => {
      console.log('🔄 AIProcessingQueue received update via subscription:', items.length, 'items', items);
      setQueueItems([...items]); // Force new array reference
      setStats(globalProcessingQueue.getStats());
    });

    // Double-check after subscription
    const postSubscribeItems = globalProcessingQueue.getQueue();
    console.log('🔄 AIProcessingQueue post-subscription check:', postSubscribeItems.length, 'items');
    if (postSubscribeItems.length > 0 && postSubscribeItems.length !== existingItems.length) {
      console.log('⚠️ Queue changed during subscription setup - updating!');
      setQueueItems([...postSubscribeItems]);
      setStats(globalProcessingQueue.getStats());
    }

    // Set up a periodic check as backup
    const backupInterval = setInterval(() => {
      const currentItems = globalProcessingQueue.getQueue();
      setQueueItems(prevItems => {
        if (currentItems.length !== prevItems.length) {
          console.log('🔄 Backup check found queue changes, updating UI...');
          setStats(globalProcessingQueue.getStats());
          return [...currentItems];
        }
        return prevItems;
      });
    }, 1000);

    // Auto-remove completed items after 5 seconds
    const autoRemoveInterval = setInterval(() => {
      const currentItems = globalProcessingQueue.getQueue();
      const completedItems = currentItems.filter(item => {
        if (item.status === 'completed' && item.completedAt) {
          const completedTime = new Date(item.completedAt).getTime();
          const now = new Date().getTime();
          const secondsSinceCompletion = (now - completedTime) / 1000;
          return secondsSinceCompletion > 5; // Remove after 5 seconds
        }
        return false;
      });

      if (completedItems.length > 0) {
        console.log(`🗑️ Auto-removing ${completedItems.length} completed items...`);
        completedItems.forEach(item => {
          globalProcessingQueue.removeItem(item.id);
        });
      }
    }, 2000);

    return () => {
      console.log('🔄 AIProcessingQueue component unmounting, cleaning up...');
      unsubscribe();
      clearInterval(backupInterval);
      clearInterval(autoRemoveInterval);
    };
  }, []);

  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getStatusIcon = (status: ProcessingQueueItem['status']) => {
    switch (status) {
      case 'queued':
        return <Clock className="h-4 w-4 text-gray-400" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: ProcessingQueueItem['status']) => {
    const variants: Record<ProcessingQueueItem['status'], string> = {
      queued: 'bg-gray-100 text-gray-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-600'
    };

    return (
      <Badge className={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleRemoveItem = (itemId: string) => {
    globalProcessingQueue.removeItem(itemId);
  };

  const handleClearCompleted = () => {
    globalProcessingQueue.clearCompleted();
  };

  const handleCancelProcessing = () => {
    globalProcessingQueue.cancelProcessing();
  };

  const handleRetryProcessing = (itemId: string) => {
    console.log('🔄 Retry processing requested for item:', itemId);
    globalProcessingQueue.retryItem(itemId);
  };

  const handleDebugQueue = () => {
    console.log('🔍 Debug Queue State:');
    console.log('   - Queue Items:', queueItems);
    console.log('   - Stats:', stats);
    console.log('   - Global Queue:', globalProcessingQueue.getQueue());
    console.log('   - Global Stats:', globalProcessingQueue.getStats());
  };

  const handleAddTestItem = () => {
    console.log('🧪 Adding test item to queue...');
    
    // Create a dummy file for testing
    const testFile = new File(['test content'], 'test-document.pdf', { type: 'application/pdf' });
    
    globalProcessingQueue.addToQueue(
      [testFile],
      'test-sop-123',
      'Test SOP',
      'TEST',
      'Test User'
    );
  };

  const handleForceRefresh = () => {
    console.log('🔄 Force refreshing queue state...');
    const currentQueue = globalProcessingQueue.getQueue();
    const currentStats = globalProcessingQueue.getStats();
    console.log('   - Current Queue:', currentQueue);
    console.log('   - Current Stats:', currentStats);
    setQueueItems(currentQueue);
    setStats(currentStats);
  };

  const currentProcessingItem = queueItems.find(item => item.status === 'processing');

  // Debug: Always log the current state
  console.log('🔍 AIProcessingQueue render:', {
    queueItemsCount: queueItems.length,
    queueItems: queueItems,
    stats: stats
  });

  console.log('✅ AIProcessingQueue: Rendering', queueItems.length, 'items');

  return (
    <Card className="bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <Database className="h-6 w-6" />
          AI Processing Queue
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Empty State */}
        {queueItems.length === 0 && (
          <div className="text-center py-12">
            <Database className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Documents Processing</h3>
            <p className="text-sm text-gray-500">
              Upload documents via "Create New SOP" to see processing status here
            </p>
          </div>
        )}

        {/* Queue Items - Clean Design */}
        {queueItems.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-sm transition-shadow"
          >
            {/* Header: Filename and Status Badge */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900 truncate flex-1 mr-4">
                {item.fileName}
              </h3>
              <Badge 
                className={`
                  px-3 py-1 text-sm font-medium rounded-full
                  ${item.status === 'processing' ? 'bg-blue-500 text-white' : ''}
                  ${item.status === 'queued' ? 'bg-gray-500 text-white' : ''}
                  ${item.status === 'completed' ? 'bg-green-500 text-white' : ''}
                  ${item.status === 'error' ? 'bg-red-500 text-white' : ''}
                `}
              >
                {item.status === 'processing' && 'processing'}
                {item.status === 'queued' && 'queued'}
                {item.status === 'completed' && 'completed'}
                {item.status === 'error' && 'error'}
              </Badge>
            </div>

            {/* Progress Bar - Only for processing and queued */}
            {(item.status === 'processing' || item.status === 'queued') && (
              <div className="mb-2">
                <div className="flex items-center gap-3 mb-1">
                  <Progress 
                    value={item.progress} 
                    className="h-2 bg-gray-200 flex-1"
                    style={{
                      '--progress-background': item.status === 'processing' ? '#3b82f6' : '#9ca3af'
                    } as React.CSSProperties}
                  />
                  <span className="text-sm font-semibold text-gray-700 min-w-[45px] text-right">
                    {item.progress}%
                  </span>
                </div>
              </div>
            )}

            {/* Time Remaining - Only for processing */}
            {item.status === 'processing' && item.estimatedTimeRemaining > 0 && (
              <p className="text-sm text-gray-600">
                {Math.floor(item.estimatedTimeRemaining / 60)} min remaining
              </p>
            )}

            {/* Queued Message */}
            {item.status === 'queued' && (
              <p className="text-sm text-gray-600">
                Waiting in queue
              </p>
            )}

            {/* Completed Message */}
            {item.status === 'completed' && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-green-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  {item.rulesExtracted} rules extracted successfully
                </p>
                {onSOPClick && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSOPClick(item.sopId)}
                    className="text-xs"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View SOP
                  </Button>
                )}
              </div>
            )}

            {/* Error Message */}
            {item.status === 'error' && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {item.errorMessage || 'Processing failed'}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRetryProcessing(item.id)}
                  className="text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
