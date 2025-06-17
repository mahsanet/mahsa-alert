import type { GeoJsonProperties, Geometry, Position } from "geojson";

export type LocationProperties = Exclude<GeoJsonProperties, null>;

export type LocationFeature = {
	geometry: Geometry;
	coordinates: Position;
	properties: LocationProperties;
};

export type LocationDataType = {
	type: "FeatureCollection";
	crs: {
		type: string;
		properties: {
			name: string;
		};
	};
	features: LocationFeature[];
};
