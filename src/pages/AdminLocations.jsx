import React, { useState, useEffect } from 'react';
import { Location } from '@/api/entities';
import { useAuth } from '@/api/AuthContext';
import { sanitizeError } from '@/utils/sanitizeError';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, Eye, QrCode, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from '@/components/ui/use-toast';
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
} from '@/components/ui/alert-dialog';

function StatusPill({ active }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
      active ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500' : 'bg-amber-500'}`} />
      {active ? 'פעיל' : 'לא פעיל'}
    </span>
  );
}

function IconBtn({ children, className = '', ...props }) {
  return (
    <button
      className={`w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default function ManageLocations() {
  const { user } = useAuth();
  const isContributor = user?.role === 'contributor';

  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { loadLocations(); }, [user]);

  const loadLocations = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = isContributor
        ? await Location.getByContributor(user.id)
        : await Location.list('-created_date');
      setLocations(data);
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const handleDelete = async (id, name) => {
    try {
      await Location.delete(id);
      setLocations(prev => prev.filter(l => l.id !== id));
      toast({ title: `"${name}" נמחק בהצלחה` });
    } catch (e) {
      toast({ title: 'שגיאה במחיקה', description: sanitizeError(e), variant: 'destructive' });
    }
  };

  const filtered = search
    ? locations.filter(l => l.name?.toLowerCase().includes(search.toLowerCase()))
    : locations;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isContributor ? 'המקומות שלי' : 'ניהול מקומות'}
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {!isLoading && (isContributor
              ? `${locations.length} מקומות מוקצים לך`
              : `${locations.length} מקומות במערכת`)}
          </p>
        </div>
        {!isContributor && (
          <Link to={createPageUrl('AdminEditLocation')}>
            <Button className="bg-[#1e2139] hover:bg-[#2a2f4a] text-white rounded-xl gap-2 shadow-sm">
              <PlusCircle className="h-4 w-4" />
              הוסף מקום חדש
            </Button>
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חיפוש לפי שם מקום..."
          className="bg-white border-gray-200 rounded-xl pr-10 shadow-sm focus-visible:ring-orange-400 text-gray-900 placeholder:text-gray-400"
        />
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-100 bg-gray-50/70 hover:bg-gray-50/70">
              <TableHead className="text-right text-gray-500 font-semibold text-xs uppercase tracking-wide py-3.5">שם המקום</TableHead>
              <TableHead className="text-right text-gray-500 font-semibold text-xs uppercase tracking-wide py-3.5">סטטוס</TableHead>
              <TableHead className="text-right text-gray-500 font-semibold text-xs uppercase tracking-wide py-3.5">צפיות</TableHead>
              <TableHead className="text-right text-gray-500 font-semibold text-xs uppercase tracking-wide py-3.5">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-gray-100">
                    <TableCell><div className="h-4 bg-gray-100 rounded-lg animate-pulse w-36" /></TableCell>
                    <TableCell><div className="h-6 bg-gray-100 rounded-full animate-pulse w-16" /></TableCell>
                    <TableCell><div className="h-4 bg-gray-100 rounded-lg animate-pulse w-8" /></TableCell>
                    <TableCell><div className="h-7 bg-gray-100 rounded-lg animate-pulse w-24" /></TableCell>
                  </TableRow>
                ))
              : filtered.length === 0
                ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-gray-400">
                      {search ? `לא נמצאו תוצאות עבור "${search}"` : 'אין מקומות עדיין'}
                    </TableCell>
                  </TableRow>
                )
                : filtered.map(loc => (
                  <TableRow key={loc.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors">
                    <TableCell className="font-semibold text-gray-900 py-3.5">{loc.name}</TableCell>
                    <TableCell><StatusPill active={loc.is_active} /></TableCell>
                    <TableCell className="text-gray-500 font-mono text-sm">{loc.view_count || 0}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-0.5">
                        {/* View */}
                        <Link to={createPageUrl(`Location?id=${loc.id}`)} target="_blank">
                          <IconBtn className="hover:text-blue-500 hover:bg-blue-50">
                            <Eye className="w-4 h-4" />
                          </IconBtn>
                        </Link>

                        {/* QR */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <IconBtn className="hover:text-green-600 hover:bg-green-50">
                              <QrCode className="w-4 h-4" />
                            </IconBtn>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-white border-gray-200" dir="rtl">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-gray-900">קוד QR — {loc.name}</AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-500">
                                סרוק את הקוד כדי להגיע ישירות לדף המקום.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="flex flex-col items-center gap-4 py-4">
                              {loc.qr_code_image_url
                                ? <img src={loc.qr_code_image_url} alt={`QR for ${loc.name}`} className="w-48 h-48 bg-white p-2 rounded-xl border border-gray-200" loading="lazy" />
                                : <p className="text-amber-600 text-sm">יש ליצור תמונת QR בדף העריכה.</p>
                              }
                              <Input
                                readOnly
                                value={`${window.location.origin}${createPageUrl(`Location?id=${loc.id}`)}`}
                                className="text-center text-xs text-gray-600 bg-gray-50 border-gray-200"
                              />
                            </div>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl border-gray-200 text-gray-700">סגור</AlertDialogCancel>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        {/* Edit */}
                        <Link to={createPageUrl(`AdminEditLocation?id=${loc.id}`)}>
                          <IconBtn className="hover:text-amber-600 hover:bg-amber-50">
                            <Edit className="w-4 h-4" />
                          </IconBtn>
                        </Link>

                        {/* Delete — admin only */}
                        {!isContributor && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <IconBtn className="hover:text-red-500 hover:bg-red-50">
                                <Trash2 className="w-4 h-4" />
                              </IconBtn>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-white border-gray-200" dir="rtl">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-gray-900">מחיקת "{loc.name}"</AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-500">
                                  פעולה זו תמחק את המקום לצמיתות ולא ניתן לשחזרה.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl border-gray-200 text-gray-700">ביטול</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
                                  onClick={() => handleDelete(loc.id, loc.name)}
                                >
                                  מחק לצמיתות
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
            }
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
