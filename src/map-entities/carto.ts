export const cartoConfig = {
	sourceKey: "carto-layer",
	layerKey: "carto-layer",
	tiles: (isDarkMode: boolean) =>
		isDarkMode
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
} as const;
