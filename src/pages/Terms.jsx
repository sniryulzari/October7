import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, AlertCircle, Copyright, Ban, Globe, Scale, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#F2F2F2]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-[#1D4E8F] rounded-2xl flex items-center justify-center shadow-lg">
              <FileText className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4">תנאי שימוש</h1>
          <p className="text-lg text-[#555E6D]">עודכן לאחרונה: אפריל 2026</p>
        </div>

        <div className="space-y-8">

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
            <p className="text-amber-800 text-sm leading-relaxed">
              אתר זה הוא פרויקט הנצחה ואינו מופעל למטרות מסחריות. השימוש באתר כפוף לתנאים המפורטים להלן,
              בהתאם לדין הישראלי החל.
            </p>
          </div>

          <Card className="shadow-lg bg-white border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-[#1A1A1A]">
                <Globe className="w-6 h-6 text-[#1D4E8F]" />
                קבלת התנאים
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-[#555E6D] leading-relaxed">
              <p>
                הגלישה באתר "זיכרון 7.10" ו/או השימוש בכל תוכן המוצג בו מהווים הסכמה מלאה לתנאי שימוש אלה.
                אם אינך מסכים לתנאים כלשהם, אנא הימנע משימוש באתר.
              </p>
              <p>
                תנאי שימוש אלה חלים על כל גרסאות האתר, לרבות הגרסה לנייד, ועל כל תוכן נגיש באמצעות קודי QR
                הממוקמים בשטח.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg bg-white border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-[#1A1A1A]">
                <Copyright className="w-6 h-6 text-[#1D4E8F]" />
                קניין רוחני וזכויות יוצרים
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-[#555E6D] leading-relaxed">
              <p>
                כל התכנים המוצגים באתר — לרבות טקסטים, תמונות, הקלטות שמע, קטעי וידאו, עיצוב גרפי ומידע על
                אתרי הזיכרון — מוגנים בחוק זכות יוצרים, תשס"ח-2007.
              </p>
              <p>
                זכויות היוצרים על התכנים שייכות לבעל האתר ו/או לבעלי הזכויות המקוריים שמסרו תוכן לצורך
                הפרויקט. חל איסור מוחלט על:
              </p>
              <ul className="list-disc list-inside space-y-2 mr-2">
                <li>העתקה, שכפול או הפצה מסחרית של תכנים</li>
                <li>שימוש בתכנים מחוץ להקשר הנצחה ללא אישור מפורש בכתב</li>
                <li>הסרת או שינוי ייחוסי זכויות יוצרים</li>
              </ul>
              <p>
                שימוש אישי לא-מסחרי, לרבות שיתוף לצורכי הנצחה וזיכרון, מותר ומעודד — בתנאי שנשמר ייחוס
                מלא למקור.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg bg-white border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-[#1A1A1A]">
                <Ban className="w-6 h-6 text-[#1D4E8F]" />
                שימושים אסורים
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-[#555E6D] leading-relaxed">
              <p>חל איסור מוחלט על השימושים הבאים:</p>
              <ul className="list-disc list-inside space-y-2 mr-2">
                <li>כל שימוש המכחיש, מקטין, או מעוות את אירועי ה-7 באוקטובר 2023</li>
                <li>שימוש לצרכי תעמולה או הסתה, בין אם פוליטית ובין אם אחרת</li>
                <li>פגיעה בכבוד הנספים, הפצועים, החטופים ומשפחותיהם</li>
                <li>שימוש מסחרי בתכנים ללא אישור מפורש בכתב</li>
                <li>ניסיון לפרוץ, לשבש או לפגוע בתפקוד האתר בכל דרך שהיא, בניגוד לחוק המחשבים, תשנ"ה-1995</li>
                <li>איסוף מידע אוטומטי (scraping) ללא אישור</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-lg bg-white border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-[#1A1A1A]">
                <AlertCircle className="w-6 h-6 text-[#1D4E8F]" />
                הגבלת אחריות
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-[#555E6D] leading-relaxed">
              <p>
                האתר מסופק "כמות שהוא" (AS IS). בעל האתר אינו ערב לדיוק, שלמות, או עדכניות המידע המוצג,
                ואינו אחראי לנזקים ישירים או עקיפים הנובעים מהסתמכות על תכני האתר.
              </p>
              <p>
                האתר עשוי להכיל קישורים לאתרים חיצוניים. בעל האתר אינו אחראי לתכנים של אתרים אלה ואין
                בהכללתם משום המלצה עליהם.
              </p>
              <p>
                ביקור פיזי באתרי הזיכרון הנזכרים באתר הינו באחריות המבקר בלבד. יש לציית להנחיות הביטחון
                המקומיות ולהוראות הרשויות המוסמכות.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg bg-white border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-[#1A1A1A]">
                <Scale className="w-6 h-6 text-[#1D4E8F]" />
                דין חל וסמכות שיפוטית
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-[#555E6D] leading-relaxed">
              <p>
                תנאי שימוש אלה כפופים לחוק הישראלי. כל סכסוך הנובע מהשימוש באתר יידון בבתי המשפט
                המוסמכים במחוז תל אביב-יפו, ישראל, בלבד.
              </p>
              <p>
                בעל האתר שומר לעצמו את הזכות לשנות תנאים אלה בכל עת. המשך השימוש באתר לאחר פרסום
                שינויים מהווה הסכמה לתנאים המעודכנים.
              </p>
            </CardContent>
          </Card>

          <div className="bg-white border border-[#1D4E8F] rounded-lg p-6">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-5 h-5 text-[#1D4E8F]" />
              <h3 className="font-semibold text-[#1D4E8F]">שאלות בנוגע לתנאי השימוש</h3>
            </div>
            <p className="text-[#555E6D]">
              לפניות בנוגע לתנאים אלה, לרבות בקשות לשימוש בתכנים, אנא פנו אלינו באמצעות{' '}
              <Link to={createPageUrl("Contact")} className="text-[#2560B0] hover:underline">דף יצירת קשר</Link>
              {' '}או ישירות למייל:{' '}
              <strong className="text-[#2560B0]">sniryulzari@gmail.com</strong>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
