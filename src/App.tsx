import React, { useState, useCallback } from 'react';
import MapComponent from './components/MapComponent';
import LocationTooltip from './components/LocationTooltip';
import Header from './components/Header';
import Legend from './components/WarningBox';
import LayerFilter, { LayerConfig } from './components/LayerFilter';

interface LocationProperties {
  [key: string]: any;
}

interface TooltipState {
  location: LocationProperties;
  x: number;
  y: number;
}

function App() {
  const [tooltipState, setTooltipState] = useState<TooltipState | null>(null);
  const [warningBoxVisible, setWarningBoxVisible] = useState(true);
  const [isFirstTimeWarning, setIsFirstTimeWarning] = useState(true);
  const [isWarningExpanded, setIsWarningExpanded] = useState(false);

  const [layers, setLayers] = useState<LayerConfig[]>([
    {
      id: 'strikes',
      name: 'حملات تایید شده',
      color: '#b81102',
      visible: true
    },
    {
      id: 'sites',
      name: 'سایت‌های نظامی و غیرنظامی',
      color: '#FF6B35',
      visible: true
    }
  ]);

  const layerVisibility = layers.reduce((acc, layer) => {
    acc[layer.id] = layer.visible;
    return acc;
  }, {} as { [layerId: string]: boolean });

  const handleLocationHover = useCallback((location: LocationProperties | null, mouseEvent?: MouseEvent) => {
    if (location && mouseEvent) {
      setTooltipState({
        location,
        x: mouseEvent.clientX,
        y: mouseEvent.clientY
      });
    } else {
      setTooltipState(null);
      // فقط اگه warning box بسته باشه و tooltip بسته شه، دوباره ظاهرش کن
      if (tooltipState && !location && !warningBoxVisible) {
        setWarningBoxVisible(true);
        setIsWarningExpanded(false); // وقتی دوباره ظاهر میشه، در حالت compact باشه
      }
    }
  }, [tooltipState, warningBoxVisible]);

  const handleMouseMove = useCallback((mouseEvent: MouseEvent) => {
    if (tooltipState) {
      setTooltipState(prev => prev ? {
        ...prev,
        x: mouseEvent.clientX,
        y: mouseEvent.clientY
      } : null);
    }
  }, [tooltipState]);

  const handleCloseWarningBox = useCallback(() => {
    setWarningBoxVisible(false);
    // اولین بار که بسته شد، برای دفعات بعدی حالت compact باشه
    if (isFirstTimeWarning) {
      setIsFirstTimeWarning(false);
    }
    setIsWarningExpanded(false);
  }, [isFirstTimeWarning]);

  const handleExpandWarning = useCallback(() => {
    setIsWarningExpanded(true);
  }, []);

  const handleLayerToggle = useCallback((layerId: string, visible: boolean) => {
    setLayers(prevLayers => 
      prevLayers.map(layer => 
        layer.id === layerId ? { ...layer, visible } : layer
      )
    );
  }, []);

  return (
    <div className="h-screen w-full relative overflow-hidden bg-gray-900">
      <Header />
      
      <div className="h-full w-full">
        <MapComponent 
          onLocationHover={handleLocationHover}
          onMouseMove={handleMouseMove}
          layerVisibility={layerVisibility}
        />
      </div>
      
      <Legend 
        isVisible={warningBoxVisible}
        onClose={handleCloseWarningBox}
        isCompact={!isFirstTimeWarning && !isWarningExpanded}
        onExpand={handleExpandWarning}
      />
      <LayerFilter 
        layers={layers}
        onLayerToggle={handleLayerToggle}
      />
      <LocationTooltip tooltipState={tooltipState} />
      
      {/* Instructions overlay for mobile */}
      <div className="absolute bottom-6 right-6 md:hidden bg-black/60 backdrop-blur-sm rounded-lg p-3 text-white text-xs max-w-48">
        <p>Tap locations to explore and zoom in</p>
      </div>
    </div>
  );
}

export default App;