import {readFileSync, writeFileSync} from 'fs';
import {resolve} from 'path';
import {execSync} from 'child_process';

// 在 version 生命周期中，npm 会先运行 preversion，然后更新 package.json 的版本号，最后运行 postversion
// 我们需要在 version 生命周期中同步其他文件的版本号

// 获取新的版本号（npm version 已经更新了 package.json）
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const newVersion = packageJson.version;

console.log(`同步版本号: ${newVersion}`);

// 同步 manifest.json
const manifestPaths = [
	resolve('manifest.json'),
	resolve('packages/obsidian/manifest.json'),
];

for (const manifestPath of manifestPaths) {
	const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
	manifest.version = newVersion;
	writeFileSync(manifestPath, JSON.stringify(manifest, null, '\t') + '\n');
}

// 同步 obsidian package.json
const obsidianPackagePath = resolve('packages/obsidian/package.json');
const obsidianPackage = JSON.parse(readFileSync(obsidianPackagePath, 'utf8'));
obsidianPackage.version = newVersion;
writeFileSync(obsidianPackagePath, JSON.stringify(obsidianPackage, null, '\t') + '\n');

// 同步 frontend package.json
const vitePackagePath = resolve('packages/frontend/package.json');
const vitePackage = JSON.parse(readFileSync(vitePackagePath, 'utf8'));
vitePackage.version = newVersion;
writeFileSync(vitePackagePath, JSON.stringify(vitePackage, null, '\t') + '\n');

// 添加修改的文件到 git 暂存区，这样 npm version 的 commit 会包含这些文件
try {
	execSync('git add manifest.json packages/obsidian/manifest.json packages/obsidian/package.json packages/frontend/package.json', { stdio: 'inherit' });
	console.log('✅ 版本文件已添加到 Git 暂存区');
} catch (error) {
	console.warn('⚠️ 添加文件到 Git 暂存区失败:', error.message);
}

console.log(`✅ 版本同步完成: ${newVersion}`);
