import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
// @ts-ignore
import tailwindcss from "@tailwindcss/vite"
import { codeInspectorPlugin } from 'code-inspector-plugin'

export default defineConfig({
	plugins: [
		react(), 
		tailwindcss(),
		codeInspectorPlugin({
			bundler: 'vite',
		})
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},

	build: {
		outDir: './dist',
		emptyOutDir: true,
		lib: {
			entry: 'src/main.tsx',
			name: 'LovpenReact',
			fileName: 'lovpen-react',
			formats: ['iife']
		},
		rollupOptions: {
			output: {
				inlineDynamicImports: true,
				exports: "named",
			}
		},
		minify: false,
	}
})
