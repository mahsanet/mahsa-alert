import React, { useState, useCallback } from 'react';
import MapComponent from './components/MapComponent';
import LocationTooltip from './components/LocationTooltip';
import Header from './components/Header';
import Legend from './components/WarningBox';
import LayerFilter, { LayerConfig } from './components/LayerFilter';
import ThemeToggle from './components/ThemeToggle';
import LocateButton from './components/LocateButton';
import ProximityAlert from './components/ProximityAlert';
import type { LocationData } from './utils/locationProximity';

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
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [shouldZoomToEvac, setShouldZoomToEvac] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationData, setLocationData] = useState<LocationData>({});

  const [layers, setLayers] = useState<LayerConfig[]>([
        {
      id: 'strikes',
      name: 'حملات تایید شده',
      color: '#b81102',
      visible: true
    },
    {
      id: 'sites',
      name: 'پایگاه‌های موشکی',
      color: '#ff9100',
      visible: true
    },
    {
      id: 'nuclear',
      name: 'مراکز هسته‌ای',
      color: '#ff9100',
      visible: true
    },
    {
      id: 'evac',
      name: 'مناطق تخلیه',
      color: '#ff0000',
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
      setTimeout(() => {
        const tooltipElement = document.querySelector('[data-tooltip="true"]');
        if (!tooltipElement || !tooltipElement.matches(':hover')) {
          setTooltipState(null);
          
          if (tooltipState && !location && !warningBoxVisible) {
            setWarningBoxVisible(true);
            setIsWarningExpanded(false); 
          }
        }
      }, 50);
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
    
    // Zoom to evacuation area when evac layer is turned on
    if (layerId === 'evac' && visible) {
      setShouldZoomToEvac(true);
      // Reset zoom trigger after a delay
      setTimeout(() => setShouldZoomToEvac(false), 100);
    }
  }, []);

  const handleThemeToggle = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  const handleLocationFound = useCallback((coords: { lat: number; lng: number }) => {
    setUserLocation(coords);
  }, []);

  const handleDataSourcesLoad = useCallback((dataSources: LocationData) => {
    setLocationData(dataSources);
  }, []);

  return (
    <div className={`h-screen w-full relative overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <Header />
      <ThemeToggle isDarkMode={isDarkMode} onToggle={handleThemeToggle} />
      
      <div className="h-full w-full">
        <MapComponent 
          onLocationHover={handleLocationHover}
          onMouseMove={handleMouseMove}
          layerVisibility={layerVisibility}
          isDarkMode={isDarkMode}
          shouldZoomToEvac={shouldZoomToEvac}
          userLocation={userLocation}
          onDataSourcesLoad={handleDataSourcesLoad}
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
      <LocateButton 
        onLocationFound={handleLocationFound}
        isDarkMode={isDarkMode}
      />
      <ProximityAlert 
        userLocation={userLocation}
        locationData={locationData}
        isDarkMode={isDarkMode}
      />
      <LocationTooltip 
        tooltipState={tooltipState} 
        onClose={() => setTooltipState(null)}
      />
      
      {/* Instructions overlay for mobile */}
      <div className="absolute bottom-6 right-6 md:hidden bg-black/60 backdrop-blur-sm rounded-lg p-3 text-white text-xs max-w-48">
        <p>Tap locations to explore and zoom in</p>
      </div>
    </div>
  );
}

export default App;