import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Play, Edit, Trash2, List, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Tasks = ({ user }) => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    operator_id: '',
    action: '',
    parameters: '{}'
  });

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('garvis_token')}` }
  });

  const canEdit = user.role === 'admin' || user.role === 'editor';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, operatorsRes] = await Promise.all([
        axios.get(`${API}/tasks`, getAuthHeaders()),
        axios.get(`${API}/operators`, getAuthHeaders())
      ]);
      setTasks(tasksRes.data);
      setOperators(operatorsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      let parameters = {};
      try {
        parameters = JSON.parse(formData.parameters);
      } catch (e) {
        toast.error('Invalid JSON in parameters field');
        return;
      }

      await axios.post(
        `${API}/tasks`,
        {
          name: formData.name,
          description: formData.description,
          operator_id: formData.operator_id,
          action: formData.action,
          parameters
        },
        getAuthHeaders()
      );

      toast.success('Task created successfully');
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error(error.response?.data?.detail || 'Failed to create task');
    }
  };

  const handleExecute = async (taskId) => {
    try {
      await axios.post(
        `${API}/executions`,
        { task_id: taskId },
        getAuthHeaders()
      );

      toast.success('Task execution started!');
      setTimeout(() => navigate('/executions'), 1000);
    } catch (error) {
      console.error('Failed to execute task:', error);
      toast.error(error.response?.data?.detail || 'Failed to execute task');
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await axios.delete(`${API}/tasks/${taskId}`, getAuthHeaders());
      toast.success('Task deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete task');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      operator_id: '',
      action: '',
      parameters: '{}'
    });
    setSelectedOperator(null);
  };

  const getActionsByType = (operatorType) => {
    const actions = {
      browser: [
        { value: 'navigate', label: 'Navigate to URL', params: '{"url": "https://example.com"}' },
        { value: 'screenshot', label: 'Take Screenshot', params: '{"url": "https://example.com", "full_page": false}' },
        { value: 'scrape', label: 'Scrape Content', params: '{"url": "https://example.com", "selector": "body"}' },
        { value: 'click', label: 'Click Element', params: '{"url": "https://example.com", "selector": "#button"}' },
        { value: 'fill_form', label: 'Fill Form', params: '{"url": "https://example.com", "fields": {"#email": "test@test.com"}}' }
      ],
      file: [
        { value: 'read', label: 'Read File', params: '{"path": "/tmp/test.txt"}' },
        { value: 'write', label: 'Write File', params: '{"path": "/tmp/test.txt", "content": "Hello World"}' },
        { value: 'list', label: 'List Directory', params: '{"path": "/tmp"}' },
        { value: 'delete', label: 'Delete File', params: '{"path": "/tmp/test.txt"}' },
        { value: 'copy', label: 'Copy File', params: '{"source": "/tmp/test.txt", "destination": "/tmp/test2.txt"}' }
      ],
      system: [
        { value: 'shell', label: 'Execute Shell Command', params: '{"command": "ls -la", "cwd": "/tmp"}' },
        { value: 'system_info', label: 'Get System Info', params: '{}' },
        { value: 'process_list', label: 'List Processes', params: '{}' }
      ],
      api: [
        { value: 'http_get', label: 'HTTP GET', params: '{"url": "https://api.example.com/data"}' },
        { value: 'http_post', label: 'HTTP POST', params: '{"url": "https://api.example.com/data", "body": {}}' }
      ],
      ai: [
        { value: 'analyze', label: 'AI Analysis', params: '{"text": "Content to analyze"}' },
        { value: 'summarize', label: 'Summarize', params: '{"text": "Content to summarize"}' }
      ]
    };
    return actions[operatorType] || [];
  };

  const getStatusBadge = (status) => {
    const colors = {
      active: 'bg-green-500/10 text-green-500',
      draft: 'bg-gray-500/10 text-gray-500',
      paused: 'bg-yellow-500/10 text-yellow-500',
      archived: 'bg-red-500/10 text-red-500'
    };
    return colors[status] || 'bg-gray-500/10 text-gray-500';
  };

  if (loading) {
    return <div className="text-gray-400">Loading tasks...</div>;
  }

  return (
    <div className="space-y-6" data-testid="tasks-page">
      <Toaster />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Automation Tasks</h1>
          <p className="text-gray-400 mt-2">Create and manage automation workflows</p>
        </div>
        {canEdit && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700" data-testid="create-task-button">
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Configure an automation task using an operator
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <Label htmlFor="name" className="text-gray-300">Task Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="My Automation Task"
                    data-testid="task-name-input"
                  />
                </div>
                <div>
                  <Label htmlFor="operator" className="text-gray-300">Select Operator</Label>
                  <Select
                    value={formData.operator_id}
                    onValueChange={(value) => {
                      const op = operators.find(o => o.id === value);
                      setSelectedOperator(op);
                      setFormData({ ...formData, operator_id: value, action: '', parameters: '{}' });
                    }}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Choose an operator" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {operators.map((op) => (
                        <SelectItem key={op.id} value={op.id}>
                          {op.name} ({op.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedOperator && (
                  <div>
                    <Label htmlFor="action" className="text-gray-300">Action</Label>
                    <Select
                      value={formData.action}
                      onValueChange={(value) => {
                        const actionData = getActionsByType(selectedOperator.type).find(a => a.value === value);
                        setFormData({ ...formData, action: value, parameters: actionData?.params || '{}' });
                      }}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Choose an action" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {getActionsByType(selectedOperator.type).map((action) => (
                          <SelectItem key={action.value} value={action.value}>
                            {action.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label htmlFor="description" className="text-gray-300">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="Describe what this task does..."
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="parameters" className="text-gray-300">Parameters (JSON)</Label>
                  <Textarea
                    id="parameters"
                    value={formData.parameters}
                    onChange={(e) => setFormData({ ...formData, parameters: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white font-mono text-sm"
                    rows={6}
                    data-testid="task-parameters-input"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }} className="border-gray-700">
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={!formData.name || !formData.operator_id || !formData.action}
                  data-testid="task-save-button"
                >
                  Create Task
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {tasks.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-12 text-center">
            <Zap className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No tasks yet</p>
            {canEdit && (
              <p className="text-gray-500 text-sm mt-2">Create your first automation task</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <Card key={task.id} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors" data-testid="task-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-white text-lg">{task.name}</CardTitle>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge className={`${getStatusBadge(task.status)}`}>
                        {task.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {task.operator_type}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm mb-4">{task.description}</p>
                <div className="space-y-2 text-xs mb-4">
                  <div className="flex justify-between text-gray-500">
                    <span>Action:</span>
                    <span className="text-gray-300">{task.action}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Created:</span>
                    <span>{new Date(task.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleExecute(task.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    data-testid="execute-task-button"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Execute
                  </Button>
                  {canEdit && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(task.id)}
                      className="border-gray-700 hover:bg-red-900/20 hover:border-red-500"
                      data-testid="delete-task-button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tasks;