#!/bin/bash

# 快速发布脚本
# 用法: 
#   ./scripts/release.sh           # 使用当前 package.json 中的版本
#   ./scripts/release.sh 0.14.7    # 指定版本号

# 获取当前目录中 package.json 的版本
CURRENT_VERSION=$(node -p "require('./package.json').version")

if [ -z "$1" ]; then
  VERSION="v$CURRENT_VERSION"
  echo "📦 使用当前版本: $VERSION"
else
  VERSION="v$1"
  echo "🚀 使用指定版本: $VERSION"
fi

echo "🏷️  创建并推送标签: $VERSION"

git tag $VERSION && git push origin $VERSION

echo "✅ 标签已推送，GitHub Actions 将自动构建发布"