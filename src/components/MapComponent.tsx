import type { Point } from "geojson";
import maplibregl, {
	type GeoJSONSource,
	type LngLatLike,
	type MapGeoJSONFeature,
} from "maplibre-gl";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { useLayers } from "../map-entities/layers.context";
import { useLayersDataRef } from "../map-entities/layers.context.ref";
import type {
	LocationDataType,
	LocationFeature,
	LocationProperties,
} from "../types";
import { loadPngAsImage } from "../utils/loadPngAsImage";

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
	onDataSourcesLoad,
}) => {
	const { layers } = useLayers();
	const layersDataRef = useLayersDataRef();

	const mapContainer = useRef<HTMLDivElement>(null);
	const map = useRef<maplibregl.Map | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isMapLoaded, setIsMapLoaded] = useState(false);
	const [retryCount, setRetryCount] = useState(0);
	const [isRetrying, setIsRetrying] = useState(false);

	const onLocationHoverRef = useRef(onLocationHover);
	const onMouseMoveRef = useRef(onMouseMove);

	// Store the data sources for re-adding after theme switch
	const dataSourcesRef = useRef<{
		strikes?: LocationDataType;
		sites?: LocationDataType;
		nuclear?: LocationDataType;
		iranBorder?: LocationDataType;
		evac?: LocationDataType;
	}>({});

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

		// Clear data sources
		dataSourcesRef.current = {};

		// Reset states
		setIsMapLoaded(false);

		setTimeout(() => {
			setIsRetrying(false);
		}, 2000);
	}, []);

	useEffect(() => {
		onLocationHoverRef.current = onLocationHover;
		onMouseMoveRef.current = onMouseMove;
	}, [onLocationHover, onMouseMove]);

	// Set layer visibility layout properties
	useEffect(() => {
		if (!map.current) return;

		layers.forEach(({ visible, mapIds }) => {
			mapIds.forEach((mapId) => {
				if (map.current?.getLayer(mapId)) {
					map.current?.setLayoutProperty(
						mapId,
						"visibility",
						visible ? "visible" : "none",
					);
				}
			});
		});
	}, [layers]);

	// Zoom to evacuation area when shouldZoomToEvac is true
	useEffect(() => {
		if (!map.current || !shouldZoomToEvac || !layersDataRef.current.evac.data)
			return;

		const bounds = calculateBounds(layersDataRef.current.evac.data);
		if (bounds) {
			map.current.fitBounds(bounds, {
				padding: 10,
				duration: 1000,
				maxZoom: 13,
			});
		}
	}, [shouldZoomToEvac, layersDataRef.current.evac.data]);

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

	// Initialize map
	useEffect(() => {
		if (map.current) return;
		if (!mapContainer.current) return;

		try {
			map.current = new maplibregl.Map({
				container: mapContainer.current,
				style: {
					version: 8,
					glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
					sources: {
						"carto-dark": {
							type: "raster",
							tiles: [
								"https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png",
								"https://cartodb-basemaps-b.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png",
								"https://cartodb-basemaps-c.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png",
								"https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
								"https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
							],
							tileSize: 256,
							attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
						},
						"carto-light": {
							type: "raster",
							tiles: [
								"https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png",
								"https://cartodb-basemaps-b.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png",
								"https://cartodb-basemaps-c.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png",
								"https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
								"https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
							],
							tileSize: 256,
							attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
						},
					},
					layers: [
						{
							id: "background",
							type: "background",
							paint: {
								"background-color": isDarkMode ? "#242f3e" : "#f8f9fa",
							},
						},
						{
							id: "carto-layer",
							type: "raster",
							source: isDarkMode ? "carto-dark" : "carto-light",
							minzoom: 0,
							maxzoom: 20,
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
				setIsLoading(false);
			});

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

			map.current.once("load", async () => {
				if (!map.current || !map.current.isStyleLoaded()) return;

				try {
					// Add images only if they don't exist
					if (!map.current.hasImage("nuclear-icon")) {
						const image = await loadPngAsImage("/assets/symbols/nuclear.png");
						if (image) {
							map.current.addImage("nuclear-icon", image);
						}
					}
					if (!map.current.hasImage("missile-base-icon")) {
						const image = await loadPngAsImage("/assets/symbols/missile.png");
						if (image) {
							map.current.addImage("missile-base-icon", image);
						}
					}
					if (!map.current.hasImage("explosion-icon")) {
						const image = await loadPngAsImage("/assets/symbols/explosion.png");
						if (image) {
							map.current.addImage("explosion-icon", image);
						}
					}

					// Load data sources
					let strikesResponse: Response;
					let sitesResponse: Response;
					let iranBorderResponse: Response;
					let nuclearFacilitiesResponse: Response;
					let evacResponse: Response;

					try {
						[
							strikesResponse,
							sitesResponse,
							iranBorderResponse,
							nuclearFacilitiesResponse,
							evacResponse,
						] = await Promise.all([
							fetch("/sources/strikes.geojson"),
							fetch("/sources/missile-bases.geojson"),
							fetch("/sources/iran-border.geojson"),
							fetch("/sources/nuclear-facilities.geojson"),
							fetch("/sources/evac-area-jun-16.geojson"),
						]);
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
					} catch (_error) {
						[
							strikesResponse,
							sitesResponse,
							iranBorderResponse,
							nuclearFacilitiesResponse,
							evacResponse,
						] = await Promise.all([
							fetch("/sources/strikes.geojson"),
							fetch("/sources/missile-bases.geojson"),
							fetch("/sources/iran-border.geojson"),
							fetch("/sources/nuclear-facilities.geojson"),
							fetch("/sources/evac-area-jun-16.geojson"),
						]);
					}

					const [
						strikesGeoJSON,
						sitesGeoJSON,
						iranBorderData,
						nuclearFacilitiesGeoJSON,
						evacDataGeoJSON,
					] = await Promise.all([
						strikesResponse.json(),
						sitesResponse.json(),
						iranBorderResponse.json(),
						nuclearFacilitiesResponse.json(),
						evacResponse.json(),
					]);

					// Store the data sources for later use
					dataSourcesRef.current = {
						strikes: strikesGeoJSON,
						sites: sitesGeoJSON,
						iranBorder: iranBorderData,
						nuclear: nuclearFacilitiesGeoJSON,
						evac: evacDataGeoJSON,
					};

					// Notify parent component about data sources
					if (onDataSourcesLoad) {
						onDataSourcesLoad({
							strikes: strikesGeoJSON,
							sites: sitesGeoJSON,
							nuclear: nuclearFacilitiesGeoJSON,
						});
					}

					// Add sources only if they don't exist
					if (!map.current.getSource("strikes")) {
						map.current.addSource("strikes", {
							type: "geojson",
							data: strikesGeoJSON,
						});
					}

					if (!map.current.getSource("nuclear-source")) {
						map.current.addSource("nuclear-source", {
							type: "geojson",
							data: nuclearFacilitiesGeoJSON,
						});
					}

					if (!map.current.getSource("sites")) {
						map.current.addSource("sites", {
							type: "geojson",
							data: sitesGeoJSON,
						});
					}

					if (!map.current.getSource("iran-border")) {
						map.current.addSource("iran-border", {
							type: "geojson",
							data: iranBorderData,
						});
					}

					if (!map.current.getSource("evac")) {
						map.current.addSource("evac", {
							type: "geojson",
							data: evacDataGeoJSON,
						});
					}

					// Add layers only if they don't exist
					if (!map.current.getLayer("iran-border-fill")) {
						map.current.addLayer({
							id: "iran-border-fill",
							type: "fill",
							source: "iran-border",
							paint: {
								"fill-color": "rgba(255, 0, 0, 0.1)",
								"fill-opacity": 0.2,
							},
						});
					}

					if (!map.current.getLayer("iran-border-line")) {
						map.current.addLayer({
							id: "iran-border-line",
							type: "line",
							source: "iran-border",
							paint: {
								"line-color": "#FF0000",
								"line-width": 3,
								"line-opacity": 0.8,
							},
						});
					}

					if (!map.current.getLayer("nuclear-layer")) {
						map.current.addLayer({
							id: "nuclear-layer",
							type: "symbol",
							source: "nuclear-source",
							layout: {
								"icon-image": "nuclear-icon",
								"icon-size": 0.4,
								"icon-allow-overlap": true,
								"icon-ignore-placement": true,
							},
						});
					}

					if (!map.current.getLayer("strikes-layer")) {
						map.current.addLayer({
							id: "strikes-layer",
							type: "symbol",
							source: "strikes",
							layout: {
								"icon-image": "explosion-icon",
								"icon-size": 0.4,
								"icon-allow-overlap": true,
								"icon-ignore-placement": true,
							},
						});
					}

					if (!map.current.getLayer("sites-layer")) {
						map.current.addLayer({
							id: "sites-layer",
							type: "symbol",
							source: "sites",
							layout: {
								"icon-image": "missile-base-icon",
								"icon-size": 0.4,
								"icon-allow-overlap": true,
								"icon-ignore-placement": true,
							},
						});
					}

					if (!map.current.getLayer("evac-fill")) {
						map.current.addLayer({
							id: "evac-fill",
							type: "fill",
							source: "evac",
							paint: {
								"fill-color": "#ff0000",
								"fill-opacity": 0.2,
							},
						});
					}

					if (!map.current.getLayer("evac-line")) {
						map.current.addLayer({
							id: "evac-line",
							type: "line",
							source: "evac",
							paint: {
								"line-color": "#ff0000",
								"line-width": 2,
								"line-opacity": 0.8,
								"line-dasharray": [4, 2],
							},
						});
					}

					// Add text layers only if they don't exist
					if (!map.current.getLayer("strikes-label")) {
						map.current.addLayer({
							id: "strikes-label",
							type: "symbol",
							source: "strikes",
							layout: {
								"text-field": ["get", "SiteTargeted"],
								"text-offset": [0, 1.5],
								"text-anchor": "top",
								"text-size": [
									"interpolate",
									["linear"],
									["zoom"],
									2,
									11,
									10,
									16,
								],
								"text-allow-overlap": false,
								"text-writing-mode": ["horizontal"],
							},
							paint: {
								"text-color": "#ff9100",
								"text-halo-color": isDarkMode ? "#000000" : "#333333",
								"text-halo-width": 2,
							},
						});
					}

					if (!map.current.getLayer("nuclear-label")) {
						map.current.addLayer({
							id: "nuclear-label",
							type: "symbol",
							source: "nuclear-source",
							layout: {
								"text-field": ["get", "Site"],
								"text-offset": [0, 1.5],
								"text-anchor": "top",
								"text-size": [
									"interpolate",
									["linear"],
									["zoom"],
									2,
									11,
									10,
									16,
								],
								"text-allow-overlap": false,
								"text-writing-mode": ["horizontal"],
							},
							paint: {
								"text-color": "#ff9100",
								"text-halo-color": isDarkMode ? "#000000" : "#333333",
								"text-halo-width": 2,
							},
						});
					}

					if (!map.current.getLayer("sites-label")) {
						map.current.addLayer({
							id: "sites-label",
							type: "symbol",
							source: "sites",
							layout: {
								"text-field": ["get", "BASES_CLUSTER"],
								"text-offset": [0, 1.5],
								"text-anchor": "top",
								"text-size": [
									"interpolate",
									["linear"],
									["zoom"],
									2,
									12,
									10,
									18,
								],
								"text-allow-overlap": false,
								"text-writing-mode": ["horizontal"],
							},
							paint: {
								"text-color": "#FFFFFF",
								"text-halo-color": isDarkMode ? "#000000" : "#333333",
								"text-halo-width": 2,
							},
						});
					}

					const isMobile = () => window.innerWidth < 768;

					["strikes-layer", "sites-layer", "nuclear-layer"].forEach(
						(layerId) => {
							if (!map.current?.getLayer(layerId)) return;

							// Desktop events (hover)
							map.current?.on("mouseenter", layerId, (e) => {
								if (!map.current || isMobile()) return;

								map.current.getCanvas().style.cursor = "pointer";

								if (e.features?.[0]) {
									const properties = e.features[0].properties;
									const coordinates = (e.features[0].geometry as Point)
										.coordinates;

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

							map.current?.on("mousemove", layerId, (e) => {
								if (!map.current || isMobile()) return;
								onMouseMoveRef.current(e.originalEvent as MouseEvent);
							});

							map.current?.on("mouseleave", layerId, (_e) => {
								if (!map.current || isMobile()) return;

								// Check if mouse is moving to tooltip
								// const rect = map.current.getContainer().getBoundingClientRect();

								// Small delay to allow moving to tooltip
								setTimeout(() => {
									const tooltipElement =
										document.querySelector("[data-tooltip]");
									if (!tooltipElement || !tooltipElement.matches(":hover")) {
										if (map.current) {
											map.current.getCanvas().style.cursor = "";
											onLocationHoverRef.current(null);
										}
									}
								}, 2000);
							});

							// Mobile and Desktop click events
							map.current?.on("click", layerId, (e) => {
								if (!map.current || !e.features || !e.features[0]) return;

								const properties = e.features[0]
									.properties as LocationProperties;
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
						},
					);

					// Mobile click-to-close tooltip
					if (isMobile()) {
						map.current.on("click", (e) => {
							const features = map.current?.queryRenderedFeatures(e.point, {
								layers: ["strikes-layer", "sites-layer", "nuclear-layer"],
							});

							if (features?.length === 0) {
								onLocationHoverRef.current(null);
							}
						});
					}
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
			});
		} catch (error) {
			console.error("Error initializing map:", error);
			setError(
				"خطا در راه‌اندازی نقشه: " +
					(error instanceof Error ? error.message : "خطای نامشخص"),
			);
			setIsLoading(false);

			// Auto retry initialization up to 2 times
			if (retryCount < 2) {
				setTimeout(() => {
					retryMapLoad();
				}, 2000);
			}
		}
	}, [isDarkMode, retryCount, onDataSourcesLoad, retryMapLoad]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (map.current) {
				map.current.remove();
				map.current = null;
			}
		};
	}, []);

	// Update map style when theme changes
	useEffect(() => {
		if (!map.current || !isMapLoaded) return;

		try {
			// Store current data sources before removing them
			const dataSources = dataSourcesRef.current;

			// Remove all existing layers and sources
			const layers = [
				"iran-border-fill",
				"iran-border-line",
				"strikes-layer",
				"strikes-label",
				"nuclear-layer",
				"nuclear-label",
				"sites-layer",
				"sites-label",
				"evac-fill",
				"evac-line",
				"user-location-circle",
				"user-location-accuracy",
				"carto-layer",
			];
			const sources = [
				"iran-border",
				"strikes",
				"sites",
				"nuclear-source",
				"evac",
				"user-location",
				"carto-layer",
			];

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

			// First add all circle layers
			if (dataSources.iranBorder) {
				map.current.addSource("iran-border", {
					type: "geojson",
					data: dataSources.iranBorder as unknown as GeoJSON.GeoJSON | string,
				});

				map.current.addLayer({
					id: "iran-border-fill",
					type: "fill",
					source: "iran-border",
					paint: {
						"fill-color": "rgba(255, 0, 0, 0.1)",
						"fill-opacity": 0.2,
					},
				});

				map.current.addLayer({
					id: "iran-border-line",
					type: "line",
					source: "iran-border",
					paint: {
						"line-color": "#FF0000",
						"line-width": 3,
						"line-opacity": 0.8,
					},
				});
			}

			if (dataSources.strikes) {
				map.current.addSource("strikes", {
					type: "geojson",
					data: dataSources.strikes as unknown as GeoJSON.GeoJSON | string,
				});

				map.current.addLayer({
					id: "strikes-layer",
					type: "symbol",
					source: "strikes",
					layout: {
						"icon-image": "explosion-icon",
						"icon-size": 0.4,
						"icon-allow-overlap": true,
						"icon-ignore-placement": true,
					},
				});
			}

			if (dataSources.sites) {
				map.current.addSource("sites", {
					type: "geojson",
					data: dataSources.sites as unknown as GeoJSON.GeoJSON | string,
				});

				map.current.addLayer({
					id: "sites-layer",
					type: "symbol",
					source: "sites",
					layout: {
						"icon-image": "missile-base-icon",
						"icon-size": 0.4,
						"icon-allow-overlap": true,
						"icon-ignore-placement": true,
					},
				});
			}

			if (dataSources.sites) {
				map.current.addSource("nuclear-source", {
					type: "geojson",
					data: dataSources.sites as unknown as GeoJSON.GeoJSON | string,
				});

				map.current.addLayer({
					id: "nuclear-layer",
					type: "symbol",
					source: "nuclear-source",
					layout: {
						"icon-image": "nuclear-icon",
						"icon-size": 0.4,
						"icon-allow-overlap": true,
						"icon-ignore-placement": true,
					},
				});
			}

			if (dataSources.evac) {
				map.current.addSource("evac", {
					type: "geojson",
					data: dataSources.evac as unknown as GeoJSON.GeoJSON | string,
				});

				map.current.addLayer({
					id: "evac-fill",
					type: "fill",
					source: "evac",
					paint: {
						"fill-color": "#ff0000",
						"fill-opacity": 0.2,
					},
				});

				map.current.addLayer({
					id: "evac-line",
					type: "line",
					source: "evac",
					paint: {
						"line-color": "#ff0000",
						"line-width": 2,
						"line-opacity": 0.8,
						"line-dasharray": [4, 2],
					},
				});
			}

			// Then add all text layers
			if (dataSources.strikes) {
				map.current.addLayer({
					id: "strikes-label",
					type: "symbol",
					source: "strikes",
					layout: {
						"text-field": ["get", "BASES_CLUSTER"],
						"text-offset": [0, 1.5],
						"text-anchor": "top",
						"text-size": ["interpolate", ["linear"], ["zoom"], 2, 11, 10, 16],
						"text-allow-overlap": false,
						"text-writing-mode": ["horizontal"],
					},
					paint: {
						"text-color": "#ff9100",
						"text-halo-color": isDarkMode ? "#d1d1d1" : "#333333",
						"text-halo-width": 2,
					},
				});
			}

			if (dataSources.sites) {
				map.current.addLayer({
					id: "sites-label",
					type: "symbol",
					source: "sites",
					layout: {
						"text-field": ["get", "SiteTargeted"],
						"text-offset": [0, 1.5],
						"text-anchor": "top",
						"text-size": ["interpolate", ["linear"], ["zoom"], 2, 12, 10, 18],
						"text-allow-overlap": false,
						"text-writing-mode": ["horizontal"],
					},
					paint: {
						"text-color": "#FFFFFF",
						"text-halo-color": isDarkMode ? "#d1d1d1" : "#333333",
						"text-halo-width": 2,
					},
				});
			}

			if (dataSources.nuclear) {
				map.current.addLayer({
					id: "nuclear-label",
					type: "symbol",
					source: "nuclear-source",
					layout: {
						"text-field": ["get", "Site"],
						"text-offset": [0, 1.5],
						"text-anchor": "top",
						"text-size": ["interpolate", ["linear"], ["zoom"], 2, 12, 10, 18],
						"text-allow-overlap": false,
						"text-writing-mode": ["horizontal"],
					},
					paint: {
						"text-color": "#FFFFFF",
						"text-halo-color": isDarkMode ? "#d1d1d1" : "#333333",
						"text-halo-width": 2,
					},
				});
			}

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

			// Re-add event listeners after theme change
			const isMobile = () => window.innerWidth < 768;

			["strikes-circle", "sites-circle"].forEach((layerId) => {
				if (!map.current?.getLayer(layerId)) return;

				// Desktop events (hover)
				map.current?.on("mouseenter", layerId, (e) => {
					if (!map.current || isMobile()) return;

					map.current.getCanvas().style.cursor = "pointer";

					if (e.features?.[0]) {
						const properties = e.features[0].properties as LocationProperties;
						const coordinates = (e.features[0].geometry as Point).coordinates;

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
				});

				map.current?.on("mousemove", layerId, (e) => {
					if (!map.current || isMobile()) return;
					onMouseMoveRef.current(e.originalEvent as MouseEvent);
				});

				map.current?.on("mouseleave", layerId, (_e) => {
					if (!map.current || isMobile()) return;

					// Check if mouse is moving to tooltip
					setTimeout(() => {
						const tooltipElement = document.querySelector("[data-tooltip]");
						if (!tooltipElement || !tooltipElement.matches(":hover")) {
							map.current!.getCanvas().style.cursor = "";
							onLocationHoverRef.current(null);
						}
					}, 2000);
				});

				// Mobile and Desktop click events
				map.current?.on("click", layerId, (e) => {
					if (!map.current || !e.features || !e.features[0]) return;

					const properties = e.features[0].properties;
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
						zoom: 8,
						duration: 2000,
					});
				});
			});
		} catch (error) {
			console.error("Error updating map style:", error);
		}
	}, [isDarkMode, isMapLoaded, userLocation]);

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
