import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, Trash2, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Schedules = ({ user }) => {
  const [schedules, setSchedules] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    task_id: '',
    schedule_type: 'cron',
    cron_expression: '0 * * * *',
    interval_seconds: 3600,
    enabled: true
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
      const [schedulesRes, tasksRes] = await Promise.all([
        axios.get(`${API}/schedules`, getAuthHeaders()),
        axios.get(`${API}/tasks`, getAuthHeaders())
      ]);
      setSchedules(schedulesRes.data);
      setTasks(tasksRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const data = {
        name: formData.name,
        task_id: formData.task_id,
        schedule_type: formData.schedule_type,
        enabled: formData.enabled
      };

      if (formData.schedule_type === 'cron') {
        data.cron_expression = formData.cron_expression;
      } else {
        data.interval_seconds = parseInt(formData.interval_seconds);
      }

      await axios.post(`${API}/schedules`, data, getAuthHeaders());

      toast.success('Schedule created successfully');
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Failed to create schedule:', error);
      toast.error(error.response?.data?.detail || 'Failed to create schedule');
    }
  };

  const handleToggle = async (scheduleId, currentState) => {
    try {
      await axios.put(
        `${API}/schedules/${scheduleId}`,
        { enabled: !currentState },
        getAuthHeaders()
      );
      toast.success(`Schedule ${!currentState ? 'enabled' : 'disabled'}`);
      fetchData();
    } catch (error) {
      console.error('Failed to toggle schedule:', error);
      toast.error('Failed to update schedule');
    }
  };

  const handleDelete = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) return;

    try {
      await axios.delete(`${API}/schedules/${scheduleId}`, getAuthHeaders());
      toast.success('Schedule deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      toast.error('Failed to delete schedule');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      task_id: '',
      schedule_type: 'cron',
      cron_expression: '0 * * * *',
      interval_seconds: 3600,
      enabled: true
    });
  };

  const cronPresets = [
    { label: 'Every hour', value: '0 * * * *' },
    { label: 'Every day at midnight', value: '0 0 * * *' },
    { label: 'Every Monday at 9am', value: '0 9 * * 1' },
    { label: 'Every 5 minutes', value: '*/5 * * * *' },
    { label: 'Every 30 minutes', value: '*/30 * * * *' }
  ];

  if (loading) {
    return <div className="text-gray-400">Loading schedules...</div>;
  }

  return (
    <div className="space-y-6" data-testid="schedules-page">
      <Toaster />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Scheduled Tasks</h1>
          <p className="text-gray-400 mt-2">Automate tasks with cron schedules and intervals</p>
        </div>
        {canEdit && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Schedule</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Schedule a task to run automatically
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-gray-300">Schedule Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="Daily report generation"
                  />
                </div>
                <div>
                  <Label htmlFor="task" className="text-gray-300">Select Task</Label>
                  <Select
                    value={formData.task_id}
                    onValueChange={(value) => setFormData({ ...formData, task_id: value })}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Choose a task" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {tasks.filter(t => t.status === 'active').map((task) => (
                        <SelectItem key={task.id} value={task.id}>
                          {task.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-300">Schedule Type</Label>
                  <Select
                    value={formData.schedule_type}
                    onValueChange={(value) => setFormData({ ...formData, schedule_type: value })}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="cron">Cron Expression</SelectItem>
                      <SelectItem value="interval">Fixed Interval</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.schedule_type === 'cron' ? (
                  <div>
                    <Label className="text-gray-300">Cron Expression</Label>
                    <Select
                      value={formData.cron_expression}
                      onValueChange={(value) => setFormData({ ...formData, cron_expression: value })}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {cronPresets.map((preset) => (
                          <SelectItem key={preset.value} value={preset.value}>
                            {preset.label} ({preset.value})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">Format: minute hour day month day_of_week</p>
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="interval" className="text-gray-300">Interval (seconds)</Label>
                    <Input
                      id="interval"
                      type="number"
                      value={formData.interval_seconds}
                      onChange={(e) => setFormData({ ...formData, interval_seconds: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="3600"
                    />
                    <p className="text-xs text-gray-500 mt-1">3600 = 1 hour, 86400 = 1 day</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }} className="border-gray-700">
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={!formData.name || !formData.task_id}
                >
                  Create Schedule
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {schedules.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-12 text-center">
            <Clock className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No schedules yet</p>
            {canEdit && (
              <p className="text-gray-500 text-sm mt-2">Create your first scheduled task</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules.map((schedule) => (
            <Card key={schedule.id} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-white text-lg">{schedule.name}</CardTitle>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge className={schedule.enabled ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}>
                        {schedule.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {schedule.schedule_type}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between text-gray-500">
                    <span>Task:</span>
                    <span className="text-gray-300">{schedule.task_name}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Schedule:</span>
                    <span className="text-gray-300 font-mono text-xs">
                      {schedule.schedule_type === 'cron' ? schedule.cron_expression : `${schedule.interval_seconds}s`}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Total Runs:</span>
                    <span className="text-gray-300">{schedule.total_runs}</span>
                  </div>
                  {schedule.last_run && (
                    <div className="flex justify-between text-gray-500">
                      <span>Last Run:</span>
                      <span className="text-gray-300 text-xs">{new Date(schedule.last_run).toLocaleString()}</span>
                    </div>
                  )}
                </div>
                {canEdit && (
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggle(schedule.id, schedule.enabled)}
                      className="flex-1 border-gray-700 hover:bg-gray-800"
                    >
                      {schedule.enabled ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                      {schedule.enabled ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(schedule.id)}
                      className="border-gray-700 hover:bg-red-900/20 hover:border-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Schedules;
