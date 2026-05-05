import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Plus, ChevronDown, ChevronUp } from "lucide-react";

export default function RouteNotIncluded({ locations, locName, locStoryTitle, onAdd, t }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (locations.length === 0) return null;

  return (
    <div className="mt-6">
      <button
        onClick={() => setIsExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-dashed border-[#D0D5DD] hover:border-[#1D4E8F] text-sm text-[#555E6D] hover:text-[#1D4E8F] transition-colors"
      >
        <span className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {t('route.notInRoute')} ({locations.length})
        </span>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-2">
          <p className="text-xs text-[#555E6D] px-1 pb-1">{t('route.notInRouteHint')}</p>
          {locations.map(location => (
            <Card key={location.id} className="bg-white border-0 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-[#F2F2F2]">
                    {location.main_image
                      ? <img src={location.main_image} alt={location.name} className="w-full h-full object-cover" loading="lazy" />
                      : <div className="w-full h-full flex items-center justify-center"><MapPin className="w-4 h-4 text-[#555E6D]" /></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1A1A1A] truncate">{locName(location)}</p>
                    <p className="text-xs text-[#555E6D] truncate">{locStoryTitle(location) || location.category}</p>
                  </div>
                  <Button size="sm" onClick={() => onAdd(location)}
                    className="bg-[#1D4E8F] hover:bg-[#2560B0] text-white text-xs h-8 shrink-0 gap-1">
                    <Plus className="w-3 h-3" />
                    {t('route.addToRoute')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
