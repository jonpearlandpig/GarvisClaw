import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, User, Clock } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuditLog = ({ user }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('garvis_token')}` }
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await axios.get(`${API}/audit?limit=100`, getAuthHeaders());
      setLogs(response.data);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeColor = (eventType) => {
    const colors = {
      user_login: 'bg-blue-500/10 text-blue-500',
      user_created: 'bg-green-500/10 text-green-500',
      user_role_changed: 'bg-yellow-500/10 text-yellow-500',
      operator_created: 'bg-purple-500/10 text-purple-500',
      operator_updated: 'bg-orange-500/10 text-orange-500',
      operator_deleted: 'bg-red-500/10 text-red-500',
      chat_message: 'bg-pink-500/10 text-pink-500',
      system_config: 'bg-gray-500/10 text-gray-500'
    };
    return colors[eventType] || 'bg-gray-500/10 text-gray-500';
  };

  if (loading) {
    return <div className="text-gray-400">Loading audit logs...</div>;
  }

  return (
    <div className="space-y-6" data-testid="audit-log-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Audit Log</h1>
        <p className="text-gray-400 mt-2">Immutable ledger of all system events</p>
      </div>

      {/* Logs */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No audit logs yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {logs.map((log) => (
                <div key={log.id} className="p-6 hover:bg-gray-800/50 transition-colors" data-testid="audit-log-entry">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Badge className={getEventTypeColor(log.event_type)}>
                          {log.event_type.replace('_', ' ')}
                        </Badge>
                        {log.user_email && (
                          <div className="flex items-center text-sm text-gray-500">
                            <User className="h-4 w-4 mr-1" />
                            {log.user_email}
                          </div>
                        )}
                      </div>
                      <p className="text-white">{log.action}</p>
                      {Object.keys(log.details || {}).length > 0 && (
                        <div className="mt-2 p-3 bg-gray-950 rounded text-xs text-gray-400 font-mono">
                          {JSON.stringify(log.details, null, 2)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-gray-500 ml-4">
                      <Clock className="h-4 w-4 mr-1" />
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLog;
