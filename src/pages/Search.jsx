import React, { useState, useEffect } from "react";
import { Location } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Eye, Filter, BookOpen, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const categoryColors = {
  "יישוב": "bg-[#F5F5F5] text-[#1E3A5F] border-[#1E3A5F]",
  "בסיס צבאי": "bg-[#F5F5F5] text-[#1E3A5F] border-[#1E3A5F]",
  "אירוע": "bg-[#F5F5F5] text-[#1E3A5F] border-[#1E3A5F]",
  "מקום אחר": "bg-[#F5F5F5] text-[#1E3A5F] border-[#1E3A5F]"
};

// Global cache for locations to avoid multiple API calls
let locationsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default function SearchPage() {
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("הכל");
  const [sortBy, setSortBy] = useState("name");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    filterAndSortLocations();
  }, [locations, searchTerm, categoryFilter, sortBy]);

  const loadLocations = async (retry = 0) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check cache first
      if (locationsCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
        const activeLocations = locationsCache.filter(loc => loc.is_active !== false);
        setLocations(activeLocations);
        setRetryCount(0);
        setIsLoading(false);
        return;
      }

      // Add delay between retries and initial load to prevent rate limiting
      if (retry > 0) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retry) * 2000)); // 2s, 4s, 8s
      } else {
        await new Promise(resolve => setTimeout(resolve, 500)); // Initial delay
      }
      
      const data = await Location.list("-created_date");
      const activeLocations = data.filter(loc => loc.is_active !== false);
      
      // Update cache
      locationsCache = data;
      cacheTimestamp = Date.now();
      
      setLocations(activeLocations);
      setRetryCount(0);
    } catch (error) {
      console.error("Error loading locations:", error);
      
      if (error.response?.status === 429) {
        setError("השרת עמוס מדי כרגע. אנא המתן מעט ונסה שוב.");
      } else {
        setError(error.message || "שגיאה בטעינת המידע");
      }
      
      // Auto retry up to 2 times for 429 errors (less aggressive)
      if (retry < 2 && (error.response?.status === 429 || !error.response)) {
        const delay = Math.pow(2, retry + 2) * 1000; // 4s, 8s
        setTimeout(() => {
          setRetryCount(retry + 1);
          loadLocations(retry + 1);
        }, delay);
      }
    }
    setIsLoading(false);
  };

  const retryLoad = () => {
    setRetryCount(0);
    loadLocations();
  };

  const filterAndSortLocations = () => {
    let filtered = locations;

    // Enhanced search - fuzzy matching and keyword search
    if (searchTerm) {
      const searchWords = searchTerm.toLowerCase().split(' ').filter(word => word.length > 0);
      
      filtered = filtered.filter(location => {
        const searchableText = [
          location.name,
          location.full_story?.title || '',
          location.full_story?.content || '',
          ...(location.search_keywords || [])
        ].join(' ').toLowerCase();

        // Check if any search word matches
        return searchWords.some(word => {
          // Exact match
          if (searchableText.includes(word)) return true;
          
          // Fuzzy match - allow single character differences
          const words = searchableText.split(' ');
          return words.some(textWord => {
            if (Math.abs(textWord.length - word.length) > 1) return false;
            
            let differences = 0;
            const maxLen = Math.max(textWord.length, word.length);
            
            for (let i = 0; i < maxLen; i++) {
              if (textWord[i] !== word[i]) differences++;
              if (differences > 1) return false;
            }
            return true;
          });
        });
      });
    }

    // Filter by category
    if (categoryFilter !== "הכל") {
      filtered = filtered.filter(location => location.category === categoryFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name, "he");
        case "views":
          return (b.view_count || 0) - (a.view_count || 0);
        case "recent":
          return new Date(b.created_date) - new Date(a.created_date);
        default:
          return 0;
      }
    });

    setFilteredLocations(filtered);
  };

  // Throttled view count update
  const viewCountUpdateQueue = new Set();
  const incrementViewCount = async (locationId) => {
    // Prevent duplicate updates
    if (viewCountUpdateQueue.has(locationId)) return;
    
    try {
      viewCountUpdateQueue.add(locationId);
      
      // Throttle view count updates
      const lastUpdate = localStorage.getItem(`viewUpdate_${locationId}`);
      const now = Date.now();
      
      if (!lastUpdate || now - parseInt(lastUpdate) > 60000) { // 1 minute throttle
        const location = locations.find(l => l.id === locationId);
        if (location) {
          await Location.update(locationId, {
            view_count: (location.view_count || 0) + 1
          });
          localStorage.setItem(`viewUpdate_${locationId}`, now.toString());
          
          setLocations(prev => 
            prev.map(loc => 
              loc.id === locationId 
                ? { ...loc, view_count: (loc.view_count || 0) + 1 }
                : loc
            )
          );
        }
      }
    } catch (error) {
      // Silently fail - view count is not critical
      console.log("Could not update view count:", error);
    } finally {
      viewCountUpdateQueue.delete(locationId);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#222222] mb-4">
            חיפוש מקומות
          </h1>
          <p className="text-lg text-[#555555] max-w-2xl mx-auto">
            חפש ומצא מידע על המקומות שנפגעו ביום 7 באוקטובר 2023
          </p>
        </div>

        {/* Error State */}
        {error && (
          <Card className="mb-8 bg-red-50 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-500" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-800 mb-1">שגיאה בטעינת המידע</h3>
                  <p className="text-red-600 text-sm">{error}</p>
                  {retryCount > 0 && retryCount <= 2 && (
                    <p className="text-red-500 text-xs mt-1">מנסה שוב... ניסיון {retryCount}/2</p>
                  )}
                </div>
                <Button 
                  onClick={retryLoad}
                  variant="outline" 
                  size="sm"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                  disabled={isLoading}
                >
                  נסה שוב
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters - Only show if not in critical error state */}
        {(!error || locations.length > 0 || isLoading) && (
          <Card className="mb-8 bg-white border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#555555] w-5 h-5" />
                  <Input
                    placeholder="חפש לפי שם מקום, תיאור או מילות מפתח..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-12 text-lg py-6 border-[#F5F5F5] focus:border-[#1E3A5F] text-[#222222]"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-[#555555]" />
                    <span className="text-sm text-[#555555]">סינון:</span>
                  </div>
                  
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="md:w-48 border-[#F5F5F5] focus:border-[#1E3A5F] [&>span]:text-right">
                      <SelectValue placeholder="סוג מקום" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-[#F5F5F5]">
                      <SelectItem value="הכל">כל הסוגים</SelectItem>
                      <SelectItem value="יישוב">יישובים</SelectItem>
                      <SelectItem value="בסיס צבאי">בסיסי צבא</SelectItem>
                      <SelectItem value="אירוע">אירועים</SelectItem>
                      <SelectItem value="מקום אחר">מקומות אחרים</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="md:w-48 border-[#F5F5F5] focus:border-[#1E3A5F] [&>span]:text-right">
                      <SelectValue placeholder="מיין לפי" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-[#F5F5F5]">
                      <SelectItem value="name">שם המקום</SelectItem>
                      <SelectItem value="views">מספר צפיות</SelectItem>
                      <SelectItem value="recent">הוספה אחרונה</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Header */}
        {(!error || locations.length > 0 || isLoading) && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[#222222]">
              {isLoading ? "טוען..." : `נמצאו ${filteredLocations.length} מקומות`}
            </h2>
            
            {searchTerm && (
              <div className="text-sm text-[#555555]">
                תוצאות חיפוש עבור: <span className="font-semibold text-[#2C5E9E]">"{searchTerm}"</span>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <Card key={i} className="animate-pulse bg-white">
                <div className="aspect-video bg-[#F5F5F5]"></div>
                <CardContent className="p-6">
                  <div className="h-4 bg-[#F5F5F5] rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-[#F5F5F5] rounded w-1/2 mb-4"></div>
                  <div className="h-3 bg-[#F5F5F5] rounded w-full mb-2"></div>
                  <div className="h-3 bg-[#F5F5F5] rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error && locations.length === 0 ? (
          // Critical error state
          <div className="text-center py-16">
            <AlertCircle className="w-24 h-24 text-red-400 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-[#222222] mb-2">
              לא ניתן לטעון את המידע
            </h3>
            <p className="text-[#555555] mb-6">
              אירעה שגיאה בטעינת רשימת המקומות. אנא נסה שוב מאוחר יותר.
            </p>
            <Button
              onClick={retryLoad}
              className="bg-[#1E3A5F] hover:bg-[#2C5E9E] text-white"
            >
              נסה שוב
            </Button>
          </div>
        ) : filteredLocations.length === 0 && locations.length > 0 ? (
          // No results due to filtering
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-[#F5F5F5] rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-[#555555]" />
            </div>
            <h3 className="text-xl font-semibold text-[#222222] mb-2">
              לא נמצאו תוצאות
            </h3>
            <p className="text-[#555555] mb-6">
              נסה לשנות את מונחי החיפוש או הסר חלק מהסינונים
            </p>
            <Button
              variant="outline"
              className="border-[#1E3A5F] text-[#1E3A5F] hover:bg-[#F5F5F5]"
              onClick={() => {
                setSearchTerm("");
                setCategoryFilter("הכל");
              }}
            >
              נקה חיפוש
            </Button>
          </div>
        ) : (
          // Display results
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLocations.map((location) => (
              <Card key={location.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden bg-white border-0">
                {/* Image - Clickable */}
                <Link 
                  to={createPageUrl(`Location?id=${location.id}`)}
                  onClick={() => incrementViewCount(location.id)}
                >
                  <div className="aspect-video relative overflow-hidden cursor-pointer">
                    {location.main_image ? (
                      <img
                        src={location.main_image}
                        alt={location.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#F5F5F5] flex items-center justify-center">
                        <MapPin className="w-12 h-12 text-[#555555]" />
                      </div>
                    )}
                    
                    {/* Overlay Badge */}
                    <div className="absolute top-3 right-3">
                      <Badge 
                        variant="outline" 
                        className={`${categoryColors[location.category]} bg-white/90 backdrop-blur-sm`}
                      >
                        {location.category}
                      </Badge>
                    </div>
                  </div>
                </Link>

                {/* Content */}
                <CardContent className="p-6">
                  <Link 
                    to={createPageUrl(`Location?id=${location.id}`)}
                    onClick={() => incrementViewCount(location.id)}
                    className="hover:text-[#2C5E9E] transition-colors"
                  >
                    <h3 className="text-xl font-semibold text-[#222222] mb-2 group-hover:text-[#2C5E9E] transition-colors">
                      {location.name}
                    </h3>
                  </Link>
                  
                  {location.full_story?.title && (
                    <p className="text-[#555555] text-sm mb-4 line-clamp-3">
                      {location.full_story.title}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link 
                      to={createPageUrl(`Location?id=${location.id}`)}
                      className="flex-1"
                      onClick={() => incrementViewCount(location.id)}
                    >
                      <Button className="w-full bg-gradient-to-r from-[#1E3A5F] to-[#2C5E9E] hover:from-[#2C5E9E] hover:to-[#3B82F6] text-white text-sm rounded-lg py-3 shadow-md hover:shadow-lg transition-all duration-200">
                        <BookOpen className="w-4 h-4 ml-2" />
                        גלה עוד
                      </Button>
                    </Link>
                    <Link 
                      to={createPageUrl(`Map?focus=${location.id}`)}
                      className="flex-1"
                    >
                      <Button variant="outline" className="w-full text-sm border-[#1E3A5F] text-[#1E3A5F] hover:bg-[#F5F5F5] rounded-lg py-3 transition-all duration-200">
                        <MapPin className="w-4 h-4 ml-2" />
                        הצג במפה
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Load More info */}
        {!isLoading && !error && filteredLocations.length > 0 && (
          <div className="text-center mt-12">
            <p className="text-[#555555]">
              {filteredLocations.length === 1 
                ? "מקום אחד נמצא" 
                : `${filteredLocations.length} מקומות נמצאו`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}