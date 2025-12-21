
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Location } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UploadFile } from '@/api/integrations';
import { Save, Loader2, Plus, Trash2, QrCode, MapPin, RotateCcw, Upload } from 'lucide-react';
import { createPageUrl } from '@/utils';

const initialLocationState = {
  name: '',
  qr_code: '',
  qr_code_image_url: '',
  search_keywords: [],
  coordinates: { lat: 31.5244, lng: 34.5951 }, // Default to Sderot
  main_image: '',
  audio_file: '',
  full_story: { title: '', content: '' },
  videos: [],
  gallery: [],
  is_active: true,
  category: 'יישוב',
  view_count: 0,
  audio_plays: 0, // New field for audio plays
  total_listening_time: 0, // New field for total listening time (for average calculation)
  average_listening_percentage: 0, // New field for average listening percentage
};

export default function EditLocation() {
  const [location, setLocation] = useState(initialLocationState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [locationId, setLocationId] = useState(null);
  const [keywordInput, setKeywordInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) {
      setLocationId(id);
      loadLocation(id);
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadLocation = async (id) => {
    try {
      const locations = await Location.list();
      const foundLocation = locations.find((l) => l.id === id);
      if (foundLocation) {
        const loaded = {
          ...initialLocationState, // Use initial state as base to ensure all fields are present
          ...foundLocation,
          coordinates: foundLocation.coordinates || { lat: 31.5244, lng: 34.5951 },
          full_story: foundLocation.full_story || { title: '', content: '' },
          videos: foundLocation.videos || [],
          gallery: foundLocation.gallery || [],
          search_keywords: foundLocation.search_keywords || [],
          qr_code_image_url: foundLocation.qr_code_image_url || '',
          view_count: foundLocation.view_count || 0,
          audio_plays: foundLocation.audio_plays || 0, // Initialize new fields
          total_listening_time: foundLocation.total_listening_time || 0, // Initialize new fields
          average_listening_percentage: foundLocation.average_listening_percentage || 0, // Initialize new fields
        };
        setLocation(loaded);
      }
    } catch (error) {
      console.error("Error loading location:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateQRCode = async () => {
    if (!locationId) return;

    const fullUrl = `${window.location.origin}${createPageUrl(`Location?id=${locationId}`)}`;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(fullUrl)}`;

    setLocation((prev) => ({
      ...prev,
      qr_code: locationId,
      qr_code_image_url: qrApiUrl
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLocation((prev) => ({ ...prev, [name]: value }));
  };

  const handleCoordsChange = (e) => {
    const { name, value } = e.target;
    setLocation((prev) => ({ ...prev, coordinates: { ...prev.coordinates, [name]: parseFloat(value) || 0 } }));
  };

  const handleNestedChange = (area, field, value) => {
    setLocation((prev) => ({ ...prev, [area]: { ...prev[area], [field]: value } }));
  };

  const addKeyword = () => {
    if (keywordInput.trim()) {
      setLocation((prev) => ({
        ...prev,
        search_keywords: [...(prev.search_keywords || []), keywordInput.trim()]
      }));
      setKeywordInput('');
    }
  };

  const removeKeyword = (index) => {
    setLocation((prev) => ({
      ...prev,
      search_keywords: prev.search_keywords.filter((_, i) => i !== index)
    }));
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setLocation((prev) => ({ ...prev, [field]: file_url }));
    } catch (error) {
      console.error(`Error uploading ${field}:`, error);
      alert(`שגיאה בהעלאת הקובץ: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGalleryFileUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      const newGallery = [...location.gallery];
      newGallery[index] = { ...newGallery[index], image_url: file_url };
      setLocation((prev) => ({ ...prev, gallery: newGallery }));
    } catch (error) {
      console.error("Error uploading gallery image:", error);
      alert(`שגיאה בהעלאת התמונה: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleVideoFileUpload = async (e, index, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      const newVideos = [...location.videos];
      newVideos[index] = { ...newVideos[index], [type]: file_url };
      setLocation((prev) => ({ ...prev, videos: newVideos }));
    } catch (error) {
      console.error(`Error uploading video ${type}:`, error);
      alert(`שגיאה בהעלאת הקובץ: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleArrayChange = (arrayName, index, field, value) => {
    const newArray = [...location[arrayName]];
    newArray[index] = { ...newArray[index], [field]: value };
    setLocation((prev) => ({ ...prev, [arrayName]: newArray }));
  };

  const addToArray = (arrayName, newItem) => {
    setLocation((prev) => ({ ...prev, [arrayName]: [...(prev[arrayName] || []), newItem] }));
  };

  const removeFromArray = (arrayName, index) => {
    setLocation((prev) => ({ ...prev, [arrayName]: prev[arrayName].filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = { ...location };
      payload.full_story = payload.full_story || { title: '', content: '' };
      payload.videos = payload.videos || [];
      payload.gallery = payload.gallery || [];
      payload.search_keywords = payload.search_keywords || [];
      payload.view_count = location.view_count;
      payload.audio_plays = location.audio_plays;
      payload.total_listening_time = location.total_listening_time;
      payload.average_listening_percentage = location.average_listening_percentage;

      if (locationId) {
        await Location.update(locationId, payload);
      } else {
        await Location.create(payload);
      }
      navigate(createPageUrl("AdminLocations"));
      window.scrollTo(0, 0); // Scroll to top after successful save and navigation
    } catch (error) {
      console.error("Error saving location:", error);
      alert(`שגיאה בשמירת המקום: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="text-center p-8"><Loader2 className="w-8 h-8 animate-spin mx-auto text-white" /></div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
              {locationId ? 'עריכת מקום' : 'הוספת מקום חדש'}
            </h1>
            <Button 
              type="submit" 
              disabled={isSaving || isUploading} 
              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3"
            >
              {isSaving ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Save className="ml-2 h-4 w-4" />}
              שמור שינויים
            </Button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <div className="xl:col-span-2 space-y-4 sm:space-y-6 lg:space-y-8">
              {/* Basic Details */}
              <Card className="bg-slate-800 border-slate-700 text-white">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg lg:text-xl">פרטי בסיס</CardTitle>
                  <CardDescription className="text-slate-400 text-sm">המידע הראשי שיוצג למשתמשים.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  <div>
                    <Label htmlFor="name" className="block mb-2 text-sm font-medium">שם המקום</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      value={location.name} 
                      onChange={handleInputChange} 
                      required 
                      className="bg-slate-700 border-slate-600 text-white text-sm sm:text-base" 
                    />
                  </div>
                  <div>
                    <Label className="block mb-2 text-sm font-medium">תמונת רקע ראשית</Label>
                    <div className="space-y-3">
                      <Input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleFileUpload(e, 'main_image')} 
                        className="bg-slate-700 border-slate-600 file:text-slate-300 text-xs sm:text-sm" 
                        disabled={isUploading} 
                      />
                      <div className="text-xs sm:text-sm text-slate-400">או הכנס קישור ישירות:</div>
                      <Input 
                        placeholder="https://example.com/image.jpg" 
                        value={location.main_image} 
                        onChange={(e) => setLocation(prev => ({...prev, main_image: e.target.value}))} 
                        className="bg-slate-700 border-slate-600 text-white text-sm" 
                      />
                    </div>
                    {location.main_image && (
                      <img 
                        src={location.main_image} 
                        className="w-full sm:w-48 mt-4 rounded-md max-h-32 sm:max-h-48 object-cover" 
                        alt="תמונת רקע" 
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Audio */}
              <Card className="bg-slate-800 border-slate-700 text-white">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg lg:text-xl">קריינות</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <Label className="block mb-2 text-sm font-medium">קובץ אודיו</Label>
                  <div className="space-y-3">
                    <Input 
                      type="file" 
                      accept="audio/*" 
                      onChange={(e) => handleFileUpload(e, 'audio_file')} 
                      className="bg-slate-700 border-slate-600 file:text-slate-300 text-xs sm:text-sm" 
                      disabled={isUploading} 
                    />
                    <div className="text-xs sm:text-sm text-slate-400">או הכנס קישור ישירות:</div>
                    <Input 
                      placeholder="https://example.com/audio.mp3" 
                      value={location.audio_file} 
                      onChange={(e) => setLocation(prev => ({...prev, audio_file: e.target.value}))} 
                      className="bg-slate-700 border-slate-600 text-white text-sm" 
                    />
                  </div>
                  {location.audio_file && (
                    <audio src={location.audio_file} controls className="w-full mt-4" />
                  )}
                </CardContent>
              </Card>

              {/* Gallery */}
              <Card className="bg-slate-800 border-slate-700 text-white">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg lg:text-xl">גלריית תמונות</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  <Button 
                    type="button" 
                    size="sm" 
                    onClick={() => addToArray('gallery', { image_url: '', caption: '', photographer: '', order: 0 })} 
                    disabled={isUploading} 
                    className="w-full sm:w-auto text-xs sm:text-sm"
                  >
                    <Plus className="w-4 h-4 ml-2" /> הוסף תמונה
                  </Button>
                  <div className="grid grid-cols-1 gap-4">
                    {location.gallery?.map((item, index) => (
                      <div key={index} className="p-3 sm:p-4 bg-slate-900/50 rounded-md border border-slate-700 space-y-3 relative">
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="icon" 
                          className="absolute top-2 left-2 h-6 w-6 text-xs" 
                          onClick={() => removeFromArray('gallery', index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        <div className="pt-6 space-y-3">
                          <div>
                            <Label className="block mb-2 text-xs font-medium text-slate-300">העלאת תמונה</Label>
                            <Input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => handleGalleryFileUpload(e, index)} 
                              className="bg-slate-700 border-slate-600 file:text-slate-300 mb-2 text-xs" 
                              disabled={isUploading} 
                            />
                            <Label className="block mb-2 text-xs font-medium text-slate-300">או קישור לתמונה</Label>
                            <Input 
                              placeholder="קישור לתמונה" 
                              value={item.image_url} 
                              onChange={(e) => handleArrayChange('gallery', index, 'image_url', e.target.value)} 
                              className="bg-slate-700 border-slate-600 text-xs" 
                            />
                          </div>
                          {item.image_url && (
                            <img 
                              src={item.image_url} 
                              className="w-full h-24 sm:h-32 object-cover rounded max-w-full" 
                              alt="תצוגה מקדימה" 
                            />
                          )}
                          <div>
                            <Label className="block mb-2 text-xs font-medium text-slate-300">הסבר התמונה</Label>
                            <Input 
                              placeholder="הסבר התמונה" 
                              value={item.caption} 
                              onChange={(e) => handleArrayChange('gallery', index, 'caption', e.target.value)} 
                              className="bg-slate-700 border-slate-600 text-xs" 
                            />
                          </div>
                          <div>
                            <Label className="block mb-2 text-xs font-medium text-slate-300">צלם / בעל זכויות</Label>
                            <Input 
                              placeholder="בעל זכויות יוצרים / צלם" 
                              value={item.photographer} 
                              onChange={(e) => handleArrayChange('gallery', index, 'photographer', e.target.value)} 
                              className="bg-slate-700 border-slate-600 text-xs" 
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Videos */}
              <Card className="bg-slate-800 border-slate-700 text-white">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg lg:text-xl">סרטונים</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  <Button 
                    type="button" 
                    size="sm" 
                    onClick={() => addToArray('videos', { title: '', description: '', video_url: '', thumbnail: '', caption: '', credits: '', order: 0 })} 
                    disabled={isUploading} 
                    className="w-full sm:w-auto text-xs sm:text-sm"
                  >
                    <Plus className="w-4 h-4 ml-2" /> הוסף וידאו
                  </Button>
                  <div className="grid grid-cols-1 gap-4">
                    {location.videos?.map((item, index) => (
                      <div key={index} className="p-3 sm:p-4 bg-slate-900/50 rounded-md border border-slate-700 space-y-3 relative">
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="icon" 
                          className="absolute top-2 left-2 h-6 w-6 text-xs" 
                          onClick={() => removeFromArray('videos', index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        <div className="pt-6 space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <Label className="block mb-2 text-xs font-medium text-slate-300">כותרת</Label>
                              <Input 
                                placeholder="כותרת" 
                                value={item.title} 
                                onChange={(e) => handleArrayChange('videos', index, 'title', e.target.value)} 
                                className="bg-slate-700 border-slate-600 text-xs" 
                              />
                            </div>
                            <div>
                              <Label className="block mb-2 text-xs font-medium text-slate-300">תיאור קצר</Label>
                              <Input 
                                placeholder="תיאור קצר" 
                                value={item.description} 
                                onChange={(e) => handleArrayChange('videos', index, 'description', e.target.value)} 
                                className="bg-slate-700 border-slate-600 text-xs" 
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="block mb-2 text-xs font-medium text-slate-300">העלאת סרטון</Label>
                            <Input 
                              type="file" 
                              accept="video/*" 
                              onChange={(e) => handleVideoFileUpload(e, index, 'video_url')} 
                              className="bg-slate-700 border-slate-600 file:text-slate-300 mb-2 text-xs" 
                              disabled={isUploading} 
                            />
                            <Label className="block mb-2 text-xs font-medium text-slate-300">או קישור לסרטון</Label>
                            <Input 
                              placeholder="קישור לסרטון" 
                              value={item.video_url} 
                              onChange={(e) => handleArrayChange('videos', index, 'video_url', e.target.value)} 
                              className="bg-slate-700 border-slate-600 text-xs" 
                            />
                          </div>
                          <div>
                            <Label className="block mb-2 text-xs font-medium text-slate-300">העלאת תמונה ממוזערת</Label>  
                            <Input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => handleVideoFileUpload(e, index, 'thumbnail')} 
                              className="bg-slate-700 border-slate-600 file:text-slate-300 mb-2 text-xs" 
                              disabled={isUploading} 
                            />
                            <Label className="block mb-2 text-xs font-medium text-slate-300">או קישור לתמונה ממוזערת</Label>
                            <Input 
                              placeholder="קישור לתמונה ממוזערת" 
                              value={item.thumbnail} 
                              onChange={(e) => handleArrayChange('videos', index, 'thumbnail', e.target.value)} 
                              className="bg-slate-700 border-slate-600 text-xs" 
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <Label className="block mb-2 text-xs font-medium text-slate-300">הסבר הווידאו</Label>
                              <Input 
                                placeholder="הסבר הווידאו" 
                                value={item.caption} 
                                onChange={(e) => handleArrayChange('videos', index, 'caption', e.target.value)} 
                                className="bg-slate-700 border-slate-600 text-xs" 
                              />
                            </div>
                            <div>
                              <Label className="block mb-2 text-xs font-medium text-slate-300">בעל זכויות יוצרים</Label>
                              <Input 
                                placeholder="בעל זכויות יוצרים" 
                                value={item.credits} 
                                onChange={(e) => handleArrayChange('videos', index, 'credits', e.target.value)} 
                                className="bg-slate-700 border-slate-600 text-xs" 
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Story Content */}
              <Card className="bg-slate-800 border-slate-700 text-white">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg lg:text-xl">תוכן "קרא עוד"</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  <div>
                    <Label className="block mb-2 text-sm font-medium">כותרת הסיפור</Label>
                    <Input 
                      name="title" 
                      placeholder="כותרת הסיפור" 
                      value={location.full_story.title} 
                      onChange={(e) => handleNestedChange('full_story', 'title', e.target.value)} 
                      className="bg-slate-700 border-slate-600 text-sm" 
                    />
                  </div>
                  <div>
                    <Label className="block mb-2 text-sm font-medium">תוכן מלא</Label>
                    <Textarea 
                      name="content" 
                      placeholder="תוכן הסיפור המלא (תומך ב-HTML)" 
                      value={location.full_story.content} 
                      onChange={(e) => handleNestedChange('full_story', 'content', e.target.value)} 
                      rows={6} 
                      className="bg-slate-700 border-slate-600 text-sm resize-none" 
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Location Coordinates - Moved to bottom */}
              <Card className="bg-slate-800 border-slate-700 text-white">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg lg:text-xl">מיקום על המפה</CardTitle>
                  <CardDescription className="text-slate-400 text-sm">הזן את הקואורדינטות הגיאוגרפיות של המקום.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  <div className="p-4 bg-slate-700 rounded-lg text-center">
                    <MapPin className="w-8 sm:w-12 h-8 sm:h-12 mx-auto mb-2 text-slate-400" />
                    <p className="text-slate-300 mb-2 text-sm">מפה אינטרקטיבית זמינה בהמשך</p>
                    <p className="text-xs text-slate-400">עכשיו אפשר להזין קואורדינטות ידנית</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="lat" className="block mb-2 text-sm font-medium">קו רוחב (Latitude)</Label>
                      <Input 
                        id="lat" 
                        type="number" 
                        name="lat" 
                        value={location.coordinates.lat} 
                        onChange={handleCoordsChange} 
                        step="any" 
                        className="bg-slate-700 border-slate-600 text-white text-sm" 
                      />
                      <p className="text-xs text-slate-400 mt-1">דוגמה: 31.5244</p>
                    </div>
                    <div>
                      <Label htmlFor="lng" className="block mb-2 text-sm font-medium">קו אורך (Longitude)</Label>
                      <Input 
                        id="lng" 
                        type="number" 
                        name="lng" 
                        value={location.coordinates.lng} 
                        onChange={handleCoordsChange} 
                        step="any" 
                        className="bg-slate-700 border-slate-600 text-white text-sm" 
                      />
                      <p className="text-xs text-slate-400 mt-1">דוגמה: 34.5951</p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 bg-slate-700 p-3 rounded">
                    <strong>עצה:</strong> אפשר להשתמש בגוגל מפות כדי למצוא קואורדינטות. לחץ ימני על המקום במפה ובחר "מה נמצא כאן?"
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="xl:col-span-1 space-y-4 sm:space-y-6 lg:space-y-8">
              {/* QR Code & Status */}
              <Card className="bg-slate-800 border-slate-700 text-white">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg lg:text-xl">סטטוס וזיהוי</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  <div>
                    <Label className="block mb-2 text-sm font-medium">קוד QR</Label>
                    <div className="p-3 sm:p-4 bg-slate-900/50 rounded-lg flex flex-col items-center gap-4">
                      {location.qr_code_image_url ? (
                        <img 
                          src={location.qr_code_image_url} 
                          alt="QR Code" 
                          className="w-32 h-32 sm:w-40 sm:h-40 bg-white p-2 rounded-md" 
                        />
                      ) : (
                        <div className="w-32 h-32 sm:w-40 sm:h-40 bg-slate-700 flex items-center justify-center text-center text-xs text-slate-400 rounded-md p-2">
                          {locationId ? 'לחץ על הכפתור ליצירת קוד QR' : 'שמור את המקום כדי להפעיל'}
                        </div>
                      )}
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={generateQRCode} 
                        className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm" 
                        disabled={!locationId}
                      >
                        <QrCode className="w-4 h-4 ml-2" />
                        {location.qr_code_image_url ? 'צור מחדש' : 'צור תמונת QR'}
                      </Button>
                      {!locationId && (
                        <p className="text-xs text-slate-400 text-center -mt-2">
                          יש לשמור את המקום תחילה.
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="block mb-2 text-sm font-medium">סטטוס</Label>
                    <Select 
                      value={String(location.is_active)} 
                      onValueChange={(val) => setLocation((p) => ({ ...p, is_active: val === 'true' }))}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 text-white border-slate-700">
                        <SelectItem value="true">פעיל</SelectItem>
                        <SelectItem value="false">לא פעיל</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="block mb-2 text-sm font-medium">קטגוריה</Label>
                    <Select 
                      value={location.category} 
                      onValueChange={(val) => setLocation((p) => ({ ...p, category: val }))}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 text-white border-slate-700">
                        <SelectItem value="יישוב">יישוב</SelectItem>
                        <SelectItem value="בסיס צבאי">בסיס צבאי</SelectItem>
                        <SelectItem value="אירוע">אירוע</SelectItem>
                        <SelectItem value="מקום אחר">מקום אחר</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Stats and Reset Section */}
                  <div className="border-t border-slate-700 pt-4">
                    <Label className="block mb-2 text-sm font-medium">סטטיסטיקות</Label>
                    <div className="p-3 bg-slate-700/50 rounded-lg space-y-2">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-slate-400">צפיות:</span>
                        <span className="text-white font-mono">{location.view_count || 0}</span>
                      </div>
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-slate-400">הפעלות אודיו:</span>
                        <span className="text-white font-mono">{location.audio_plays || 0}</span>
                      </div>
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-slate-400">האזנה ממוצעת:</span>
                        <span className="text-white font-mono">{location.average_listening_percentage || 0}%</span>
                      </div>
                    </div>
                    {locationId && (
                      <div className="space-y-2 mt-3">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          className="w-full border-red-500 text-red-400 hover:bg-red-500/20 text-xs sm:text-sm"
                          onClick={async () => {
                            if (window.confirm(`האם אתה בטוח שברצונך לאפס את סטטיסטיקות הצפיות של "${location.name}"?`)) {
                              try {
                                const updatedLocation = { ...location, view_count: 0 };
                                await Location.update(locationId, { view_count: 0 });
                                setLocation(updatedLocation);
                              } catch (error) {
                                console.error("Error resetting view stats:", error);
                                alert("שגיאה באיפוס סטטיסטיקות: " + error.message);
                              }
                            }
                          }}
                        >
                          <RotateCcw className="w-4 h-4 ml-2" />
                          איפוס צפיות
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          className="w-full border-orange-500 text-orange-400 hover:bg-orange-500/20 text-xs sm:text-sm"
                          onClick={async () => {
                            if (window.confirm(`האם אתה בטוח שברצונך לאפס את סטטיסטיקות האודיו של "${location.name}"?`)) {
                              try {
                                const updatedStats = { 
                                  audio_plays: 0, 
                                  total_listening_time: 0, 
                                  average_listening_percentage: 0 
                                };
                                await Location.update(locationId, updatedStats);
                                setLocation(prev => ({ ...prev, ...updatedStats }));
                              } catch (error) {
                                console.error("Error resetting audio stats:", error);
                                alert("שגיאה באיפוס סטטיסטיקות אודיו: " + error.message);
                              }
                            }
                          }}
                        >
                          <RotateCcw className="w-4 h-4 ml-2" />
                          איפוס הפעלות אודיו
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Search Keywords */}
              <Card className="bg-slate-800 border-slate-700 text-white">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg lg:text-xl">מילות מפתח לחיפוש</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  <div>
                    <Label className="block mb-2 text-sm font-medium">הוסף מילת מפתח</Label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="הוסף מילת מפתח" 
                        value={keywordInput} 
                        onChange={(e) => setKeywordInput(e.target.value)} 
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())} 
                        className="bg-slate-700 border-slate-600 text-xs sm:text-sm flex-1" 
                      />
                      <Button 
                        type="button" 
                        onClick={addKeyword} 
                        size="sm" 
                        className="text-xs sm:text-sm px-3"
                      >
                        הוסף
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {location.search_keywords?.map((keyword, index) => (
                      <div key={index} className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs flex items-center gap-2">
                        {keyword}
                        <button 
                          type="button" 
                          onClick={() => removeKeyword(index)} 
                          className="hover:text-red-300 text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {isUploading && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-slate-800 p-4 sm:p-6 rounded-lg text-white text-center mx-4">
                <Loader2 className="w-6 sm:w-8 h-6 sm:h-8 animate-spin mx-auto mb-4" />
                <p className="text-sm sm:text-base">מעלה קובץ...</p>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
