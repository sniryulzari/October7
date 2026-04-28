import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldX, Loader2, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validToken, setValidToken] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase puts the recovery token in the URL hash
    const hash = window.location.hash;
    if (hash.includes('type=recovery') || hash.includes('access_token')) {
      setValidToken(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }
    if (password !== confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      // Redirect based on role
      const { data: { user: updatedUser } } = await supabase.auth.getUser();
      const role = updatedUser?.app_metadata?.role;
      const destination = role === 'contributor'
        ? createPageUrl('AdminLocations')
        : createPageUrl('AdminDashboard');
      setTimeout(() => navigate(destination), 2500);
    } catch {
      setError('שגיאה באיפוס הסיסמה. נסה לבקש קישור חדש.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700 text-white">
        <CardHeader className="text-center pb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-red-700 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ShieldX className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">הגדרת סיסמה חדשה</CardTitle>
          <p className="text-slate-400 text-sm mt-1">זיכרון 7.10</p>
        </CardHeader>

        <CardContent>
          {success ? (
            <div className="text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
              <p className="text-slate-200 font-medium">הסיסמה עודכנה בהצלחה!</p>
              <p className="text-slate-400 text-sm">מועבר לממשק הניהול...</p>
            </div>
          ) : !validToken ? (
            <div className="text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-orange-400 mx-auto" />
              <p className="text-slate-200 font-medium">קישור לא תקין</p>
              <p className="text-slate-400 text-sm">הקישור לאיפוס פג תוקף או אינו תקין. בקש קישור חדש.</p>
              <Button
                onClick={() => navigate(createPageUrl('Login'))}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
              >
                חזור לכניסה
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">סיסמה חדשה</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="לפחות 6 תווים"
                    required
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-orange-500 pl-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-slate-300">אימות סיסמה</Label>
                <Input
                  id="confirm"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="הזן שוב את הסיסמה"
                  required
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-orange-500"
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm text-center bg-red-900/30 py-2 px-3 rounded-lg">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold py-3"
              >
                {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> מעדכן...</> : 'עדכן סיסמה'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
