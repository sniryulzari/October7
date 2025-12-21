import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, MapPin, Headphones, Route, Users, Shield, Heart, BookOpen, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AboutPage() {
  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = createPageUrl("Home");
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={goBack}
              variant="ghost"
              size="sm"
              className="text-[#1E3A5F] hover:bg-[#F5F5F5] p-3 rounded-full"
            >
              <ArrowRight className="w-6 h-6" />
            </Button>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#222222]">
              אודות הפרויקט
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12">
        {/* הצגת הפרויקט */}
        <Card className="bg-white border-0 shadow-lg">
          <CardContent className="p-8 sm:p-10">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#1E3A5F] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#222222] mb-4">
                זיכרון דיגיטלי לאירועי 7 באוקטובר
              </h2>
            </div>
            
            <div className="prose prose-lg max-w-none text-[#555555] leading-relaxed space-y-4">
              <p className="text-lg sm:text-xl leading-relaxed">
                האפליקציה נועדה לאפשר למבקרים באזור עוטף עזה להכיר ולהבין את האירועים הקשים 
                שהתרחשו במקומות המרכזיים במהלך הטבח ב־7 באוקטובר 2023.
              </p>
              <p className="text-lg leading-relaxed">
                באמצעות סריקת קוד QR הממוקם באתרים, ניתן להאזין לסיפורו של כל מקום 
                ולצפות בתמונות ובקטעי וידאו אותנטיים מהיום ההוא.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* מטרות האפליקציה */}
        <Card className="bg-white border-0 shadow-lg">
          <CardContent className="p-8 sm:p-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#222222] mb-8 text-center">
              מטרות האפליקציה
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#1E3A5F] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Headphones className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#222222] mb-2">הנגשת המידע</h3>
                  <p className="text-[#555555] leading-relaxed">
                    לאפשר לכל אדם לשמוע את הסיפור של המקום בו הוא נמצא באופן נגיש ומיידי.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#1E3A5F] rounded-xl flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#222222] mb-2">שימור הזיכרון</h3>
                  <p className="text-[#555555] leading-relaxed">
                    שמירה על עדויות, תמונות, סרטונים ומסמכים חשובים לדורות הבאים.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#1E3A5F] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Route className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#222222] mb-2">הנחיית מסלול</h3>
                  <p className="text-[#555555] leading-relaxed">
                    הצעת מסלול מסודר ומותאם אישית למטיילים בין האתרים השונים.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#1E3A5F] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#222222] mb-2">חיבור קהילתי</h3>
                  <p className="text-[#555555] leading-relaxed">
                    יצירת גשר בין המבקרים לבין הסיפורים האישיים של האנשים שהיו שם.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* איך זה עובד */}
        <Card className="bg-white border-0 shadow-lg">
          <CardContent className="p-8 sm:p-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#222222] mb-8 text-center">
              איך זה עובד?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#1E3A5F] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <h3 className="text-lg font-semibold text-[#222222] mb-2">סרוק את הברקוד</h3>
                <p className="text-[#555555] text-sm leading-relaxed">
                  מצא את קוד ה-QR במקום בו אתה נמצא וסרוק אותו עם הטלפון
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-[#1E3A5F] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <h3 className="text-lg font-semibold text-[#222222] mb-2">קבל דף ייעודי</h3>
                <p className="text-[#555555] text-sm leading-relaxed">
                  תגיע לדף המקום עם נגן אודיו, תמונות וכל המידע הרלוונטי
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-[#1E3A5F] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <h3 className="text-lg font-semibold text-[#222222] mb-2">האזן וגלה</h3>
                <p className="text-[#555555] text-sm leading-relaxed">
                  האזן לסיפור המקום וצפה בתמונות ובסרטונים מהיום ההוא
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* מי אנחנו */}
        <Card className="bg-white border-0 shadow-lg">
          <CardContent className="p-8 sm:p-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#222222] mb-6 text-center">
              מי אנחנו
            </h2>
            
            <div className="prose prose-lg max-w-none text-[#555555] leading-relaxed space-y-4">
              <p className="text-lg leading-relaxed">
                פרויקט "זיכרון 7.10" הוא יוזמה עצמאית שנוצרה מתוך הרצון לשמר ולהנציח את זכר 
                הקורבנות ולספר את סיפורם של המקומות שנפגעו באותו יום נורא.
              </p>
              <p className="leading-relaxed">
                הפרויקט פותח בשיתוף עם גורמים מקומיים, עדים לאירועים ובני משפחות של נספים, 
                במטרה ליצור חוויה משמעותית ומכבדת לכל מי שבוחר לבקר באתרים.
              </p>
              <p className="leading-relaxed">
                אנו מאמינים בכוחה של הטכנולוgia לשרת מטרות חברתיות חשובות ולהפוך מידע חיוני 
                לנגיש עבור כל אדם, בכל מקום ובכל זמן.
              </p>
            </div>
            
            <div className="mt-8 p-6 bg-[#F5F5F5] rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-6 h-6 text-[#1E3A5F]" />
                <h3 className="text-lg font-semibold text-[#222222]">התחייבותנו</h3>
              </div>
              <p className="text-[#555555] leading-relaxed">
                אנו מתחייבים לשמור על דיוק המידע, לכבד את זכר הנפגעים ולהציג את התכנים 
                בצורה רגישה ומכבדת. כל התכנים נבדקים ומאושרים על ידי גורמים מוסמכים.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* מידע נוסף וקישורים */}
        <Card className="bg-white border-0 shadow-lg">
          <CardContent className="p-8 sm:p-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#222222] mb-6 text-center">
              מידע נוסף
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link 
                to={createPageUrl("Privacy")}
                className="flex items-center gap-4 p-4 bg-[#F5F5F5] rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="w-10 h-10 bg-[#1E3A5F] rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#222222]">מדיניות פרטיות</h3>
                  <p className="text-sm text-[#555555]">איך אנו שומרים על הפרטיות שלך</p>
                </div>
              </Link>
              
              <Link 
                to={createPageUrl("Contact")}
                className="flex items-center gap-4 p-4 bg-[#F5F5F5] rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="w-10 h-10 bg-[#1E3A5F] rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#222222]">יצירת קשר</h3>
                  <p className="text-sm text-[#555555]">יש לך שאלות? צור עמנו קשר</p>
                </div>
              </Link>
            </div>
            
            <div className="mt-8 text-center">
              <Link to={createPageUrl("Home")}>
                <Button className="bg-[#1E3A5F] hover:bg-[#2C5E9E] text-white px-8 py-3">
                  <MapPin className="w-5 h-5 mr-2" />
                  התחל לחקור את המקומות
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}