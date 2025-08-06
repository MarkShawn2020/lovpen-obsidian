#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import colors from 'colors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log(colors.cyan('🚀 Starting Lovpen with HMR support...\n'));

// Set environment variable to enable HMR mode
process.env.__LOVPEN_DEV_MODE__ = 'true';

// Start Vite dev server for frontend
console.log(colors.yellow('📦 Starting Vite dev server for React HMR...'));
const viteProcess = spawn('pnpm', ['--filter', '@lovpen/frontend', 'dev:hmr'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env }
});

// Wait a bit for Vite to start
setTimeout(() => {
  console.log(colors.yellow('\n⚡ Starting Obsidian plugin in watch mode...'));
  
  // Start obsidian plugin in watch mode
  const obsidianProcess = spawn('pnpm', ['--filter', '@lovpen/obsidian', 'dev'], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, __LOVPEN_DEV_MODE__: 'true' }
  });

  obsidianProcess.on('error', (err) => {
    console.error(colors.red('❌ Obsidian plugin build failed:'), err);
  });
}, 3000);

viteProcess.on('error', (err) => {
  console.error(colors.red('❌ Vite dev server failed:'), err);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log(colors.yellow('\n👋 Shutting down dev servers...'));
  viteProcess.kill();
  process.exit();
});

console.log(colors.green(`
✨ HMR Development Mode Instructions:
=====================================
1. Vite dev server will run at http://localhost:5173
2. React components will hot reload on save
3. Obsidian plugin will rebuild and sync automatically
4. Reload Obsidian (Cmd+R) after the initial build

Note: Make sure Obsidian is already running before making changes.
`));