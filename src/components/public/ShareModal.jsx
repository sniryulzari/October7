import { useState, useEffect, useRef } from "react";
import { X, Copy, Check, MessageCircle, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Location } from "@/api/entities";

export default function ShareModal({ isOpen, onClose, locationId, shareText, shareUrl }) {
  const [linkCopied, setLinkCopied] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const prevFocus = document.activeElement;
    modalRef.current?.focus();
    const handleKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      prevFocus?.focus();
    };
  }, [isOpen, onClose]);

  const fallbackCopy = (text) => {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  };

  const copyToClipboard = (text) => {
    const markCopied = () => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(markCopied).catch(() => { fallbackCopy(text); markCopied(); });
    } else {
      fallbackCopy(text);
      markCopied();
    }
  };

  if (!isOpen) return null;

  const handleShareClick = () => {
    Location.incrementShareCount(locationId).catch(() => {});
    onClose();
  };

  return (
    <div
      ref={modalRef}
      tabIndex={-1}
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 outline-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 id="share-modal-title" className="text-lg font-bold text-[#1A1A1A]">שיתוף</h3>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="סגור חלון שיתוף"
            className="p-2 rounded-full text-[#555E6D] hover:bg-[#F2F2F2] focus:outline-2 focus:outline-offset-2 focus:outline-[#1D4E8F]">
            <X className="w-5 h-5" aria-hidden="true" />
          </Button>
        </div>
        <div className="space-y-3">
          <a href={`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-4 w-full p-4 rounded-xl bg-green-50 hover:bg-green-100 transition-colors focus:outline-2 focus:outline-offset-2 focus:outline-[#1D4E8F]"
            onClick={handleShareClick}>
            <div className="w-11 h-11 bg-[#25D366] rounded-full flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
            </div>
            <span className="text-[#1A1A1A] font-medium text-base">שיתוף בווטסאפ</span>
          </a>
          <a href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-4 w-full p-4 rounded-xl bg-sky-50 hover:bg-sky-100 transition-colors focus:outline-2 focus:outline-offset-2 focus:outline-[#1D4E8F]"
            onClick={handleShareClick}>
            <div className="w-11 h-11 bg-[#229ED9] rounded-full flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-[#1A1A1A] font-medium text-base">שיתוף בטלגרם</span>
          </a>
          <a href={`sms:?body=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`}
            className="flex items-center gap-4 w-full p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-2 focus:outline-offset-2 focus:outline-[#1D4E8F]"
            onClick={handleShareClick}>
            <div className="w-11 h-11 bg-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <span className="text-[#1A1A1A] font-medium text-base">שלח ב-SMS</span>
          </a>
          <button onClick={() => copyToClipboard(shareUrl)}
            className="flex items-center gap-4 w-full p-4 rounded-xl bg-[#F2F2F2] hover:bg-gray-200 transition-colors focus:outline-2 focus:outline-offset-2 focus:outline-[#1D4E8F]">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${linkCopied ? "bg-green-500" : "bg-[#1D4E8F]"}`}>
              {linkCopied ? <Check className="w-5 h-5 text-white" /> : <Copy className="w-5 h-5 text-white" />}
            </div>
            <span className="text-[#1A1A1A] font-medium text-base">
              {linkCopied ? "הקישור הועתק!" : "העתק קישור"}
            </span>
          </button>
        </div>
        <p className="text-xs text-[#555E6D] text-center mt-4">
          ניתן להדביק את הקישור באינסטגרם, פייסבוק או כל פלטפורמה אחרת
        </p>
      </div>
    </div>
  );
}
