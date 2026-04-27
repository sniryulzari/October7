import React, { useEffect } from 'react';
import { User } from '@/api/entities';
import { useAuth } from '@/api/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { LayoutDashboard, MapPin, LogOut, ShieldCheck, Loader2, Users, Globe, BarChart2, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { name: 'לוח בקרה',      url: createPageUrl("AdminDashboard"),  icon: LayoutDashboard, activeColor: 'text-orange-500' },
  { name: 'ניהול מקומות',   url: createPageUrl("AdminLocations"),  icon: MapPin,          activeColor: 'text-blue-500'   },
  { name: 'ניהול משתמשים',  url: createPageUrl("AdminUsers"),      icon: Users,           activeColor: 'text-green-500'  },
  { name: 'סטטיסטיקות',     url: createPageUrl("AdminStats"),      icon: BarChart2,       activeColor: 'text-purple-500' },
];

function getInitials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

const AdminSidebar = ({ isOpen, onClose, user }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await User.logout();
    navigate(createPageUrl("Home"));
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={onClose} />
      )}

      <div
        className={`
          fixed lg:relative inset-y-0 right-0 z-50 w-60 flex flex-col h-screen
          bg-white border-l border-gray-200 shadow-sm
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Mobile close */}
        <button
          onClick={onClose}
          className="lg:hidden absolute top-3 left-3 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">ממשק ניהול</p>
            <p className="text-[11px] text-gray-400">זיכרון 7.10</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-grow px-3 py-3 overflow-y-auto space-y-0.5">
          {NAV_LINKS.map(link => {
            const isActive = location.pathname === link.url;
            return (
              <Link
                key={link.name}
                to={link.url}
                onClick={() => window.innerWidth < 1024 && onClose()}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                  ${isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}
                `}
              >
                <link.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? link.activeColor : 'text-gray-400'}`} />
                {link.name}
              </Link>
            );
          })}

          <div className="pt-4 mt-4 border-t border-gray-100">
            <a
              href={createPageUrl("Home")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-all"
            >
              <Globe className="w-4 h-4 flex-shrink-0 text-gray-400" />
              פתח את האפליקציה
            </a>
          </div>
        </nav>

        {/* User section */}
        <div className="border-t border-gray-100 p-3 space-y-1">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
              {getInitials(user?.full_name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                {user?.full_name || 'מנהל'}
              </p>
              <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            יציאה
          </button>
        </div>
      </div>
    </>
  );
};

export default function AdminLayout({ children }) {
  const { user, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    if (!user) navigate(createPageUrl("Login"));
    else if (user.role !== 'admin') navigate(createPageUrl("AccessDenied"));
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f0f2f7] flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3 text-orange-500" />
          <p className="text-gray-500 text-sm">מאמת הרשאות...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="flex min-h-screen bg-[#f0f2f7]" dir="rtl">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />

      <main className="flex-grow flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm">ממשק ניהול</span>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-grow p-4 sm:p-6 lg:p-8 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
