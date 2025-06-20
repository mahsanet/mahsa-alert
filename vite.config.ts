import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
	optimizeDeps: {
		exclude: ["lucide-react"],
	},
	plugins: [
		react(),
		tailwindcss(),
		VitePWA({
			registerType: "autoUpdate",
			injectRegister: "auto",
			devOptions: {
				enabled: true,
			},
			manifest: {
				name: "Mahsa Alert",
				short_name: "Mahsa Alert",
				description: "Early warning and shelter map for crisis events in Iran",
				theme_color: "#000000",
				background_color: "#ffffff",
				display: "standalone",
				orientation: "portrait",
				scope: "/",
				start_url: "/",
				icons: [
					{
						src: "/assets/img/icon-192x192.png",
						sizes: "192x192",
						type: "image/png",
						purpose: "any maskable",
					},
					{
						src: "/assets/img/icon-512x512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "any maskable",
					},
					{
						src: "/assets/img/icon-512x512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "any",
					},
				],
				categories: ["navigation", "utilities", "weather"],
				lang: "en",
				dir: "ltr",
			},
			workbox: {
				globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/api\.mapbox\.com\/.*/i,
						handler: "CacheFirst",
						options: {
							cacheName: "mapbox-cache",
							expiration: {
								maxEntries: 50,
								maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
							},
						},
					},
					{
						urlPattern: /^https:\/\/.*\.geojson$/i,
						handler: "CacheFirst",
						options: {
							cacheName: "geojson-cache",
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
							},
						},
					},
				],
			},
		}),
	],
	resolve: {
		alias: {
			"@": path.resolve(process.cwd(), "./src"),
		},
	},
});
