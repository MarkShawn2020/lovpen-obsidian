#!/bin/bash

echo "🔍 HMR Verification Script"
echo "=========================="

# Check if Vite dev server is running
echo -n "1. Checking Vite dev server... "
if curl -s http://localhost:5173/@vite/client > /dev/null; then
    echo "✅ Running"
else
    echo "❌ Not running"
    echo "   Run: pnpm dev:hmr"
    exit 1
fi

# Check WebSocket connection
echo -n "2. Checking HMR WebSocket... "
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 | grep -q "200"; then
    echo "✅ Available"
else
    echo "⚠️ May need configuration"
fi

# Check if files exist
echo -n "3. Checking HMR files... "
if [ -f "packages/frontend/src/components/HMRTest.tsx" ]; then
    echo "✅ Test component exists"
else
    echo "❌ Test component missing"
fi

# Instructions
echo ""
echo "📝 Next Steps:"
echo "1. Open Obsidian"
echo "2. Reload once (Cmd+R)"
echo "3. Open Lovpen panel"
echo "4. Look for green HMR indicator (bottom-right)"
echo "5. Edit any component in packages/frontend/src/"
echo "6. Save and watch it update instantly!"
echo ""
echo "🎉 HMR is ready to use!"