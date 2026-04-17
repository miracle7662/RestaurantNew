import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
	base: command === 'build' ? "./" : "/",
	plugins: [react()],
	define: { "process.env": {} },
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "src"),
		},
	},
	build: {
		target: 'es2022'
	},
	server: {
		host: true,
		proxy: {
			'/api': {
				target: 'http://192.168.1.3:3001',
				changeOrigin: true,
				secure: false,
			},
		},
	},
}));

