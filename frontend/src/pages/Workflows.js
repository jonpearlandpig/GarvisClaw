import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GitBranch, Play, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Workflows = ({ user }) => {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('garvis_token')}` }
  });

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const response = await axios.get(`${API}/workflows`, getAuthHeaders());
      setWorkflows(response.data);
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
      toast.error('Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async (workflowId) => {
    try {
      await axios.post(`${API}/workflows/${workflowId}/execute`, {}, getAuthHeaders());
      toast.success('Workflow execution started!');
      setTimeout(() => navigate('/executions'), 1000);
    } catch (error) {
      console.error('Failed to execute workflow:', error);
      toast.error('Failed to execute workflow');
    }
  };

  if (loading) {
    return <div className="text-gray-400">Loading workflows...</div>;
  }

  return (
    <div className="space-y-6" data-testid="workflows-page">
      <Toaster />
      
      <div>
        <h1 className="text-3xl font-bold text-white">Workflows</h1>
        <p className="text-gray-400 mt-2">Multi-step task automation sequences</p>
      </div>

      {workflows.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-12 text-center">
            <GitBranch className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No workflows yet</p>
            <p className="text-gray-500 text-sm mt-2">Coming soon: Visual workflow builder</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((workflow) => (
            <Card key={workflow.id} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-white text-lg">{workflow.name}</CardTitle>
                    <Badge className="mt-2 bg-purple-500/10 text-purple-500">
                      {workflow.steps.length} steps
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm mb-4">{workflow.description}</p>
                <Button
                  size="sm"
                  onClick={() => handleExecute(workflow.id)}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Execute Workflow
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Workflows;