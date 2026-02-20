type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
    private static instance: Logger;
    private isDev: boolean;

    private constructor() {
        this.isDev = import.meta.env.DEV;
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    private formatMessage(level: LogLevel, message: string, data?: any) {
        const timestamp = new Date().toISOString();
        return {
            timestamp,
            level,
            message,
            data,
        };
    }

    public info(message: string, data?: any) {
        if (this.isDev) {
            console.log(`ℹ️ [INFO] ${message}`, data || '');
        }
        // TODO: Send to remote logging service in prod
    }

    public warn(message: string, data?: any) {
        console.warn(`⚠️ [WARN] ${message}`, data || '');
    }

    public error(message: string, error?: any) {
        console.error(`🚨 [ERROR] ${message}`, error || '');
        // TODO: Send to Sentry/LogRocket in prod
    }

    public debug(message: string, data?: any) {
        if (this.isDev) {
            console.debug(`🐞 [DEBUG] ${message}`, data || '');
        }
    }
}

export const logger = Logger.getInstance();
