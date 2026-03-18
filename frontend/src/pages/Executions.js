import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, CheckCircle, XCircle, Clock, Loader, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Executions = ({ user }) => {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('garvis_token')}` }
  });

  useEffect(() => {
    fetchExecutions();
    const interval = setInterval(fetchExecutions, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchExecutions = async () => {
    try {
      const response = await axios.get(`${API}/executions?limit=50`, getAuthHeaders());
      setExecutions(response.data);
    } catch (error) {
      console.error('Failed to fetch executions:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewDetails = async (executionId) => {
    try {
      const response = await axios.get(`${API}/executions/${executionId}`, getAuthHeaders());
      setSelectedExecution(response.data);
      setDetailsOpen(true);
    } catch (error) {
      console.error('Failed to fetch execution details:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <Loader className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <Play className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      completed: 'bg-green-500/10 text-green-500',
      failed: 'bg-red-500/10 text-red-500',
      running: 'bg-blue-500/10 text-blue-500',
      pending: 'bg-yellow-500/10 text-yellow-500',
      cancelled: 'bg-gray-500/10 text-gray-500'
    };
    return colors[status] || 'bg-gray-500/10 text-gray-500';
  };

  if (loading) {
    return <div className="text-gray-400">Loading executions...</div>;
  }

  return (
    <div className="space-y-6" data-testid="executions-page">
      <div>
        <h1 className="text-3xl font-bold text-white">Execution History</h1>
        <p className="text-gray-400 mt-2">Monitor and review task executions</p>
      </div>

      {executions.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-12 text-center">
            <Play className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No executions yet</p>
            <p className="text-gray-500 text-sm mt-2">Execute a task to see it here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {executions.map((execution) => (
            <Card key={execution.id} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors" data-testid="execution-card">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="mt-1">
                      {getStatusIcon(execution.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{execution.task_name}</h3>
                        <Badge className={getStatusBadge(execution.status)}>
                          {execution.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {execution.operator_type}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Started:</span>
                          <p className="text-gray-300">{new Date(execution.started_at).toLocaleString()}</p>
                        </div>
                        {execution.completed_at && (
                          <div>
                            <span className="text-gray-500">Completed:</span>
                            <p className="text-gray-300">{new Date(execution.completed_at).toLocaleString()}</p>
                          </div>
                        )}
                        {execution.duration_seconds && (
                          <div>
                            <span className="text-gray-500">Duration:</span>
                            <p className="text-gray-300">{execution.duration_seconds.toFixed(2)}s</p>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">Execution ID:</span>
                          <p className="text-gray-300 text-xs font-mono truncate">{execution.id}</p>
                        </div>
                      </div>
                      {execution.error && (
                        <div className="mt-3 p-3 bg-red-900/20 border border-red-500/20 rounded text-sm text-red-400">
                          <strong>Error:</strong> {execution.error}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => viewDetails(execution.id)}
                    className="border-gray-700 hover:bg-gray-800"
                    data-testid="view-execution-button"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <span>Execution Details</span>
              {selectedExecution && (
                <Badge className={getStatusBadge(selectedExecution.status)}>
                  {selectedExecution.status}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedExecution && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-800 rounded-lg">
                <div>
                  <p className="text-gray-500 text-sm">Task Name</p>
                  <p className="text-white font-semibold">{selectedExecution.task_name}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Operator Type</p>
                  <p className="text-white font-semibold">{selectedExecution.operator_type}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Started At</p>
                  <p className="text-white">{new Date(selectedExecution.started_at).toLocaleString()}</p>
                </div>
                {selectedExecution.completed_at && (
                  <div>
                    <p className="text-gray-500 text-sm">Completed At</p>
                    <p className="text-white">{new Date(selectedExecution.completed_at).toLocaleString()}</p>
                  </div>
                )}
                {selectedExecution.duration_seconds && (
                  <div>
                    <p className="text-gray-500 text-sm">Duration</p>
                    <p className="text-white">{selectedExecution.duration_seconds.toFixed(2)} seconds</p>
                  </div>
                )}
              </div>

              {selectedExecution.logs && selectedExecution.logs.length > 0 && (
                <div>
                  <h3 className="text-white font-semibold mb-2">Execution Logs</h3>
                  <ScrollArea className="h-[200px] w-full rounded-md border border-gray-800 bg-gray-950 p-4">
                    <div className="space-y-1 font-mono text-xs">
                      {selectedExecution.logs.map((log, index) => (
                        <div key={index} className="text-gray-300">
                          {log}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {selectedExecution.result && (
                <div>
                  <h3 className="text-white font-semibold mb-2">Result</h3>
                  <div className="p-4 bg-gray-950 rounded-md border border-gray-800">
                    <pre className="text-sm text-gray-300 overflow-x-auto">
                      {JSON.stringify(selectedExecution.result, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {selectedExecution.error && (
                <div>
                  <h3 className="text-red-400 font-semibold mb-2">Error</h3>
                  <div className="p-4 bg-red-900/20 border border-red-500/20 rounded text-sm text-red-400">
                    {selectedExecution.error}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Executions;
