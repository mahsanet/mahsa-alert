import type { LocationDataType } from "../types";

// Function to calculate bounds for GeoJSON data
export const calculateBounds = (
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
