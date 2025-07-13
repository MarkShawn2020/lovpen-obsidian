/**
 * Frontend包的全局API类型
 * 从shared包导入统一的类型定义，避免重复
 *
 * 注意：对应的实现位于 @packages/obsidian/note-preview-external.tsx
 * 和 @packages/obsidian/services/ReactAPIService.ts
 */

// 从shared包导入所有API类型
export type {
	RequestUrlOptions,
	RequestUrlResponse,
	RequestUrlFunction,
	PersistentStorageAPI,
	TemplateKitAPI,
	SettingsAPI,
	LovpenReactAPI,
	LovpenGlobalAPI
} from '@lovpen/shared';

// 重新导出以供本地使用
import type {LovpenGlobalAPI} from '@lovpen/shared';

declare global {
	interface Window extends LovpenGlobalAPI {
	}
}

export {};
