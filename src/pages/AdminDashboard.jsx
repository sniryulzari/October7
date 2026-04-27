import React, { useState, useEffect } from 'react';
import { Location, User } from '@/api/entities';
import { MapPin, Eye, TrendingUp, AlertCircle, PlusCircle, BarChart2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const STAT_CARDS = [
  { key: 'total',      label: 'סה"כ מקומות',   icon: MapPin,      bg: 'bg-blue-50',   icon_color: 'text-blue-500',   value_color: 'text-blue-600'   },
  { key: 'active',     label: 'מקומות פעילים',  icon: TrendingUp,  bg: 'bg-green-50',  icon_color: 'text-green-500',  value_color: 'text-green-600'  },
  { key: 'totalViews', label: 'סה"כ צפיות',     icon: Eye,         bg: 'bg-purple-50', icon_color: 'text-purple-500', value_color: 'text-purple-600' },
  { key: 'inactive',   label: 'לא פעילים',      icon: AlertCircle, bg: 'bg-orange-50', icon_color: 'text-orange-500', value_color: 'text-orange-600' },
];

const QUICK_ACTIONS = [
  { label: 'הוסף מקום חדש',  desc: 'הוסף אתר זיכרון למפה',         icon: PlusCircle, url: createPageUrl("AdminEditLocation"), dot: 'bg-blue-500'   },
  { label: 'ניהול מקומות',    desc: 'ערוך, מחק וצפה בכל המקומות',   icon: MapPin,     url: createPageUrl("AdminLocations"),   dot: 'bg-green-500'  },
  { label: 'סטטיסטיקות',      desc: 'צפיות, האזנות ומגמות',          icon: BarChart2,  url: createPageUrl("AdminStats"),       dot: 'bg-purple-500' },
];

function StatCard({ label, value, icon: Icon, bg, icon_color, loading }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-4`}>
        <Icon className={`w-5 h-5 ${icon_color}`} />
      </div>
      {loading
        ? <div className="h-8 w-16 bg-gray-100 rounded-lg animate-pulse mb-1" />
        : <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      }
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, totalViews: 0 });
  const [recentLocations, setRecentLocations] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const today = new Date().toLocaleDateString('he-IL', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  useEffect(() => {
    (async () => {
      try {
        const [user, locs] = await Promise.all([User.me(), Location.list('-created_date')]);
        setCurrentUser(user);
        const active = locs.filter(l => l.is_active).length;
        const totalViews = locs.reduce((s, l) => s + (l.view_count || 0), 0);
        setStats({ total: locs.length, active, inactive: locs.length - active, totalViews });
        setRecentLocations(locs.slice(0, 5));
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const firstName = currentUser?.full_name?.trim().split(/\s+/)[0] || '';

  return (
    <div className="space-y-7 max-w-4xl">
      {/* Header */}
      <div>
        <p className="text-xs text-gray-400 mb-1">{today}</p>
        <h1 className="text-2xl font-bold text-gray-900">
          שלום{firstName ? `, ${firstName}` : ''} 👋
        </h1>
        <p className="text-gray-400 text-sm mt-1">סיכום מצב המערכת</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(c => (
          <StatCard key={c.key} {...c} value={stats[c.key]} loading={isLoading} />
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">פעולות מהירות</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {QUICK_ACTIONS.map(action => (
            <Link key={action.label} to={action.url}>
              <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow cursor-pointer group">
                <div className={`w-2 h-2 rounded-full ${action.dot} flex-shrink-0`} />
                <action.icon className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{action.label}</p>
                  <p className="text-xs text-gray-400 truncate">{action.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent locations */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">מקומות שנוספו לאחרונה</p>
          <Link to={createPageUrl("AdminLocations")}>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-700 text-xs h-7 gap-1 px-2">
              כל המקומות <ArrowLeft className="w-3 h-3" />
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-4 border-b border-gray-100 last:border-0">
                  <div className="space-y-1.5">
                    <div className="h-3.5 bg-gray-100 rounded animate-pulse w-36" />
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-20" />
                  </div>
                  <div className="h-7 w-12 bg-gray-100 rounded-lg animate-pulse" />
                </div>
              ))
            : recentLocations.length === 0
              ? <div className="p-10 text-center text-gray-400 text-sm">אין מקומות עדיין</div>
              : recentLocations.map(loc => (
                  <div key={loc.id} className="flex items-center justify-between px-5 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{loc.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">{loc.category || 'ללא קטגוריה'}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          loc.is_active ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {loc.is_active ? 'פעיל' : 'לא פעיל'}
                        </span>
                      </div>
                    </div>
                    <Link to={createPageUrl(`AdminEditLocation?id=${loc.id}`)}>
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-900 text-xs h-7 rounded-lg">
                        ערוך
                      </Button>
                    </Link>
                  </div>
                ))
          }
        </div>
      </div>
    </div>
  );
}
