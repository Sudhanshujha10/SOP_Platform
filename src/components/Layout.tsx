
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  FileText, 
  Database, 
  Menu, 
  X,
  Bell,
  Settings,
  User,
  Sparkles,
  Trash2,
  ArrowLeft
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentModule: 'dashboard' | 'sops' | 'lookup' | 'test';
  onModuleChange: (module: 'dashboard' | 'sops' | 'lookup' | 'test') => void;
  onSettingsClick?: () => void;
}

export const Layout = ({ children, currentModule, onModuleChange, onSettingsClick }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleModuleChange = (module: 'dashboard' | 'sops' | 'lookup' | 'test') => {
    onModuleChange(module);
    setSidebarOpen(false); // Close sidebar when module is selected
  };

  const handleBackToDashboard = () => {
    onModuleChange('dashboard');
  };

  const modules = [
    {
      id: 'dashboard' as const,
      name: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Overview & Analytics'
    },
    {
      id: 'sops' as const,
      name: 'SOPs',
      icon: FileText,
      description: 'Standard Operating Procedures'
    },
    {
      id: 'lookup' as const,
      name: 'Lookup Tables',
      icon: Database,
      description: 'Code Groups & Reference Data'
    },
    {
      id: 'test' as const,
      name: 'Test Runner',
      icon: Sparkles,
      description: 'Automated Extraction Test'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            {/* Hamburger Menu - Always Visible */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hover:bg-gray-100"
              aria-label="Toggle navigation menu"
            >
              <Menu className="h-6 w-6" />
            </Button>
            
            <div>
              <h1 className="text-xl font-bold text-gray-900">RapidClaims SOP</h1>
              <p className="text-sm text-gray-600">Advanced Healthcare Management</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" className="hover:bg-gray-100">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onSettingsClick} className="hover:bg-gray-100">
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="hover:bg-gray-100">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex relative">
        {/* Sidebar - Hidden by default, slides in from left */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-gray-200 shadow-xl
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex flex-col h-full pt-20">
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
              {modules.map((module) => {
                const Icon = module.icon;
                const isActive = currentModule === module.id;
                
                return (
                  <button
                    key={module.id}
                    className={`
                      w-full flex items-start p-4 rounded-lg transition-all duration-200
                      ${isActive 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'hover:bg-gray-100 text-gray-700'
                      }
                    `}
                    onClick={() => handleModuleChange(module.id)}
                  >
                    <Icon className={`h-6 w-6 mr-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                    <div className="text-left flex-1">
                      <div className={`font-semibold text-base ${isActive ? 'text-white' : 'text-gray-900'}`}>
                        {module.name}
                      </div>
                      <div className={`text-sm mt-0.5 ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>
                        {module.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
            
            <div className="p-4 border-t border-gray-200">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Active Client</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">Demo Org</Badge>
                </div>
                <p className="text-xs text-gray-600">
                  Healthcare Partners LLC
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Overlay - Click outside to close */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation menu"
          />
        )}

        {/* Main content */}
        <main className="flex-1 w-full">
          {/* Back to Dashboard Button - Only show when not on dashboard */}
          {currentModule !== 'dashboard' && (
            <div className="bg-white border-b border-gray-200 px-6 py-3">
              <Button
                variant="ghost"
                onClick={handleBackToDashboard}
                className="hover:bg-gray-100 text-gray-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          )}
          
          <div className="p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
