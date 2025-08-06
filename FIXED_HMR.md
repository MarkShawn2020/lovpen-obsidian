# HMR Preamble Error Fix

## Problem
The error "@vitejs/plugin-react can't detect preamble" occurred because of JSX runtime configuration conflicts and missing React imports.

## Solution Applied

### 1. **Vite Configuration Changes**
- Switched to **classic JSX runtime** to avoid automatic runtime preamble issues
- Configured esbuild to automatically inject React imports
- Removed conflicting plugins (code-inspector) during development
- Explicitly set JSX pragma and fragment

### 2. **TypeScript Configuration**
- Changed `jsx` from `"react-jsx"` to `"react"` for classic runtime
- Removed `jsxImportSource` which is only for automatic runtime

### 3. **React Import Updates**
- Changed all `import * as React` to `import React` (default import)
- Added missing React imports to files using JSX
- Ensured main.tsx and all UI components have proper imports

### 4. **Cache Cleanup**
- Cleared node_modules/.vite cache
- Removed dist directory

## Testing the Fix

1. **Start fresh:**
   ```bash
   rm -rf node_modules/.vite dist
   ```

2. **Start HMR mode:**
   ```bash
   pnpm dev:hmr
   ```

3. **In Obsidian:**
   - Reload once after starting (Cmd+R)
   - Open the Lovpen preview panel
   - Modify any React component - should hot reload without errors

## Key Technical Details

The fix works by:
- Using **classic JSX runtime** which doesn't require preamble detection
- Having esbuild automatically inject `import React from 'react'` 
- Ensuring consistent JSX handling across Vite, TypeScript, and esbuild
- Avoiding plugin conflicts during transformation pipeline

## If Issues Persist

1. Clear all caches:
   ```bash
   rm -rf node_modules/.vite dist packages/*/dist
   pnpm store prune
   ```

2. Reinstall dependencies:
   ```bash
   pnpm install
   ```

3. Check browser console for any CORS issues
4. Ensure port 5173 is not blocked by firewall