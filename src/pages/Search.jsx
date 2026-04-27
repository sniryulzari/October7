import React, { useState, useEffect, useRef } from "react";
import { Location } from "@/api/entities";
import { useLanguage } from "@/utils/language";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Eye, BookOpen, AlertCircle, Headphones, Camera, Video } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";

// Global cache for locations to avoid multiple API calls
let locationsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default function SearchPage() {
  const { t, lang, locName, locStoryTitle, locStoryContent } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('q') || "");
  const [categoryFilter, setCategoryFilter] = useState(() => searchParams.get('cat') || "הכל");
  const [sortBy, setSortBy] = useState("name");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const viewCountUpdateQueue = useRef(new Set());
  const retryTimeoutRef = useRef(null);

  useEffect(() => {
    loadLocations();
    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    filterAndSortLocations();
  }, [locations, searchTerm, categoryFilter, sortBy]);

  // Sync search state to URL
  useEffect(() => {
    const params = {};
    if (searchTerm) params.q = searchTerm;
    if (categoryFilter !== "הכל") params.cat = categoryFilter;
    setSearchParams(params, { replace: true });
  }, [searchTerm, categoryFilter]);

  const loadLocations = async (retry = 0) => {
    setIsLoading(true);
    setError(null);

    try {
      if (locationsCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
        setLocations(locationsCache.filter(loc => loc.is_active !== false));
        setRetryCount(0);
        return;
      }

      if (retry > 0) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retry) * 2000));
      }

      const data = await Location.list("-created_date");
      locationsCache = data;
      cacheTimestamp = Date.now();

      setLocations(data.filter(loc => loc.is_active !== false));
      setRetryCount(0);
    } catch (err) {
      console.error("Error loading locations:", err);

      if (err.response?.status === 429) {
        setError("השרת עמוס מדי כרגע. אנא המתן מעט ונסה שוב.");
      } else {
        setError(err.message || "שגיאה בטעינת המידע");
      }

      if (retry < 2 && (err.response?.status === 429 || !err.response)) {
        const delay = Math.pow(2, retry + 2) * 1000;
        retryTimeoutRef.current = setTimeout(() => {
          setRetryCount(retry + 1);
          loadLocations(retry + 1);
        }, delay);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const retryLoad = () => {
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    setRetryCount(0);
    loadLocations();
  };

  const filterAndSortLocations = () => {
    let filtered = locations;

    if (searchTerm) {
      const searchWords = searchTerm.toLowerCase().split(' ').filter(word => word.length > 0);

      filtered = filtered.filter(location => {
        const searchableText = [
          location.name,
          location.name_en || '',
          location.full_story?.title || '',
          location.full_story?.content || '',
          location.full_story_en?.title || '',
          location.full_story_en?.content || '',
          ...(location.search_keywords || [])
        ].join(' ').toLowerCase();

        return searchWords.some(word => {
          if (searchableText.includes(word)) return true;

          // Fuzzy match only for words longer than 4 chars to avoid false positives
          if (word.length <= 4) return false;

          return searchableText.split(' ').some(textWord => {
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

    if (categoryFilter !== "הכל") {
      filtered = filtered.filter(location => location.category === categoryFilter);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":  return a.name.localeCompare(b.name, "he");
        case "views": return (b.view_count || 0) - (a.view_count || 0);
        case "recent": return new Date(b.created_date) - new Date(a.created_date);
        default: return 0;
      }
    });

    setFilteredLocations(filtered);
  };

  const incrementViewCount = async (locationId) => {
    if (viewCountUpdateQueue.current.has(locationId)) return;

    try {
      viewCountUpdateQueue.current.add(locationId);
      const lastUpdate = localStorage.getItem(`viewUpdate_${locationId}`);
      const now = Date.now();

      if (!lastUpdate || now - parseInt(lastUpdate) > 60000) {
        await Location.incrementViewCount(locationId);
        localStorage.setItem(`viewUpdate_${locationId}`, now.toString());
        setLocations(prev =>
          prev.map(loc =>
            loc.id === locationId ? { ...loc, view_count: (loc.view_count || 0) + 1 } : loc
          )
        );
      }
    } catch (err) {
      console.log("Could not update view count:", err);
    } finally {
      viewCountUpdateQueue.current.delete(locationId);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4">
            {t('search.title')}
          </h1>
          <p className="text-lg text-[#6B7280] max-w-2xl mx-auto">
            {t('search.subtitle')}
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

        {/* Search and Filters */}
        {(!error || locations.length > 0 || isLoading) && (
          <Card className="mb-8 bg-white border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6B7280] w-5 h-5" />
                  <Input
                    placeholder={t('search.placeholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-12 text-lg py-6 border-[#F2F2F2] focus:border-[#1D4E8F] text-[#1A1A1A]"
                  />
                </div>

                {/* Category Filter Buttons */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'הכל', label: t('search.allTypes') },
                    { value: 'יישוב', label: t('search.townPlural') },
                    { value: 'מיגונית', label: t('search.shelterPlural') },
                    { value: 'אירוע', label: t('search.eventPlural') },
                    { value: 'מקום אחר', label: t('search.otherPlural') },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setCategoryFilter(value)}
                      className={`px-5 py-3 rounded-full text-base font-medium transition-all border-2 touch-manipulation select-none
                        ${categoryFilter === value
                          ? 'bg-[#1D4E8F] text-white border-[#1D4E8F] shadow-md'
                          : 'bg-white text-[#1D4E8F] border-[#1D4E8F] hover:bg-[#F2F2F2]'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Sort */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm text-[#6B7280]">{t('search.sort')}</span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-44 border-[#F2F2F2] focus:border-[#1D4E8F] [&>span]:text-right">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-[#F2F2F2]">
                      <SelectItem value="name">{t('search.sortName')}</SelectItem>
                      <SelectItem value="views">{t('search.sortViews')}</SelectItem>
                      <SelectItem value="recent">{t('search.sortRecent')}</SelectItem>
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
            <h2 className="text-xl font-semibold text-[#1A1A1A]">
              {isLoading
                ? t('search.loading')
                : filteredLocations.length === 1
                  ? t('search.foundOne')
                  : t('search.foundMany').replace('{count}', filteredLocations.length)
              }
            </h2>

            {searchTerm && (
              <div className="text-sm text-[#6B7280]">
                {t('search.resultsFor')} <span className="font-semibold text-[#2560B0]">&ldquo;{searchTerm}&rdquo;</span>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <Card key={i} className="animate-pulse bg-white">
                <div className="aspect-video bg-[#F2F2F2]"></div>
                <CardContent className="p-6">
                  <div className="h-4 bg-[#F2F2F2] rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-[#F2F2F2] rounded w-1/2 mb-4"></div>
                  <div className="h-3 bg-[#F2F2F2] rounded w-full mb-2"></div>
                  <div className="h-3 bg-[#F2F2F2] rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error && locations.length === 0 ? (
          <div className="text-center py-16">
            <AlertCircle className="w-24 h-24 text-red-400 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">
              {t('search.cannotLoad')}
            </h3>
            <p className="text-[#6B7280] mb-6">{t('search.tryLater')}</p>
            <Button
              onClick={retryLoad}
              className="bg-[#1D4E8F] hover:bg-[#2560B0] text-white"
            >
              {t('search.tryAgain')}
            </Button>
          </div>
        ) : filteredLocations.length === 0 && locations.length > 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-[#F2F2F2] rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-[#6B7280]" />
            </div>
            <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">
              {t('search.noResults')}
            </h3>
            <p className="text-[#6B7280] mb-6">{t('search.noResultsHint')}</p>
            <Button
              variant="outline"
              className="border-[#1D4E8F] text-[#1D4E8F] hover:bg-[#F2F2F2]"
              onClick={() => { setSearchTerm(""); setCategoryFilter("הכל"); }}
            >
              {t('search.clearSearch')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLocations.map((location) => (
              <Card key={location.id} className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden bg-white border-0">
                {/* Image */}
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
                      <div className="w-full h-full bg-gradient-to-br from-[#1E3A5F] to-[#2560B0] flex flex-col items-center justify-center gap-2">
                        <MapPin className="w-10 h-10 text-white/40" />
                        <span className="text-white/70 text-sm font-medium text-center px-6 line-clamp-2">{location.name}</span>
                      </div>
                    )}

                    {location.view_count > 0 && (
                      <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                        <Eye className="w-3 h-3" />
                        <span>{location.view_count.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Content */}
                <CardContent className="p-5">
                  <Link
                    to={createPageUrl(`Location?id=${location.id}`)}
                    onClick={() => incrementViewCount(location.id)}
                    className="hover:text-[#2560B0] transition-colors"
                  >
                    <h3 className="text-lg font-bold text-[#1A1A1A] mb-0.5 group-hover:text-[#2560B0] transition-colors">
                      {locName(location)}
                    </h3>
                  </Link>

                  {/* Category */}
                  <p className="text-xs text-[#9CA3AF] mb-3">{t(`category.${location.category}`)}</p>

                  {/* Story title */}
                  {locStoryTitle(location) && (
                    <p className="text-[#6B7280] text-sm font-medium mb-2 line-clamp-1">
                      {locStoryTitle(location)}
                    </p>
                  )}

                  {/* Story excerpt */}
                  {locStoryContent(location) && (
                    <p className="text-[#9CA3AF] text-sm mb-3 line-clamp-2 leading-relaxed">
                      {locStoryContent(location)}
                    </p>
                  )}

                  {/* Content type indicators */}
                  {(location.audio_file || location.gallery?.length > 0 || location.videos?.length > 0) && (
                    <div className="flex items-center gap-2 mb-4">
                      {location.audio_file && (
                        <span className="flex items-center gap-1 text-xs text-[#6B7280] bg-[#F2F2F2] px-2 py-1 rounded-full">
                          <Headphones className="w-3 h-3" />
                          {t('search.audio')}
                        </span>
                      )}
                      {location.gallery?.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-[#6B7280] bg-[#F2F2F2] px-2 py-1 rounded-full">
                          <Camera className="w-3 h-3" />
                          {location.gallery.length}
                        </span>
                      )}
                      {location.videos?.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-[#6B7280] bg-[#F2F2F2] px-2 py-1 rounded-full">
                          <Video className="w-3 h-3" />
                          {location.videos.length}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Link
                      to={createPageUrl(`Location?id=${location.id}`)}
                      className="flex-1"
                      onClick={() => incrementViewCount(location.id)}
                    >
                      <Button className="w-full bg-[#1D4E8F] hover:bg-[#2560B0] text-white">
                        <BookOpen className="w-4 h-4 ml-2" />
                        {t('search.discoverMore')}
                      </Button>
                    </Link>
                    <Link to={createPageUrl(`Map?focus=${location.id}`)}>
                      <Button variant="outline" className="border-[#1D4E8F] text-[#1D4E8F] hover:bg-[#F2F2F2] flex-shrink-0 gap-1.5 px-3">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{t('search.showOnMap')}</span>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
