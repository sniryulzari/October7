import { Fragment } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, MapPin, Navigation, Info, CheckCircle2, Circle, X } from "lucide-react";
import { createPageUrl } from "@/utils";
import { makeGoogleMapsNavUrl } from "@/utils/geo";

export default function RouteStopCard({
  location, index, distFromPrev, driveMinutes, recommendedTime,
  isVisited, locName, locStoryTitle, onToggleVisited, onRemove, onIncrementViewCount, t,
}) {
  return (
    <Fragment>
      {index > 0 && distFromPrev > 0 && (
        <div className="flex items-center gap-2 px-3 py-0.5">
          <div className="w-px h-4 bg-[#D0D5DD] mx-[19px]" />
          <span className="text-xs text-[#555E6D]">
            <Car className="w-3 h-3 inline ml-1" />
            {Math.round(distFromPrev)} {t('route.km')} — {driveMinutes} {t('route.minutes')} נסיעה
          </span>
        </div>
      )}

      <Card className={`bg-white hover:shadow-md transition-shadow overflow-hidden ${isVisited ? 'border-2 border-green-400' : 'border-0 shadow-sm'}`}>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm ${isVisited ? 'bg-green-500' : 'bg-[#1D4E8F]'}`}>
                {isVisited ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <Link to={createPageUrl(`Location?id=${location.id}`)}
                  onClick={() => onIncrementViewCount(location.id)}
                  className="flex-1 hover:text-[#2560B0] transition-colors">
                  <h3 className="text-base font-semibold text-[#1A1A1A] leading-tight">{locName(location)}</h3>
                </Link>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => onToggleVisited(location.id)}
                    title={t('route.markVisited')}
                    className={`p-1 h-auto ${isVisited ? 'text-green-600' : 'text-[#555E6D] hover:text-green-600'}`}>
                    {isVisited ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onRemove(location.id)}
                    className="p-1 h-auto text-[#555E6D] hover:text-red-500">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <p className="text-sm text-[#555E6D] mb-2 leading-relaxed line-clamp-2">
                {locStoryTitle(location) || t('route.defaultStory')}
              </p>

              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge variant="outline" className="text-xs border-[#1D4E8F] text-[#1D4E8F] px-2">
                  {location.category}
                </Badge>
                <span className="text-xs text-[#1D4E8F] font-medium">⏱ {recommendedTime} {t('route.minutes')}</span>
                {location.audio_file && <span className="text-xs text-purple-600">🎧 הקלטה</span>}
              </div>

              <div className="flex gap-2">
                <Link to={createPageUrl(`Location?id=${location.id}`)}>
                  <Button size="sm" className="bg-[#1D4E8F] hover:bg-[#2560B0] text-white text-xs h-8">
                    <Info className="w-3 h-3 ml-1" />{t('route.moreInfo')}
                  </Button>
                </Link>
                {location.coordinates && (
                  <Button size="sm" variant="outline"
                    className="border-[#1D4E8F] text-[#1D4E8F] hover:bg-[#F2F2F2] text-xs h-8"
                    onClick={() => window.open(makeGoogleMapsNavUrl(location.coordinates.lat, location.coordinates.lng), '_blank')}>
                    <Navigation className="w-3 h-3 ml-1" />{t('route.navigateTo')}
                  </Button>
                )}
              </div>
            </div>

            <div className="hidden sm:block w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-[#F2F2F2]">
              {location.main_image
                ? <Link to={createPageUrl(`Location?id=${location.id}`)} onClick={() => onIncrementViewCount(location.id)}>
                    <img src={location.main_image} alt={location.name} className="w-full h-full object-cover hover:opacity-80 transition-opacity" loading="lazy" />
                  </Link>
                : <div className="w-full h-full flex items-center justify-center"><MapPin className="w-6 h-6 text-[#555E6D]" /></div>
              }
            </div>
          </div>
        </CardContent>
      </Card>
    </Fragment>
  );
}
