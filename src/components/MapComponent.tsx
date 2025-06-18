import type { Point } from "geojson";
import maplibregl, {
	type GeoJSONSource,
	type LngLatLike,
	type MapGeoJSONFeature,
} from "maplibre-gl";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { useBordersDataRef } from "../map-entities/border.context.ref";
import { totalBorders } from "../map-entities/borders";
import { useBorders } from "../map-entities/borders.context";
import { totalLayers } from "../map-entities/layers";
import { useLayers } from "../map-entities/layers.context";
import type {
	LocationDataType,
	LocationFeature,
	LocationProperties,
} from "../types";

interface MapComponentProps {
	onLocationHover: (
		location: LocationProperties | null,
		mouseEvent?: MouseEvent,
	) => void;
	onMouseMove: (mouseEvent: MouseEvent) => void;
	isDarkMode: boolean;
	shouldZoomToEvac?: boolean;
	userLocation?: { lat: number; lng: number } | null;
	onDataSourcesLoad?: (dataSources: Record<string, LocationDataType>) => void;
}

// Function to calculate bounds for GeoJSON data
const calculateBounds = (
	geoJsonData: LocationDataType,
): [[number, number], [number, number]] | null => {
	if (!geoJsonData?.features?.length) return null;

	let minLng = Number.POSITIVE_INFINITY;
	let minLat = Number.POSITIVE_INFINITY;
	let maxLng = Number.NEGATIVE_INFINITY;
	let maxLat = Number.NEGATIVE_INFINITY;

	geoJsonData.features.forEach((feature) => {
		if ("coordinates" in feature.geometry && feature.geometry.coordinates) {
			const coords = feature.geometry.coordinates;

			if (feature.geometry.type === "Polygon" && Array.isArray(coords[0])) {
				coords[0].forEach((coord) => {
					const [lng, lat] = coord as [number, number];
					minLng = Math.min(minLng, lng);
					maxLng = Math.max(maxLng, lng);
					minLat = Math.min(minLat, lat);
					maxLat = Math.max(maxLat, lat);
				});
			} else if (feature.geometry.type === "Point") {
				const [lng, lat] = coords as [number, number];
				minLng = Math.min(minLng, lng);
				maxLng = Math.max(maxLng, lng);
				minLat = Math.min(minLat, lat);
				maxLat = Math.max(maxLat, lat);
			}
		}
	});

	if (minLng === Number.POSITIVE_INFINITY) return null;

	return [
		[minLng, minLat],
		[maxLng, maxLat],
	];
};

const MapComponent: React.FC<MapComponentProps> = ({
	onLocationHover,
	onMouseMove,
	isDarkMode,
	shouldZoomToEvac,
	userLocation,
}) => {
	const { layers, layersData, isLayersDataLoaded } = useLayers();
	const { borders, bordersData, isBordersDataLoaded } = useBorders();
	const bordersDataRef = useBordersDataRef();

	const mapContainer = useRef<HTMLDivElement>(null);
	const map = useRef<maplibregl.Map | null>(null);

	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isMapLoaded, setIsMapLoaded] = useState(false);
	const [retryCount, setRetryCount] = useState(0);
	const [isRetrying, setIsRetrying] = useState(false);

	const onLocationHoverRef = useRef(onLocationHover);
	const onMouseMoveRef = useRef(onMouseMove);

	const isMobile = useCallback(() => window.innerWidth < 768, []);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (map.current) {
				map.current.remove();
				map.current = null;
			}
		};
	}, []);

	// Set parent mouse event handlers refs
	useEffect(() => {
		onLocationHoverRef.current = onLocationHover;
		onMouseMoveRef.current = onMouseMove;
	}, [onLocationHover, onMouseMove]);

	const retryMapLoad = useCallback(() => {
		setIsRetrying(true);
		setError(null);
		setIsLoading(true);
		setRetryCount((prev) => prev + 1);

		// Clean up existing map completely
		if (map.current) {
			map.current.remove();
			map.current = null;
		}

		// Reset states
		setIsMapLoaded(false);

		setTimeout(() => {
			setIsRetrying(false);
		}, 2000);
	}, []);

	// Set layer visibility layout properties
	useEffect(() => {
		if (!map.current) return;

		layers.forEach(({ visible, layerKey, label }) => {
			if (map.current?.getLayer(layerKey)) {
				map.current?.setLayoutProperty(
					layerKey,
					"visibility",
					visible ? "visible" : "none",
				);
			}
			if (map.current?.getLayer(label.key)) {
				map.current?.setLayoutProperty(
					label.key,
					"visibility",
					visible ? "visible" : "none",
				);
			}
		});

		borders.forEach(({ visible, fill, line }) => {
			if (map.current?.getLayer(fill.key)) {
				map.current?.setLayoutProperty(
					fill.key,
					"visibility",
					visible ? "visible" : "none",
				);
			}
			if (map.current?.getLayer(line.key)) {
				map.current?.setLayoutProperty(
					line.key,
					"visibility",
					visible ? "visible" : "none",
				);
			}
		});
	}, [layers, borders]);

	// Zoom to evacuation area when shouldZoomToEvac is true
	useEffect(() => {
		if (!map.current || !shouldZoomToEvac || !bordersDataRef.current.evac.data)
			return;

		const bounds = calculateBounds(bordersDataRef.current.evac.data);
		if (bounds) {
			map.current.fitBounds(bounds, {
				padding: 10,
				duration: 1000,
				maxZoom: 13,
			});
		}
	}, [shouldZoomToEvac, bordersDataRef]);

	// Update user location marker
	useEffect(() => {
		if (!map.current || !userLocation) return;

		const userLocationGeoJSON = {
			type: "FeatureCollection" as const,
			features: [
				{
					type: "Feature" as const,
					properties: {
						name: "موقعیت من",
						accuracy: "بالا",
					},
					geometry: {
						type: "Point" as const,
						coordinates: [userLocation.lng, userLocation.lat],
					},
				},
			],
		};

		// Add or update user location source
		if (map.current.getSource("user-location")) {
			(map.current.getSource("user-location") as GeoJSONSource).setData(
				userLocationGeoJSON,
			);
		} else {
			map.current.addSource("user-location", {
				type: "geojson",
				data: userLocationGeoJSON,
			});

			// Add user location circle
			map.current.addLayer({
				id: "user-location-circle",
				type: "circle",
				source: "user-location",
				paint: {
					"circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 8, 10, 16],
					"circle-color": "#4285f4",
					"circle-stroke-width": 3,
					"circle-stroke-color": "#ffffff",
					"circle-opacity": 0.8,
				},
			});

			// Add user location accuracy circle
			map.current.addLayer({
				id: "user-location-accuracy",
				type: "circle",
				source: "user-location",
				paint: {
					"circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 20, 10, 40],
					"circle-color": "#4285f4",
					"circle-opacity": 0.1,
					"circle-stroke-width": 1,
					"circle-stroke-color": "#4285f4",
					"circle-stroke-opacity": 0.3,
				},
			});
		}

		// Fly to user location
		map.current.flyTo({
			center: [userLocation.lng, userLocation.lat],
			zoom: 15,
			duration: 2000,
		});
	}, [userLocation]);

	const loadBorders = useCallback(() => {
		if (!map.current || !isLayersDataLoaded) return;

		totalBorders.forEach((border) => {
			const hasSourceAlready =
				border.source.key && map.current?.getSource(border.source.key);
			const shouldAddSource =
				border.visible &&
				border.source.key &&
				bordersData[border.id].data &&
				!hasSourceAlready;
			if (shouldAddSource) {
				map.current?.addSource(border.source.key, {
					type: "geojson",
					data: bordersData[border.id]
						.data as unknown as GeoJSON.FeatureCollection,
				});
			}

			const hasFillLayerAlready = map.current?.getLayer(border.fill.key);
			const shouldAddFillLayer =
				border.visible && border.fill.key && !hasFillLayerAlready;
			if (shouldAddFillLayer) {
				map.current?.addLayer({
					id: border.fill.key,
					type: "fill",
					source: border.source.key,
					paint: {
						"fill-color": border.fill.color,
						"fill-opacity": 0.2,
					},
				});
			}

			const hasLinkLayerAlready = map.current?.getLayer(border.line.key);
			const shouldAddLinkLayer =
				border.visible && border.line.key && !hasLinkLayerAlready;
			if (shouldAddLinkLayer) {
				map.current?.addLayer({
					id: border.line.key,
					type: "line",
					source: border.source.key,
					paint: {
						"line-color": border.line.color,
						"line-width": 3,
						"line-opacity": 0.8,
					},
				});
			}
		});
	}, [bordersData, isLayersDataLoaded]);

	const loadLayers = useCallback(() => {
		if (!map.current || !isLayersDataLoaded) return;

		totalLayers.forEach((layer) => {
			// Add images for layers that have icons and are visible
			const iconKey = layer.icon?.key;
			const iconImage = layersData[layer.id].iconImage;
			const hasImageAlready = iconKey && map.current?.hasImage(iconKey);
			const shouldAddImage =
				iconImage && iconKey && layer.visible && !hasImageAlready;
			if (shouldAddImage) {
				map.current?.addImage(iconKey, iconImage);
			}

			// Add sources for layers that have data and are visible
			const hasSourceAlready =
				layer.source.key && map.current?.getSource(layer.source.key);
			const shouldAddSource =
				layer.visible &&
				layer.source.key &&
				layersData[layer.id].data &&
				!hasSourceAlready;
			if (shouldAddSource) {
				map.current?.addSource(layer.source.key, {
					type: "geojson",
					data: layersData[layer.id]
						.data as unknown as GeoJSON.FeatureCollection,
				});
			}

			// Add layers for layers that have data and are visible
			const hasLayerAlready =
				layer.layerKey && map.current?.getLayer(layer.layerKey);
			const shouldAddLayer =
				layer.visible &&
				layer.layerKey &&
				layersData[layer.id].data &&
				!hasLayerAlready;
			if (shouldAddLayer) {
				map.current?.addLayer({
					id: layer.layerKey,
					type: "symbol",
					source: layer.source.key,
					layout: {
						"icon-image": layer.icon?.key,
						"icon-size": 0.4,
						"icon-allow-overlap": true,
						"icon-ignore-placement": true,
					},
				});
			}

			// Add label layers for layers that have data and are visible
			const hasLabelLayerAlready =
				layer.label.key && map.current?.getLayer(layer.label.key);
			const shouldAddLabelLayer =
				layer.visible &&
				layer.label.key &&
				layersData[layer.id].data &&
				!hasLabelLayerAlready;
			if (shouldAddLabelLayer) {
				map.current?.addLayer({
					id: layer.label.key,
					type: "symbol",
					source: layer.source.key,
					layout: {
						"text-field": ["get", layer.label.textField],
						"text-offset": [0, 1.5],
						"text-anchor": "top",
						"text-size": ["interpolate", ["linear"], ["zoom"], 2, 11, 10, 18],
						"text-allow-overlap": false,
						"text-writing-mode": ["horizontal"],
					},
					paint: {
						"text-color": layer.label.textColor,
						"text-halo-color": isDarkMode ? "#FFFFFF" : "#000000",
						"text-halo-width": 0.8,
					},
				});
			}

			// Desktop events (hover)
			map.current?.on("mouseenter", layer.layerKey, (e) => {
				if (!map.current || isMobile()) return;

				map.current.getCanvas().style.cursor = "pointer";

				if (e.features?.[0]) {
					const properties = e.features[0].properties;
					const coordinates = (e.features[0].geometry as Point).coordinates;

					// Add coordinates to properties for tooltip
					// @ts-expect-error
					const enrichedProperties: MapGeoJSONFeature &
						Pick<LocationFeature, "geometry" | "coordinates"> = {
						...properties,
						geometry: e.features[0].geometry,
						coordinates: coordinates,
					};

					onLocationHoverRef.current(
						enrichedProperties as unknown as LocationProperties,
						e.originalEvent as MouseEvent,
					);
				}
			});

			map.current?.on("mousemove", layer.layerKey, (e) => {
				if (!map.current || isMobile()) return;
				onMouseMoveRef.current(e.originalEvent as MouseEvent);
			});

			map.current?.on("mouseleave", layer.layerKey, (_e) => {
				if (!map.current || isMobile()) return;

				// Check if mouse is moving to tooltip
				// const rect = map.current.getContainer().getBoundingClientRect();

				// Small delay to allow moving to tooltip
				setTimeout(() => {
					const tooltipElement = document.querySelector("[data-tooltip]");
					if (!tooltipElement || !tooltipElement.matches(":hover")) {
						if (map.current) {
							map.current.getCanvas().style.cursor = "";
							onLocationHoverRef.current(null);
						}
					}
				}, 2000);
			});

			// Mobile and Desktop click events
			map.current?.on("click", layer.layerKey, (e) => {
				if (!map.current || !e.features || !e.features[0]) return;

				const properties = e.features[0].properties as LocationProperties;
				const coordinates = (
					e.features[0].geometry as Point
				).coordinates.slice();

				if (isMobile()) {
					// Add coordinates to properties for tooltip
					const enrichedProperties = {
						...properties,
						geometry: e.features[0].geometry,
						coordinates: coordinates,
					};

					onLocationHoverRef.current(
						enrichedProperties as unknown as LocationProperties,
						e.originalEvent as MouseEvent,
					);
				}

				map.current?.flyTo({
					center: coordinates as LngLatLike,
					zoom: 10,
					duration: 1000,
				});
			});
		});

		// Mobile click-to-close tooltip
		if (isMobile()) {
			map.current.on("click", (e) => {
				const features = map.current?.queryRenderedFeatures(e.point, {
					layers: totalLayers.map((layer) => layer.layerKey),
				});

				if (features?.length === 0) {
					onLocationHoverRef.current(null);
				}
			});
		}
	}, [isMobile, isLayersDataLoaded, isDarkMode, layersData]);

	const loadMap = useCallback(async () => {
		if (!map.current || !map.current.isStyleLoaded()) return;

		try {
			// Update background color
			map.current.setPaintProperty(
				"background",
				"background-color",
				isDarkMode ? "#242f3e" : "#f8f9fa",
			);

			// Add new base layer with fallback servers
			map.current.addSource("carto-layer", {
				type: "raster",
				tiles: isDarkMode
					? [
							"https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png",
							"https://cartodb-basemaps-b.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png",
							"https://cartodb-basemaps-c.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png",
							"https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
							"https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
						]
					: [
							"https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png",
							"https://cartodb-basemaps-b.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png",
							"https://cartodb-basemaps-c.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png",
							"https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
							"https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
						],
				tileSize: 256,
				attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
			});

			map.current.addLayer({
				id: "carto-layer",
				type: "raster",
				source: "carto-layer",
				minzoom: 0,
				maxzoom: 20,
			});

			loadBorders();
			loadLayers();

			setIsLoading(false);
		} catch (err) {
			console.error("❌ Error loading map data:", err);
			setError(
				"خطا در بارگذاری داده‌های نقشه: " +
					(err instanceof Error ? err.message : "خطای نامشخص"),
			);
			setIsLoading(false);

			// Auto retry data loading up to 2 times
			if (retryCount < 2) {
				setTimeout(() => {
					retryMapLoad();
				}, 2000);
			}
		}
	}, [isDarkMode, retryCount, retryMapLoad, loadBorders, loadLayers]);

	const eraseMap = useCallback(() => {
		if (!map.current) return;

		try {
			// Remove all existing layers and sources
			const layers = [
				"user-location-circle",
				"user-location-accuracy",
				"carto-layer",
			]
				.concat(
					totalLayers
						.flatMap((layer) => [
							layer.layerKey,
							layer.label.key,
							layer.icon?.key ?? "",
						])
						.filter(Boolean),
				)
				.concat(
					totalBorders.flatMap((border) => [border.fill.key, border.line.key]),
				);

			const sources = ["user-location", "carto-layer"]
				.concat(totalLayers.map((layer) => layer.source.key))
				.concat(totalBorders.map((border) => border.source.key));

			layers.forEach((layer) => {
				if (map.current?.getLayer(layer)) {
					map.current?.removeLayer(layer);
				}
			});

			sources.forEach((source) => {
				if (map.current?.getSource(source)) {
					map.current?.removeSource(source);
				}
			});
		} catch (err) {
			console.error("❌ Error erasing map:", err);
		}
	}, []);

	// Initialize map
	useEffect(() => {
		if (map.current) return;
		if (!mapContainer.current) return;
		if (!isLayersDataLoaded || !isBordersDataLoaded) return;

		try {
			map.current = new maplibregl.Map({
				container: mapContainer.current,
				style: {
					version: 8,
					glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
					sources: {},
					layers: [
						{
							id: "background",
							type: "background",
							paint: {
								"background-color": isDarkMode ? "#242f3e" : "#f8f9fa",
							},
						},
					],
				},
				center: [53.688, 32.4279],
				zoom: 4.7,
				pitch: 0,
				bearing: 0,
			});

			map.current.on("load", () => {
				setIsMapLoaded(true);
			});
			map.current.once("load", loadMap);

			map.current.on("error", (e) => {
				console.error("Map error:", e);

				// Check if it's a tile loading error (usually temporary)
				if (
					e.error?.message?.includes("Failed to fetch") ||
					e.error?.message?.includes("AJAXError")
				) {
					console.warn("Tile loading error, retrying...", e.error?.message);

					// For tile errors, retry more aggressively but silently
					if (retryCount < 5) {
						const delay = Math.min(500 * 1.5 ** retryCount, 3000);
						setTimeout(() => {
							retryMapLoad();
						}, delay);
						return;
					}
				}

				setError(`خطا در بارگذاری نقشه: ${e.error?.message || "خطای نامشخص"}`);
				setIsLoading(false);

				// Auto retry up to 3 times for other errors
				if (retryCount < 3) {
					const delay = Math.min(1000 * 2 ** retryCount, 5000); // exponential backoff, max 5s
					setTimeout(() => {
						retryMapLoad();
					}, delay);
				}
			});
		} catch (err) {
			console.error("❌ Error loading map data:", err);
			setError(
				"خطا در بارگذاری داده‌های نقشه: " +
					(err instanceof Error ? err.message : "خطای نامشخص"),
			);
			setIsLoading(false);

			// Auto retry data loading up to 2 times
			if (retryCount < 2) {
				setTimeout(() => {
					retryMapLoad();
				}, 2000);
			}
		}
	}, [
		loadMap,
		isLayersDataLoaded,
		isBordersDataLoaded,
		isDarkMode,
		retryCount,
		retryMapLoad,
	]);

	// Update map style when theme changes
	const themeBackup = useRef<boolean | null>(null);
	useEffect(() => {
		if (!map.current || !isMapLoaded) return;
		if (themeBackup.current === null) return;
		if (themeBackup.current === isDarkMode) return;

		try {
			eraseMap();
			loadMap();

			// Re-add user location if it exists
			if (userLocation) {
				const userLocationGeoJSON = {
					type: "FeatureCollection" as const,
					features: [
						{
							type: "Feature" as const,
							properties: {
								name: "موقعیت من",
								accuracy: "بالا",
							},
							geometry: {
								type: "Point" as const,
								coordinates: [userLocation.lng, userLocation.lat],
							},
						},
					],
				};

				map.current.addSource("user-location", {
					type: "geojson",
					data: userLocationGeoJSON,
				});

				map.current.addLayer({
					id: "user-location-circle",
					type: "circle",
					source: "user-location",
					paint: {
						"circle-radius": [
							"interpolate",
							["linear"],
							["zoom"],
							3,
							8,
							10,
							16,
						],
						"circle-color": "#4285f4",
						"circle-stroke-width": 3,
						"circle-stroke-color": "#ffffff",
						"circle-opacity": 0.8,
					},
				});

				map.current.addLayer({
					id: "user-location-accuracy",
					type: "circle",
					source: "user-location",
					paint: {
						"circle-radius": [
							"interpolate",
							["linear"],
							["zoom"],
							3,
							20,
							10,
							40,
						],
						"circle-color": "#4285f4",
						"circle-opacity": 0.1,
						"circle-stroke-width": 1,
						"circle-stroke-color": "#4285f4",
						"circle-stroke-opacity": 0.3,
					},
				});
			}
		} catch (error) {
			console.error("Error updating map style:", error);
		}
	}, [isDarkMode, isMapLoaded, userLocation, loadMap, eraseMap]);

	useEffect(() => {
		themeBackup.current = isDarkMode;
	}, [isDarkMode]);

	if (error) {
		return (
			<div
				className={`w-full h-full flex items-center justify-center ${isDarkMode ? "bg-gray-900" : "bg-gray-100"} transition-colors`}
			>
				<div className="text-center p-8 max-w-md">
					<div className="mb-6">
						<div
							className={`text-6xl mb-4 ${isDarkMode ? "text-red-400" : "text-red-500"}`}
						>
							⚠️
						</div>
						<h3
							className={`text-xl font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}
						>
							خطا در بارگذاری نقشه
						</h3>
						<p
							className={`${isDarkMode ? "text-gray-400" : "text-gray-600"} mb-6 text-sm leading-relaxed`}
						>
							{error}
						</p>
						{retryCount > 0 && (
							<p
								className={`${isDarkMode ? "text-gray-500" : "text-gray-500"} text-xs mb-4`}
							>
								تلاش {retryCount} از 3
							</p>
						)}
					</div>

					<div className="space-y-3">
						<button
							type="button"
							onClick={retryMapLoad}
							disabled={isRetrying}
							className={`
                w-full px-6 py-3 rounded-lg font-medium transition-all duration-200
                ${
									isRetrying
										? "bg-gray-500 cursor-not-allowed"
										: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
								} 
                text-white shadow-lg hover:shadow-xl
                disabled:opacity-50
              `}
						>
							{isRetrying ? (
								<div className="flex items-center justify-center gap-2">
									<div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
									در حال تلاش مجدد...
								</div>
							) : (
								"تلاش مجدد"
							)}
						</button>

						<button
							type="button"
							onClick={() => window.location.reload()}
							className={`
                w-full px-6 py-2 rounded-lg font-medium transition-all duration-200
                ${
									isDarkMode
										? "bg-gray-700 hover:bg-gray-600 text-gray-300"
										: "bg-gray-200 hover:bg-gray-300 text-gray-700"
								}
              `}
						>
							بارگذاری مجدد صفحه
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="relative w-full h-full">
			<div ref={mapContainer} className="w-full h-full" />
			{isLoading && (
				<div
					className={`absolute inset-0 ${isDarkMode ? "bg-gray-900" : "bg-gray-100"} bg-opacity-75 flex items-center justify-center transition-colors`}
				>
					<div
						className={`${isDarkMode ? "text-white" : "text-gray-900"} text-center`}
					>
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4" />
						<p className="mb-2">در حال بارگذاری نقشه...</p>
						{retryCount > 0 && (
							<p
								className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
							>
								تلاش {retryCount} از 3
							</p>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export default MapComponent;
