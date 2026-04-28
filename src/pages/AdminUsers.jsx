import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { useAuth } from '@/api/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, ShieldCheck, UserPlus, Trash2, KeyRound, Loader2 } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

function getInitials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = ['bg-blue-400', 'bg-purple-400', 'bg-green-400', 'bg-amber-400', 'bg-pink-400', 'bg-indigo-400'];

const ROLE_META = {
  admin:       { label: 'מנהל',        badge: 'bg-purple-100 text-purple-700', icon: Shield },
  contributor: { label: 'תורם תוכן',  badge: 'bg-blue-100 text-blue-700',    icon: ShieldCheck },
  user:        { label: 'משתמש',       badge: 'bg-gray-100 text-gray-600',    icon: null },
};

function RoleBadge({ role }) {
  const meta = ROLE_META[role] || ROLE_META.user;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${meta.badge}`}>
      {Icon && <Icon className="w-3 h-3" />}
      {meta.label}
    </span>
  );
}

const ROLE_OPTIONS = [
  { value: 'admin',       label: 'מנהל — גישה מלאה' },
  { value: 'contributor', label: 'תורם תוכן — עריכה במקומות מוקצים' },
  { value: 'user',        label: 'משתמש — ללא גישה לממשק' },
];

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Invite dialog
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFullName, setInviteFullName] = useState('');
  const [inviteRole, setInviteRole] = useState('contributor');
  const [isInviting, setIsInviting] = useState(false);

  // Loading states per user
  const [pendingRole, setPendingRole] = useState({});
  const [pendingReset, setPendingReset] = useState({});
  const [pendingDelete, setPendingDelete] = useState({});

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      setUsers(await User.list());
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const handleRoleChange = async (userId, newRole) => {
    setPendingRole(p => ({ ...p, [userId]: true }));
    try {
      await User.update(userId, { role: newRole });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast({ title: 'התפקיד עודכן בהצלחה' });
    } catch (e) {
      toast({ title: 'שגיאה בעדכון התפקיד', description: e.message, variant: 'destructive' });
    }
    setPendingRole(p => ({ ...p, [userId]: false }));
  };

  const handlePasswordReset = async (userId, email) => {
    setPendingReset(p => ({ ...p, [userId]: true }));
    try {
      await User.sendPasswordReset(email);
      toast({ title: 'נשלח מייל לאיפוס סיסמה', description: `קישור נשלח לכתובת ${email}` });
    } catch (e) {
      toast({ title: 'שגיאה בשליחת המייל', description: e.message, variant: 'destructive' });
    }
    setPendingReset(p => ({ ...p, [userId]: false }));
  };

  const handleDelete = async (userId) => {
    setPendingDelete(p => ({ ...p, [userId]: true }));
    try {
      await User.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast({ title: 'המשתמש נמחק בהצלחה' });
    } catch (e) {
      toast({ title: 'שגיאה במחיקת המשתמש', description: e.message, variant: 'destructive' });
    }
    setPendingDelete(p => ({ ...p, [userId]: false }));
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setIsInviting(true);
    try {
      await User.invite(inviteEmail, inviteFullName, inviteRole);
      toast({
        title: 'ההזמנה נשלחה בהצלחה',
        description: `קישור הוגדרת סיסמה נשלח לכתובת ${inviteEmail}`,
      });
      setInviteOpen(false);
      setInviteEmail('');
      setInviteFullName('');
      setInviteRole('contributor');
      loadUsers();
    } catch (e) {
      toast({ title: 'שגיאה בשליחת ההזמנה', description: e.message, variant: 'destructive' });
    }
    setIsInviting(false);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ניהול משתמשים</h1>
          <p className="text-gray-400 text-sm mt-0.5">הזמן משתמשים והגדר את הרשאות הגישה שלהם</p>
        </div>
        <Button
          onClick={() => setInviteOpen(true)}
          className="bg-[#1e2139] hover:bg-[#2a2f4a] text-white rounded-xl gap-2 shadow-sm"
        >
          <UserPlus className="h-4 w-4" />
          הזמן משתמש
        </Button>
      </div>

      {/* Roles explanation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { role: 'admin',       desc: 'גישה מלאה לכל הממשק — יצירה, עריכה, מחיקה, ניהול משתמשים' },
          { role: 'contributor', desc: 'יכול לעדכן תוכן רק במקומות שהוקצו לו, ללא מחיקה או ניהול' },
          { role: 'user',        desc: 'ללא גישה לממשק הניהול — ניתן להקצות מאוחר יותר' },
        ].map(({ role, desc }) => (
          <div key={role} className="flex gap-3 p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
            <RoleBadge role={role} />
            <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* Table */}
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
                    <TableCell><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" /><div className="h-4 bg-gray-100 rounded-lg animate-pulse w-28" /></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-100 rounded-lg animate-pulse w-40" /></TableCell>
                    <TableCell><div className="h-6 bg-gray-100 rounded-full animate-pulse w-24" /></TableCell>
                    <TableCell><div className="h-8 bg-gray-100 rounded-xl animate-pulse w-40" /></TableCell>
                  </TableRow>
                ))
              : users.map((user, idx) => {
                  const isMe = user.id === currentUser?.id;
                  return (
                    <TableRow key={user.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors">
                      {/* Name */}
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                            {getInitials(user.full_name)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 leading-tight">{user.full_name || '—'}</p>
                            {isMe && <p className="text-xs text-blue-500">זה אתה</p>}
                          </div>
                        </div>
                      </TableCell>

                      {/* Email */}
                      <TableCell className="text-gray-500 text-sm">{user.email}</TableCell>

                      {/* Role selector */}
                      <TableCell>
                        {isMe ? (
                          <RoleBadge role={user.role} />
                        ) : (
                          <div className="flex items-center gap-2">
                            <Select
                              value={user.role || 'user'}
                              onValueChange={(val) => handleRoleChange(user.id, val)}
                              disabled={!!pendingRole[user.id]}
                            >
                              <SelectTrigger className="h-8 text-xs border-gray-200 bg-white w-44 rounded-lg">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ROLE_OPTIONS.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {pendingRole[user.id] && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />}
                          </div>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        {!isMe && (
                          <div className="flex items-center gap-1.5">
                            {/* Password reset */}
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!!pendingReset[user.id]}
                              onClick={() => handlePasswordReset(user.id, user.email)}
                              className="rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50 gap-1.5 shadow-sm text-xs h-8"
                            >
                              {pendingReset[user.id]
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <KeyRound className="h-3.5 w-3.5 text-amber-500" />}
                              איפוס סיסמה
                            </Button>

                            {/* Delete */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={!!pendingDelete[user.id]}
                                  className="rounded-xl border-gray-200 text-gray-600 hover:bg-red-50 hover:border-red-200 gap-1.5 shadow-sm text-xs h-8"
                                >
                                  {pendingDelete[user.id]
                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    : <Trash2 className="h-3.5 w-3.5 text-red-500" />}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-white border-gray-200" dir="rtl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-gray-900">מחיקת {user.full_name || user.email}?</AlertDialogTitle>
                                  <AlertDialogDescription className="text-gray-500">
                                    המשתמש יוסר לצמיתות מהמערכת. פעולה זו אינה ניתנת לביטול.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="rounded-xl border-gray-200 text-gray-700">ביטול</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
                                    onClick={() => handleDelete(user.id)}
                                  >
                                    מחק לצמיתות
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
            }
          </TableBody>
        </Table>
      </div>

      {/* Security note */}
      <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <Shield className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800 mb-0.5">הערות אבטחה</p>
          <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
            <li>רק מנהל יכול לשנות תפקידים ולהזמין משתמשים חדשים.</li>
            <li>לא ניתן לשנות את התפקיד שלך עצמך.</li>
            <li>לאיפוס סיסמה נשלח קישור חד-פעמי לאימייל המשתמש בלבד.</li>
            <li>תורמי תוכן יכולים לערוך רק מקומות שהוקצו להם בדף עריכת מקום.</li>
          </ul>
        </div>
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="bg-white border-gray-200 max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-gray-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-500" />
              הזמן משתמש חדש
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleInvite} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">כתובת אימייל *</Label>
              <Input
                type="email"
                required
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="user@example.com"
                className="bg-white border-gray-200 text-gray-900"
                dir="ltr"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">שם מלא</Label>
              <Input
                type="text"
                value={inviteFullName}
                onChange={e => setInviteFullName(e.target.value)}
                placeholder="ישראל ישראלי"
                className="bg-white border-gray-200 text-gray-900"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">תפקיד</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="bg-white border-gray-200 text-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400">
                {inviteRole === 'contributor'
                  ? 'לאחר ההזמנה, הגדר במה מקומות הוא יכול לערוך דרך דף "עריכת מקום".'
                  : inviteRole === 'admin'
                  ? 'המשתמש יקבל גישה מלאה לממשק הניהול.'
                  : 'משתמש ללא גישה לממשק — ניתן לשנות תפקיד בכל עת.'}
              </p>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
              יישלח מייל הזמנה עם קישור חד-פעמי להגדרת סיסמה. הקישור תקף ל-24 שעות.
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setInviteOpen(false)}
                className="rounded-xl border-gray-200 text-gray-700"
              >
                ביטול
              </Button>
              <Button
                type="submit"
                disabled={isInviting}
                className="bg-[#1e2139] hover:bg-[#2a2f4a] text-white rounded-xl gap-2"
              >
                {isInviting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> שולח...</>
                  : <><UserPlus className="w-4 h-4" /> שלח הזמנה</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
