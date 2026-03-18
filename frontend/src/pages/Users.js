import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, UserCog, Shield, Eye, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Users = ({ user: currentUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'viewer'
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    role: 'viewer'
  });

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('garvis_token')}` }
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`, getAuthHeaders());
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await axios.post(
        `${API}/users`,
        formData,
        getAuthHeaders()
      );

      toast.success('User created successfully');
      setDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Failed to create user:', error);
      toast.error(error.response?.data?.detail || 'Failed to create user');
    }
  };

  const handleUpdate = async () => {
    try {
      await axios.put(
        `${API}/users/${selectedUser.id}`,
        editFormData,
        getAuthHeaders()
      );

      toast.success('User updated successfully');
      setEditDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
      toast.error(error.response?.data?.detail || 'Failed to update user');
    }
  };

  const openEditDialog = (user) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      role: user.role
    });
    setEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      role: 'viewer'
    });
  };

  const getRoleBadge = (role) => {
    const config = {
      admin: { color: 'bg-red-500/10 text-red-500', icon: Shield },
      editor: { color: 'bg-blue-500/10 text-blue-500', icon: Edit },
      viewer: { color: 'bg-gray-500/10 text-gray-500', icon: Eye }
    };
    const { color, icon: Icon } = config[role] || config.viewer;
    return (
      <Badge className={color}>
        <Icon className="h-3 w-3 mr-1" />
        {role}
      </Badge>
    );
  };

  if (loading) {
    return <div className="text-gray-400">Loading users...</div>;
  }

  return (
    <div className="space-y-6" data-testid="users-page">
      <Toaster />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-gray-400 mt-2">Manage system users and roles</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700" data-testid="create-user-button">
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-800 text-white">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription className="text-gray-400">
                Add a new user to the system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="user@example.com"
                  data-testid="user-email-input"
                />
              </div>
              <div>
                <Label htmlFor="name" className="text-gray-300">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="John Doe"
                  data-testid="user-name-input"
                />
              </div>
              <div>
                <Label htmlFor="role" className="text-gray-300">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white" data-testid="user-role-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-gray-700">
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="user-create-button"
              >
                Create User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((u) => (
          <Card key={u.id} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors" data-testid="user-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{u.name}</h3>
                    <p className="text-sm text-gray-500">{u.email}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Role</span>
                  {getRoleBadge(u.role)}
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Joined</span>
                  <span>{new Date(u.created_at).toLocaleDateString()}</span>
                </div>
                
                {u.last_login && (
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Last Login</span>
                    <span>{new Date(u.last_login).toLocaleDateString()}</span>
                  </div>
                )}
                
                {u.id !== currentUser.id && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full border-gray-700 hover:bg-gray-800 mt-4"
                    onClick={() => openEditDialog(u)}
                    data-testid="edit-user-button"
                  >
                    <UserCog className="h-4 w-4 mr-2" />
                    Edit Role
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update user role and information
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Email</Label>
                <Input
                  value={selectedUser.email}
                  disabled
                  className="bg-gray-800 border-gray-700 text-gray-500"
                />
              </div>
              <div>
                <Label htmlFor="edit-name" className="text-gray-300">Name</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="edit-role" className="text-gray-300">Role</Label>
                <Select
                  value={editFormData.role}
                  onValueChange={(value) => setEditFormData({ ...editFormData, role: value })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="border-gray-700">
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Update User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
