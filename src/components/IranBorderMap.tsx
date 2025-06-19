import maplibregl, {
	type GeoJSONSourceSpecification,
	type Map as MapLibreMap,
} from "maplibre-gl";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import type { LocationProperties } from "@/types";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTheme } from "@/ui/theme-provider";

interface MapComponentProps {
	onLocationHover: (
		location: LocationProperties | null,
		mouseEvent?: MouseEvent,
	) => void;
	onMouseMove: (mouseEvent: MouseEvent) => void;
	shouldZoomToEvac?: boolean;
	zoomToBounds?: [[number, number], [number, number]] | null;
}

const IranBorderMap: React.FC<MapComponentProps> = ({
	onLocationHover,
	onMouseMove,
	zoomToBounds,
}) => {
	console.log({
		onLocationHover,
		onMouseMove,
		zoomToBounds,
	});
	const { isDarkMode } = useTheme();
	const mapContainer = useRef<HTMLDivElement | null>(null);
	const mapRef = useRef<MapLibreMap | null>(null);
	const [borderData, setBorderData] =
		useState<GeoJSON.FeatureCollection | null>(null);

	useEffect(() => {
		fetch("/iran-border.geojson")
			.then((response) => response.json())
			.then((data) => setBorderData(data));
	}, []);

	useEffect(() => {
		if (!mapRef.current) return;

		mapRef.current.on("move", () => {
			const center = mapRef.current!.getCenter();
			const zoom = mapRef.current!.getZoom();
			console.log(
				`Center: [${center.lng.toFixed(4)}, ${center.lat.toFixed(4)}], Zoom: ${zoom.toFixed(2)}`,
			);
		});
	}, []);

	useEffect(() => {
		if (mapRef.current || !borderData) return;

		mapRef.current = new maplibregl.Map({
			container: mapContainer.current!,
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
			center: [54.389, 32.6892], // Tehran coordinates as approximate center of Iran
			zoom: 5,
		});

		mapRef.current.on("load", () => {
			mapRef.current!.addSource("iran-border", {
				type: "geojson",
				data: borderData,
			} as GeoJSONSourceSpecification);

			mapRef.current!.addLayer({
				id: "iran-border-line",
				type: "line",
				source: "iran-border",
				paint: {
					"line-color": "#ff0000",
					"line-width": 3,
				},
			});
		});
	}, [borderData, isDarkMode]);

	return <div ref={mapContainer} style={{ height: "100vh", width: "100%" }} />;
};

export default IranBorderMap;
