// AI 操作日志服务
export interface AILogEntry {
	id: string;
	timestamp: number;
	type: 'prompt_generation' | 'image_generation' | 'error';
	status: 'started' | 'completed' | 'failed';
	message: string;
	// 详细信息
	prompt?: string;
	negativePrompt?: string;
	model?: string;
	style?: string;
	aspectRatio?: string;
	// 结果
	imageUrl?: string;
	generatedPrompt?: string;
	error?: string;
}

const MAX_LOGS = 100;
const STORAGE_KEY = 'lovpen-ai-logs';

class AILogService {
	private static instance: AILogService;
	private logs: AILogEntry[] = [];
	private listeners: Set<() => void> = new Set();

	private constructor() {
		this.loadFromStorage();
	}

	static getInstance(): AILogService {
		if (!AILogService.instance) {
			AILogService.instance = new AILogService();
		}
		return AILogService.instance;
	}

	private loadFromStorage() {
		try {
			const data = localStorage.getItem(STORAGE_KEY);
			this.logs = data ? JSON.parse(data) : [];
		} catch {
			this.logs = [];
		}
	}

	private saveToStorage() {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs.slice(0, MAX_LOGS)));
		} catch {
			// ignore
		}
	}

	private notifyListeners() {
		this.listeners.forEach(fn => fn());
	}

	addLog(entry: Omit<AILogEntry, 'id' | 'timestamp'>): string {
		const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
		const log: AILogEntry = {
			...entry,
			id,
			timestamp: Date.now()
		};
		this.logs.unshift(log);
		if (this.logs.length > MAX_LOGS) {
			this.logs = this.logs.slice(0, MAX_LOGS);
		}
		this.saveToStorage();
		this.notifyListeners();
		return id;
	}

	updateLog(id: string, updates: Partial<Omit<AILogEntry, 'id' | 'timestamp'>>) {
		const index = this.logs.findIndex(l => l.id === id);
		if (index !== -1) {
			this.logs[index] = {...this.logs[index], ...updates};
			this.saveToStorage();
			this.notifyListeners();
		}
	}

	getLogs(): AILogEntry[] {
		return [...this.logs];
	}

	clearLogs() {
		this.logs = [];
		this.saveToStorage();
		this.notifyListeners();
	}

	subscribe(callback: () => void): () => void {
		this.listeners.add(callback);
		return () => this.listeners.delete(callback);
	}
}

export const aiLogService = AILogService.getInstance();
