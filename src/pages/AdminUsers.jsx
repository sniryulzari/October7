import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Shield, ShieldCheck, Users } from 'lucide-react';
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

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const currentUserData = await User.me();
      setCurrentUser(currentUserData);
      
      const usersData = await User.list();
      setUsers(usersData);
    } catch (error) {
      console.error("Error loading users:", error);
    }
    setIsLoading(false);
  };

  const changeUserRole = async (userId, newRole) => {
    try {
      await User.update(userId, { role: newRole });
      loadUsers(); // Refresh list
    } catch (error) {
      console.error("Error updating user role:", error);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Users className="w-8 h-8 text-blue-400" />
        <h1 className="text-3xl font-bold text-white">ניהול משתמשים</h1>
      </div>

      <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
        <Table>
          <TableHeader>
            <TableRow className="border-b-slate-700 hover:bg-slate-800">
              <TableHead className="text-right text-white">שם מלא</TableHead>
              <TableHead className="text-right text-white">אימייל</TableHead>
              <TableHead className="text-right text-white">תפקיד</TableHead>
              <TableHead className="text-right text-white">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center p-8 text-slate-400">טוען משתמשים...</TableCell>
              </TableRow>
            ) : users.map(user => (
              <TableRow key={user.id} className="border-b-slate-700 hover:bg-slate-700/50">
                <TableCell className="font-medium text-white">
                  {user.full_name}
                  {user.id === currentUser?.id && <span className="text-blue-400 text-sm mr-2">(אתה)</span>}
                </TableCell>
                <TableCell className="text-slate-300">{user.email}</TableCell>
                <TableCell>
                  <Badge 
                    className={user.role === 'admin' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-slate-600/50 text-slate-300 border-slate-500/50'}
                  >
                    {user.role === 'admin' ? 'מנהל' : 'משתמש רגיל'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.id !== currentUser?.id && (
                    <div className="flex gap-2">
                      {user.role !== 'admin' ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="border-green-500/50 text-green-400 hover:bg-green-500/20 hover:text-green-300">
                              <ShieldCheck className="h-4 w-4 ml-1" />
                              הפוך למנהל
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-slate-900 text-white border-slate-700" dir="rtl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>האם להפוך את {user.full_name} למנהל?</AlertDialogTitle>
                              <AlertDialogDescription className="text-slate-400">
                                משתמש זה יקבל גישה מלאה למערכת הניהול ויוכל לערוך ולמחוק תכנים.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-slate-700 border-0 hover:bg-slate-600">ביטול</AlertDialogCancel>
                              <AlertDialogAction 
                                className="bg-green-600 hover:bg-green-700" 
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
                            <Button variant="outline" size="sm" className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20 hover:text-yellow-300">
                              <Shield className="h-4 w-4 ml-1" />
                              הסר הרשאות מנהל
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-slate-900 text-white border-slate-700" dir="rtl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>האם להסיר הרשאות מנהל מ-{user.full_name}?</AlertDialogTitle>
                              <AlertDialogDescription className="text-slate-400">
                                משתמש זה יאבד את הגישה למערכת הניהול ויהפוך למשתמש רגיל.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-slate-700 border-0 hover:bg-slate-600">ביטול</AlertDialogCancel>
                              <AlertDialogAction 
                                className="bg-yellow-600 hover:bg-yellow-700" 
                                onClick={() => changeUserRole(user.id, 'user')}
                              >
                                הסר הרשאות
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <h3 className="text-lg font-semibold text-yellow-400 mb-2">הערה חשובה</h3>
        <p className="text-slate-300 text-sm">
          רק מנהלים יכולים לשנות הרשאות של משתמשים אחרים. המשתמש הנוכחי (אתה) לא יכול לשנות את ההרשאות של עצמו למטרות אבטחה.
        </p>
      </div>
    </div>
  );
}