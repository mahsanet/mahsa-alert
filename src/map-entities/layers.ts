export const layerIds = {
	strikes: "strikes",
	sites: "sites",
	nuclear: "nuclear",
	evac: "evac",
} as const;

export type Layer = {
	type: "layer";
	id: keyof typeof layerIds;
	layerKey: string;
	name: string;
	label: {
		key: string;
		textField: string;
		textColor: string;
	};
	source: {
		key: string;
		path: string;
	};
	icon: {
		key: string;
		path: string;
	} | null;
	visible?: boolean;
};

export const totalLayers: Layer[] = [
	{
		type: "layer",
		id: layerIds.strikes,
		layerKey: `${layerIds.strikes}-layer`,
		name: "حملات تایید شده",
		label: {
			key: `${layerIds.strikes}-label`,
			textField: "SiteTargeted",
			textColor: "#b81102",
		},
		source: {
			key: `${layerIds.strikes}-source`,
			path: "/sources/strikes.geojson",
		},
		icon: {
			key: "explosion-icon",
			path: "/assets/symbols/explosion.png",
		},
		visible: true,
	},
	{
		type: "layer",
		id: layerIds.sites,
		layerKey: `${layerIds.sites}-layer`,
		name: "پایگاه‌های موشکی",
		label: {
			key: `${layerIds.sites}-label`,
			textField: "BASES_CLUSTER",
			textColor: "#3674B5",
		},
		source: {
			key: `${layerIds.sites}-source`,
			path: "/sources/missile-bases.geojson",
		},
		icon: {
			key: "missile-base-icon",
			path: "/assets/symbols/missile.png",
		},
		visible: true,
	},
	{
		type: "layer",
		id: layerIds.nuclear,
		layerKey: `${layerIds.nuclear}-layer`,
		name: "مراکز هسته‌ای",
		label: {
			key: `${layerIds.nuclear}-label`,
			textField: "Site",
			textColor: "#ff9100",
		},
		source: {
			key: `${layerIds.nuclear}-source`,
			path: "/sources/nuclear-facilities.geojson",
		},
		icon: {
			key: "nuclear-icon",
			path: "/assets/symbols/nuclear.png",
		},
		visible: true,
	},
] as const;
