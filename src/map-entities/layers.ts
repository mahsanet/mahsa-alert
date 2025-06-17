export const layerIds = {
	strikes: "strikes",
	sites: "sites",
	nuclear: "nuclear",
	evac: "evac",
} as const;

export type Layer = {
	id: keyof typeof layerIds;
	mapIds: string[];
	name: string;
	color: string;
	dataPath: string;
	icon: {
		key: string;
		path: string;
	} | null;
	visible?: boolean;
};

export const totalLayers: Layer[] = [
	{
		id: layerIds.strikes,
		mapIds: [`${layerIds.strikes}-layer`, `${layerIds.strikes}-label`],
		name: "حملات تایید شده",
		color: "#b81102",
		dataPath: "public/sources/strikes.geojson",
		icon: {
			key: "explosion-icon",
			path: "/assets/symbols/explosion.png",
		},
		visible: true,
	},
	{
		id: layerIds.sites as keyof typeof layerIds,
		mapIds: [`${layerIds.sites}-layer`, `${layerIds.sites}-label`],
		name: "پایگاه‌های موشکی",
		color: "#ff9100",
		dataPath: "public/sources/missile-bases.geojson",
		icon: {
			key: "missile-base-icon",
			path: "/assets/symbols/missile.png",
		},
		visible: true,
	},
	{
		id: layerIds.nuclear,
		mapIds: [`${layerIds.nuclear}-layer`, `${layerIds.nuclear}-label`],
		name: "مراکز هسته‌ای",
		color: "#ff9100",
		dataPath: "public/sources/nuclear-facilities.geojson",
		icon: {
			key: "nuclear-icon",
			path: "/assets/symbols/nuclear.png",
		},
		visible: true,
	},
	{
		id: layerIds.evac,
		mapIds: [`${layerIds.evac}-fill`, `${layerIds.evac}-line`],
		name: "مناطق تخلیه",
		color: "#ff0000",
		dataPath: "public/sources/evac-area-jun-16.geojson",
		icon: null,
		visible: true,
	},
] as const;
