export default function RouteModeSelector({ allLocations, routeMode, hoursBudget, onApplyMode, t }) {
  if (allLocations.length === 0) return null;

  return (
    <div className="mt-6 pt-5 border-t border-[#EBEBEB]">
      <p className="text-sm font-medium text-[#1A1A1A] mb-3">{t('route.mode.label')}</p>
      <div className="flex flex-wrap gap-2 items-center">
        {[
          { id: 'essential',   labelKey: 'route.mode.essential',   descKey: 'route.mode.essentialDesc',   dot: 'bg-red-500'   },
          { id: 'recommended', labelKey: 'route.mode.recommended', descKey: 'route.mode.recommendedDesc', dot: 'bg-[#1D4E8F]' },
          { id: 'full',        labelKey: 'route.mode.full',        descKey: 'route.mode.fullDesc',        dot: 'bg-[#6B7280]' },
          { id: 'custom',      labelKey: 'route.mode.custom',      descKey: null,                         dot: 'bg-amber-500' },
        ].map(({ id, labelKey, descKey, dot }) => {
          const active = routeMode === id;
          return (
            <button key={id} onClick={() => onApplyMode(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                active ? 'bg-[#1D4E8F] text-white border-[#1D4E8F]'
                       : 'bg-white text-[#444] border-[#D0D5DD] hover:border-[#1D4E8F] hover:text-[#1D4E8F]'
              }`}>
              <span className={`w-2 h-2 rounded-full shrink-0 ${active ? 'bg-white' : dot}`} />
              {t(labelKey)}
              {descKey && <span className={`text-xs ${active ? 'text-blue-200' : 'text-[#555E6D]'}`}> — {t(descKey)}</span>}
            </button>
          );
        })}
      </div>

      {routeMode === 'custom' && (
        <div className="mt-4 max-w-sm">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-[#555E6D]">{t('route.mode.budgetLabel')}</span>
            <span className="font-semibold text-[#1D4E8F]">{hoursBudget} {t('route.mode.hours')}</span>
          </div>
          <input type="range" min={2} max={9} step={0.5} value={hoursBudget}
            onChange={e => onApplyMode('custom', parseFloat(e.target.value))}
            className="w-full accent-[#1D4E8F] cursor-pointer" />
          <div className="flex justify-between text-xs text-[#555E6D] mt-1">
            <span>2 {t('route.mode.hours')}</span>
            <span>9 {t('route.mode.hours')}</span>
          </div>
        </div>
      )}

      {routeMode === 'essential' && !allLocations.some(l => l.priority === 'essential') && (
        <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 max-w-lg">
          💡 {t('route.mode.noPriorityHint')}
        </p>
      )}

      <p className="mt-3 text-xs text-[#555E6D]">
        {t('route.customizeHint')}
      </p>
    </div>
  );
}
