import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface LocationProperties {
  [key: string]: any;
}

interface MapComponentProps {
  onLocationHover: (location: LocationProperties | null, mouseEvent?: MouseEvent) => void;
  onMouseMove: (mouseEvent: MouseEvent) => void;
  layerVisibility: { [layerId: string]: boolean };
}

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
};

const parseCSVToGeoJSON = (csvText: string, dataType: 'strikes' | 'sites') => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return { type: 'FeatureCollection' as const, features: [] };
  
  const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, ''));
  
  const features = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCSVLine(line).map(v => v.replace(/"/g, ''));
    
    if (values.length < headers.length - 2) continue; // Allow some flexibility
    
    const properties: any = {};
    headers.forEach((header, index) => {
      properties[header] = values[index] || '';
    });
    
    let lat, lng, name, description;
    
    if (dataType === 'strikes') {
      lat = parseFloat(properties.Latitude || properties.latitude || '0');
      lng = parseFloat(properties.Longitude || properties.longitude || '0');
      name = properties.Targeted_S || properties.City || properties.Province || 'نامشخص';
      description = properties.SIGACT || properties.Data_Type || '';
    } else {
      lat = parseFloat(properties.Latitude || properties.latitude || '0');
      lng = parseFloat(properties.Longitude || properties.longitude || '0');
      name = properties.Site || properties.name || properties.CityBody || 'نامشخص';
      description = properties.Branch_Art || properties.Map_Icon || '';
    }
    
    if (lat && lng && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      features.push({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [lng, lat]
        },
        properties: {
          ...properties,
          name,
          description,
          dataType
        }
      });
    }
  }
  
  return {
    type: 'FeatureCollection' as const,
    features
  };
};

const MapComponent: React.FC<MapComponentProps> = ({ onLocationHover, onMouseMove, layerVisibility }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const onLocationHoverRef = useRef(onLocationHover);
  const onMouseMoveRef = useRef(onMouseMove);

  useEffect(() => {
    onLocationHoverRef.current = onLocationHover;
    onMouseMoveRef.current = onMouseMove;
  }, [onLocationHover, onMouseMove]);

  useEffect(() => {
    if (!map.current) return;

    Object.entries(layerVisibility).forEach(([layerId, visible]) => {
      const layerIds = [`${layerId}-circle`, `${layerId}-label`];
      
      layerIds.forEach(id => {
        if (map.current?.getLayer(id)) {
          map.current.setLayoutProperty(
            id, 
            'visibility', 
            visible ? 'visible' : 'none'
          );
        }
      });
    });
  }, [layerVisibility]);

  useEffect(() => {
    if (map.current) return;

    if (!mapContainer.current) return;

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
          sources: {
            'carto-dark': {
              type: 'raster',
              tiles: [
                'https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png'
              ],
              tileSize: 256,
              attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
            }
          },
          layers: [
            {
              id: 'background',
              type: 'background',
              paint: {
                'background-color': '#242f3e'
              }
            },
            {
              id: 'carto-dark-layer',
              type: 'raster',
              source: 'carto-dark',
              minzoom: 0,
              maxzoom: 20
            }
          ]
        },
        center: [53.6880, 32.4279],
        zoom: 4.7,
        pitch: 0,
        bearing: 0,
      });

      map.current.on('load', async () => {
        if (!map.current) return;

        try {
          
          let strikesResponse, sitesResponse, iranBorderResponse;
          
          try {
            [strikesResponse, sitesResponse, iranBorderResponse] = await Promise.all([
              fetch('https://dataviz.nbcnews.com/projects/20250613-iran-strikes-locations/data/strikes-confirmed-latest.csv'),
              fetch('https://dataviz.nbcnews.com/projects/20250613-iran-strikes-locations/data/iran-military-and-civilian-sites.csv'),
              fetch('/iran-border.geojson')
            ]);
          } catch (error) {
            [strikesResponse, sitesResponse, iranBorderResponse] = await Promise.all([
              fetch('/strikes-confirmed-latest.csv'),
              fetch('/iran-military-and-civilian-sites.csv'),
              fetch('/iran-border.geojson')
            ]);
          }

          if (!strikesResponse.ok || !sitesResponse.ok || !iranBorderResponse.ok) {
            throw new Error('Failed to load data');
          }

          const [strikesCSV, sitesCSV, iranBorderData] = await Promise.all([
            strikesResponse.text(),
            sitesResponse.text(),
            iranBorderResponse.json()
          ]);

          const strikesGeoJSON = parseCSVToGeoJSON(strikesCSV, 'strikes');
          const sitesGeoJSON = parseCSVToGeoJSON(sitesCSV, 'sites');


          
          map.current.addSource('strikes', {
            type: 'geojson',
            data: strikesGeoJSON,
          });

          map.current.addSource('sites', {
            type: 'geojson',
            data: sitesGeoJSON,
          });


          map.current.addSource('iran-border', {
            type: 'geojson',
            data: iranBorderData,
          });

          map.current.addLayer({
            id: 'iran-border-fill',
            type: 'fill',
            source: 'iran-border',
            paint: {
              'fill-color': 'rgba(255, 0, 0, 0.1)',
              'fill-opacity': 0.2,
            },
          });

          map.current.addLayer({
            id: 'iran-border-line',
            type: 'line',
            source: 'iran-border',
            paint: {
              'line-color': '#FF0000',
              'line-width': 3,
              'line-opacity': 0.8,
            },
          });

          map.current.addLayer({
            id: 'strikes-circle',
            type: 'circle',
            source: 'strikes',
            paint: {
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                3, 8,
                10, 16
              ],
              'circle-color': '#b81102', 
              'circle-stroke-width': 2,
              'circle-stroke-color': '#FFFFFF',
              'circle-opacity': 0.8,
            },
          });

          map.current.addLayer({
            id: 'sites-circle',
            type: 'circle',
            source: 'sites',
            paint: {
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                3, 6,
                10, 12
              ],
              'circle-color': '#FF6B35', 
              'circle-stroke-width': 2,
              'circle-stroke-color': '#FFFFFF',
              'circle-opacity': 0.8,
            },
          });

          map.current.addLayer({
            id: 'strikes-label',
            type: 'symbol',
            source: 'strikes',
            layout: {
              'text-field': ['get', 'name'],
              'text-offset': [0, 1.5],
              'text-anchor': 'top',
              'text-size': [
                'interpolate',
                ['linear'],
                ['zoom'],
                2, 11,
                10, 16
              ],
              'text-allow-overlap': false,
              'text-writing-mode': ['horizontal'],
            },
            paint: {
              'text-color': '#FF6B35',
              'text-halo-color': '#000000',
              'text-halo-width': 2,
            },
          });

          map.current.addLayer({
            id: 'sites-label',
            type: 'symbol',
            source: 'sites',
            layout: {
              'text-field': ['get', 'name'],
              'text-offset': [0, 1.5],
              'text-anchor': 'top',
              'text-size': [
                'interpolate',
                ['linear'],
                ['zoom'],
                2, 12,
                10, 18
              ],
              'text-allow-overlap': false,
              'text-writing-mode': ['horizontal'],
            },
            paint: {
              'text-color': '#FFFFFF',
              'text-halo-color': '#000000',
              'text-halo-width': 2,
            },
          });


          const isMobile = () => window.innerWidth < 768;

          ['strikes-circle', 'sites-circle'].forEach(layerId => {
            // Desktop events (hover)
            map.current!.on('mouseenter', layerId, (e) => {
              if (!map.current || isMobile()) return;
              
              map.current.getCanvas().style.cursor = 'pointer';
              
              if (e.features && e.features[0]) {
                const properties = e.features[0].properties as LocationProperties;
                onLocationHoverRef.current(properties, e.originalEvent as MouseEvent);
              }
            });

            map.current!.on('mousemove', layerId, (e) => {
              if (!map.current || isMobile()) return;
              onMouseMoveRef.current(e.originalEvent as MouseEvent);
            });

            map.current!.on('mouseleave', layerId, () => {
              if (!map.current || isMobile()) return;
              
              map.current.getCanvas().style.cursor = '';
              onLocationHoverRef.current(null);
            });

            // Mobile and Desktop click events
            map.current!.on('click', layerId, (e) => {
              if (!map.current || !e.features || !e.features[0]) return;
              
              const properties = e.features[0].properties as LocationProperties;
              const coordinates = (e.features[0].geometry as any).coordinates.slice();
              
              if (isMobile()) {
                onLocationHoverRef.current(properties, e.originalEvent as MouseEvent);
                
                setTimeout(() => {
                  onLocationHoverRef.current(null);
                }, 3000);
              } else {
                map.current!.flyTo({
                  center: coordinates,
                  zoom: 8,
                  duration: 2000,
                });
              }
            });
          });

          if (isMobile()) {
            map.current.on('click', (e) => {
              const features = map.current!.queryRenderedFeatures(e.point, {
                layers: ['strikes-circle', 'sites-circle']
              });
              
              if (features.length === 0) {
                onLocationHoverRef.current(null);
              }
            });
          }

          setIsLoading(false);
        } catch (err) {
          console.error('❌ Error loading map data:', err);
          setError(`Loading error: ${err instanceof Error ? err.message : 'Unknown error'}`);
          setIsLoading(false);
        }
      });

      map.current.on('error', (e) => {
        console.error('Map error:', e);
        setError('Failed to load map.');
        setIsLoading(false);
      });

    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Failed to initialize map');
      setIsLoading(false);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center p-8">
          <h3 className="text-xl font-semibold mb-2">Error Loading Map</h3>
          <p className="text-gray-400 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p>Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;