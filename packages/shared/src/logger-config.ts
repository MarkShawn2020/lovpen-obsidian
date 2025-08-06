export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

export interface LoggerConfig {
	level: LogLevel;
	enableInProduction: boolean;
	timestamp: boolean;
}

// 默认配置
export const defaultLoggerConfig: LoggerConfig = {
	level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
	enableInProduction: false,
	timestamp: false
};

// 全局配置对象
let globalConfig: LoggerConfig = { ...defaultLoggerConfig };

/**
 * 设置全局日志配置
 */
export function setLoggerConfig(config: Partial<LoggerConfig>) {
	globalConfig = { ...globalConfig, ...config };
}

/**
 * 获取当前日志配置
 */
export function getLoggerConfig(): LoggerConfig {
	return { ...globalConfig };
}

/**
 * 重置日志配置为默认值
 */
export function resetLoggerConfig() {
	globalConfig = { ...defaultLoggerConfig };
}