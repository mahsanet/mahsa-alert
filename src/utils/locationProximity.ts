import * as turf from "@turf/turf";
import type { LocationDataType, LocationFeature } from "../types";

export interface ProximityResult {
	isInDanger: boolean;
	nearbyPoints: Array<{
		type: "strikes" | "sites" | "nuclear";
		distance: number;
		properties: LocationFeature["properties"];
		coordinates: LocationFeature["coordinates"];
	}>;
	bufferZone: unknown | null;
}

export interface LocationData {
	strikes?: LocationDataType;
	sites?: LocationDataType;
	nuclear?: LocationDataType;
}

export const checkLocationProximity = (
	userLocation: { lat: number; lng: number },
	locationData: LocationData,
	radiusKm = 3,
): ProximityResult => {
	console.log("🎯 checkLocationProximity called with:", {
		userLocation,
		radiusKm,
	});

	const userPoint = turf.point([userLocation.lng, userLocation.lat]);

	// Create simple buffer zone (we'll use distance calculation instead)
	const bufferZone = null;

	const nearbyPoints: ProximityResult["nearbyPoints"] = [];

	// Check strikes
	if (locationData.strikes?.features) {
		locationData.strikes.features.forEach((feature) => {
			if (feature.geometry?.type === "Point") {
				const point = turf.point(feature.geometry.coordinates);
				const distance = turf.distance(userPoint, point, "kilometers");

				if (distance <= radiusKm) {
					nearbyPoints.push({
						type: "strikes",
						distance: Math.round(distance * 100) / 100,
						properties: feature.properties,
						coordinates: feature.geometry.coordinates,
					});
				}
			}
		});
	}

	// Check sites
	if (locationData.sites?.features) {
		locationData.sites.features.forEach((feature) => {
			if (feature.geometry?.type === "Point") {
				const point = turf.point(feature.geometry.coordinates);
				const distance = turf.distance(userPoint, point, "kilometers");

				if (distance <= radiusKm) {
					nearbyPoints.push({
						type: "sites",
						distance: Math.round(distance * 100) / 100,
						properties: feature.properties,
						coordinates: feature.geometry.coordinates,
					});
				}
			}
		});
	}

	// Check nuclear
	if (locationData.nuclear?.features) {
		locationData.nuclear.features.forEach((feature) => {
			if (feature.geometry?.type === "Point") {
				const point = turf.point(feature.geometry.coordinates);
				const distance = turf.distance(userPoint, point, "kilometers");

				if (distance <= radiusKm) {
					nearbyPoints.push({
						type: "nuclear",
						distance: Math.round(distance * 100) / 100,
						properties: feature.properties,
						coordinates: feature.geometry.coordinates,
					});
				}
			}
		});
	}

	// Sort by distance (closest first)
	nearbyPoints.sort((a, b) => a.distance - b.distance);

	const result = {
		isInDanger: nearbyPoints.length > 0,
		nearbyPoints,
		bufferZone,
	};

	console.log("📊 Proximity check result:", result);

	return result;
};

export const getDangerMessage = (
	pointType: "strikes" | "sites" | "nuclear",
): string => {
	switch (pointType) {
		case "strikes":
			return "منطقه حمله شده";
		case "sites":
			return "پایگاه موشکی";
		case "nuclear":
			return "مرکز هسته‌ای";
		default:
			return "منطقه خطرناک";
	}
};

export const generateWarningMessage = (result: ProximityResult): string => {
	if (!result.isInDanger) {
		return "شما در منطقه امنی قرار دارید";
	}

	const closestPoint = result.nearbyPoints[0];
	const pointName = getDangerMessage(closestPoint.type);

	if (result.nearbyPoints.length === 1) {
		if (closestPoint.distance === 0) {
			return `⚠️ هشدار: شما در فاصله کمتر از یک کیلومتری ${pointName} قرار دارید`;
		}
		return `⚠️ هشدار: شما در فاصله ${closestPoint.distance} کیلومتری ${pointName} قرار دارید`;
	}
	if (closestPoint.distance === 0) {
		return `⚠️ هشدار: شما در فاصله کمتر از یک کیلومتری ${pointName} و ${result.nearbyPoints.length - 1} نقطه خطرناک دیگر قرار دارید`;
	}
	return `⚠️ هشدار: شما در فاصله ${closestPoint.distance} کیلومتری ${pointName} و ${result.nearbyPoints.length - 1} نقطه خطرناک دیگر قرار دارید`;
};
