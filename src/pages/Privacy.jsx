import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Eye, Lock, Database, Globe, Cookie, Mail, UserCheck } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#F2F2F2]" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-[#1D4E8F] rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="w-12 h-12 text-white" aria-hidden="true" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4">מדיניות פרטיות</h1>
          <p className="text-lg text-[#555E6D]">
            מדיניות זו מתארת כיצד פרויקט "זיכרון 7.10" אוסף, משתמש ושומר מידע אישי,
            בהתאם לחוק הגנת הפרטיות, התשמ"א-1981 ותקנותיו.
          </p>
          <p className="text-sm text-[#555E6D] mt-2">עודכן לאחרונה: אפריל 2026</p>
        </div>

        <div className="space-y-8">

          {/* 1. Identity */}
          <Card className="shadow-lg bg-white border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-[#1A1A1A]">
                <UserCheck className="w-6 h-6 text-[#1D4E8F]" aria-hidden="true" />
                1. זהות בעל האתר ואחריות על המידע
              </CardTitle>
            </CardHeader>
            <CardContent className="text-[#555E6D] leading-relaxed space-y-3">
              <p>
                האתר <strong>"זיכרון 7.10"</strong> (להלן: "האתר" או "הפרויקט") הוא פרויקט
                הנצחה ותיעוד של אתרי הטבח מ-7 באוקטובר 2023 בעוטף עזה. הפרויקט מופעל על-ידי
                שניר יולזרי (להלן: "מפעיל האתר").
              </p>
              <div className="bg-[#F2F2F2] rounded-xl p-4 space-y-1">
                <p><strong>שם:</strong> שניר יולזרי</p>
                <p>
                  <strong>דוא"ל:</strong>{' '}
                  <a href="mailto:sniryulzari@gmail.com" className="text-[#1D4E8F] hover:underline">
                    sniryulzari@gmail.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 2. Data collected */}
          <Card className="shadow-lg bg-white border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-[#1A1A1A]">
                <Eye className="w-6 h-6 text-[#1D4E8F]" aria-hidden="true" />
                2. מידע הנאסף ומטרות השימוש בו
              </CardTitle>
            </CardHeader>
            <CardContent className="text-[#555E6D] leading-relaxed space-y-4">
              <p>אנו אוספים מידע בשני מצבים בלבד:</p>

              <div>
                <h3 className="font-semibold text-[#1A1A1A] mb-2">א. גולשים שאינם רשומים (כלל הציבור)</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>נתוני גלישה אנונימיים: דפים שנצפו, משך הביקור, מדינת המשתמש</li>
                  <li>מידע טכני: סוג דפדפן, מערכת הפעלה, רזולוציית מסך, כתובת IP מקוצרת</li>
                </ul>
                <p className="mt-2 text-sm">
                  <strong>מטרה:</strong> שיפור חוויית השימוש ואיתור תקלות טכניות.
                  <br />
                  <strong>בסיס חוקי:</strong> אינטרס לגיטימי של מפעיל האתר לתפעול תקין של השירות
                  (סעיף 8 לחוק הגנת הפרטיות).
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-[#1A1A1A] mb-2">ב. משתמשים רשומים (מנהלים בלבד)</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>כתובת דוא"ל</li>
                  <li>שם מלא</li>
                  <li>תפקיד (מנהל / משתמש רגיל)</li>
                  <li>תאריך ושעת יצירת החשבון וכניסות אחרונות</li>
                </ul>
                <p className="mt-2 text-sm">
                  <strong>מטרה:</strong> אימות זהות לצורך גישה לממשק הניהול ועריכת תכני האתר.
                  <br />
                  <strong>בסיס חוקי:</strong> ביצוע חוזה / הסכמה מפורשת בעת ההרשמה.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-[#1A1A1A] mb-2">ג. פניות דרך טופס "צור קשר"</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>שם ושם משפחה</li>
                  <li>כתובת דוא"ל</li>
                  <li>תוכן ההודעה</li>
                </ul>
                <p className="mt-2 text-sm">
                  <strong>מטרה:</strong> מתן מענה לפניות.
                  <br />
                  <strong>בסיס חוקי:</strong> הסכמה מפורשת של הפונה בעת שליחת הטופס.
                </p>
              </div>

              <p className="text-sm italic">
                האתר <strong>אינו</strong> אוסף מידע רגיש כגון מספרי זהות, פרטי תשלום, נתונים
                ביומטריים או מידע על בריאות.
              </p>
            </CardContent>
          </Card>

          {/* 3. Cookies */}
          <Card className="shadow-lg bg-white border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-[#1A1A1A]">
                <Cookie className="w-6 h-6 text-[#1D4E8F]" aria-hidden="true" />
                3. עוגיות (Cookies)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-[#555E6D] leading-relaxed space-y-3">
              <p>האתר משתמש בעוגיות מוגבלות לצרכים הבאים:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <strong>עוגיות הפעלה (Session):</strong> שמירת מצב הכניסה של מנהלים רשומים
                  לאורך הגלישה. עוגיות אלה נמחקות עם סגירת הדפדפן.
                </li>
                <li>
                  <strong>עוגיות העדפות:</strong> שפת ממשק, אם רלוונטי.
                </li>
              </ul>
              <p>
                האתר <strong>אינו</strong> משתמש בעוגיות פרסום, עוגיות מעקב של צד שלישי, או
                רשתות פרסום.
              </p>
              <p>
                ניתן לנהל ולמחוק עוגיות בהגדרות הדפדפן. חסימת עוגיות הפעלה עלולה למנוע גישה
                לממשק הניהול.
              </p>
            </CardContent>
          </Card>

          {/* 4. Storage abroad */}
          <Card className="shadow-lg bg-white border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-[#1A1A1A]">
                <Globe className="w-6 h-6 text-[#1D4E8F]" aria-hidden="true" />
                4. אחסון מידע ועיבודו מחוץ לישראל
              </CardTitle>
            </CardHeader>
            <CardContent className="text-[#555E6D] leading-relaxed space-y-3">
              <p>
                האתר מתבסס על <strong>Supabase</strong> (Supabase Inc., ארה"ב) לאחסון מסד הנתונים,
                אימות משתמשים ואחסון קבצי מדיה. שרתי Supabase ממוקמים באיחוד האירופי ו/או בארה"ב.
              </p>
              <p>
                העברת מידע לחו"ל מתבצעת בהתאם להוראות חוק הגנת הפרטיות ועל בסיס
                הסכמי עיבוד נתונים (DPA) הכוללים סעיפי חוזה סטנדרטיים (SCCs) המעניקים הגנה
                מספקת למידע אישי.
              </p>
              <p>
                קבצי מדיה (תמונות, שמע, וידאו) המועלים על-ידי מנהלי האתר נשמרים ב-
                <strong>Supabase Storage</strong> (דלי "media") ונגישים לכלל הגולשים.
              </p>
            </CardContent>
          </Card>

          {/* 5. Retention */}
          <Card className="shadow-lg bg-white border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-[#1A1A1A]">
                <Database className="w-6 h-6 text-[#1D4E8F]" aria-hidden="true" />
                5. תקופת שמירת המידע
              </CardTitle>
            </CardHeader>
            <CardContent className="text-[#555E6D] leading-relaxed">
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <strong>חשבונות מנהלים:</strong> המידע נשמר כל עוד החשבון פעיל. עם סגירת
                  חשבון, המידע האישי יימחק תוך 30 יום.
                </li>
                <li>
                  <strong>נתוני גלישה:</strong> נשמרים לתקופה של עד 12 חודשים לצורך ניתוח
                  מגמות ואיתור תקלות.
                </li>
                <li>
                  <strong>פניות יצירת קשר:</strong> נשמרות לתקופה של עד 3 שנים לצרכי תיעוד.
                </li>
                <li>
                  <strong>תכני אתרי ההנצחה (תמונות, קטעי שמע, טקסטים):</strong> נשמרים לצמיתות
                  כחלק ממשימת ההנצחה של הפרויקט.
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 6. Security */}
          <Card className="shadow-lg bg-white border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-[#1A1A1A]">
                <Lock className="w-6 h-6 text-[#1D4E8F]" aria-hidden="true" />
                6. אבטחת מידע
              </CardTitle>
            </CardHeader>
            <CardContent className="text-[#555E6D] leading-relaxed space-y-3">
              <p>אנו נוקטים אמצעי אבטחה מתאימים, לרבות:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>הצפנת תעבורה בפרוטוקול HTTPS/TLS לכל התקשורת עם האתר</li>
                <li>הצפנת סיסמאות באמצעות bcrypt (מבוצע על-ידי Supabase Auth)</li>
                <li>מדיניות הרשאות מינימלית (Row-Level Security) — כל משתמש ניגש אך ורק
                    למידע הרלוונטי לתפקידו</li>
                <li>תהליך איפוס סיסמה מאובטח באמצעות קישור חד-פעמי לדוא"ל</li>
              </ul>
              <p>
                למרות האמצעים הננקטים, אין ביכולתנו להבטיח אבטחה מוחלטת. אנא הודיעו לנו מיידית
                על כל חשש לפרצת אבטחה.
              </p>
            </CardContent>
          </Card>

          {/* 7. Rights */}
          <Card className="shadow-lg bg-white border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-[#1A1A1A]">
                <UserCheck className="w-6 h-6 text-[#1D4E8F]" aria-hidden="true" />
                7. זכויות נושא המידע
              </CardTitle>
            </CardHeader>
            <CardContent className="text-[#555E6D] leading-relaxed space-y-3">
              <p>
                בהתאם לחוק הגנת הפרטיות, התשמ"א-1981, עומדות לכם הזכויות הבאות:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <strong>זכות עיון:</strong> לבקש לצפות במידע האישי השמור עליכם במאגרנו
                  (סעיף 13 לחוק).
                </li>
                <li>
                  <strong>זכות תיקון:</strong> לבקש תיקון מידע שגוי, לא שלם או לא מעודכן
                  (סעיף 14 לחוק).
                </li>
                <li>
                  <strong>זכות מחיקה:</strong> לבקש מחיקת המידע האישי שלכם, ככל שלא קיימת
                  חובה חוקית לשמרו.
                </li>
                <li>
                  <strong>זכות התנגדות:</strong> להתנגד לעיבוד מידע המבוסס על אינטרס לגיטימי,
                  ממניעים לגיטימיים הנוגעים למצבכם הפרטי.
                </li>
                <li>
                  <strong>זכות הגבלת עיבוד:</strong> לבקש הגבלת עיבוד המידע בנסיבות מסוימות.
                </li>
              </ul>
              <p>
                לממש את זכויותיכם, אנא פנו אלינו בכתב לכתובת הדוא"ל הרשומה להלן. נטפל
                בבקשה תוך <strong>30 יום</strong> ממועד קבלתה.
              </p>
              <p>
                אם אינכם מרוצים מהטיפול בבקשתכם, ניתן לפנות ל
                <strong>הרשות להגנת הפרטיות</strong> (gov.il/privacy).
              </p>
            </CardContent>
          </Card>

          {/* 8. Third parties */}
          <Card className="shadow-lg bg-white border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-[#1A1A1A]">
                <Globe className="w-6 h-6 text-[#1D4E8F]" aria-hidden="true" />
                8. שיתוף מידע עם צדדים שלישיים
              </CardTitle>
            </CardHeader>
            <CardContent className="text-[#555E6D] leading-relaxed space-y-3">
              <p>
                אנו <strong>אינם</strong> מוכרים, משכירים או מעבירים מידע אישי לצדדים שלישיים
                לצורכי שיווק.
              </p>
              <p>המידע עשוי להיחשף רק במקרים הבאים:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <strong>ספקי שירות טכניים:</strong> Supabase Inc. בלבד, הפועלים כ"מעבד מידע"
                  בשמנו ומחויבים להגן על המידע.
                </li>
                <li>
                  <strong>חובה חוקית:</strong> כאשר נדרש על-פי דין, צו שיפוטי או בקשת רשות מוסמכת.
                </li>
                <li>
                  <strong>הגנה על זכויות:</strong> אם נדרש לצורך הגנה על זכויות, רכוש, או
                  בטיחות משתמשים.
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 9. Minors */}
          <Card className="shadow-lg bg-white border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-[#1A1A1A]">
                <Shield className="w-6 h-6 text-[#1D4E8F]" aria-hidden="true" />
                9. קטינים
              </CardTitle>
            </CardHeader>
            <CardContent className="text-[#555E6D] leading-relaxed">
              <p>
                תכני האתר — לרבות תמונות ווידאו מאתרי הטבח — עשויים להיות קשים לצפייה.
                האתר אינו מיועד לילדים מתחת לגיל 13. אנו לא אוספים ביודעין מידע אישי
                מקטינים. אם נודע לנו שנאסף מידע כזה, נמחק אותו מיידית.
              </p>
            </CardContent>
          </Card>

          {/* 10. Changes */}
          <Card className="shadow-lg bg-white border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-[#1A1A1A]">
                <Shield className="w-6 h-6 text-[#1D4E8F]" aria-hidden="true" />
                10. שינויים במדיניות הפרטיות
              </CardTitle>
            </CardHeader>
            <CardContent className="text-[#555E6D] leading-relaxed">
              <p>
                מדיניות זו עשויה להתעדכן מעת לעת. כל שינוי מהותי יפורסם בדף זה עם עדכון
                תאריך ה"עודכן לאחרונה" שבראש הדף. אם יש לנו את כתובת הדוא"ל שלכם (למשתמשים
                רשומים), נודיע לכם בדוא"ל על שינויים מהותיים לפחות 14 יום מראש.
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <div className="bg-white border border-[#1D4E8F] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <Mail className="w-6 h-6 text-[#1D4E8F]" aria-hidden="true" />
              <h3 className="font-semibold text-[#1D4E8F] text-lg">יצירת קשר בנושא פרטיות</h3>
            </div>
            <p className="text-[#555E6D] mb-3">
              לשאלות, בקשות לממש זכויות, או כל עניין הקשור למדיניות פרטיות זו:
            </p>
            <div className="bg-[#F2F2F2] rounded-xl p-4 space-y-1">
              <p className="text-[#1A1A1A] font-semibold">ממונה הפרטיות: שניר יולזרי</p>
              <p className="text-[#555E6D]">
                דוא"ל:{' '}
                <a href="mailto:sniryulzari@gmail.com" className="text-[#1D4E8F] hover:underline font-medium">
                  sniryulzari@gmail.com
                </a>
              </p>
              <p className="text-[#555E6D] text-sm">אנו מתחייבים לחזור תוך 30 יום.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
