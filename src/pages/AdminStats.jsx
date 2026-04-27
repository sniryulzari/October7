import React, { useState, useEffect } from 'react';
import { Location } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from '@/components/ui/use-toast';
import {
  BarChart2, Eye, MapPin, RotateCcw, Headphones, PlayCircle, TrendingUp,
  AlertTriangle, Share2, Navigation, ChevronDown, ChevronUp, ChevronsUpDown,
  Download, Languages, Video, QrCode,
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getEngagement(pct) {
  if (pct >= 80) return { text: 'מצוין',  cls: 'bg-green-100 text-green-700'  };
  if (pct >= 60) return { text: 'טוב',    cls: 'bg-blue-100 text-blue-700'    };
  if (pct >= 40) return { text: 'בינוני', cls: 'bg-amber-100 text-amber-700'  };
  return         { text: 'נמוך',  cls: 'bg-red-100 text-red-700'    };
}

function audioConversionRate(loc) {
  if (!loc.view_count) return 0;
  return Math.min(100, Math.round((loc.audio_plays || 0) / loc.view_count * 100));
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, bg, iconColor, loading, sub }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-4`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      {loading
        ? <div className="h-8 w-16 bg-gray-100 rounded-lg animate-pulse mb-1" />
        : <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      }
      <p className="text-sm text-gray-500">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function SortTh({ field, current, dir, onSort, children }) {
  const active = current === field;
  return (
    <TableHead
      className="text-right text-gray-500 font-semibold text-xs uppercase tracking-wide whitespace-nowrap py-3 cursor-pointer select-none hover:text-gray-800 transition-colors"
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {active
          ? (dir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)
          : <ChevronsUpDown className="w-3 h-3 opacity-30" />}
      </span>
    </TableHead>
  );
}

const MEDAL_BG  = ['bg-yellow-50 border-yellow-200', 'bg-gray-50 border-gray-200', 'bg-orange-50 border-orange-200'];
const MEDAL_NUM = ['1', '2', '3'];
const MEDAL_CLR = ['text-yellow-600', 'text-gray-500', 'text-orange-600'];

const REC_STYLES = {
  blue:   'bg-blue-50 border-blue-200 text-blue-800',
  amber:  'bg-amber-50 border-amber-200 text-amber-800',
  orange: 'bg-orange-50 border-orange-200 text-orange-800',
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminStats() {
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState('view_count');
  const [sortDir, setSortDir]   = useState('desc');

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    setIsLoading(true);
    try { setLocations(await Location.list()); }
    catch (e) { console.error(e); }
    setIsLoading(false);
  };

  // ── Sorting ────────────────────────────────────────────────────────────────
  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const sorted = [...locations].sort((a, b) => {
    let aVal, bVal;
    if (sortField === 'audio_conversion') {
      aVal = audioConversionRate(a);
      bVal = audioConversionRate(b);
    } else {
      aVal = a[sortField] ?? 0;
      bVal = b[sortField] ?? 0;
    }
    return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
  });

  // ── Aggregates ─────────────────────────────────────────────────────────────
  const totalViews      = locations.reduce((s, l) => s + (l.view_count      || 0), 0);
  const totalAudioPlays = locations.reduce((s, l) => s + (l.audio_plays     || 0), 0);
  const totalShares     = locations.reduce((s, l) => s + (l.share_count     || 0), 0);
  const totalNavs       = locations.reduce((s, l) => s + (l.navigation_clicks || 0), 0);
  const totalVideoPlays = locations.reduce((s, l) => s + (l.video_plays     || 0), 0);
  const totalQrViews    = locations.reduce((s, l) => s + (l.qr_views        || 0), 0);
  const totalViewsHe    = locations.reduce((s, l) => s + (l.views_he        || 0), 0);
  const totalViewsEn    = locations.reduce((s, l) => s + (l.views_en        || 0), 0);

  // Weighted average listening (correct formula)
  const weightedAvgListening = (() => {
    if (totalAudioPlays === 0) return 0;
    const weighted = locations.reduce((s, l) =>
      s + (l.audio_plays || 0) * (l.average_listening_percentage || 0), 0);
    return Math.round(weighted / totalAudioPlays);
  })();

  // ── Top 3 ──────────────────────────────────────────────────────────────────
  const top3 = [...locations]
    .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
    .slice(0, 3);

  // ── Categories ─────────────────────────────────────────────────────────────
  const categoryMap = {};
  locations.forEach(l => {
    const cat = l.category || 'אחר';
    if (!categoryMap[cat]) categoryMap[cat] = { count: 0, views: 0 };
    categoryMap[cat].count++;
    categoryMap[cat].views += l.view_count || 0;
  });
  const categories  = Object.entries(categoryMap).sort((a, b) => b[1].views - a[1].views);
  const maxCatViews = Math.max(1, ...categories.map(([, v]) => v.views));

  // ── Recommendations ────────────────────────────────────────────────────────
  const noViews      = locations.filter(l => !l.view_count);
  const lowListening = locations.filter(l => (l.average_listening_percentage || 0) > 0 && l.average_listening_percentage < 40);
  const inactive     = locations.filter(l => !l.is_active);

  const recommendations = [
    noViews.length > 0 && {
      color: 'blue', title: 'קידום מקומות ללא צפיות',
      text: `${noViews.length} מקומות ללא אף צפייה — שקול לקדם אותם במפה.`,
      locs: noViews.slice(0, 4),
    },
    lowListening.length > 0 && {
      color: 'amber', title: 'שיפור תוכן אודיו',
      text: `${lowListening.length} מקומות עם אחוז האזנה נמוך מ-40%.`,
      locs: lowListening.slice(0, 4),
    },
    inactive.length > 0 && {
      color: 'orange', title: 'מקומות לא פעילים',
      text: `${inactive.length} מקומות מוגדרים כ"לא פעיל" ואינם מוצגים לציבור.`,
      locs: inactive.slice(0, 4),
    },
  ].filter(Boolean);

  // ── Resets ─────────────────────────────────────────────────────────────────
  const resetViews = async () => {
    try {
      await Promise.all(locations.map(l => Location.update(l.id, { view_count: 0 })));
      toast({ title: 'כל הצפיות אופסו בהצלחה' });
      loadStats();
    } catch { toast({ title: 'שגיאה באיפוס הצפיות', variant: 'destructive' }); }
  };

  const resetAudio = async () => {
    try {
      await Promise.all(locations.map(l =>
        Location.update(l.id, { audio_plays: 0, total_listening_time: 0, average_listening_percentage: 0 })));
      toast({ title: 'סטטיסטיקות האודיו אופסו בהצלחה' });
      loadStats();
    } catch { toast({ title: 'שגיאה באיפוס האודיו', variant: 'destructive' }); }
  };

  // ── CSV export ─────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const headers = ['שם', 'קטגוריה', 'סטטוס', 'צפיות', 'צפיות QR', 'שיתופים', 'ניווטים', 'הפעלות וידאו', 'הפעלות אודיו', 'המרת אודיו %', '% האזנה', 'עברית', 'אנגלית', 'מעורבות'];
    const rows = sorted.map(l => [
      `"${l.name}"`,
      l.category || '',
      l.is_active ? 'פעיל' : 'לא פעיל',
      l.view_count || 0,
      l.qr_views || 0,
      l.share_count || 0,
      l.navigation_clicks || 0,
      l.video_plays || 0,
      l.audio_plays || 0,
      audioConversionRate(l),
      l.average_listening_percentage || 0,
      l.views_he || 0,
      l.views_en || 0,
      getEngagement(l.average_listening_percentage || 0).text,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `stats_${new Date().toLocaleDateString('he-IL').replace(/\//g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // ── Reset button ───────────────────────────────────────────────────────────
  const ResetBtn = ({ label, icon: Icon, onConfirm, confirmClass }) => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50 gap-2 shadow-sm">
          <Icon className="h-4 w-4" />{label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-white border-gray-200" dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-gray-900">{label}</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-500">פעולה זו אינה ניתנת לביטול.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl border-gray-200 text-gray-700">ביטול</AlertDialogCancel>
          <AlertDialogAction className={`rounded-xl text-white ${confirmClass}`} onClick={onConfirm}>אפס</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
            <BarChart2 className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">סטטיסטיקות</h1>
            <p className="text-gray-400 text-sm">נתוני שימוש ומעורבות</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline" size="sm"
            className="rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50 gap-2 shadow-sm"
            onClick={exportCSV}
            disabled={isLoading || locations.length === 0}
          >
            <Download className="h-4 w-4" /> ייצוא CSV
          </Button>
          <ResetBtn label="איפוס אודיו"  icon={Headphones} onConfirm={resetAudio} confirmClass="bg-amber-500 hover:bg-amber-600" />
          <ResetBtn label="איפוס צפיות"  icon={RotateCcw}  onConfirm={resetViews} confirmClass="bg-red-500 hover:bg-red-600"   />
        </div>
      </div>

      {/* Summary cards — row 1: core metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label='סה"כ מקומות'  value={locations.length}        icon={MapPin}      bg="bg-blue-50"   iconColor="text-blue-500"   loading={isLoading} />
        <StatCard label='סה"כ צפיות'   value={totalViews.toLocaleString()} icon={Eye}      bg="bg-purple-50" iconColor="text-purple-500" loading={isLoading} />
        <StatCard label="הפעלות אודיו" value={totalAudioPlays.toLocaleString()} icon={PlayCircle} bg="bg-green-50" iconColor="text-green-500" loading={isLoading} />
        <StatCard label="ממוצע האזנה (משוקלל)" value={`${weightedAvgListening}%`} icon={Headphones} bg="bg-orange-50" iconColor="text-orange-500" loading={isLoading} />
      </div>

      {/* Summary cards — row 2: new engagement metrics (show only if data exists) */}
      {!isLoading && (totalShares + totalNavs + totalVideoPlays + totalQrViews) > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {totalShares > 0     && <StatCard label="שיתופים"         value={totalShares.toLocaleString()}     icon={Share2}     bg="bg-pink-50"    iconColor="text-pink-500"    loading={false} />}
          {totalNavs > 0       && <StatCard label="ניווטים לאתר"    value={totalNavs.toLocaleString()}       icon={Navigation} bg="bg-cyan-50"    iconColor="text-cyan-500"    loading={false} />}
          {totalVideoPlays > 0 && <StatCard label="הפעלות וידאו"    value={totalVideoPlays.toLocaleString()} icon={Video}      bg="bg-indigo-50"  iconColor="text-indigo-500"  loading={false} />}
          {totalQrViews > 0    && <StatCard label="כניסות דרך QR"   value={totalQrViews.toLocaleString()}    icon={QrCode}     bg="bg-emerald-50" iconColor="text-emerald-500" loading={false} />}
        </div>
      )}

      {/* Top 3 */}
      {!isLoading && top3.length > 0 && top3[0].view_count > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">מקומות מובילים</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {top3.map((loc, i) => (
              <div key={loc.id} className={`rounded-xl p-4 border ${MEDAL_BG[i]}`}>
                <div className="flex items-start justify-between mb-2">
                  <span className={`text-xl font-black ${MEDAL_CLR[i]}`}>#{MEDAL_NUM[i]}</span>
                  <Link to={createPageUrl(`AdminEditLocation?id=${loc.id}`)}>
                    <span className="text-xs text-gray-400 hover:text-gray-700 transition-colors">ערוך →</span>
                  </Link>
                </div>
                <p className="font-bold text-gray-900 text-sm leading-tight">{loc.name}</p>
                <p className="text-xs text-gray-500 mt-1.5">{(loc.view_count || 0).toLocaleString()} צפיות</p>
                {(loc.share_count || 0) > 0 &&
                  <p className="text-xs text-gray-400">{loc.share_count} שיתופים</p>}
                {(loc.navigation_clicks || 0) > 0 &&
                  <p className="text-xs text-gray-400">{loc.navigation_clicks} ניווטים</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Language breakdown */}
      {!isLoading && (totalViewsHe + totalViewsEn) > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Languages className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">שפת הגולשים</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: 'עברית', value: totalViewsHe, color: 'bg-blue-500' },
              { label: 'English', value: totalViewsEn, color: 'bg-indigo-400' },
            ].map(({ label, value, color }) => {
              const pct = Math.round(value / (totalViewsHe + totalViewsEn) * 100);
              return (
                <div key={label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                    <span className="text-sm text-gray-500">{value.toLocaleString()} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full sortable table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Eye className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700">פירוט לפי מקום</h2>
          <span className="text-xs text-gray-400 mr-1">— לחץ על כותרת עמודה למיון</span>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/70 border-b border-gray-100 hover:bg-gray-50/70">
                <TableHead className="text-right text-gray-500 font-semibold text-xs uppercase tracking-wide whitespace-nowrap py-3">שם המקום</TableHead>
                <TableHead className="text-right text-gray-500 font-semibold text-xs uppercase tracking-wide whitespace-nowrap py-3">סטטוס</TableHead>
                <SortTh field="view_count"                current={sortField} dir={sortDir} onSort={handleSort}>צפיות</SortTh>
                <SortTh field="share_count"              current={sortField} dir={sortDir} onSort={handleSort}>שיתופים</SortTh>
                <SortTh field="navigation_clicks"        current={sortField} dir={sortDir} onSort={handleSort}>ניווטים</SortTh>
                <SortTh field="audio_plays"              current={sortField} dir={sortDir} onSort={handleSort}>הפעלות אודיו</SortTh>
                <SortTh field="audio_conversion"         current={sortField} dir={sortDir} onSort={handleSort}>המרת אודיו</SortTh>
                <SortTh field="average_listening_percentage" current={sortField} dir={sortDir} onSort={handleSort}>% האזנה</SortTh>
                <TableHead className="text-right text-gray-500 font-semibold text-xs uppercase tracking-wide whitespace-nowrap py-3">מעורבות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-b border-gray-100">
                      {Array.from({ length: 9 }).map((__, j) => (
                        <TableCell key={j}><div className="h-4 bg-gray-100 rounded-lg animate-pulse w-16" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : sorted.length === 0
                  ? <TableRow><TableCell colSpan={9} className="text-center py-12 text-gray-400">אין מקומות עדיין</TableCell></TableRow>
                  : sorted.map(loc => {
                      const pct = loc.average_listening_percentage || 0;
                      const eng = getEngagement(pct);
                      const conv = audioConversionRate(loc);
                      return (
                        <TableRow key={loc.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors">
                          <TableCell className="py-3.5">
                            <Link to={createPageUrl(`AdminEditLocation?id=${loc.id}`)} className="font-semibold text-gray-900 hover:text-blue-600 transition-colors whitespace-nowrap">
                              {loc.name}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${loc.is_active ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${loc.is_active ? 'bg-green-500' : 'bg-amber-500'}`} />
                              {loc.is_active ? 'פעיל' : 'לא פעיל'}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-sm text-gray-600">{(loc.view_count || 0).toLocaleString()}</TableCell>
                          <TableCell className="font-mono text-sm text-gray-600">{loc.share_count || 0}</TableCell>
                          <TableCell className="font-mono text-sm text-gray-600">{loc.navigation_clicks || 0}</TableCell>
                          <TableCell className="font-mono text-sm text-gray-600">{loc.audio_plays || 0}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-green-400 rounded-full" style={{ width: `${conv}%` }} />
                              </div>
                              <span className="font-mono text-xs text-gray-500">{conv}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm text-gray-600">{pct}%</TableCell>
                          <TableCell>
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${eng.cls}`}>{eng.text}</span>
                          </TableCell>
                        </TableRow>
                      );
                    })
              }
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Category progress bars */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-5">
          <BarChart2 className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700">סטטיסטיקות לפי קטגוריה</h2>
        </div>
        {isLoading
          ? <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-100 rounded-lg animate-pulse w-28" />
                <div className="h-2 bg-gray-100 rounded-full animate-pulse" />
              </div>))}</div>
          : categories.length === 0
            ? <p className="text-gray-400 text-sm">אין נתונים</p>
            : <div className="space-y-4">
                {categories.map(([cat, data]) => (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-800">{cat}</span>
                        <span className="text-xs text-gray-400">{data.count} מקומות</span>
                      </div>
                      <span className="text-sm font-mono text-gray-500">{data.views.toLocaleString()} צפיות</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-l from-purple-500 to-purple-400 rounded-full transition-all duration-700"
                        style={{ width: `${(data.views / maxCatViews) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
        }
      </div>

      {/* Recommendations */}
      {!isLoading && recommendations.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">המלצות לשיפור</h2>
          </div>
          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <div key={i} className={`p-4 rounded-xl border ${REC_STYLES[rec.color]}`}>
                <div className="flex gap-3">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 opacity-70" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold mb-0.5">{rec.title}</p>
                    <p className="text-xs opacity-75 mb-2">{rec.text}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {rec.locs.map(l => (
                        <Link key={l.id} to={createPageUrl(`AdminEditLocation?id=${l.id}`)}>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white/70 hover:bg-white transition-colors border border-current/20 cursor-pointer">
                            {l.name} <span className="opacity-50">←</span>
                          </span>
                        </Link>
                      ))}
                      {rec.locs.length < (rec.color === 'blue' ? noViews.length : rec.color === 'amber' ? lowListening.length : inactive.length) && (
                        <span className="text-xs opacity-60 self-center">
                          +{(rec.color === 'blue' ? noViews.length : rec.color === 'amber' ? lowListening.length : inactive.length) - rec.locs.length} נוספים
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoading && recommendations.length === 0 && locations.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
          <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-6 h-6 text-green-500" />
          </div>
          <p className="text-sm font-semibold text-gray-800">הכל נראה מצוין!</p>
          <p className="text-xs text-gray-400 mt-1">אין המלצות לשיפור כרגע.</p>
        </div>
      )}

    </div>
  );
}
