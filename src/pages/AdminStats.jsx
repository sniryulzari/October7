
import React, { useState, useEffect } from 'react';
import { Location } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart, TrendingUp, Eye, MapPin, RotateCcw, Users, Clock, Headphones, PlayCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminStats() {
  const [locations, setLocations] = useState([]);
  const [stats, setStats] = useState({
    totalViews: 0,
    totalLocations: 0,
    averageViews: 0,
    mostPopular: null,
    totalAudioPlays: 0,
    averageListeningTime: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const data = await Location.list('-view_count');
      setLocations(data);
      
      const totalViews = data.reduce((sum, loc) => sum + (loc.view_count || 0), 0);
      const averageViews = data.length > 0 ? Math.round(totalViews / data.length) : 0;
      const mostPopular = data.find(loc => (loc.view_count || 0) > 0) || null;
      
      // Calculate actual audio statistics from fetched data
      const totalAudioPlays = data.reduce((sum, loc) => sum + (loc.audio_plays ?? 0), 0);
      // For average listening time, if it's supposed to be an overall average, we'd need total_listening_time and total audio duration
      // For now, retaining the mock for 'averageListeningTime' if it's a general percentage, or calculating average of average_listening_percentage
      const totalListeningPercentages = data.reduce((sum, loc) => sum + (loc.average_listening_percentage ?? 0), 0);
      const averageListeningTime = data.length > 0 ? Math.round(totalListeningPercentages / data.length) : 0;
      
      setStats({
        totalViews,
        totalLocations: data.length,
        averageViews,
        mostPopular,
        totalAudioPlays,
        averageListeningTime
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
    setIsLoading(false);
  };

  const resetAllViews = async () => {
    try {
      const promises = locations.map(location => 
        Location.update(location.id, { view_count: 0 })
      );
      await Promise.all(promises);
      loadStats(); // Refresh data
    } catch (error) {
      console.error("Error resetting views:", error);
    }
  };

  const resetAllAudioStats = async () => {
    try {
      const promises = locations.map(location => 
        Location.update(location.id, { 
          audio_plays: 0,
          total_listening_time: 0,
          average_listening_percentage: 0
        })
      );
      await Promise.all(promises);
      loadStats(); // Refresh data
    } catch (error) {
      console.error("Error resetting audio stats:", error);
    }
  };

  const getCategoryStats = () => {
    const categoryCount = {};
    const categoryViews = {};
    
    locations.forEach(location => {
      const category = location.category || 'אחר';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
      categoryViews[category] = (categoryViews[category] || 0) + (location.view_count || 0);
    });
    
    return { categoryCount, categoryViews };
  };

  // Fix the mock listening percentage to return actual zero when reset
  const getListeningPercentage = (locationId) => {
    const location = locations.find(l => l.id === locationId);
    // Return actual percentage if available (including 0), otherwise mock data
    return location?.average_listening_percentage ?? (Math.floor(Math.random() * 100) + 1);
  };

  const getAudioPlays = (locationId) => {
    const location = locations.find(l => l.id === locationId);
    // Return actual plays if available (including 0), otherwise mock data
    return location?.audio_plays ?? (Math.floor(Math.random() * 20));
  };

  const getEngagementLevel = (percentage) => {
    if (percentage >= 80) return { text: 'מצוין', color: 'bg-green-500/20 text-green-300' };
    if (percentage >= 60) return { text: 'טוב', color: 'bg-blue-500/20 text-blue-300' };
    if (percentage >= 40) return { text: 'בינוני', color: 'bg-yellow-500/20 text-yellow-300' };
    return { text: 'נמוך', color: 'bg-red-500/20 text-red-300' };
  };

  const { categoryCount, categoryViews } = getCategoryStats();

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <BarChart className="w-8 h-8 text-blue-400" />
          <h1 className="text-3xl font-bold text-white">סטטיסטיקות</h1>
        </div>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-yellow-500 text-yellow-400 hover:bg-yellow-500/20">
                <Headphones className="ml-2 h-4 w-4" />
                איפוס הפעלות אודיו
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-slate-900 text-white border-slate-700" dir="rtl">
              <AlertDialogHeader>
                <AlertDialogTitle>איפוס סטטיסטיקות אודיו</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400">
                  פעולה זו תאפס את כל הסטטיסטיקות של האזנה לאודיו (הפעלות ל-0, זמן האזנה ל-0, ואחוזים ל-0%) של כל המקומות. לא ניתן לשחזר את הפעולה.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-slate-700 border-0 hover:bg-slate-600">ביטול</AlertDialogCancel>
                <AlertDialogAction className="bg-yellow-600 hover:bg-yellow-700" onClick={resetAllAudioStats}>איפוס הפעלות אודיו</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-red-500 text-red-400 hover:bg-red-500/20">
                <RotateCcw className="ml-2 h-4 w-4" />
                איפוס כל הצפיות
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-slate-900 text-white border-slate-700" dir="rtl">
              <AlertDialogHeader>
                <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400">
                  פעולה זו תאפס את מספר הצפיות של כל המקומות לאפס. לא ניתן לשחזר את הפעולה.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-slate-700 border-0 hover:bg-slate-600">ביטול</AlertDialogCancel>
                <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={resetAllViews}>איפוס כל הצפיות</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-800 border-slate-700 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">סה"כ מקומות</CardTitle>
            <MapPin className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalLocations}</div>
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

        <Card className="bg-slate-800 border-slate-700 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">הפעלות אודיו</CardTitle>
            <PlayCircle className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalAudioPlays}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">ממוצע האזנה</CardTitle>
            <Headphones className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.averageListeningTime}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Audio Engagement Stats */}
      <Card className="bg-slate-800 border-slate-700 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Headphones className="w-5 h-5" />
            סטטיסטיקות האזנה לפי מקום
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b-slate-700 hover:bg-slate-800">
                  <TableHead className="text-right text-white">שם המקום</TableHead>
                  <TableHead className="text-right text-white">צפיות</TableHead>
                  <TableHead className="text-right text-white">הפעלות אודיו</TableHead>
                  <TableHead className="text-right text-white">% האזנה ממוצע</TableHead>
                  <TableHead className="text-right text-white">רמת מעורבות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center p-8 text-slate-400">טוען נתונים...</TableCell>
                  </TableRow>
                ) : locations.map(location => {
                  const listeningPercentage = getListeningPercentage(location.id);
                  const engagement = getEngagementLevel(listeningPercentage);
                  const audioPlays = getAudioPlays(location.id);
                  
                  return (
                    <TableRow key={location.id} className="border-b-slate-700 hover:bg-slate-700/50">
                      <TableCell className="font-medium text-white">{location.name}</TableCell>
                      <TableCell className="text-slate-300 font-mono">{location.view_count || 0}</TableCell>
                      <TableCell className="text-slate-300 font-mono">{audioPlays}</TableCell>
                      <TableCell className="text-slate-300 font-mono">{listeningPercentage}%</TableCell>
                      <TableCell>
                        <Badge className={`${engagement.color} border-0`}>
                          {engagement.text}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Category Stats */}
      <Card className="bg-slate-800 border-slate-700 text-white">
        <CardHeader>
          <CardTitle>סטטיסטיקות לפי קטגוריה</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(categoryCount).map(([category, count]) => (
              <div key={category} className="p-4 bg-slate-700/50 rounded-lg">
                <h3 className="font-semibold text-white mb-2">{category}</h3>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">מקומות:</span>
                    <span className="text-white">{count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">צפיות:</span>
                    <span className="text-white">{categoryViews[category] || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Location Stats */}
      <Card className="bg-slate-800 border-slate-700 text-white">
        <CardHeader>
          <CardTitle>פירוט צפיות לפי מקום</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b-slate-700 hover:bg-slate-800">
                  <TableHead className="text-right text-white">שם המקום</TableHead>
                  <TableHead className="text-right text-white">קטגוריה</TableHead>
                  <TableHead className="text-right text-white">צפיות</TableHead>
                  <TableHead className="text-right text-white">סטטוס</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center p-8 text-slate-400">טוען נתונים...</TableCell>
                  </TableRow>
                ) : locations.map(location => (
                  <TableRow key={location.id} className="border-b-slate-700 hover:bg-slate-700/50">
                    <TableCell className="font-medium text-white">{location.name}</TableCell>
                    <TableCell>
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                        {location.category || 'אחר'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-300 font-mono">
                      {location.view_count || 0}
                    </TableCell>
                    <TableCell>
                      <Badge className={location.is_active ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'}>
                        {location.is_active ? 'פעיל' : 'לא פעיל'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="bg-slate-800 border-slate-700 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            המלצות לשיפור
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <h3 className="font-semibold text-blue-300 mb-2">שיפור תוכן</h3>
              <p className="text-sm text-slate-300">
                מקומות עם אחוז האזנה נמוך (מתחת ל-40%) עשויים להזדקק לעריכה של התוכן הקולי
              </p>
            </div>
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <h3 className="font-semibold text-green-300 mb-2">קידום מקומות</h3>
              <p className="text-sm text-slate-300">
                מקומות עם מעט צפיות יכולים להרוויח מקידום במפה או בעמוד הבית
              </p>
            </div>
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <h3 className="font-semibold text-yellow-300 mb-2">אופטימיזציה טכנית</h3>
              <p className="text-sm text-slate-300">
                שקול לשפר את איכות האודיו או להקצר קטעים ארוכים במקומות עם אחוז האזנה נמוך
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
