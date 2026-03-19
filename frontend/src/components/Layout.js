import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Users, 
  Cpu, 
  FileText, 
  MessageSquare, 
  LogOut,
  Shield,
  Zap,
  Play,
  Clock,
  GitBranch,
  Files,
  Menu,
  X
} from 'lucide-react';

const Layout = ({ user, onLogout, children }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Operators', href: '/operators', icon: Cpu },
    { name: 'Tasks', href: '/tasks', icon: Zap },
    { name: 'Executions', href: '/executions', icon: Play },
    { name: 'Schedules', href: '/schedules', icon: Clock },
    { name: 'Workflows', href: '/workflows', icon: GitBranch },
    { name: 'Templates', href: '/templates', icon: Files },
    { name: 'Audit Log', href: '/audit', icon: FileText },
    { name: 'Chat', href: '/chat', icon: MessageSquare },
  ];

  if (user.role === 'admin') {
    navigation.push({ name: 'Users', href: '/users', icon: Users });
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'editor': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="h-6 w-6 text-blue-500" />
            <div>
              <h1 className="text-lg font-bold text-white">GARVIS</h1>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar - Desktop & Mobile */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 border-r border-gray-800
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo - Desktop Only */}
          <div className="hidden lg:block p-6 border-b border-gray-800">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-500" />
              <div>
                <h1 className="text-xl font-bold text-white">GARVIS</h1>
                <p className="text-xs text-gray-500">OpenClaw</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto pt-20 lg:pt-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={closeMobileMenu}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors touch-manipulation ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white active:bg-gray-700'
                  }`}
                  data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-gray-800">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)} text-center`}>
                {user.role.toUpperCase()}
              </div>
              <Button
                onClick={() => {
                  closeMobileMenu();
                  onLogout();
                }}
                variant="outline"
                className="w-full border-gray-700 hover:bg-gray-800 touch-manipulation"
                data-testid="logout-button"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64 pt-16 lg:pt-0">
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
