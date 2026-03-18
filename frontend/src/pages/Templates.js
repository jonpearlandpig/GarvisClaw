import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Templates = ({ user }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [useDialogOpen, setUseDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [taskName, setTaskName] = useState('');

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('garvis_token')}` }
  });

  const canEdit = user.role === 'admin' || user.role === 'editor';

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API}/templates`, getAuthHeaders());
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = async () => {
    if (!taskName) {
      toast.error('Please enter a task name');
      return;
    }

    try {
      await axios.post(
        `${API}/templates/${selectedTemplate.id}/use?task_name=${encodeURIComponent(taskName)}`,
        {},
        getAuthHeaders()
      );
      toast.success('Task created from template!');
      setUseDialogOpen(false);
      setTaskName('');
      setSelectedTemplate(null);
    } catch (error) {
      console.error('Failed to use template:', error);
      toast.error(error.response?.data?.detail || 'Failed to create task from template');
    }
  };

  const openUseDialog = (template) => {
    setSelectedTemplate(template);
    setTaskName(template.name);
    setUseDialogOpen(true);
  };

  const getTypeBadgeColor = (type) => {
    const colors = {
      browser: 'bg-blue-500/10 text-blue-500',
      file: 'bg-green-500/10 text-green-500',
      system: 'bg-yellow-500/10 text-yellow-500',
      api: 'bg-purple-500/10 text-purple-500',
      ai: 'bg-pink-500/10 text-pink-500'
    };
    return colors[type] || 'bg-gray-500/10 text-gray-500';
  };

  if (loading) {
    return <div className="text-gray-400">Loading templates...</div>;
  }

  return (
    <div className="space-y-6" data-testid="templates-page">
      <Toaster />
      
      <div>
        <h1 className="text-3xl font-bold text-white">Task Templates</h1>
        <p className="text-gray-400 mt-2">Pre-configured automation templates ready to use</p>
      </div>

      {templates.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No templates yet</p>
            <p className="text-gray-500 text-sm mt-2">Templates will be available soon</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-white text-lg">{template.name}</CardTitle>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge className={getTypeBadgeColor(template.operator_type)}>
                        {template.operator_type}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {template.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm mb-4">{template.description}</p>
                <div className="space-y-2 text-xs mb-4">
                  <div className="flex justify-between text-gray-500">
                    <span>Action:</span>
                    <span className="text-gray-300">{template.action}</span>
                  </div>
                </div>
                {canEdit && (
                  <Button
                    size="sm"
                    onClick={() => openUseDialog(template)}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Use Template
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={useDialogOpen} onOpenChange={setUseDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Create Task from Template</DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedTemplate?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="taskName" className="text-gray-300">Task Name</Label>
              <Input
                id="taskName"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="My Automation Task"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUseDialogOpen(false)} className="border-gray-700">
              Cancel
            </Button>
            <Button onClick={handleUseTemplate} className="bg-blue-600 hover:bg-blue-700">
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Templates;