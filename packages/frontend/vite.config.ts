import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
// @ts-ignore
import tailwindcss from "@tailwindcss/vite"
import { codeInspectorPlugin } from 'code-inspector-plugin'

export default defineConfig(({ mode }) => {
	const isDev = mode === 'development';
	
	return {
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
		
		// Dev server configuration for HMR
		server: {
			port: 5173,
			host: 'localhost',
			cors: {
				origin: '*',
				credentials: true
			},
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type'
			}
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
	}
})
