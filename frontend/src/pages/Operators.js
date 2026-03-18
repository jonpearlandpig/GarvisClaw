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
import { Plus, Trash2, Edit, Cpu } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Operators = ({ user }) => {
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentOperator, setCurrentOperator] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'browser',
    description: '',
    metadata: '{}'
  });

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('garvis_token')}` }
  });

  const canEdit = user.role === 'admin' || user.role === 'editor';

  useEffect(() => {
    fetchOperators();
  }, []);

  const fetchOperators = async () => {
    try {
      const response = await axios.get(`${API}/operators`, getAuthHeaders());
      setOperators(response.data);
    } catch (error) {
      console.error('Failed to fetch operators:', error);
      toast.error('Failed to load operators');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      let metadata = {};
      try {
        metadata = JSON.parse(formData.metadata);
      } catch (e) {
        toast.error('Invalid JSON in metadata field');
        return;
      }

      await axios.post(
        `${API}/operators`,
        {
          name: formData.name,
          type: formData.type,
          description: formData.description,
          metadata
        },
        getAuthHeaders()
      );

      toast.success('Operator created successfully');
      setDialogOpen(false);
      resetForm();
      fetchOperators();
    } catch (error) {
      console.error('Failed to create operator:', error);
      toast.error(error.response?.data?.detail || 'Failed to create operator');
    }
  };

  const handleUpdate = async () => {
    try {
      let metadata = {};
      try {
        metadata = JSON.parse(formData.metadata);
      } catch (e) {
        toast.error('Invalid JSON in metadata field');
        return;
      }

      await axios.put(
        `${API}/operators/${currentOperator.id}`,
        {
          name: formData.name,
          description: formData.description,
          metadata
        },
        getAuthHeaders()
      );

      toast.success('Operator updated successfully');
      setDialogOpen(false);
      resetForm();
      fetchOperators();
    } catch (error) {
      console.error('Failed to update operator:', error);
      toast.error(error.response?.data?.detail || 'Failed to update operator');
    }
  };

  const handleDelete = async (operatorId) => {
    if (!window.confirm('Are you sure you want to delete this operator?')) return;

    try {
      await axios.delete(`${API}/operators/${operatorId}`, getAuthHeaders());
      toast.success('Operator deleted successfully');
      fetchOperators();
    } catch (error) {
      console.error('Failed to delete operator:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete operator');
    }
  };

  const openCreateDialog = () => {
    setEditMode(false);
    setCurrentOperator(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (operator) => {
    setEditMode(true);
    setCurrentOperator(operator);
    setFormData({
      name: operator.name,
      type: operator.type,
      description: operator.description,
      metadata: JSON.stringify(operator.metadata || {}, null, 2)
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'browser',
      description: '',
      metadata: '{}'
    });
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
    return <div className="text-gray-400">Loading operators...</div>;
  }

  return (
    <div className="space-y-6" data-testid="operators-page">
      <Toaster />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Pig Pen Operators</h1>
          <p className="text-gray-400 mt-2">Manage your AI automation operators</p>
        </div>
        {canEdit && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700" data-testid="create-operator-button">
                <Plus className="h-4 w-4 mr-2" />
                Create Operator
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-800 text-white">
              <DialogHeader>
                <DialogTitle>{editMode ? 'Edit Operator' : 'Create New Operator'}</DialogTitle>
                <DialogDescription className="text-gray-400">
                  {editMode ? 'Update operator details' : 'Add a new operator to the Pig Pen registry'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-gray-300">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="Web Scraper"
                    data-testid="operator-name-input"
                  />
                </div>
                <div>
                  <Label htmlFor="type" className="text-gray-300">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                    disabled={editMode}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white" data-testid="operator-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="browser">Browser</SelectItem>
                      <SelectItem value="file">File</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="api">API</SelectItem>
                      <SelectItem value="ai">AI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description" className="text-gray-300">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="Describe what this operator does..."
                    rows={3}
                    data-testid="operator-description-input"
                  />
                </div>
                <div>
                  <Label htmlFor="metadata" className="text-gray-300">Metadata (JSON)</Label>
                  <Textarea
                    id="metadata"
                    value={formData.metadata}
                    onChange={(e) => setFormData({ ...formData, metadata: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white font-mono text-sm"
                    placeholder='{"capability": "web_scraping"}'
                    rows={4}
                    data-testid="operator-metadata-input"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-gray-700">
                  Cancel
                </Button>
                <Button
                  onClick={editMode ? handleUpdate : handleCreate}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="operator-save-button"
                >
                  {editMode ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Operators Grid */}
      {operators.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-12 text-center">
            <Cpu className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No operators yet</p>
            {canEdit && (
              <p className="text-gray-500 text-sm mt-2">Create your first operator to get started</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {operators.map((operator) => (
            <Card key={operator.id} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors" data-testid="operator-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-white text-lg">{operator.name}</CardTitle>
                    <Badge className={`mt-2 ${getTypeBadgeColor(operator.type)}`}>
                      {operator.type}
                    </Badge>
                  </div>
                  {canEdit && (
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(operator)}
                        className="text-gray-400 hover:text-white"
                        data-testid="edit-operator-button"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(operator.id)}
                        className="text-gray-400 hover:text-red-500"
                        data-testid="delete-operator-button"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm mb-4">{operator.description}</p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-gray-500">
                    <span>Status:</span>
                    <span className={operator.status === 'active' ? 'text-green-500' : 'text-gray-500'}>
                      {operator.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Created:</span>
                    <span>{new Date(operator.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Operators;
