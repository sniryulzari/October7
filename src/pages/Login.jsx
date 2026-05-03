import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/api/entities';
import { supabase } from '@/api/supabaseClient';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldX, Loader2, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 60;
const RESET_COOLDOWN_SECONDS = 30;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('login'); // 'login' | 'forgot'
  const [resetSent, setResetSent] = useState(false);

  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [lockCountdown, setLockCountdown] = useState(0);

  const [resetCooldownUntil, setResetCooldownUntil] = useState(null);
  const [resetCountdown, setResetCountdown] = useState(0);

  const navigate = useNavigate();
  const timerRef = useRef(null);

  useEffect(() => {
    if (!lockedUntil && !resetCooldownUntil) return;
    timerRef.current = setInterval(() => {
      const now = Date.now();
      if (lockedUntil) setLockCountdown(Math.max(0, Math.ceil((lockedUntil - now) / 1000)));
      if (resetCooldownUntil) setResetCountdown(Math.max(0, Math.ceil((resetCooldownUntil - now) / 1000)));
      if ((!lockedUntil || now >= lockedUntil) && (!resetCooldownUntil || now >= resetCooldownUntil)) {
        clearInterval(timerRef.current);
      }
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [lockedUntil, resetCooldownUntil]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (lockedUntil && Date.now() < lockedUntil) return;

    setError('');
    setIsLoading(true);
    try {
      await User.login({ email, password });
      const user = await User.me();
      if (user.role === 'admin') {
        navigate(createPageUrl('AdminDashboard'));
      } else if (user.role === 'contributor') {
        navigate(createPageUrl('AdminLocations'));
      } else {
        setError('אין לך הרשאות גישה למערכת');
        await User.logout();
      }
      setLoginAttempts(0);
    } catch (err) {
      if (err?.status === 429) {
        const until = Date.now() + LOCKOUT_SECONDS * 1000;
        setLockedUntil(until);
        setError(`יותר מדי ניסיונות — נסה שוב בעוד ${LOCKOUT_SECONDS} שניות`);
      } else {
        const next = loginAttempts + 1;
        setLoginAttempts(next);
        if (next >= MAX_LOGIN_ATTEMPTS) {
          const until = Date.now() + LOCKOUT_SECONDS * 1000;
          setLockedUntil(until);
          setError(`יותר מדי ניסיונות — נסה שוב בעוד ${LOCKOUT_SECONDS} שניות`);
        } else {
          setError('אימייל או סיסמה שגויים');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (resetCooldownUntil && Date.now() < resetCooldownUntil) return;

    setError('');
    setIsLoading(true);
    try {
      const redirectTo = `${window.location.origin}/resetpassword`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      setResetSent(true);
      setResetCooldownUntil(Date.now() + RESET_COOLDOWN_SECONDS * 1000);
    } catch {
      setError('אם הכתובת קיימת במערכת, נשלח אליה קישור לאיפוס הסיסמה.');
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
          <CardTitle className="text-2xl font-bold text-white">
            {mode === 'login' ? 'כניסה לממשק ניהול' : 'איפוס סיסמה'}
          </CardTitle>
          <p className="text-slate-400 text-sm mt-1">זיכרון 7.10</p>
        </CardHeader>

        <CardContent>
          {/* Login form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">אימייל</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-orange-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">סיסמה</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-orange-500 pl-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-sm text-center bg-red-900/30 py-2 px-3 rounded-lg">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={isLoading || (lockedUntil && Date.now() < lockedUntil)}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold py-3"
              >
                {isLoading
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> מתחבר...</>
                  : lockCountdown > 0
                    ? `נסה שוב בעוד ${lockCountdown}ש'`
                    : 'כניסה'}
              </Button>

              <button
                type="button"
                onClick={() => { setMode('forgot'); setError(''); }}
                className="w-full text-slate-400 hover:text-slate-200 text-sm text-center transition-colors"
              >
                שכחתי סיסמה
              </button>
            </form>
          )}

          {/* Forgot password form */}
          {mode === 'forgot' && !resetSent && (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <p className="text-slate-400 text-sm">
                הזן את כתובת האימייל שלך ונשלח לך קישור לאיפוס הסיסמה.
              </p>
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-slate-300">אימייל</Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
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
                disabled={isLoading || (resetCooldownUntil && Date.now() < resetCooldownUntil)}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold py-3"
              >
                {isLoading
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> שולח...</>
                  : resetCountdown > 0
                    ? `ניתן לשלוח שוב בעוד ${resetCountdown}ש'`
                    : 'שלח קישור לאיפוס'}
              </Button>

              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className="w-full flex items-center justify-center gap-1 text-slate-400 hover:text-slate-200 text-sm transition-colors"
              >
                <ArrowRight className="w-3 h-3" />
                חזרה לכניסה
              </button>
            </form>
          )}

          {/* Reset email sent confirmation */}
          {mode === 'forgot' && resetSent && (
            <div className="text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
              <p className="text-slate-200 font-medium">הקישור נשלח!</p>
              <p className="text-slate-400 text-sm">
                בדוק את תיבת הדואר של <span className="text-white">{email}</span> ולחץ על הקישור לאיפוס הסיסמה.
              </p>
              <button
                type="button"
                onClick={() => { setMode('login'); setResetSent(false); setError(''); }}
                className="text-slate-400 hover:text-slate-200 text-sm flex items-center justify-center gap-1 mx-auto transition-colors"
              >
                <ArrowRight className="w-3 h-3" />
                חזרה לכניסה
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
