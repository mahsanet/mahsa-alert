export const borderIds = {
	iran: "iran",
	evac: "evac",
} as const;

export type Border = {
	type: "border";
	id: keyof typeof borderIds;
	name: string;
	fill: {
		key: string;
		color: string;
	};
	line: {
		key: string;
		color: string;
	};
	source: {
		key: string;
		path: string;
	};
	visible?: boolean;
};

export const totalBorders: Border[] = [
	{
		type: "border",
		id: borderIds.iran,
		name: "مرز ایران",
		fill: {
			key: `${borderIds.iran}-fill`,
			color: "transparent",
		},
		line: {
			key: `${borderIds.iran}-line`,
			color: "#FF0000",
		},
		source: {
			key: `${borderIds.iran}-source`,
			path: "/sources/iran-border.geojson",
		},
		visible: true,
	},
	{
		type: "border",
		id: borderIds.evac,
		name: "مناطق تخلیه",
		fill: {
			key: `${borderIds.evac}-fill`,
			color: "#FF0000",
		},
		line: {
			key: `${borderIds.evac}-line`,
			color: "#FF0000",
		},
		source: {
			key: `${borderIds.evac}-source`,
			path: "/sources/evac-area-jun-16.geojson",
		},
		visible: true,
	},
];
