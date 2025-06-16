import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';

interface LocationProperties {
  [key: string]: any;
}

interface TooltipState {
  location: LocationProperties;
  x: number;
  y: number;
}

interface LocationTooltipProps {
  tooltipState: TooltipState | null;
}

const getCategoryColor = (dataType: string): string => {
  if (dataType === 'strikes') return 'bg-red-700';
  return 'bg-orange-500';
};

const getImportantProperties = (location: LocationProperties) => {
  const dataType = location.dataType;
  const importantData: { [key: string]: any } = {};

  if (dataType === 'strikes') {
    if (location.Date) importantData['تاریخ'] = location.Date;
    if (location.Data_Type) importantData['نوع حمله'] = location.Data_Type;
    if (location.City) importantData['شهر'] = location.City;
    if (location.Province) importantData['استان'] = location.Province;
    if (location.Confidence) importantData['سطح اطمینان'] = location.Confidence;
    if (location.Actor) importantData['عامل'] = location.Actor;
  } else {
    if (location.Map_Icon) importantData['نوع سایت'] = location.Map_Icon;
    if (location.Branch_Art) importantData['شاخه نظامی'] = location.Branch_Art;
    if (location.CityBody) importantData['شهر'] = location.CityBody;
    if (location.Provincial) importantData['استان'] = location.Provincial;
  }

  return importantData;
};

const LocationTooltip: React.FC<LocationTooltipProps> = ({ tooltipState }) => {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateWindowSize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateWindowSize();
    window.addEventListener('resize', updateWindowSize);
    return () => window.removeEventListener('resize', updateWindowSize);
  }, []);

  if (!tooltipState || windowSize.width === 0) return null;

  const { location, x, y } = tooltipState;

  const isMobile = windowSize.width < 768;
  const tooltipWidth = isMobile ? Math.min(280, windowSize.width - 32) : 320;
  const importantProps = getImportantProperties(location);
  const tooltipHeight = Math.min(isMobile ? 400 : 500, Object.keys(importantProps).length * 50 + 250);
  const padding = isMobile ? 16 : 24;

  let adjustedX = x + 15;
  let adjustedY = y - tooltipHeight / 2;

  if (isMobile) {
    adjustedX = (windowSize.width - tooltipWidth) / 2;
    adjustedY = Math.max(padding, Math.min(y - tooltipHeight / 2, windowSize.height - tooltipHeight - padding));
  } else {
    // Desktop positioning
    if (adjustedX + tooltipWidth > windowSize.width - padding) {
      adjustedX = x - tooltipWidth - 15;
    }

    if (adjustedY < padding) {
      adjustedY = padding;
    } else if (adjustedY + tooltipHeight > windowSize.height - padding) {
      adjustedY = windowSize.height - tooltipHeight - padding;
    }
  }

  adjustedX = Math.max(padding, Math.min(adjustedX, windowSize.width - tooltipWidth - padding));
  adjustedY = Math.max(padding, Math.min(adjustedY, windowSize.height - tooltipHeight - padding));

  const name = location.name || 'نامشخص';
  const dataType = location.dataType;
  const description = location.description || '';
  const categoryLabel = dataType === 'strikes' ? 'حمله تایید شده' : 'سایت نظامی/غیرنظامی';

  return (
    <div 
      className={`fixed bg-white rounded-2xl shadow-2xl z-50 border border-gray-200 pointer-events-none transition-all duration-200 ease-out ${
        isMobile ? 'p-4' : 'p-5'
      }`}
      style={{
        left: `${adjustedX}px`,
        top: `${adjustedY}px`,
        width: `${tooltipWidth}px`,
        maxHeight: `${tooltipHeight}px`,
        transform: 'scale(1)',
        animation: 'tooltipFadeIn 0.3s ease-out',
        direction: 'rtl'
      }}
    >
      <style>{`
        @keyframes tooltipFadeIn {
          from {
            opacity: 0;
            transform: scale(0.85) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
      
      <div className={`${isMobile ? 'mb-3' : 'mb-4'}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`font-bold text-gray-900 persian-text leading-tight ${
            isMobile ? 'text-base' : 'text-lg'
          }`}>{name}</h3>
          <MapPin className={`text-gray-400 flex-shrink-0 ml-2 ${
            isMobile ? 'w-4 h-4' : 'w-5 h-5'
          }`} />
        </div>
        <div className="flex items-center justify-start">
          <span className={`inline-flex items-center px-3 py-1 rounded-full font-semibold text-white shadow-sm ${getCategoryColor(dataType)} ${
            isMobile ? 'text-xs' : 'text-xs'
          }`}>
            {categoryLabel}
          </span>
        </div>
      </div>
      
      {description && (
        <div className={`${isMobile ? 'mb-3' : 'mb-4'}`}>
          <p className={`text-gray-600 leading-relaxed persian-text ${
            isMobile ? 'text-xs' : 'text-sm'
          }`}>
            {description}
          </p>
        </div>
      )}
      
      {Object.keys(importantProps).length > 0 && (
        <div className={`border-t ${isMobile ? 'pt-2 space-y-1' : 'pt-3 space-y-2'}`}>
          {Object.entries(importantProps).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center py-1">
              <span className={`text-gray-900 persian-text font-medium ${
                isMobile ? 'text-xs' : 'text-sm'
              }`}>{String(value)}</span>
              <span className={`font-medium text-gray-500 persian-text ${
                isMobile ? 'text-xs' : 'text-sm'
              }`}>:{key}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationTooltip;