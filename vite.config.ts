import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd());

	const allowedHosts = env.VITE_ALLOWED_HOSTS?.split(",") || [];

	return {
		optimizeDeps: {
			exclude: ["lucide-react"],
		},
		plugins: [react(), tailwindcss()],
		resolve: {
			alias: {
				"@": path.resolve(process.cwd(), "./src"),
			},
		},
		server: {
			allowedHosts,
		},
	};
});
