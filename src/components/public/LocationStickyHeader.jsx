import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Share2 } from "lucide-react";

export default function LocationStickyHeader({ location, locName, onBack, onShare, t }) {
  return (
    <div className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={onBack} variant="ghost" size="sm" aria-label={t("location.back")}
              className="text-[#1D4E8F] hover:bg-[#F2F2F2] p-3 rounded-full">
              <ArrowRight className="w-6 h-6" aria-hidden="true" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#1A1A1A] line-clamp-1">
                {locName(location)}
              </h1>
              {location.category && (
                <Badge className="mt-1 bg-[#F2F2F2] text-[#1D4E8F] border-[#1D4E8F]">
                  {location.category}
                </Badge>
              )}
            </div>
          </div>
          <Button onClick={onShare} variant="ghost" size="sm" aria-label={t("location.share")}
            className="text-[#555E6D] hover:text-[#1D4E8F] hover:bg-[#F2F2F2] p-3 rounded-full">
            <Share2 className="w-5 h-5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
