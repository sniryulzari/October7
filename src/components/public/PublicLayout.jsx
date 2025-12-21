
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Route, Map, Search, Home, Mail, Shield, FileText, Settings } from 'lucide-react';
import { User } from '@/api/entities';

export default function PublicLayout({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const maxRetries = 3;
      const timeoutMs = 5000; // 5 seconds timeout for each attempt
      let user = null;
      let attempt = 0;
      let lastError = null;

      while (attempt < maxRetries) {
        attempt++;
        try {
          const userPromise = User.me();
          const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timed out')), timeoutMs)
          );
          user = await Promise.race([userPromise, timeout]);
          break; // Successfully got user, exit retry loop
        } catch (error) {
          lastError = error;
          const errorMessage = error.message === 'Request timed out' ? 'timed out' : error.message;
          console.warn(`User.me() attempt ${attempt}/${maxRetries} failed: ${errorMessage}.`);
          
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Wait before retrying (exponential backoff)
          } else {
            // All retries exhausted, re-throw to be caught by the outer catch block
            throw lastError; 
          }
        }
      }

      setCurrentUser(user);
    } catch (error) {
      // User not authenticated or network error - this is fine for public pages
      console.log("Could not check user role:", error.message);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col" dir="rtl">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to={createPageUrl("Home")} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#1E3A5F] rounded-lg flex items-center justify-center">
                <Route className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-[#222222] hidden sm:block">זיכרון 7.10</span>
            </Link>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <Link to={createPageUrl("Home")}>
                <Button variant="ghost" size="sm" className="text-[#555555] hover:text-[#1E3A5F] hover:bg-gray-50">
                  <Home className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">בית</span>
                </Button>
              </Link>
              <Link to={createPageUrl("Map")}>
                <Button variant="ghost" size="sm" className="text-[#555555] hover:text-[#1E3A5F] hover:bg-gray-50">
                  <Map className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">מפה</span>
                </Button>
              </Link>
              <Link to={createPageUrl("Search")}>
                <Button variant="ghost" size="sm" className="text-[#555555] hover:text-[#1E3A5F] hover:bg-gray-50">
                  <Search className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">חיפוש</span>
                </Button>
              </Link>
              <Link to={createPageUrl("Route")}>
                <Button variant="ghost" size="sm" className="text-[#555555] hover:text-[#1E3A5F] hover:bg-gray-50">
                  <Route className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">מסלול</span>
                </Button>
              </Link>
              
              {/* Admin Link - Only visible to admins */}
              {!isLoading && currentUser && currentUser.role === 'admin' && (
                <Link to={createPageUrl("AdminDashboard")}>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-[#1E3A5F] hover:text-white hover:bg-[#1E3A5F] border border-[#1E3A5F]"
                  >
                    <Settings className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">ניהול</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#1E3A5F] text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* About */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Route className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold">זיכרון 7.10</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                אפליקציה המתעדת ומנציחה את אתרי הזיכרון מאירועי 7 באוקטובר 2023, 
                ומאפשרת למשתמשים לחוות את הסיפורים דרך מסלולי טיול מודרכים.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">קישורים מהירים</h3>
              <div className="space-y-2">
                <Link to={createPageUrl("Map")} className="block text-white/80 hover:text-white text-sm transition-colors">
                  מפת האתרים
                </Link>
                <Link to={createPageUrl("Route")} className="block text-white/80 hover:text-white text-sm transition-colors">
                  מסלול מומלץ
                </Link>
                <Link to={createPageUrl("Search")} className="block text-white/80 hover:text-white text-sm transition-colors">
                  חיפוש מקומות
                </Link>
                <Link to={createPageUrl("About")} className="block text-white/80 hover:text-white text-sm transition-colors">
                  אודות
                </Link>
              </div>
            </div>

            {/* Contact & Legal */}
            <div>
              <h3 className="text-lg font-semibold mb-4">יצירת קשר ומידע משפטי</h3>
              <div className="space-y-2">
                <Link to={createPageUrl("Contact")} className="block text-white/80 hover:text-white text-sm transition-colors">
                  <Mail className="w-4 h-4 inline mr-2" />
                  יצירת קשר
                </Link>
                <Link to={createPageUrl("Privacy")} className="block text-white/80 hover:text-white text-sm transition-colors">
                  <Shield className="w-4 h-4 inline mr-2" />
                  מדיניות פרטיות
                </Link>
                <Link to={createPageUrl("About")} className="block text-white/80 hover:text-white text-sm transition-colors">
                  <FileText className="w-4 h-4 inline mr-2" />
                  תנאי שימוש
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/20 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-white/60 text-sm">
              Copyright © {currentYear} Snir Yulzari All rights reserved.
            </p>
            <p className="text-white/60 text-sm mt-2 sm:mt-0">
              לזכר חללי ונספי 7 באוקטובר 2023
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
