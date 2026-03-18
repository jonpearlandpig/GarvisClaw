import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import '@/App.css';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Operators from '@/pages/Operators';
import AuditLog from '@/pages/AuditLog';
import Users from '@/pages/Users';
import Chat from '@/pages/Chat';
import Tasks from '@/pages/Tasks';
import Executions from '@/pages/Executions';
import Layout from '@/components/Layout';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token
    const token = localStorage.getItem('garvis_token');
    const userData = localStorage.getItem('garvis_user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const handleLogin = (token, userData) => {
    localStorage.setItem('garvis_token', token);
    localStorage.setItem('garvis_user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('garvis_token');
    localStorage.removeItem('garvis_user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
          }
        />
        <Route
          path="/*"
          element={
            user ? (
              <Layout user={user} onLogout={handleLogout}>
                <Routes>
                  <Route path="/" element={<Dashboard user={user} />} />
                  <Route path="/operators" element={<Operators user={user} />} />
                  <Route path="/tasks" element={<Tasks user={user} />} />
                  <Route path="/executions" element={<Executions user={user} />} />
                  <Route path="/audit" element={<AuditLog user={user} />} />
                  <Route path="/chat" element={<Chat user={user} />} />
                  {user.role === 'admin' && (
                    <Route path="/users" element={<Users user={user} />} />
                  )}
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
