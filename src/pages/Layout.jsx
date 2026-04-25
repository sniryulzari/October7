
import React, { useEffect } from 'react';
import PublicLayout from '@/components/public/PublicLayout';
import AdminLayout from '@/components/admin/AdminLayout';

export default function Layout({ children, currentPageName }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPageName]);

  if (currentPageName.startsWith('Admin')) {
    return <AdminLayout>{children}</AdminLayout>;
  }

  if (currentPageName === 'AccessDenied' || currentPageName === 'Login' || currentPageName === 'ResetPassword') {
    return children;
  }

  return <PublicLayout>{children}</PublicLayout>;
}
