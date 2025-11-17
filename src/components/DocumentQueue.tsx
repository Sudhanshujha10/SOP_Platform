import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2,
  Trash2,
  Play,
  Pause,
  AlertCircle
} from 'lucide-react';
import { DocumentQueueItem, ProcessingQueue } from '@/types/advanced';
import { DocumentQueueService } from '@/services/documentQueueService';

interface DocumentQueueProps {
  apiKey: string;
  clientPrefix: string;
  onBatchComplete: (rules: any[]) => void;
}

export const DocumentQueue = ({ apiKey, clientPrefix, onBatchComplete }: DocumentQueueProps) => {
  const [queueService] = useState(() => new DocumentQueueService(apiKey, clientPrefix));
  const [queue, setQueue] = useState<ProcessingQueue>(queueService.getQueue());
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useEffect(() => {
    queueService.onProgress((updatedQueue) => {
      setQueue(updatedQueue);
    });

    queueService.onComplete((item) => {
      console.log(`Document ${item.fileName} completed with ${item.rulesExtracted} rules`);
    });
  }, [queueService]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  };

  const handleAddToQueue = () => {
    if (selectedFiles.length > 0) {
      queueService.addDocuments(selectedFiles);
      setSelectedFiles([]);
      // Reset file input
      const fileInput = document.getElementById('queue-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  const handleStartProcessing = async () => {
    await queueService.startProcessing();
    
    // Get all extracted rules when processing completes
    const allRules = queueService.getAllExtractedRules();
    if (allRules.length > 0) {
      onBatchComplete(allRules);
    }
  };

  const handleCancelProcessing = () => {
    queueService.cancelProcessing();
  };

  const handleRemoveDocument = (docId: string) => {
    queueService.removeDocument(docId);
  };

  const handleClearCompleted = () => {
    queueService.clearCompleted();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getStatusIcon = (status: DocumentQueueItem['status']) => {
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

  const getStatusBadge = (status: DocumentQueueItem['status']) => {
    const variants: Record<DocumentQueueItem['status'], string> = {
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

  const currentItem = queue.currentIndex >= 0 ? queue.items[queue.currentIndex] : null;

  return (
    <div className="space-y-4">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Sequential Document Processing</CardTitle>
          <CardDescription>
            Upload multiple documents - they will be processed one at a time to ensure quality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <input
              type="file"
              id="queue-file-input"
              className="hidden"
              accept=".pdf,.docx,.doc,.csv,.xlsx"
              multiple
              onChange={handleFileSelect}
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById('queue-file-input')?.click()}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Select Files
            </Button>
            <Button
              onClick={handleAddToQueue}
              disabled={selectedFiles.length === 0}
            >
              Add to Queue ({selectedFiles.length})
            </Button>
          </div>

          {selectedFiles.length > 0 && (
            <div className="text-sm text-gray-600">
              Selected: {selectedFiles.map(f => f.name).join(', ')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Queue Status */}
      {queue.items.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Processing Queue</CardTitle>
                <CardDescription>
                  {queue.completedDocuments} of {queue.totalDocuments} documents completed
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {!queue.isProcessing && queue.items.some(i => i.status === 'queued') && (
                  <Button onClick={handleStartProcessing}>
                    <Play className="h-4 w-4 mr-2" />
                    Start Processing
                  </Button>
                )}
                {queue.isProcessing && (
                  <Button variant="destructive" onClick={handleCancelProcessing}>
                    <Pause className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                )}
                {queue.completedDocuments > 0 && !queue.isProcessing && (
                  <Button variant="outline" onClick={handleClearCompleted}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Completed
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Overall Progress */}
            {queue.isProcessing && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">
                      Processing document {queue.currentIndex + 1} of {queue.totalDocuments}
                    </p>
                    {queue.estimatedTotalTime > 0 && (
                      <p className="text-sm text-gray-600">
                        Estimated time remaining: {formatTime(queue.estimatedTotalTime)}
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Current Document Details */}
            {currentItem && currentItem.status === 'processing' && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                        <span className="font-medium">{currentItem.fileName}</span>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">
                        {currentItem.rulesExtracted} rules found
                      </Badge>
                    </div>
                    <Progress value={currentItem.progress} className="h-2" />
                    <p className="text-sm text-gray-600">
                      {currentItem.progress}% complete - Extracting rules...
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Document List */}
            <div className="space-y-2">
              {queue.items.map((item, index) => (
                <div
                  key={item.id}
                  className={`border rounded-lg p-4 ${
                    index === queue.currentIndex ? 'border-blue-300 bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getStatusIcon(item.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="font-medium truncate">{item.fileName}</span>
                          {getStatusBadge(item.status)}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            {formatFileSize(item.fileSize)} • {item.fileType.toUpperCase()}
                          </p>
                          {item.status === 'processing' && (
                            <>
                              <Progress value={item.progress} className="h-1 my-2" />
                              <p>{item.progress}% complete</p>
                            </>
                          )}
                          {item.status === 'completed' && (
                            <p className="text-green-600 font-medium">
                              ✓ {item.rulesExtracted} rules extracted
                            </p>
                          )}
                          {item.status === 'error' && (
                            <p className="text-red-600 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {item.errorMessage}
                            </p>
                          )}
                          {item.status === 'queued' && item.estimatedTimeRemaining > 0 && (
                            <p className="text-gray-500">
                              Est. {formatTime(item.estimatedTimeRemaining)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    {(item.status === 'queued' || item.status === 'error') && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveDocument(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
