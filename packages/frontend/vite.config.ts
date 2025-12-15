import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
// @ts-ignore
import tailwindcss from "@tailwindcss/vite"
import { lovinspPlugin } from 'lovinsp'

export default defineConfig(({ mode }) => {
	const isDev = mode === 'development';
	const isStandalone = mode === 'standalone';
	const serverPort = isStandalone ? 1101 : 5173;

	return {
		define: {
			'process.env.NODE_ENV': JSON.stringify(mode),
			'__STANDALONE_MODE__': isStandalone
		},
		plugins: [
			lovinspPlugin({
				bundler: 'vite',
			}),
			react({
				// Use automatic runtime for better HMR
				jsxRuntime: 'automatic',
				// Fast refresh enabled
				fastRefresh: true,
				// Include all JSX/TSX files
				include: '**/*.{jsx,tsx,js,ts}'
			}),
			tailwindcss()
		],
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "./src"),
			},
		},

		// Dev server configuration for HMR
		server: {
			port: serverPort,
			host: 'localhost',
			open: isStandalone,
			cors: {
				origin: '*',
				credentials: true,
				methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD']
			},
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
				'Access-Control-Allow-Headers': '*',
				'Access-Control-Expose-Headers': '*'
			},
			// HMR configuration
			hmr: {
				protocol: 'ws',
				host: 'localhost',
				port: serverPort
			}
		},
		
		// Optimizations for better HMR
		optimizeDeps: {
			include: ['react', 'react-dom', 'react/jsx-runtime'],
			exclude: ['@lovpen/obsidian']
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
