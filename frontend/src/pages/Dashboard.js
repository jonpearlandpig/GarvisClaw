import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Cpu, FileText, Activity, ArrowDown } from 'lucide-react';
import OperatorVisualization from '@/components/OperatorVisualization';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [hierarchy, setHierarchy] = useState([]);
  const [operators, setOperators] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('garvis_token')}` }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, hierarchyRes, operatorsRes, executionsRes] = await Promise.all([
          axios.get(`${API}/dashboard/stats`, getAuthHeaders()),
          axios.get(`${API}/hierarchy`),
          axios.get(`${API}/operators`, getAuthHeaders()),
          axios.get(`${API}/executions?limit=10`, getAuthHeaders())
        ]);
        setStats(statsRes.data);
        setHierarchy(hierarchyRes.data.hierarchy);
        setOperators(operatorsRes.data);
        setExecutions(executionsRes.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Users', value: stats?.total_users || 0, icon: Users, color: 'text-blue-500' },
    { title: 'Operators', value: stats?.total_operators || 0, icon: Cpu, color: 'text-green-500' },
    { title: 'Audit Events', value: stats?.total_audit_events || 0, icon: FileText, color: 'text-purple-500' },
  ];

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">GARVIS OpenClaw</h1>
        <p className="text-gray-400">Governance, Authority, Routing, Verification, Intelligence, Sovereignty</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="bg-gray-900 border-gray-800" data-testid={`stat-${stat.title.toLowerCase().replace(' ', '-')}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">{stat.title}</p>
                    <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                  </div>
                  <Icon className={`h-12 w-12 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 3D Operator Visualization */}
      <Card className="bg-gray-900 border-gray-800" data-testid="operator-visualization">
        <CardHeader>
          <CardTitle className="text-white">Operator Network Visualization</CardTitle>
          <CardDescription className="text-gray-400">
            Live 3D view of your AI operators thinking and communicating
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OperatorVisualization operators={operators} executions={executions} />
          <div className="mt-4 flex items-center justify-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-gray-400">Browser</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-400">File</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-gray-400">System</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-gray-400">API</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-pink-500"></div>
              <span className="text-gray-400">AI</span>
            </div>
          </div>
          <p className="text-center text-xs text-gray-500 mt-3">
            Drag to rotate • Scroll to zoom • Active operators pulse with thinking particles
          </p>
        </CardContent>
      </Card>

      {/* Authority Hierarchy */}
      <Card className="bg-gray-900 border-gray-800" data-testid="authority-hierarchy">
        <CardHeader>
          <CardTitle className="text-white">Authority Hierarchy</CardTitle>
          <CardDescription className="text-gray-400">
            The GARVIS governance chain of command
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {hierarchy.map((level, index) => (
              <div key={level.level}>
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500/10 border-2 border-blue-500 flex items-center justify-center">
                    <span className="text-blue-500 font-bold">{level.level}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">{level.name}</h3>
                    <p className="text-sm text-gray-400">{level.description}</p>
                  </div>
                </div>
                {index < hierarchy.length - 1 && (
                  <div className="ml-6 my-2">
                    <ArrowDown className="h-6 w-6 text-gray-600" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-gray-900 border-gray-800" data-testid="recent-activity">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats?.recent_activity?.length > 0 ? (
              stats.recent_activity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
                  <div>
                    <p className="text-sm text-white">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.user_email || 'System'}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-xs">
                      {activity.event_type}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Operators by Type */}
      {stats?.operators_by_type && Object.keys(stats.operators_by_type).length > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Operators by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(stats.operators_by_type).map(([type, count]) => (
                <div key={type} className="text-center p-4 bg-gray-800 rounded-lg">
                  <p className="text-2xl font-bold text-white">{count}</p>
                  <p className="text-sm text-gray-400 capitalize">{type}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
