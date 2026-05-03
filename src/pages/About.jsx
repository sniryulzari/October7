import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, MapPin, Headphones, Shield, BookOpen, Mail } from 'lucide-react';
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
    <div className="min-h-screen bg-[#F2F2F2]" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={goBack}
              variant="ghost"
              size="sm"
              className="text-[#1D4E8F] hover:bg-[#F2F2F2] p-3 rounded-full"
            >
              <ArrowRight className="w-6 h-6" />
            </Button>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A]">
              אודות הפרויקט
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12">
        {/* הצגת הפרויקט */}
        <Card className="bg-white border-0 shadow-lg">
          <CardContent className="p-8 sm:p-10">
            <div className="prose prose-lg max-w-none text-[#555E6D] leading-relaxed space-y-4">
              <p className="text-lg sm:text-xl leading-relaxed">
                ״בשביל הזיכרון 7 באוקטובר״ הוא פרויקט שמטרתו לאפשר לכל מבקר במקומות שבהם אירע טבח 7 באוקטובר 2023, לשמוע ולהבין מה קרה שם.
              </p>
              <p className="text-lg leading-relaxed">
                אנחנו חושבים שלהגיע למקום, להסתכל מסביב, ולהמשיך הלאה מבלי לדעת מה התרחש שם — זו חוויה חסרה. לכן אנחנו רוצים לאפשר לכל מי שמעוניין לשמוע את הסיפור ולהבין מה קרה בתחילת אותו בוקר וכיצד התפתחו האירועים.
              </p>
              <p className="text-lg leading-relaxed">
                לשם כך מיקמנו קוד QR בכל אחד מהמקומות המרכזיים, וכל מי שמגיע למקום יכול לסרוק את הקוד עם הטלפון הנייד ולשמוע את הסיפור המלא, בליווי תמונות וקטעי וידאו. המידע מונגש לציבור בחינם ונועד לשמר את זכר האירועים של אותו יום.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* מטרות האפליקציה */}
        <Card className="bg-white border-0 shadow-lg">
          <CardContent className="p-8 sm:p-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-8 text-center">
              מטרות האתר
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#1D4E8F] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Headphones className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">הבנה במקום</h3>
                  <p className="text-[#555E6D] leading-relaxed">
                    כל מי שמגיע למקום יכול לשמוע בדיוק מה קרה שם — מתחילת אותו בוקר ועד סופו.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#1D4E8F] rounded-xl flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">שימור הזיכרון</h3>
                  <p className="text-[#555E6D] leading-relaxed">
                    שמירה על תיעוד, תמונות וקטעי וידאו מאותו יום לדורות הבאים.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#1D4E8F] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">נגישות לכולם</h3>
                  <p className="text-[#555E6D] leading-relaxed">
                    המידע מונגש בחינם לכל אדם עם טלפון נייד, ללא צורך בהורדת אפליקציה.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#1D4E8F] rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">המשך הסיפור</h3>
                  <p className="text-[#555E6D] leading-relaxed">
                    מי שרוצה לשמוע עוד — יכול להמשיך למקומות נוספים ולהבין את התמונה הרחבה.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* איך זה עובד */}
        <Card className="bg-white border-0 shadow-lg">
          <CardContent className="p-8 sm:p-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-8 text-center">
              איך זה עובד?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#1D4E8F] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">הגע למקום</h3>
                <p className="text-[#555E6D] text-sm leading-relaxed">
                  הגע לאחד מהמקומות בעוטף עזה — קיבוץ, מיגונית, או כל אתר אחר
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-[#1D4E8F] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">סרוק את קוד ה-QR</h3>
                <p className="text-[#555E6D] text-sm leading-relaxed">
                  סרוק את הקוד המוצב במקום עם הטלפון הנייד
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-[#1D4E8F] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">שמע את הסיפור</h3>
                <p className="text-[#555E6D] text-sm leading-relaxed">
                  תשמע מה קרה שם ב-7 באוקטובר — בליווי תמונות וקטעי וידאו מאותו יום
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* מי אנחנו */}
        <Card className="bg-white border-0 shadow-lg">
          <CardContent className="p-8 sm:p-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-6 text-center">
              מי אנחנו
            </h2>
            
            <div className="prose prose-lg max-w-none text-[#555E6D] leading-relaxed space-y-4">
              <p className="text-lg leading-relaxed">
                ״בשביל הזיכרון 7 באוקטובר״ הוא יוזמה עצמאית שנוצרה מתוך הרצון לשמר ולהנציח את זכר הנרצחים והחטופים, ולספר את סיפורם של המקומות שנפגעו באותו יום.
              </p>
              <p className="leading-relaxed">
                הפרויקט פותח במטרה ליצור חוויה משמעותית ומכבדת לכל מי שבוחר לבקר במקומות — ולאפשר לו לצאת משם עם הבנה אמיתית של מה שהתרחש שם.
              </p>
              <p className="leading-relaxed">
                אנו מאמינים בכוחה של הטכנולוגיה לשרת מטרות חברתיות חשובות ולהפוך מידע חיוני לנגיש עבור כל אדם, בכל מקום ובכל זמן.
              </p>
            </div>
            
            <div className="mt-8 p-6 bg-[#F2F2F2] rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-6 h-6 text-[#1D4E8F]" />
                <h3 className="text-lg font-semibold text-[#1A1A1A]">התחייבותנו</h3>
              </div>
              <p className="text-[#555E6D] leading-relaxed">
                אנו מתחייבים לדיוק — כל הסיפורים מבוססים על מקורות מתועדים. המידע מוצג בצורה רגישה ומכבדת, מתוך כבוד לנרצחים, לחטופים ולמשפחותיהם.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* מידע נוסף וקישורים */}
        <Card className="bg-white border-0 shadow-lg">
          <CardContent className="p-8 sm:p-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-6 text-center">
              מידע נוסף
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link 
                to={createPageUrl("Privacy")}
                className="flex items-center gap-4 p-4 bg-[#F2F2F2] rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="w-10 h-10 bg-[#1D4E8F] rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1A1A1A]">מדיניות פרטיות</h3>
                  <p className="text-sm text-[#555E6D]">איך אנו שומרים על הפרטיות שלך</p>
                </div>
              </Link>
              
              <Link 
                to={createPageUrl("Contact")}
                className="flex items-center gap-4 p-4 bg-[#F2F2F2] rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="w-10 h-10 bg-[#1D4E8F] rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1A1A1A]">יצירת קשר</h3>
                  <p className="text-sm text-[#555E6D]">יש לך שאלות? צור עמנו קשר</p>
                </div>
              </Link>
            </div>
            
            <div className="mt-8 text-center">
              <Link to={createPageUrl("Home")}>
                <Button className="bg-[#1D4E8F] hover:bg-[#2560B0] text-white px-8 py-3">
                  <MapPin className="w-5 h-5 mr-2" />
                  לכל המקומות
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}