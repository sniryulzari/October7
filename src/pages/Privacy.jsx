import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Eye, Lock, Database } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-[#1E3A5F] rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#222222] mb-4">מדיניות פרטיות</h1>
          <p className="text-lg text-[#555555]">איך אנחנו שומרים על המידע שלכם</p>
        </div>

        <div className="space-y-8">
          <Card className="shadow-lg bg-white border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-[#222222]">
                <Eye className="w-6 h-6 text-[#1E3A5F]" />
                איסוף מידע
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#555555] leading-relaxed mb-4">
                אנו אוספים מידע מינימלי הדרוש לתפעול האפליקציה:
              </p>
              <ul className="list-disc list-inside text-[#555555] space-y-2">
                <li>נתוני שימוש כלליים (דפים שנצפו, זמני ביקור)</li>
                <li>מידע טכני בסיסי (סוג דפדפן, מערכת הפעלה)</li>
                <li>מידע שמועבר במקרה של יצירת קשר</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-lg bg-white border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-[#222222]">
                <Lock className="w-6 h-6 text-[#1E3A5F]" />
                אבטחת מידע
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#555555] leading-relaxed">
                אנו משתמשים בטכנולוגיות אבטחה מתקדמות להגנה על המידע שלכם. כל המידע מועבר בצורה מוצפנת 
                ונשמר בשרתים מאובטחים. אנו לא חושפים מידע אישי לגורמים חיצוניים ללא הסכמתכם המפורשת.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg bg-white border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-[#222222]">
                <Database className="w-6 h-6 text-[#1E3A5F]" />
                שמירה ומחיקת מידע
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#555555] leading-relaxed mb-4">
                זכויותיכם בנוגע למידע שלכם:
              </p>
              <ul className="list-disc list-inside text-[#555555] space-y-2">
                <li>זכות לבקש מחיקת מידע אישי</li>
                <li>זכות לצפייה במידע שנשמר עליכם</li>
                <li>זכות לתקן מידע שגוי</li>
                <li>זכות להפסיק את השימוש בשירות בכל עת</li>
              </ul>
            </CardContent>
          </Card>

          <div className="bg-white border border-[#1E3A5F] rounded-lg p-6">
            <h3 className="font-semibold text-[#1E3A5F] mb-2">יצירת קשר בנושא פרטיות</h3>
            <p className="text-[#555555]">
              לשאלות או בקשות בנוגע למדיניות הפרטיות, אנא פנו אלינו באמצעות דף "צור קשר" או ישירות למייל: 
              <strong className="mr-2 text-[#2C5E9E]">sniryulzari@gmail.com</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}