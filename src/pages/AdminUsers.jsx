import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, ShieldCheck } from 'lucide-react';
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

function getInitials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = ['bg-blue-400', 'bg-purple-400', 'bg-green-400', 'bg-amber-400', 'bg-pink-400', 'bg-indigo-400'];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const [me, list] = await Promise.all([User.me(), User.list()]);
      setCurrentUser(me);
      setUsers(list);
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const changeUserRole = async (userId, newRole) => {
    try {
      await User.update(userId, { role: newRole });
      loadUsers();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ניהול משתמשים</h1>
        <p className="text-gray-400 text-sm mt-0.5">הגדרת הרשאות גישה למערכת</p>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/70 border-b border-gray-100 hover:bg-gray-50/70">
              <TableHead className="text-right text-gray-500 font-semibold text-xs uppercase tracking-wide py-3.5">משתמש</TableHead>
              <TableHead className="text-right text-gray-500 font-semibold text-xs uppercase tracking-wide py-3.5">אימייל</TableHead>
              <TableHead className="text-right text-gray-500 font-semibold text-xs uppercase tracking-wide py-3.5">תפקיד</TableHead>
              <TableHead className="text-right text-gray-500 font-semibold text-xs uppercase tracking-wide py-3.5">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-gray-100">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
                        <div className="h-4 bg-gray-100 rounded-lg animate-pulse w-28" />
                      </div>
                    </TableCell>
                    <TableCell><div className="h-4 bg-gray-100 rounded-lg animate-pulse w-40" /></TableCell>
                    <TableCell><div className="h-6 bg-gray-100 rounded-full animate-pulse w-20" /></TableCell>
                    <TableCell><div className="h-8 bg-gray-100 rounded-xl animate-pulse w-28" /></TableCell>
                  </TableRow>
                ))
              : users.map((user, idx) => (
                  <TableRow key={user.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors">
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                          {getInitials(user.full_name)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 leading-tight">
                            {user.full_name}
                          </p>
                          {user.id === currentUser?.id && (
                            <p className="text-xs text-blue-500">זה אתה</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">{user.email}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {user.role === 'admin' && <Shield className="w-3 h-3" />}
                        {user.role === 'admin' ? 'מנהל' : 'משתמש'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {user.id !== currentUser?.id && (
                        user.role !== 'admin'
                          ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline" className="rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50 gap-1.5 shadow-sm text-xs h-8">
                                  <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
                                  הפוך למנהל
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-white border-gray-200" dir="rtl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-gray-900">הפיכת {user.full_name} למנהל?</AlertDialogTitle>
                                  <AlertDialogDescription className="text-gray-500">
                                    המשתמש יקבל גישה מלאה למערכת הניהול ויוכל לערוך ולמחוק תכנים.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="rounded-xl border-gray-200 text-gray-700">ביטול</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-green-500 hover:bg-green-600 text-white rounded-xl"
                                    onClick={() => changeUserRole(user.id, 'admin')}
                                  >
                                    הפוך למנהל
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline" className="rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50 gap-1.5 shadow-sm text-xs h-8">
                                  <Shield className="h-3.5 w-3.5 text-amber-500" />
                                  הסר הרשאות
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-white border-gray-200" dir="rtl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-gray-900">הסרת הרשאות מנהל מ-{user.full_name}?</AlertDialogTitle>
                                  <AlertDialogDescription className="text-gray-500">
                                    המשתמש יאבד את הגישה למערכת הניהול ויהפוך למשתמש רגיל.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="rounded-xl border-gray-200 text-gray-700">ביטול</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl"
                                    onClick={() => changeUserRole(user.id, 'user')}
                                  >
                                    הסר הרשאות
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )
                      )}
                    </TableCell>
                  </TableRow>
                ))
            }
          </TableBody>
        </Table>
      </div>

      {/* Note */}
      <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <Shield className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800 mb-0.5">הערה חשובה</p>
          <p className="text-xs text-amber-700">
            רק מנהלים יכולים לשנות הרשאות של משתמשים אחרים. לא ניתן לשנות את הרשאות המשתמש הנוכחי למטרות אבטחה.
          </p>
        </div>
      </div>
    </div>
  );
}
