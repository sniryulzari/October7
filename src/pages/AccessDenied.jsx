import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Home, LogOut } from 'lucide-react';
import { User } from '@/api/entities';

export default function AccessDenied() {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await User.logout();
        navigate(createPageUrl("Home"));
    };
    
  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center" dir="rtl">
      <div className="text-center p-8 bg-white rounded-lg shadow-xl max-w-md w-full">
        <ShieldAlert className="w-20 h-20 text-[#1E3A5F] mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-[#222222] mb-2">
          הגישה נדחתה
        </h1>
        <p className="text-[#555555] mb-8">
          אין לך את ההרשאות המתאימות לצפייה בדף זה.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to={createPageUrl("Home")}>
            <Button className="w-full bg-[#1E3A5F] hover:bg-[#2C5E9E]">
              <Home className="ml-2 w-4 h-4" />
              חזור לדף הבית
            </Button>
          </Link>
          <Button variant="outline" onClick={handleLogout} className="w-full border-[#1E3A5F] text-[#1E3A5F] hover:bg-[#F5F5F5]">
            <LogOut className="ml-2 w-4 h-4" />
            התנתק ונסה שוב
          </Button>
        </div>
      </div>
    </div>
  );
}