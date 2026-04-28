
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Location, User } from '@/api/entities';
import { useAuth } from '@/api/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { UploadFile } from '@/api/integrations';
import { useToast } from '@/components/ui/use-toast';
import {
  Save, Loader2, Plus, Trash2, QrCode, MapPin, RotateCcw,
  Upload, Sparkles, ChevronRight, ArrowRight, UserPlus, X,
} from 'lucide-react';
import { createPageUrl } from '@/utils';

const initialLocationState = {
  name: '',
  name_en: '',
  qr_code: '',
  qr_code_image_url: '',
  search_keywords: [],
  coordinates: { lat: 31.5244, lng: 34.5951 },
  main_image: '',
  audio_file: '',
  full_story: { title: '', content: '' },
  full_story_en: { title: '', content: '' },
  videos: [],
  gallery: [],
  is_active: true,
  category: 'יישוב',
  priority: 'recommended',
  view_count: 0,
  audio_plays: 0,
  total_listening_time: 0,
  average_listening_percentage: 0,
};

// Styled upload zone that wraps a hidden file input
function UploadZone({ accept, onChange, disabled, label, hint }) {
  const inputRef = React.useRef();
  const [isDragging, setIsDragging] = React.useState(false);

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file) onChange({ target: { files: [file] } });
  };

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      className={`
        border-2 border-dashed rounded-xl px-4 py-5 text-center cursor-pointer transition-all
        ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <Upload className="w-5 h-5 mx-auto mb-1.5 text-gray-400" />
      <p className="text-sm font-medium text-gray-600">{label || 'גרור קובץ לכאן או לחץ לבחירה'}</p>
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onChange}
        disabled={disabled}
        className="hidden"
      />
    </div>
  );
}

export default function EditLocation() {
  const { user: currentUser } = useAuth();
  const isContributor = currentUser?.role === 'contributor';

  const [location, setLocation] = useState(initialLocationState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [locationId, setLocationId] = useState(null);
  const [keywordInput, setKeywordInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Contributors management (admin only)
  const [allContributors, setAllContributors] = useState([]);
  const [contributorSearch, setContributorSearch] = useState('');
  const [contributorLoading, setContributorLoading] = useState(false);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', description: '', onConfirm: null });

  // ElevenLabs TTS state
  const [elevenLabsKey, setElevenLabsKey] = useState(() => localStorage.getItem('elevenlabs_key') || '');
  const [ttsVoice, setTtsVoice] = useState('pNInz6obpgDQGcFmaJgB');
  const [customVoiceId, setCustomVoiceId] = useState('');
  const [ttsLang, setTtsLang] = useState('he');
  const [isGeneratingTTS, setIsGeneratingTTS] = useState(false);
  const [ttsPreviewUrl, setTtsPreviewUrl] = useState(null);
  const [ttsBlobRef, setTtsBlobRef] = useState(null);
  const [ttsError, setTtsError] = useState(null);

  const navigate = useNavigate();
  const { toast } = useToast();

  // Unsaved changes warning
  useEffect(() => {
    const handler = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const updateLocation = useCallback((updater) => {
    setIsDirty(true);
    setLocation(updater);
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) {
      setLocationId(id);
      loadLocation(id);
    } else {
      // Contributors cannot create new locations
      if (isContributor) navigate(createPageUrl('AdminLocations'));
      else setIsLoading(false);
    }
  }, [isContributor]);

  // Load all contributors list (admin only, for assignment UI)
  useEffect(() => {
    if (!currentUser || isContributor) return;
    User.listContributors().then(setAllContributors).catch(console.error);
  }, [currentUser, isContributor]);

  const handleManageContributor = async (contributorId, action) => {
    if (!locationId) return;
    setContributorLoading(true);
    try {
      await Location.manageContributor(locationId, contributorId, action);
      const updated = await Location.get(locationId);
      setLocation(prev => ({ ...prev, allowed_contributors: updated.allowed_contributors || [] }));
    } catch (e) {
      toast({ title: 'שגיאה בעדכון תורמי התוכן', description: e.message, variant: 'destructive' });
    }
    setContributorLoading(false);
  };

  const loadLocation = async (id) => {
    try {
      const locations = await Location.list();
      const foundLocation = locations.find((l) => l.id === id);
      if (foundLocation) {
        // Contributor access guard: redirect if not in allowed_contributors
        if (isContributor && currentUser && !foundLocation.allowed_contributors?.includes(currentUser.id)) {
          navigate(createPageUrl('AdminLocations'));
          return;
        }
        const loaded = {
          ...initialLocationState,
          ...foundLocation,
          name: foundLocation.name || '',
          qr_code: foundLocation.qr_code || '',
          qr_code_image_url: foundLocation.qr_code_image_url || '',
          main_image: foundLocation.main_image || '',
          audio_file: foundLocation.audio_file || '',
          name_en: foundLocation.name_en || '',
          category: foundLocation.category || 'יישוב',
          coordinates: foundLocation.coordinates || { lat: 31.5244, lng: 34.5951 },
          full_story: foundLocation.full_story || { title: '', content: '' },
          full_story_en: foundLocation.full_story_en || { title: '', content: '' },
          videos: foundLocation.videos || [],
          gallery: foundLocation.gallery || [],
          search_keywords: foundLocation.search_keywords || [],
          priority: foundLocation.priority || 'recommended',
          view_count: foundLocation.view_count || 0,
          audio_plays: foundLocation.audio_plays || 0,
          total_listening_time: foundLocation.total_listening_time || 0,
          average_listening_percentage: foundLocation.average_listening_percentage || 0,
        };
        setLocation(loaded);
      }
    } catch (error) {
      toast({ title: 'שגיאה בטעינת המקום', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const generateQRCode = () => {
    if (!locationId) return;
    const fullUrl = `${window.location.origin}${createPageUrl(`Location?id=${locationId}`)}&src=qr`;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(fullUrl)}`;
    updateLocation((prev) => ({ ...prev, qr_code: locationId, qr_code_image_url: qrApiUrl }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    updateLocation((prev) => ({ ...prev, [name]: value }));
  };

  const handleCoordsChange = (e) => {
    const { name, value } = e.target;
    updateLocation((prev) => ({ ...prev, coordinates: { ...prev.coordinates, [name]: parseFloat(value) || 0 } }));
  };

  const handleNestedChange = (area, field, value) => {
    updateLocation((prev) => ({ ...prev, [area]: { ...prev[area], [field]: value } }));
  };

  const addKeyword = () => {
    if (keywordInput.trim()) {
      updateLocation((prev) => ({
        ...prev,
        search_keywords: [...(prev.search_keywords || []), keywordInput.trim()],
      }));
      setKeywordInput('');
    }
  };

  const removeKeyword = (index) => {
    updateLocation((prev) => ({
      ...prev,
      search_keywords: prev.search_keywords.filter((_, i) => i !== index),
    }));
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const { file_url } = await UploadFile(file);
      updateLocation((prev) => ({ ...prev, [field]: file_url }));
      toast({ title: 'הקובץ הועלה בהצלחה' });
    } catch (error) {
      toast({ title: 'שגיאה בהעלאת הקובץ', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleGalleryFileUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const { file_url } = await UploadFile(file);
      const newGallery = [...location.gallery];
      newGallery[index] = { ...newGallery[index], image_url: file_url };
      updateLocation((prev) => ({ ...prev, gallery: newGallery }));
      toast({ title: 'התמונה הועלתה בהצלחה' });
    } catch (error) {
      toast({ title: 'שגיאה בהעלאת התמונה', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleVideoFileUpload = async (e, index, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const { file_url } = await UploadFile(file);
      const newVideos = [...location.videos];
      newVideos[index] = { ...newVideos[index], [type]: file_url };
      updateLocation((prev) => ({ ...prev, videos: newVideos }));
      toast({ title: 'הקובץ הועלה בהצלחה' });
    } catch (error) {
      toast({ title: 'שגיאה בהעלאת הקובץ', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleArrayChange = (arrayName, index, field, value) => {
    const newArray = [...location[arrayName]];
    newArray[index] = { ...newArray[index], [field]: value };
    updateLocation((prev) => ({ ...prev, [arrayName]: newArray }));
  };

  const addToArray = (arrayName, newItem) => {
    updateLocation((prev) => ({ ...prev, [arrayName]: [...(prev[arrayName] || []), newItem] }));
  };

  const removeFromArray = (arrayName, index) => {
    updateLocation((prev) => ({ ...prev, [arrayName]: prev[arrayName].filter((_, i) => i !== index) }));
  };

  const stripHtml = (html) => {
    const div = document.createElement('div');
    div.innerHTML = html || '';
    return (div.textContent || div.innerText || '').trim();
  };

  const generateTTS = async () => {
    const rawText = ttsLang === 'he'
      ? (location.full_story?.content || location.full_story?.title || location.name)
      : (location.full_story_en?.content || location.full_story_en?.title || location.name_en || location.name);
    const text = stripHtml(rawText);

    if (!text) {
      setTtsError('אין תוכן לקריינות — מלא את שדה הסיפור קודם.');
      return;
    }
    if (!elevenLabsKey) {
      setTtsError('נא להזין מפתח ElevenLabs API.');
      return;
    }

    setIsGeneratingTTS(true);
    setTtsError(null);
    if (ttsPreviewUrl) { URL.revokeObjectURL(ttsPreviewUrl); setTtsPreviewUrl(null); }

    try {
      const voiceId = ttsVoice === 'custom' ? customVoiceId : ttsVoice;
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': elevenLabsKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail?.message || `שגיאת שרת ${response.status}`);
      }

      const blob = await response.blob();
      setTtsBlobRef(blob);
      setTtsPreviewUrl(URL.createObjectURL(blob));
    } catch (err) {
      setTtsError(err.message);
    } finally {
      setIsGeneratingTTS(false);
    }
  };

  const applyTTSAudio = async () => {
    if (!ttsBlobRef) return;
    setIsUploading(true);
    try {
      const file = new File([ttsBlobRef], `narration_${Date.now()}.mp3`, { type: 'audio/mpeg' });
      const { file_url } = await UploadFile(file);
      updateLocation(prev => ({ ...prev, audio_file: file_url }));
      URL.revokeObjectURL(ttsPreviewUrl);
      setTtsPreviewUrl(null);
      setTtsBlobRef(null);
      toast({ title: 'הקריינות הוחלה בהצלחה' });
    } catch (err) {
      toast({ title: 'שגיאה בהעלאת הקובץ', description: err.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const openConfirm = (title, description, onConfirm) => {
    setConfirmDialog({ open: true, title, description, onConfirm });
  };

  const handleResetViewStats = () => {
    openConfirm(
      'איפוס סטטיסטיקות צפיות',
      `האם לאפס את מונה הצפיות של "${location.name}"? לא ניתן לשחזר.`,
      async () => {
        try {
          await Location.update(locationId, { view_count: 0 });
          setLocation(prev => ({ ...prev, view_count: 0 }));
          toast({ title: 'סטטיסטיקות הצפיות אופסו' });
        } catch (error) {
          toast({ title: 'שגיאה באיפוס', description: error.message, variant: 'destructive' });
        }
      }
    );
  };

  const handleResetAudioStats = () => {
    openConfirm(
      'איפוס סטטיסטיקות אודיו',
      `האם לאפס את נתוני האודיו של "${location.name}"? לא ניתן לשחזר.`,
      async () => {
        try {
          const updatedStats = { audio_plays: 0, total_listening_time: 0, average_listening_percentage: 0 };
          await Location.update(locationId, updatedStats);
          setLocation(prev => ({ ...prev, ...updatedStats }));
          toast({ title: 'סטטיסטיקות האודיו אופסו' });
        } catch (error) {
          toast({ title: 'שגיאה באיפוס', description: error.message, variant: 'destructive' });
        }
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Contributors may only update content fields — not meta/status/coordinates
      const payload = isContributor ? {
        name: location.name,
        name_en: location.name_en,
        main_image: location.main_image,
        audio_file: location.audio_file,
        full_story: location.full_story || { title: '', content: '' },
        full_story_en: location.full_story_en || { title: '', content: '' },
        videos: location.videos || [],
        gallery: location.gallery || [],
        search_keywords: location.search_keywords || [],
      } : {
        ...location,
        full_story: location.full_story || { title: '', content: '' },
        videos: location.videos || [],
        gallery: location.gallery || [],
        search_keywords: location.search_keywords || [],
      };

      if (locationId) {
        await Location.update(locationId, payload);
      } else {
        await Location.create(payload);
      }
      setIsDirty(false);
      toast({ title: locationId ? 'המקום עודכן בהצלחה' : 'המקום נוצר בהצלחה' });
      navigate(createPageUrl("AdminLocations"));
      window.scrollTo(0, 0);
    } catch (error) {
      toast({ title: 'שגיאה בשמירת המקום', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const SaveButton = ({ className = '' }) => (
    <Button
      type="submit"
      disabled={isSaving || isUploading}
      className={`bg-[#1E3A5F] hover:bg-[#16304f] text-white gap-2 ${className}`}
    >
      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      שמור שינויים
    </Button>
  );

  if (isLoading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-8 h-8 animate-spin text-[#1E3A5F]" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link to={createPageUrl("AdminLocations")} className="hover:text-gray-700 transition-colors">
          ניהול מקומות
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-700 font-medium">
          {locationId ? (location.name || 'עריכת מקום') : 'הוספת מקום חדש'}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Link
              to={createPageUrl("AdminLocations")}
              className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors shadow-sm"
            >
              <ArrowRight className="w-4 h-4" />
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {locationId ? 'עריכת מקום' : 'הוספת מקום חדש'}
            </h1>
          </div>
          <SaveButton className="w-full sm:w-auto px-6 py-2.5 rounded-xl shadow-sm" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* ── LEFT COLUMN ── */}
          <div className="xl:col-span-2 space-y-6">

            {/* Basic Details */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="p-5 sm:p-6 border-b border-gray-100">
                <CardTitle className="text-base sm:text-lg text-gray-900">פרטי בסיס</CardTitle>
                <CardDescription className="text-gray-400 text-sm">המידע הראשי שיוצג למשתמשים.</CardDescription>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 space-y-5">
                <div>
                  <Label htmlFor="name" className="block mb-1.5 text-sm font-medium text-gray-700">שם המקום (עברית)</Label>
                  <Input
                    id="name"
                    name="name"
                    value={location.name}
                    onChange={handleInputChange}
                    required
                    className="bg-white border-gray-200 text-gray-900 focus-visible:ring-blue-400"
                  />
                </div>
                <div>
                  <Label htmlFor="name_en" className="block mb-1.5 text-sm font-medium text-gray-700">Location Name (English)</Label>
                  <Input
                    id="name_en"
                    name="name_en"
                    value={location.name_en}
                    onChange={handleInputChange}
                    placeholder="English name"
                    className="bg-white border-gray-200 text-gray-900 focus-visible:ring-blue-400"
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label className="block mb-1.5 text-sm font-medium text-gray-700">תמונת רקע ראשית</Label>
                  <UploadZone
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'main_image')}
                    disabled={isUploading}
                    label="גרור תמונה לכאן או לחץ לבחירה"
                    hint="JPG, PNG, WebP"
                  />
                  <div className="mt-3">
                    <p className="text-xs text-gray-400 mb-1.5">או הכנס קישור ישירות:</p>
                    <Input
                      placeholder="https://example.com/image.jpg"
                      value={location.main_image}
                      onChange={(e) => updateLocation(prev => ({ ...prev, main_image: e.target.value }))}
                      className="bg-white border-gray-200 text-gray-900 text-sm"
                    />
                  </div>
                  {location.main_image && (
                    <img
                      src={location.main_image}
                      className="w-full sm:w-56 mt-3 rounded-xl max-h-40 object-cover border border-gray-200"
                      alt="תמונת רקע"
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Story - Hebrew */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="p-5 sm:p-6 border-b border-gray-100">
                <CardTitle className="text-base sm:text-lg text-gray-900">תוכן &ldquo;קרא עוד&rdquo; — עברית</CardTitle>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 space-y-4">
                <div>
                  <Label className="block mb-1.5 text-sm font-medium text-gray-700">כותרת הסיפור</Label>
                  <Input
                    placeholder="כותרת הסיפור"
                    value={location.full_story.title}
                    onChange={(e) => handleNestedChange('full_story', 'title', e.target.value)}
                    className="bg-white border-gray-200 text-gray-900"
                  />
                </div>
                <div>
                  <Label className="block mb-1.5 text-sm font-medium text-gray-700">תוכן מלא</Label>
                  <Textarea
                    placeholder="תוכן הסיפור המלא (תומך ב-HTML)"
                    value={location.full_story.content}
                    onChange={(e) => handleNestedChange('full_story', 'content', e.target.value)}
                    rows={7}
                    className="bg-white border-gray-200 text-gray-900 resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Story - English */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="p-5 sm:p-6 border-b border-gray-100">
                <CardTitle className="text-base sm:text-lg text-gray-900">Story Content — English</CardTitle>
                <CardDescription className="text-gray-400 text-sm">Displayed when the visitor switches the site language to English.</CardDescription>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 space-y-4" dir="ltr">
                <div>
                  <Label className="block mb-1.5 text-sm font-medium text-gray-700">Story Title</Label>
                  <Input
                    placeholder="Story title in English"
                    value={location.full_story_en.title}
                    onChange={(e) => handleNestedChange('full_story_en', 'title', e.target.value)}
                    className="bg-white border-gray-200 text-gray-900"
                  />
                </div>
                <div>
                  <Label className="block mb-1.5 text-sm font-medium text-gray-700">Full Content</Label>
                  <Textarea
                    placeholder="Full story content in English (HTML supported)"
                    value={location.full_story_en.content}
                    onChange={(e) => handleNestedChange('full_story_en', 'content', e.target.value)}
                    rows={7}
                    className="bg-white border-gray-200 text-gray-900 resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Audio */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="p-5 sm:p-6 border-b border-gray-100">
                <CardTitle className="text-base sm:text-lg text-gray-900">קריינות</CardTitle>
                <CardDescription className="text-gray-400 text-sm">העלה הקלטה אנושית, או ייצר קריינות AI באמצעות ElevenLabs.</CardDescription>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 space-y-6">

                {/* Human Recording */}
                <div>
                  <Label className="block mb-1.5 text-sm font-medium text-gray-700">הקלטה אנושית / קובץ אודיו</Label>
                  <UploadZone
                    accept="audio/*"
                    onChange={(e) => handleFileUpload(e, 'audio_file')}
                    disabled={isUploading}
                    label="גרור קובץ אודיו לכאן או לחץ לבחירה"
                    hint="MP3, WAV, M4A"
                  />
                  <div className="mt-3">
                    <p className="text-xs text-gray-400 mb-1.5">או הכנס קישור ישירות:</p>
                    <Input
                      placeholder="https://example.com/audio.mp3"
                      value={location.audio_file}
                      onChange={(e) => updateLocation(prev => ({ ...prev, audio_file: e.target.value }))}
                      className="bg-white border-gray-200 text-gray-900 text-sm"
                    />
                  </div>
                  {location.audio_file && (
                    <audio src={location.audio_file} controls className="w-full mt-3 rounded-lg" />
                  )}
                </div>

                {/* AI TTS */}
                <div className="border-t border-gray-100 pt-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <Label className="text-sm font-semibold text-purple-700">ייצור קריינות AI — ElevenLabs</Label>
                  </div>

                  <div className="mb-3">
                    <Label className="block mb-1 text-xs font-medium text-gray-500">מפתח API של ElevenLabs</Label>
                    <Input
                      type="password"
                      placeholder="sk-..."
                      value={elevenLabsKey}
                      onChange={(e) => {
                        setElevenLabsKey(e.target.value);
                        localStorage.setItem('elevenlabs_key', e.target.value);
                      }}
                      className="bg-white border-gray-200 text-gray-900 text-sm"
                      dir="ltr"
                    />
                    <p className="text-xs text-gray-400 mt-1">המפתח נשמר בדפדפן בלבד ואינו עולה לשרת</p>
                  </div>

                  <div className="flex gap-2 mb-3">
                    {[{ code: 'he', label: 'עברית' }, { code: 'en', label: 'English' }].map(({ code, label }) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setTtsLang(code)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border ${ttsLang === code ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mb-3 bg-gray-50 rounded-lg px-3 py-2">
                    טקסט שיישלח: {ttsLang === 'he'
                      ? (stripHtml(location.full_story?.content || location.full_story?.title || location.name) || '—').slice(0, 80) + '...'
                      : (stripHtml(location.full_story_en?.content || location.full_story_en?.title || location.name_en || location.name) || '—').slice(0, 80) + '...'}
                  </p>

                  <div className="mb-3">
                    <Label className="block mb-1 text-xs font-medium text-gray-500">קול</Label>
                    <Select value={ttsVoice} onValueChange={setTtsVoice}>
                      <SelectTrigger className="bg-white border-gray-200 text-gray-900 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pNInz6obpgDQGcFmaJgB">Adam — גבר, רב-לשוני</SelectItem>
                        <SelectItem value="EXAVITQu4vr4xnSDxMaL">Bella — אישה, רב-לשוני</SelectItem>
                        <SelectItem value="XB0fDUnXU5powFXDhCwa">Charlotte — אישה, רב-לשוני</SelectItem>
                        <SelectItem value="TxGEqnHWrfWFTfGW9XjX">Josh — גבר, רב-לשוני</SelectItem>
                        <SelectItem value="custom">קול מותאם אישית (ID ידני)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {ttsVoice === 'custom' && (
                    <div className="mb-3">
                      <Input
                        placeholder="Voice ID מ-ElevenLabs"
                        value={customVoiceId}
                        onChange={(e) => setCustomVoiceId(e.target.value)}
                        className="bg-white border-gray-200 text-gray-900 text-sm"
                        dir="ltr"
                      />
                    </div>
                  )}

                  <Button
                    type="button"
                    onClick={generateTTS}
                    disabled={isGeneratingTTS || !elevenLabsKey}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2"
                  >
                    {isGeneratingTTS
                      ? <><Loader2 className="w-4 h-4 animate-spin" />מייצר קריינות...</>
                      : <><Sparkles className="w-4 h-4" />ייצר קריינות AI</>}
                  </Button>

                  {ttsError && (
                    <p className="text-red-600 text-xs mt-2 p-2 bg-red-50 border border-red-100 rounded-lg">{ttsError}</p>
                  )}

                  {ttsPreviewUrl && (
                    <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
                      <p className="text-xs text-purple-700 font-semibold mb-3">הקריינות מוכנה — האזן לפני האישור:</p>
                      <audio src={ttsPreviewUrl} controls className="w-full mb-3 rounded-lg" />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={applyTTSAudio}
                          disabled={isUploading}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          {isUploading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : '✓ השתמש בקריינות הזו'}
                        </Button>
                        <Button
                          type="button"
                          onClick={() => { URL.revokeObjectURL(ttsPreviewUrl); setTtsPreviewUrl(null); setTtsBlobRef(null); }}
                          variant="outline"
                          className="border-gray-200 text-gray-600"
                        >
                          בטל
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Gallery */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="p-5 sm:p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg text-gray-900">גלריית תמונות</CardTitle>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => addToArray('gallery', { image_url: '', caption: '', photographer: '', order: 0 })}
                    disabled={isUploading}
                    className="bg-[#1E3A5F] hover:bg-[#16304f] text-white gap-1.5 rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" /> הוסף תמונה
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 space-y-4">
                {location.gallery?.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-6">אין תמונות בגלריה עדיין</p>
                )}
                {location.gallery?.map((item, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-500">תמונה {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeFromArray('gallery', index)}
                        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> הסר
                      </button>
                    </div>
                    <UploadZone
                      accept="image/*"
                      onChange={(e) => handleGalleryFileUpload(e, index)}
                      disabled={isUploading}
                      label="גרור תמונה לכאן"
                      hint="JPG, PNG, WebP"
                    />
                    <div>
                      <Label className="block mb-1 text-xs font-medium text-gray-500">או קישור לתמונה</Label>
                      <Input
                        placeholder="קישור לתמונה"
                        value={item.image_url}
                        onChange={(e) => handleArrayChange('gallery', index, 'image_url', e.target.value)}
                        className="bg-white border-gray-200 text-sm"
                      />
                    </div>
                    {item.image_url && (
                      <img src={item.image_url} className="w-full h-32 object-cover rounded-lg border border-gray-200" alt="תצוגה מקדימה" />
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="block mb-1 text-xs font-medium text-gray-500">הסבר התמונה</Label>
                        <Input
                          placeholder="הסבר התמונה"
                          value={item.caption}
                          onChange={(e) => handleArrayChange('gallery', index, 'caption', e.target.value)}
                          className="bg-white border-gray-200 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="block mb-1 text-xs font-medium text-gray-500">צלם / בעל זכויות</Label>
                        <Input
                          placeholder="בעל זכויות יוצרים / צלם"
                          value={item.photographer}
                          onChange={(e) => handleArrayChange('gallery', index, 'photographer', e.target.value)}
                          className="bg-white border-gray-200 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Videos */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="p-5 sm:p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg text-gray-900">סרטונים</CardTitle>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => addToArray('videos', { title: '', description: '', video_url: '', thumbnail: '', caption: '', credits: '', order: 0 })}
                    disabled={isUploading}
                    className="bg-[#1E3A5F] hover:bg-[#16304f] text-white gap-1.5 rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" /> הוסף וידאו
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 space-y-4">
                {location.videos?.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-6">אין סרטונים עדיין</p>
                )}
                {location.videos?.map((item, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-500">סרטון {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeFromArray('videos', index)}
                        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> הסר
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="block mb-1 text-xs font-medium text-gray-500">כותרת</Label>
                        <Input
                          placeholder="כותרת"
                          value={item.title}
                          onChange={(e) => handleArrayChange('videos', index, 'title', e.target.value)}
                          className="bg-white border-gray-200 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="block mb-1 text-xs font-medium text-gray-500">תיאור קצר</Label>
                        <Input
                          placeholder="תיאור קצר"
                          value={item.description}
                          onChange={(e) => handleArrayChange('videos', index, 'description', e.target.value)}
                          className="bg-white border-gray-200 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="block mb-1 text-xs font-medium text-gray-500">העלאת סרטון</Label>
                      <UploadZone
                        accept="video/*"
                        onChange={(e) => handleVideoFileUpload(e, index, 'video_url')}
                        disabled={isUploading}
                        label="גרור סרטון לכאן"
                        hint="MP4, MOV, WebM"
                      />
                      <div className="mt-2">
                        <Label className="block mb-1 text-xs font-medium text-gray-500">או קישור לסרטון</Label>
                        <Input
                          placeholder="קישור לסרטון"
                          value={item.video_url}
                          onChange={(e) => handleArrayChange('videos', index, 'video_url', e.target.value)}
                          className="bg-white border-gray-200 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="block mb-1 text-xs font-medium text-gray-500">תמונה ממוזערת</Label>
                      <UploadZone
                        accept="image/*"
                        onChange={(e) => handleVideoFileUpload(e, index, 'thumbnail')}
                        disabled={isUploading}
                        label="גרור תמונה ממוזערת לכאן"
                        hint="JPG, PNG"
                      />
                      <div className="mt-2">
                        <Label className="block mb-1 text-xs font-medium text-gray-500">או קישור לתמונה ממוזערת</Label>
                        <Input
                          placeholder="קישור לתמונה ממוזערת"
                          value={item.thumbnail}
                          onChange={(e) => handleArrayChange('videos', index, 'thumbnail', e.target.value)}
                          className="bg-white border-gray-200 text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="block mb-1 text-xs font-medium text-gray-500">הסבר הווידאו</Label>
                        <Input
                          placeholder="הסבר הווידאו"
                          value={item.caption}
                          onChange={(e) => handleArrayChange('videos', index, 'caption', e.target.value)}
                          className="bg-white border-gray-200 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="block mb-1 text-xs font-medium text-gray-500">בעל זכויות יוצרים</Label>
                        <Input
                          placeholder="בעל זכויות יוצרים"
                          value={item.credits}
                          onChange={(e) => handleArrayChange('videos', index, 'credits', e.target.value)}
                          className="bg-white border-gray-200 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Map / Coordinates */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="p-5 sm:p-6 border-b border-gray-100">
                <CardTitle className="text-base sm:text-lg text-gray-900">מיקום על המפה</CardTitle>
                <CardDescription className="text-gray-400 text-sm">הזן את הקואורדינטות הגיאוגרפיות של המקום.</CardDescription>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lat" className="block mb-1.5 text-sm font-medium text-gray-700">קו רוחב (Latitude)</Label>
                    <Input
                      id="lat"
                      type="number"
                      name="lat"
                      value={location.coordinates.lat}
                      onChange={handleCoordsChange}
                      step="any"
                      className="bg-white border-gray-200 text-gray-900"
                    />
                    <p className="text-xs text-gray-400 mt-1">דוגמה: 31.5244</p>
                  </div>
                  <div>
                    <Label htmlFor="lng" className="block mb-1.5 text-sm font-medium text-gray-700">קו אורך (Longitude)</Label>
                    <Input
                      id="lng"
                      type="number"
                      name="lng"
                      value={location.coordinates.lng}
                      onChange={handleCoordsChange}
                      step="any"
                      className="bg-white border-gray-200 text-gray-900"
                    />
                    <p className="text-xs text-gray-400 mt-1">דוגמה: 34.5951</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 text-sm text-gray-500 bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <MapPin className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>אפשר להשתמש בגוגל מפות — לחץ ימני על המקום ובחר &ldquo;מה נמצא כאן?&rdquo; כדי לקבל קואורדינטות.</span>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* ── RIGHT COLUMN (sidebar) ── */}
          <div className="xl:col-span-1 space-y-6">

            {/* Status & QR — admin only */}
            {!isContributor && <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="p-5 sm:p-6 border-b border-gray-100">
                <CardTitle className="text-base sm:text-lg text-gray-900">סטטוס וזיהוי</CardTitle>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 space-y-5">
                <div>
                  <Label className="block mb-1.5 text-sm font-medium text-gray-700">סטטוס</Label>
                  <Select
                    value={String(location.is_active)}
                    onValueChange={(val) => updateLocation((p) => ({ ...p, is_active: val === 'true' }))}
                  >
                    <SelectTrigger className="bg-white border-gray-200 text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">פעיל</SelectItem>
                      <SelectItem value="false">לא פעיל</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="block mb-1.5 text-sm font-medium text-gray-700">קטגוריה</Label>
                  <Select
                    value={location.category}
                    onValueChange={(val) => updateLocation((p) => ({ ...p, category: val }))}
                  >
                    <SelectTrigger className="bg-white border-gray-200 text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="יישוב">יישוב</SelectItem>
                      <SelectItem value="מיגונית">מיגונית</SelectItem>
                      <SelectItem value="אירוע">אירוע</SelectItem>
                      <SelectItem value="מקום אחר">מקום אחר</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="block mb-1.5 text-sm font-medium text-gray-700">עדיפות במסלול</Label>
                  <Select
                    value={location.priority || 'recommended'}
                    onValueChange={(val) => updateLocation((p) => ({ ...p, priority: val }))}
                  >
                    <SelectTrigger className="bg-white border-gray-200 text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="essential">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                          חובה — תחנה מרכזית
                        </span>
                      </SelectItem>
                      <SelectItem value="recommended">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                          מומלץ — תחנה רגילה
                        </span>
                      </SelectItem>
                      <SelectItem value="extended">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
                          מורחב — תחנת בונוס
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-400 mt-1">קובע אילו מסלולים יכללו תחנה זו</p>
                </div>

                <div>
                  <Label className="block mb-1.5 text-sm font-medium text-gray-700">קוד QR</Label>
                  <div className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    {location.qr_code_image_url ? (
                      <img
                        src={location.qr_code_image_url}
                        alt="QR Code"
                        className="w-36 h-36 bg-white p-2 rounded-xl border border-gray-200 shadow-sm"
                      />
                    ) : (
                      <div className="w-36 h-36 bg-white flex items-center justify-center text-center text-xs text-gray-400 rounded-xl border border-dashed border-gray-300 p-3">
                        {locationId ? 'לחץ על הכפתור ליצירת קוד QR' : 'שמור את המקום כדי להפעיל'}
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateQRCode}
                      className="w-full border-gray-200 text-gray-700 hover:bg-gray-50 gap-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
                      disabled={!locationId}
                    >
                      <QrCode className="w-4 h-4" />
                      {location.qr_code_image_url ? 'צור מחדש' : 'צור תמונת QR'}
                    </Button>
                    {!locationId && (
                      <p className="text-xs text-gray-400 text-center">יש לשמור את המקום תחילה.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>}

            {/* Search Keywords */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="p-5 sm:p-6 border-b border-gray-100">
                <CardTitle className="text-base sm:text-lg text-gray-900">מילות מפתח לחיפוש</CardTitle>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="הוסף מילת מפתח"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                    className="bg-white border-gray-200 text-gray-900 flex-1"
                  />
                  <Button
                    type="button"
                    onClick={addKeyword}
                    size="sm"
                    className="bg-[#1E3A5F] hover:bg-[#16304f] text-white px-4 rounded-lg"
                  >
                    הוסף
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {location.search_keywords?.map((keyword, index) => (
                    <span key={index} className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full text-xs font-medium">
                      {keyword}
                      <button
                        type="button"
                        onClick={() => removeKeyword(index)}
                        className="hover:text-red-500 transition-colors w-4 h-4 flex items-center justify-center rounded-full hover:bg-red-50"
                        aria-label={`הסר ${keyword}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {location.search_keywords?.length === 0 && (
                    <p className="text-xs text-gray-400">לא הוספו מילות מפתח עדיין</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Stats — admin only */}
            {!isContributor && locationId && (
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader className="p-5 sm:p-6 border-b border-gray-100">
                  <CardTitle className="text-base sm:text-lg text-gray-900">סטטיסטיקות</CardTitle>
                </CardHeader>
                <CardContent className="p-5 sm:p-6 space-y-4">
                  <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
                    <div className="flex justify-between items-center px-4 py-3 bg-gray-50">
                      <span className="text-sm text-gray-500">צפיות</span>
                      <span className="text-sm font-bold text-gray-900 font-mono">{location.view_count || 0}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-sm text-gray-500">הפעלות אודיו</span>
                      <span className="text-sm font-bold text-gray-900 font-mono">{location.audio_plays || 0}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3 bg-gray-50">
                      <span className="text-sm text-gray-500">האזנה ממוצעת</span>
                      <span className="text-sm font-bold text-gray-900 font-mono">{location.average_listening_percentage || 0}%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 gap-2 rounded-xl"
                      onClick={handleResetViewStats}
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> איפוס צפיות
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300 gap-2 rounded-xl"
                      onClick={handleResetAudioStats}
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> איפוס הפעלות אודיו
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contributors — admin only */}
            {!isContributor && locationId && (
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader className="p-5 sm:p-6 border-b border-gray-100">
                  <CardTitle className="text-base sm:text-lg text-gray-900">תורמי תוכן</CardTitle>
                  <CardDescription className="text-gray-400 text-sm">
                    משתמשים אלה יוכלו לערוך תוכן במקום זה.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 sm:p-6 space-y-4">
                  {/* Current contributors */}
                  <div className="space-y-2">
                    {(location.allowed_contributors || []).length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-2">לא הוקצו תורמי תוכן למקום זה</p>
                    )}
                    {(location.allowed_contributors || []).map(uid => {
                      const profile = allContributors.find(c => c.id === uid);
                      return (
                        <div key={uid} className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                          <div>
                            <p className="text-xs font-semibold text-blue-800">{profile?.full_name || '—'}</p>
                            <p className="text-[11px] text-blue-500">{profile?.email || uid.slice(0, 8) + '...'}</p>
                          </div>
                          <button
                            type="button"
                            disabled={contributorLoading}
                            onClick={() => handleManageContributor(uid, 'remove')}
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add contributor */}
                  {allContributors.filter(c => !(location.allowed_contributors || []).includes(c.id)).length > 0 && (
                    <div className="border-t border-gray-100 pt-3">
                      <p className="text-xs font-medium text-gray-500 mb-2">הוסף תורם תוכן:</p>
                      <div className="relative mb-2">
                        <Input
                          placeholder="חיפוש לפי שם..."
                          value={contributorSearch}
                          onChange={e => setContributorSearch(e.target.value)}
                          className="bg-white border-gray-200 text-gray-900 text-xs h-8"
                        />
                      </div>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {allContributors
                          .filter(c =>
                            !(location.allowed_contributors || []).includes(c.id) &&
                            (contributorSearch === '' ||
                              c.full_name?.toLowerCase().includes(contributorSearch.toLowerCase()) ||
                              c.email?.toLowerCase().includes(contributorSearch.toLowerCase()))
                          )
                          .map(c => (
                            <button
                              key={c.id}
                              type="button"
                              disabled={contributorLoading}
                              onClick={() => handleManageContributor(c.id, 'add')}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-right hover:bg-gray-50 border border-gray-100 transition-colors"
                            >
                              <UserPlus className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-gray-800 truncate">{c.full_name || '—'}</p>
                                <p className="text-[11px] text-gray-400 truncate">{c.email}</p>
                              </div>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                  {contributorLoading && (
                    <div className="flex justify-center pt-1">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Bottom save bar */}
        <div className="sticky bottom-0 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 bg-white/90 backdrop-blur border-t border-gray-200 flex items-center justify-between gap-4 z-20">
          <p className="text-sm text-gray-400">
            {isDirty ? 'יש שינויים שלא נשמרו' : 'כל השינויים שמורים'}
          </p>
          <SaveButton className="px-8 py-2.5 rounded-xl shadow-sm" />
        </div>
      </form>

      {/* Upload overlay */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 shadow-xl text-center border border-gray-200">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#1E3A5F]" />
            <p className="text-sm font-medium text-gray-700">מעלה קובץ...</p>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog(d => ({ ...d, open: false }))}>
        <AlertDialogContent className="bg-white border-gray-200" dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-gray-200 text-gray-700">ביטול</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
              onClick={() => {
                confirmDialog.onConfirm?.();
                setConfirmDialog(d => ({ ...d, open: false }));
              }}
            >
              אפס
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
