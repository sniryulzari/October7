
import React, { useEffect } from 'react';
import PublicLayout from '@/components/public/PublicLayout';
import AdminLayout from '@/components/admin/AdminLayout';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

const LoginPage = () => (
    <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
            <Shield className="mx-auto h-12 w-12 text-gray-400" />
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                נדרשת התחברות
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
                כדי לגשת לאזור זה, עליך להתחבר.
            </p>
            <div className="mt-6">
                <Button onClick={() => User.login()}>
                    התחבר
                </Button>
            </div>
        </div>
    </div>
);

export default function Layout({ children, currentPageName }) {
  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPageName]);

  if (currentPageName.startsWith('Admin')) {
    return <AdminLayout>{children}</AdminLayout>;
  }
  
  if (currentPageName === 'AccessDenied') {
      return children;
  }

  return <PublicLayout>{children}</PublicLayout>;
}
