import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SendEmail } from '@/api/integrations';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubjectChange = (value) => {
    setFormData(prev => ({ ...prev, subject: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const emailContent = `
שם: ${formData.name}
אימייל: ${formData.email}
נושא: ${formData.subject}

הודעה:
${formData.message}

---
הודעה זו נשלחה מאפליקציה "זיכרון 7 באוקטובר"
      `;

      await SendEmail({
        subject: `צור קשר - ${formData.subject}`,
        body: emailContent,
        reply_to: formData.email,
      });

      setIsSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error('Error sending email:', error?.message ?? error);
      alert('שגיאה בשליחת ההודעה. אנא נסו שוב.');
    }

    setIsSubmitting(false);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#F2F2F2] flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <CheckCircle className="w-16 h-16 text-[#1D4E8F] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">ההודעה התקבלה</h1>
          <p className="text-[#555E6D] mb-6">תודה. נחזור אליך בהקדם.</p>
          <Button onClick={() => setIsSubmitted(false)} className="bg-[#1D4E8F] hover:bg-[#2560B0]">שלח הודעה נוספת</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F2F2]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-[#1D4E8F] rounded-2xl flex items-center justify-center shadow-lg">
              <Mail className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4">צור קשר</h1>
          <p className="text-lg text-[#555E6D]">שאלות על הפרויקט, תיקון מידע, או רצון לתרום תוכן — נשמח לשמוע</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg bg-white border-0">
              <CardHeader>
                <CardTitle className="text-[#1A1A1A]">פרטי יצירת קשר</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-[#1D4E8F] mt-1" />
                  <div>
                    <p className="font-medium text-[#1A1A1A]">אימייל</p>
                    <p className="text-[#555E6D]">sniryulzari@gmail.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#1D4E8F] mt-1" />
                  <div>
                    <p className="font-medium text-[#1A1A1A]">מיקום</p>
                    <p className="text-[#555E6D]">ישראל</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg bg-white border-0">
              <CardHeader>
                <CardTitle className="text-[#1A1A1A]">שלחו לנו הודעה</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="name" className="block mb-2 text-[#1A1A1A]">שם מלא</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full border-[#F2F2F2] focus:border-[#1D4E8F] text-[#1A1A1A]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="block mb-2 text-[#1A1A1A]">אימייל</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full border-[#F2F2F2] focus:border-[#1D4E8F] text-[#1A1A1A]"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="subject" className="block mb-2 text-[#1A1A1A]">נושא הפנייה</Label>
                    <Select value={formData.subject} onValueChange={handleSubjectChange}>
                      <SelectTrigger id="subject" aria-label="נושא הפנייה" className="border-[#F2F2F2] focus:border-[#1D4E8F]">
                        <SelectValue placeholder="בחרו נושא" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-[#F2F2F2]">
                        <SelectItem value="הוספת מקום חדש">הוספת מקום חדש</SelectItem>
                        <SelectItem value="תיקון מידע">תיקון מידע קיים</SelectItem>
                        <SelectItem value="בעיה טכנית">בעיה טכנית</SelectItem>
                        <SelectItem value="שאלה כללית">שאלה כללית</SelectItem>
                        <SelectItem value="אחר">אחר</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="message" className="block mb-2 text-[#1A1A1A]">הודעה</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      className="w-full border-[#F2F2F2] focus:border-[#1D4E8F] text-[#1A1A1A]"
                      placeholder="כתבו כאן את ההודעה שלכם..."
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#1D4E8F] hover:bg-[#2560B0]"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                        שולח...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 ml-2" />
                        שלח הודעה
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}