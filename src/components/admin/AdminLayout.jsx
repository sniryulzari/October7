import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, MapPin, LogOut, ShieldX, Loader2, Users, Globe, BarChart, Menu, X } from 'lucide-react';

const AdminSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await User.logout();
    navigate(createPageUrl("Home"));
  };

  const navLinks = [
    { name: 'לוח בקרה', url: createPageUrl("AdminDashboard"), icon: LayoutDashboard },
    { name: 'ניהול מקומות', url: createPageUrl("AdminLocations"), icon: MapPin },
    { name: 'ניהול משתמשים', url: createPageUrl("AdminUsers"), icon: Users },
    { name: 'סטטיסטיקות', url: createPageUrl("AdminStats"), icon: BarChart },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 right-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col h-screen p-4 border-l border-slate-700 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        {/* Mobile Close Button */}
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="lg:hidden absolute top-4 left-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </Button>

        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-red-700 rounded-lg flex items-center justify-center shadow-lg">
            <ShieldX className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">ממשק ניהול</h1>
            <p className="text-sm text-slate-400">אזור מאובטח</p>
          </div>
        </div>

        <nav className="flex-grow">
          <ul className="space-y-2">
            {navLinks.map((link) => (
              <li key={link.name}>
                <Link
                  to={link.url}
                  onClick={() => window.innerWidth < 1024 && onClose()}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    location.pathname === link.url
                      ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-md'
                      : 'hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  <link.icon className="w-5 h-5" />
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <hr className="my-2 border-slate-700" />
          <a
              href={createPageUrl("Home")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-slate-300 hover:bg-slate-700/50 hover:text-white w-full"
          >
              <Globe className="w-5 h-5" />
              פתח את האפליקציה
          </a>
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-300 hover:bg-slate-700/50 hover:text-white mt-1"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 ml-3" />
            יציאה מאובטחת
          </Button>
        </div>
      </div>
    </>
  );
};

export default function AdminLayout({ children }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await User.me();
        if (user && user.role === 'admin') {
          setIsAuthorized(true);
        } else {
          navigate(createPageUrl("AccessDenied"));
        }
      } catch (error) {
        navigate(createPageUrl("Login"));
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white" dir="rtl">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p>מאמת הרשאות...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-200" dir="rtl">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-grow flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">ממשק ניהול</h1>
          <Button
            onClick={() => setSidebarOpen(true)}
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-grow p-4 sm:p-6 lg:p-8 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}