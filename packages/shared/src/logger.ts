import { LogLevel, getLoggerConfig } from './logger-config';

interface LoggerOptions {
	level?: LogLevel;
	prefix?: string;
	timestamp?: boolean;
}

class Logger {
	private level: LogLevel;
	private prefix: string;
	private timestamp: boolean;
	private readonly levels: Record<LogLevel, number> = {
		debug: 0,
		info: 1,
		warn: 2,
		error: 3,
		none: 999
	};

	constructor(options: LoggerOptions = {}) {
		const config = getLoggerConfig();
		
		// 使用全局配置，但允许实例覆盖
		this.level = options.level || config.level;
		this.prefix = options.prefix || 'LovPen';
		this.timestamp = options.timestamp ?? config.timestamp;
	}

	private shouldLog(level: LogLevel): boolean {
		return this.levels[level] >= this.levels[this.level];
	}

	private formatMessage(level: LogLevel, args: any[]): string[] {
		const prefix = this.timestamp 
			? `[${new Date().toISOString()}] [${this.prefix}] [${level.toUpperCase()}]`
			: `[${this.prefix}] [${level.toUpperCase()}]`;
		
		return [prefix, ...args];
	}

	debug(...args: any[]) {
		if (this.shouldLog('debug')) {
			console.debug(...this.formatMessage('debug', args));
		}
	}

	info(...args: any[]) {
		if (this.shouldLog('info')) {
			console.info(...this.formatMessage('info', args));
		}
	}

	warn(...args: any[]) {
		if (this.shouldLog('warn')) {
			console.warn(...this.formatMessage('warn', args));
		}
	}

	error(...args: any[]) {
		if (this.shouldLog('error')) {
			console.error(...this.formatMessage('error', args));
		}
	}

	setLevel(level: LogLevel) {
		this.level = level;
	}

	createChild(prefix: string): Logger {
		return new Logger({
			level: this.level,
			prefix: `${this.prefix}:${prefix}`,
			timestamp: this.timestamp
		});
	}
}

// 导出默认logger实例
export const logger = new Logger();
