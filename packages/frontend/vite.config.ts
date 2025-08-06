import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
// @ts-ignore
import tailwindcss from "@tailwindcss/vite"

export default defineConfig(({ mode }) => {
	const isDev = mode === 'development';
	
	return {
		plugins: [
			react({
				// Force classic JSX runtime in dev to avoid preamble issues
				jsxRuntime: 'classic',
				// Explicit JSX pragma
				jsxPragma: 'React.createElement',
				jsxPragmaFragment: 'React.Fragment',
				// Fast refresh for HMR
				fastRefresh: isDev,
				// Don't use Babel transforms that might conflict
				babel: false
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
			},
			// Important: enable HMR
			hmr: true
		},
		
		// Ensure esbuild handles JSX correctly
		esbuild: {
			jsx: 'transform',
			jsxFactory: 'React.createElement',
			jsxFragment: 'React.Fragment',
			jsxInject: `import React from 'react'`
		},
		
		// Optimizations for better HMR
		optimizeDeps: {
			include: ['react', 'react-dom'],
			exclude: ['@lovpen/obsidian'],
			esbuildOptions: {
				jsx: 'transform',
				jsxFactory: 'React.createElement',
				jsxFragment: 'React.Fragment'
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