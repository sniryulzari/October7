import React, { useState, useEffect } from 'react';
import { Location } from '@/api/entities';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Eye, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ locations: 0, totalViews: 0 });
  const [recentLocations, setRecentLocations] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);

        const locationsData = await Location.list('-created_date');
        const totalViews = locationsData.reduce((sum, loc) => sum + (loc.view_count || 0), 0);
        
        setStats({ locations: locationsData.length, totalViews });
        setRecentLocations(locationsData.slice(0, 5));
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">לוח בקרה</h1>
        {currentUser && (
            <p className="text-slate-400">ברוך הבא, {currentUser.full_name}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-slate-800 border-slate-700 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">סה"כ מקומות</CardTitle>
            <MapPin className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.locations}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">סה"כ צפיות</CardTitle>
            <Eye className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalViews}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800 border-slate-700 text-white">
        <CardHeader>
          <CardTitle>מקומות שנוספו לאחרונה</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentLocations.map(location => (
              <div key={location.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div>
                  <p className="font-semibold text-white">{location.name}</p>
                  <p className="text-sm text-slate-400">{location.category}</p>
                </div>
                <Link to={createPageUrl(`AdminEditLocation?id=${location.id}`)}>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                    ערוך
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}