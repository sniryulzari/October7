
import React, { useState, useEffect } from 'react';
import { Location } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Edit, Trash2, Eye, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
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
import { Input } from "@/components/ui/input";

export default function ManageLocations() {
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    setIsLoading(true);
    try {
      const data = await Location.list('-created_date');
      setLocations(data);
    } catch (error) {
      console.error("Error loading locations:", error);
    }
    setIsLoading(false);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`האם אתה בטוח שברצונך למחוק את המקום "${name}"? פעולה זו אינה ניתנת לביטול.`)) {
      try {
        await Location.delete(id);
        loadLocations();
      } catch (error) {
        console.error("Error deleting location:", error);
        alert("שגיאה במחיקת המקום: " + error.message);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">ניהול מקומות</h1>
        <Link to={createPageUrl("AdminEditLocation")}>
          <Button className="bg-red-600 hover:bg-red-700">
            <PlusCircle className="ml-2 h-4 w-4" />
            הוסף מקום חדש
          </Button>
        </Link>
      </div>

      <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
        <Table>
          <TableHeader>
            <TableRow className="border-b-slate-700 hover:bg-slate-800">
              <TableHead className="text-right text-white">שם המקום</TableHead>
              <TableHead className="text-right text-white">סטטוס</TableHead>
              <TableHead className="text-right text-white">צפיות</TableHead>
              <TableHead className="text-right text-white">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center p-8 text-slate-400">טוען מקומות...</TableCell>
              </TableRow>
            ) : locations.map(location => (
              <TableRow key={location.id} className="border-b-slate-700 hover:bg-slate-700/50">
                <TableCell className="font-medium text-white">{location.name}</TableCell>
                <TableCell>
                  <Badge className={location.is_active ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'}>
                    {location.is_active ? 'פעיל' : 'לא פעיל'}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-300">{location.view_count || 0}</TableCell>
                <TableCell>
                  <div className="flex gap-1 sm:gap-2">
                    <Link to={createPageUrl(`Location?id=${location.id}`)} target="_blank">
                       <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-400"><Eye className="h-4 w-4" /></Button>
                    </Link>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="icon" className="text-slate-400 hover:text-green-400"><QrCode className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-slate-900 text-white border-slate-700" dir="rtl">
                            <AlertDialogHeader>
                                <AlertDialogTitle>קוד QR עבור "{location.name}"</AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-400">
                                    ניתן לסרוק קוד זה כדי להגיע ישירות לדף המקום.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="flex flex-col items-center justify-center gap-4 py-4">
                                {location.qr_code_image_url ? (
                                    <img src={location.qr_code_image_url} alt={`QR Code for ${location.name}`} className="w-48 h-48 bg-white p-2 rounded-lg"/>
                                ) : (
                                    <p className="text-yellow-400">יש ליצור תמונת QR בדף העריכה.</p>
                                )}
                                <Input
                                  readOnly
                                  value={`${window.location.origin}${createPageUrl(`Location?id=${location.id}`)}`}
                                  className="bg-slate-800 border-slate-700 text-center"
                                />
                            </div>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="bg-slate-700 border-0 hover:bg-slate-600">סגור</AlertDialogCancel>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <Link to={createPageUrl(`AdminEditLocation?id=${location.id}`)}>
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-yellow-400"><Edit className="h-4 w-4" /></Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(location.id, location.name)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      מחק
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
