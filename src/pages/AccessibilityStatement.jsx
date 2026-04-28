import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accessibility, Mail, CheckCircle, AlertCircle } from 'lucide-react';

export default function AccessibilityStatement() {
  return (
    <div className="min-h-screen bg-[#F2F2F2]" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-[#1D4E8F] rounded-2xl flex items-center justify-center shadow-lg">
              <Accessibility className="w-12 h-12 text-white" aria-hidden="true" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4">הצהרת נגישות</h1>
          <p className="text-lg text-[#555E6D]">
            פרויקט "זיכרון 7.10" פועל להנגשת שירותיו לכלל הציבור, לרבות אנשים עם מוגבלות
          </p>
        </div>

        <div className="space-y-8">
          {/* Legal basis */}
          <Card className="shadow-lg bg-white border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-[#1A1A1A]">
                <CheckCircle className="w-6 h-6 text-[#1D4E8F]" aria-hidden="true" />
                בסיס חוקי
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#555E6D] leading-relaxed">
                הנגשת האתר מתבצעת בהתאם ל<strong>חוק שוויון זכויות לאנשים עם מוגבלות, התשנ"ח-1998</strong>,
                ולתקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע"ג-2013.
                האתר שואף לעמוד ברמת נגישות <strong>AA</strong> של תקן WCAG 2.0,
                המהווה את הבסיס לתקן הישראלי IS 5568.
              </p>
            </CardContent>
          </Card>

          {/* Accessibility level */}
          <Card className="shadow-lg bg-white border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-[#1A1A1A]">
                <CheckCircle className="w-6 h-6 text-[#1D4E8F]" aria-hidden="true" />
                רמת הנגישות באתר
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#555E6D] leading-relaxed mb-4">
                האתר יישם את ההתאמות הבאות:
              </p>
              <ul className="list-disc list-inside text-[#555E6D] space-y-2">
                <li>שפת הדף מוגדרת כעברית (<code lang="en">lang="he"</code>) לתמיכה בקוראי מסך</li>
                <li>כל האתר תומך בכיוון RTL (ימין לשמאל)</li>
                <li>קישור "דלג לתוכן" מאפשר גישה מהירה לתוכן הראשי</li>
                <li>כפתורים הכוללים אייקון בלבד מצוידים בתיאור מילולי (<code lang="en">aria-label</code>)</li>
                <li>שדות קלט מקושרים לתוויות (<code lang="en">label</code>) מתאימות</li>
                <li>דיאלוגים ומודאלים מסומנים עם <code lang="en">role="dialog"</code> ו-<code lang="en">aria-modal</code></li>
                <li>נגן האודיו נגיש למקלדת עם <code lang="en">role="slider"</code></li>
                <li>כפתורי סינון מדווחים מצב לחיצה (<code lang="en">aria-pressed</code>)</li>
                <li>תמונות מצוידות בטקסט חלופי (<code lang="en">alt</code>)</li>
                <li>היררכיית כותרות (H1–H4) תקינה בכל הדפים</li>
                <li>ניווט מלא במקלדת בכל רכיבי הממשק</li>
              </ul>
            </CardContent>
          </Card>

          {/* Known limitations */}
          <Card className="shadow-lg bg-white border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-[#1A1A1A]">
                <AlertCircle className="w-6 h-6 text-amber-500" aria-hidden="true" />
                מגבלות נגישות ידועות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-[#555E6D] space-y-2">
                <li>הקלטות האודיו אינן מלוות בתמלול כתוב — אנו עובדים על הוספתו</li>
                <li>סרטוני הווידאו אינם מלווים בכתוביות — אנו עובדים על הוספתן</li>
                <li>מפת המקומות (OpenStreetMap / MapLibre) מוגבלת בנגישות מלאה לקוראי מסך; קיים תחליף בצורת רשימת המקומות בסרגל הצד</li>
                <li>ניגוד צבעים מסוים בטקסטים משניים (מידע לא קריטי) עלול שלא לעמוד ביחס 4.5:1 — ייבדק ויתוקן בגרסה הבאה</li>
              </ul>
            </CardContent>
          </Card>

          {/* Contact for accessibility */}
          <Card className="shadow-lg bg-white border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-[#1A1A1A]">
                <Mail className="w-6 h-6 text-[#1D4E8F]" aria-hidden="true" />
                פנייה בנושא נגישות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#555E6D] leading-relaxed mb-4">
                אם נתקלת בבעיית נגישות באתר, אנא פנה אלינו ונטפל בכך בהקדם:
              </p>
              <div className="bg-[#F2F2F2] rounded-xl p-4 space-y-2">
                <p className="text-[#1A1A1A] font-semibold">ממונה נגישות: שניר יולזרי</p>
                <p className="text-[#555E6D]">
                  דוא"ל:{' '}
                  <a href="mailto:sniryulzari@gmail.com" className="text-[#1D4E8F] hover:underline font-medium">
                    sniryulzari@gmail.com
                  </a>
                </p>
                <p className="text-[#555E6D] text-sm">
                  אנו מתחייבים לחזור תוך 5 ימי עסקים.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Date */}
          <div className="text-center text-sm text-[#555E6D]">
            <p>הצהרה זו עודכנה לאחרונה: אפריל 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
