#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import colors from 'colors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log(colors.cyan('🚀 Starting Lovpen with HMR support...\n'));

// Set environment variables for HMR mode
process.env.NODE_ENV = 'development';
process.env.__LOVPEN_DEV_MODE__ = 'true';
process.env.VITE_HMR_ENABLED = 'true';

// Start Vite dev server for frontend
console.log(colors.yellow('📦 Starting Vite dev server for React HMR...'));
const viteProcess = spawn('pnpm', ['--filter', '@lovpen/frontend', 'dev:hmr'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
  env: { 
    ...process.env,
    NODE_ENV: 'development',
    FORCE_COLOR: '1'
  }
});

// Wait a bit for Vite to start
setTimeout(() => {
  console.log(colors.yellow('\n⚡ Starting Obsidian plugin in watch mode...'));
  
  // Check if Vite is running
  fetch('http://localhost:5173/@vite/client')
    .then(() => {
      console.log(colors.green('✅ Vite dev server is running'));
    })
    .catch(() => {
      console.log(colors.yellow('⚠️ Vite dev server may not be ready yet'));
    });
  
  // Start obsidian plugin in watch mode
  const obsidianProcess = spawn('pnpm', ['--filter', '@lovpen/obsidian', 'dev'], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true,
    env: { 
      ...process.env, 
      NODE_ENV: 'development',
      __LOVPEN_DEV_MODE__: 'true'
    }
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